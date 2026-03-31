import prisma from "../../../config/database.js";
const MATERIAL_WITH_CATEGORY_SELECT = {
  id: true,
  nombre: true,
  categoriaId: true,
  categoria: true,
  descripcion: true,
  stockFundacion: true,
  stockEventos: true,
  stockEventosReservado: true,
  unidadMedida: true,
  estado: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  category: {
    select: {
      id: true,
      nombre: true,
      estado: true,
    },
  },
};

class MaterialsRepository {
  /**
   * Get all materials with pagination and search
   */
  async findAll({
    page = 1,
    limit = 10,
    search = "",
    estado = null,
    categoriaId = null,
    stockType = null,
  }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: "insensitive" } },
        { categoria: { contains: search, mode: "insensitive" } },
        { descripcion: { contains: search, mode: "insensitive" } },
      ];
    }

    if (estado) {
      where.estado = estado;
    }

    if (categoriaId) {
      where.categoriaId = parseInt(categoriaId);
    }

    // Filter by stock type
    if (stockType === "eventos") {
      where.stockEventos = { gt: 0 };
    } else if (stockType === "fundacion") {
      where.stockFundacion = { gt: 0 };
    }

    const [materials, total] = await Promise.all([
      prisma.material.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          nombre: true,
          categoriaId: true,
          categoria: true,
          descripcion: true,
          stockFundacion: true,
          stockEventos: true,
          stockEventosReservado: true,
          unidadMedida: true,
          estado: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              nombre: true,
              estado: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.material.count({ where }),
    ]);

    // Calculate total stock and check for movements for each material
    const materialsWithTotal = await Promise.all(
      materials.map(async (material) => {
        // Check if material has any movements
        const movementsCount = await prisma.materialMovement.count({
          where: { materialId: material.id },
        });

        // Check if material has active event assignments (consumables)
        const consumableAssignmentsCount = await prisma.eventMaterial.count({
          where: {
            materialId: material.id,
            bloqueado: false,
          },
        });

        // Check if material has active event assignments (reusables)
        const reusableAssignmentsCount =
          await prisma.eventMaterialReusable.count({
            where: {
              materialId: material.id,
            },
          });

        // Total active assignments (both types)
        const activeAssignmentsCount =
          consumableAssignmentsCount + reusableAssignmentsCount;

        return {
          ...material,
          stockTotal: material.stockFundacion + material.stockEventos,
          stockEventosDisponible:
            material.stockEventos - (material.stockEventosReservado || 0),
          hasMovements: movementsCount > 0,
          movementsCount,
          hasActiveAssignments: activeAssignmentsCount > 0,
          activeAssignmentsCount,
        };
      }),
    );

    return {
      materials: materialsWithTotal,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get material by ID
   */
  async findById(id) {
    const material = await prisma.material.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        nombre: true,
        categoriaId: true,
        categoria: true,
        descripcion: true,
        stockFundacion: true,
        stockEventos: true,
        stockEventosReservado: true,
        unidadMedida: true,
        estado: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
        category: {
          select: {
            id: true,
            nombre: true,
            estado: true,
          },
        },
      },
    });

    if (!material) return null;

    // Check if material has any movements
    const movementsCount = await prisma.materialMovement.count({
      where: { materialId: material.id },
    });

    // Check if material has active event assignments (consumables)
    const consumableAssignmentsCount = await prisma.eventMaterial.count({
      where: {
        materialId: material.id,
        bloqueado: false,
      },
    });

    // Check if material has active event assignments (reusables)
    const reusableAssignmentsCount = await prisma.eventMaterialReusable.count({
      where: {
        materialId: material.id,
      },
    });

    // Total active assignments (both types)
    const activeAssignmentsCount =
      consumableAssignmentsCount + reusableAssignmentsCount;

    // Add calculated fields
    return {
      ...material,
      stockTotal: material.stockFundacion + material.stockEventos,
      stockEventosDisponible:
        material.stockEventos - (material.stockEventosReservado || 0),
      hasMovements: movementsCount > 0,
      movementsCount,
      hasActiveAssignments: activeAssignmentsCount > 0,
      activeAssignmentsCount,
    };
  }

  /**
   * Verificar si existe un material con el mismo nombre en la misma categoría
   */
  async existsByNameAndCategory(nombre, categoriaId, excludeId = null) {
    const where = {
      nombre: {
        equals: nombre.trim(),
        mode: "insensitive",
      },
      categoriaId: parseInt(categoriaId),
    };

    if (excludeId) {
      where.NOT = { id: parseInt(excludeId) };
    }

    const material = await prisma.material.findFirst({ where });
    return !!material;
  }

  /**
   * Create material
   */
  async create(data, userId) {
    // Get category name
    const category = await prisma.materialCategory.findUnique({
      where: { id: parseInt(data.categoria_id) },
      select: { nombre: true, estado: true },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    if (category.estado !== "Activo") {
      throw new Error("Cannot create material with inactive category");
    }

    const material = await prisma.material.create({
      data: {
        nombre: data.nombre.trim(),
        categoriaId: parseInt(data.categoria_id),
        categoria: category.nombre,
        descripcion: data.descripcion?.trim() || null,
        unidadMedida: data.unidad_medida?.trim().toLowerCase() || "unidad",
        stockFundacion: 0,
        stockEventos: 0,
        estado: "Activo",
        createdBy: userId,
      },
      select: MATERIAL_WITH_CATEGORY_SELECT,
    });

    // Add calculated fields
    return {
      ...material,
      stockTotal: material.stockFundacion + material.stockEventos,
    };
  }

  /**
   * Actualizar material
   * IMPORTANTE: No se puede cambiar nombre ni categoría si tiene movimientos
   */
  async update(id, data, userId) {
    const material = await this.findById(id);
    if (!material) {
      throw new Error("Material no encontrado");
    }

    // Verificar si tiene movimientos
    const movementsCount = await prisma.materialMovement.count({
      where: { materialId: parseInt(id) },
    });

    const updateData = {
      descripcion: data.descripcion?.trim() || null,
      estado: data.estado,
      updatedBy: userId,
    };

    // Si tiene movimientos, NO permitir cambiar nombre ni categoría
    if (movementsCount > 0) {
      // Validar que no intenten cambiar el nombre
      if (data.nombre && data.nombre.trim() !== material.nombre) {
        throw new Error(
          "No se puede cambiar el nombre del material porque tiene movimientos registrados. Para mantener la trazabilidad del inventario, el nombre debe permanecer igual.",
        );
      }

      // Validar que no intenten cambiar la categoría
      if (
        data.categoria_id &&
        parseInt(data.categoria_id) !== material.categoriaId
      ) {
        throw new Error(
          "No se puede cambiar la categoría del material porque tiene movimientos registrados. Para mantener la trazabilidad del inventario, la categoría debe permanecer igual.",
        );
      }
    } else {
      // Si NO tiene movimientos, permitir cambiar nombre y categoría
      if (data.nombre) {
        updateData.nombre = data.nombre.trim();
      }

      if (data.categoria_id) {
        const category = await prisma.materialCategory.findUnique({
          where: { id: parseInt(data.categoria_id) },
          select: { nombre: true, estado: true },
        });

        if (!category) {
          throw new Error("Categoría no encontrada");
        }

        if (category.estado !== "Activo") {
          throw new Error("No se puede asignar una categoría inactiva");
        }

        updateData.categoriaId = parseInt(data.categoria_id);
        updateData.categoria = category.nombre;
      }
    }

    // La unidad de medida siempre es "unidad", no se actualiza

    const materialActualizado = await prisma.material.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: MATERIAL_WITH_CATEGORY_SELECT,
    });

    // Add calculated total stock
    return {
      ...materialActualizado,
      stockTotal:
        materialActualizado.stockFundacion + materialActualizado.stockEventos,
    };
  }

  /**
   * Toggle material status
   */
  async toggleStatus(id, userId) {
    const material = await this.findById(id);
    if (!material) {
      throw new Error("Material not found");
    }

    const newStatus = material.estado === "Activo" ? "Inactivo" : "Activo";

    const materialActualizado = await prisma.material.update({
      where: { id: parseInt(id) },
      data: {
        estado: newStatus,
        updatedBy: userId,
      },
      select: MATERIAL_WITH_CATEGORY_SELECT,
    });

    // Add calculated total stock
    return {
      ...materialActualizado,
      stockTotal:
        materialActualizado.stockFundacion + materialActualizado.stockEventos,
    };
  }

  /**
   * Eliminar material (solo si no tiene stock ni movimientos)
   */
  async delete(id) {
    // Obtener el material con su stock actual
    const material = await prisma.material.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        nombre: true,
        stockFundacion: true,
        stockEventos: true,
        stockEventosReservado: true,
      },
    });

    if (!material) {
      throw new Error("Material no encontrado");
    }

    // Verificar si tiene stock actual
    const stockTotal =
      material.stockFundacion +
      material.stockEventos +
      material.stockEventosReservado;
    if (stockTotal > 0) {
      throw new Error(
        `No se puede eliminar el material porque tiene stock registrado (Fundación: ${material.stockFundacion}, Eventos: ${material.stockEventos}, Reservado: ${material.stockEventosReservado}). Debe agotar el stock primero.`,
      );
    }

    // Verificar si tiene movimientos históricos
    const movementsCount = await prisma.materialMovement.count({
      where: { materialId: parseInt(id) },
    });

    if (movementsCount > 0) {
      throw new Error(
        `No se puede eliminar el material porque tiene ${movementsCount} movimiento(s) histórico(s). Cambie el estado a Inactivo en su lugar para mantener la integridad del historial.`,
      );
    }

    // Solo se puede eliminar si no tiene stock ni movimientos
    return await prisma.material.delete({
      where: { id: parseInt(id) },
    });
  }

  /**
   * Calcular stock actual desde movimientos
   */
  async calculateStock(materialId) {
    const movements = await prisma.materialMovement.findMany({
      where: { materialId: parseInt(materialId) },
      select: {
        tipoMovimiento: true,
        cantidad: true,
      },
    });

    let stock = 0;
    movements.forEach((mov) => {
      if (mov.tipoMovimiento === "Entrada") {
        stock += mov.cantidad;
      } else if (mov.tipoMovimiento === "Salida") {
        stock -= mov.cantidad;
      }
    });

    return stock;
  }

  /**
   * Register material discharge (atomic transaction)
   */
  async registerDischarge(materialId, data, userId, userName) {
    return await prisma.$transaction(async (tx) => {
      // 1. Get material with lock
      const material = await tx.material.findUnique({
        where: { id: parseInt(materialId) },
        select: {
          id: true,
          nombre: true,
          categoria: true,
          estado: true,
          stockFundacion: true,
          stockEventos: true,
        },
      });

      if (!material) {
        throw new Error("Material not found");
      }

      if (material.estado !== "Activo") {
        throw new Error("Cannot register discharge on inactive materials");
      }

      // 2. Determine which inventory to deduct from
      const inventoryType = data.inventario_origen || "FUNDACION";
      const stockField =
        inventoryType === "FUNDACION" ? "stockFundacion" : "stockEventos";
      const currentStock = material[stockField];

      // 3. If discharging from FUNDACION, check available stock (not planned)
      if (inventoryType === "FUNDACION") {
        // Get active event assignments (exclude Finalizado and Cancelado)
        const activeAssignments = await tx.eventMaterialReusable.findMany({
          where: {
            materialId: parseInt(materialId),
            evento: {
              NOT: {
                status: {
                  in: ["Finalizado", "Cancelado"],
                },
              },
            },
          },
          include: {
            evento: {
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
                status: true,
              },
            },
          },
        });

        // Calculate total planned (sum all quantities)
        const maxConcurrentUsage = activeAssignments.reduce(
          (sum, assignment) => sum + assignment.cantidad,
          0,
        );

        // Calculate available stock (not planned)
        const availableStock = currentStock - maxConcurrentUsage;

        // Validate that discharge doesn't exceed available stock
        if (data.cantidad > availableStock) {
          throw new Error(
            `No se puede dar de baja ${data.cantidad} unidades del stock de Fundación. Stock total: ${currentStock}, Planificado en eventos: ${maxConcurrentUsage}, Disponible para baja: ${availableStock}. Reduce las planificaciones en eventos para poder dar de baja esta cantidad.`,
          );
        }
      }

      // 4. Validate sufficient stock
      if (currentStock < data.cantidad) {
        throw new Error(
          `Stock insuficiente en ${inventoryType}. Disponible: ${currentStock}, Solicitado: ${data.cantidad}`,
        );
      }

      const stockAnterior = material.stockFundacion + material.stockEventos;
      const newStockValue = currentStock - data.cantidad;
      const stockNuevo =
        inventoryType === "FUNDACION"
          ? newStockValue + material.stockEventos
          : material.stockFundacion + newStockValue;

      // 5. Update material stock
      const materialActualizado = await tx.material.update({
        where: { id: parseInt(materialId) },
        data: {
          [stockField]: newStockValue,
        },
        select: MATERIAL_WITH_CATEGORY_SELECT,
      });

      // 6. Map discharge type to enum value
      let tipoBajaEnum;
      const tipoBajaNormalizado = data.tipo_baja.toUpperCase().trim();

      switch (tipoBajaNormalizado) {
        case "DAÑO O DETERIORO":
        case "DANO O DETERIORO":
          tipoBajaEnum = "DanoDeterioro";
          break;
        case "PÉRDIDA":
        case "PERDIDA":
          tipoBajaEnum = "Perdida";
          break;
        case "ROBO":
          tipoBajaEnum = "Robo";
          break;
        case "AJUSTE DE INVENTARIO":
          tipoBajaEnum = "AjusteInventario";
          break;
        default:
          tipoBajaEnum = "Otro";
      }

      // 7. Create discharge movement
      await tx.materialMovement.create({
        data: {
          materialId: parseInt(materialId),
          materialNombre: material.nombre,
          categoria: material.categoria,
          tipoMovimiento: "Baja",
          cantidad: data.cantidad,
          inventarioOrigen: inventoryType,
          tipoBaja: tipoBajaEnum,
          observaciones: data.descripcion,
          stockAnterior: stockAnterior,
          stockNuevo: stockNuevo,
          createdBy: userId,
          createdByName: userName,
        },
      });

      // 8. Return updated material with calculated total
      return {
        ...materialActualizado,
        stockTotal:
          materialActualizado.stockFundacion + materialActualizado.stockEventos,
      };
    });
  }

  /**
   * Mapear tipo de baja a valor del enum
   */
  mapTipoBajaToEnum(tipoBaja) {
    // Normalizar el valor recibido
    const tipoBajaNormalizado = tipoBaja.toUpperCase().trim();

    const mapeo = {
      "DAÑO O DETERIORO": "DanoDeterioro",
      "DANO O DETERIORO": "DanoDeterioro",
      PÉRDIDA: "Perdida",
      PERDIDA: "Perdida",
      ROBO: "Robo",
      "AJUSTE DE INVENTARIO": "AjusteInventario",
      OTRO: "Otro",
    };

    return mapeo[tipoBajaNormalizado] || "Otro";
  }

  /**
   * Transfer stock between inventories (atomic transaction)
   */
  async transferStock(materialId, data, userId, userName) {
    return await prisma.$transaction(async (tx) => {
      // 1. Get material with lock
      const material = await tx.material.findUnique({
        where: { id: parseInt(materialId) },
        select: {
          id: true,
          nombre: true,
          categoria: true,
          estado: true,
          stockFundacion: true,
          stockEventos: true,
        },
      });

      if (!material) {
        throw new Error("Material not found");
      }

      if (material.estado !== "Activo") {
        throw new Error("Cannot transfer stock on inactive materials");
      }

      // 2. Validate different inventories
      if (data.from === data.to) {
        throw new Error("Source and destination inventories must be different");
      }

      // 3. Determine stock fields
      const fromField =
        data.from === "FUNDACION" ? "stockFundacion" : "stockEventos";
      const toField =
        data.to === "FUNDACION" ? "stockFundacion" : "stockEventos";
      const fromStock = material[fromField];
      const toStock = material[toField];

      // 4. If transferring FROM FUNDACION, check available stock (not planned)
      if (data.from === "FUNDACION") {
        // Get active event assignments (exclude Finalizado and Cancelado)
        const activeAssignments = await tx.eventMaterialReusable.findMany({
          where: {
            materialId: parseInt(materialId),
            evento: {
              NOT: {
                status: {
                  in: ["Finalizado", "Cancelado"],
                },
              },
            },
          },
          include: {
            evento: {
              select: {
                startDate: true,
                endDate: true,
                status: true,
              },
            },
          },
        });

        // Calculate total planned (sum all quantities)
        const maxConcurrentUsage = activeAssignments.reduce(
          (sum, assignment) => sum + assignment.cantidad,
          0,
        );

        // Calculate available stock (not planned)
        const availableStock = fromStock - maxConcurrentUsage;

        // Validate that transfer doesn't exceed available stock
        if (data.cantidad > availableStock) {
          throw new Error(
            `No se puede transferir ${data.cantidad} unidades del stock de Fundación. Stock total: ${fromStock}, Planificado en eventos: ${maxConcurrentUsage}, Disponible para transferir: ${availableStock}. Reduce las planificaciones en eventos para poder transferir esta cantidad.`,
          );
        }
      }

      // 5. Validate sufficient stock in source
      if (fromStock < data.cantidad) {
        throw new Error(
          `Stock insuficiente en ${data.from}. Disponible: ${fromStock}, Solicitado: ${data.cantidad}`,
        );
      }

      const stockAnterior = material.stockFundacion + material.stockEventos;
      const newFromStock = fromStock - data.cantidad;
      const newToStock = toStock + data.cantidad;

      // 6. Update material stock
      const materialActualizado = await tx.material.update({
        where: { id: parseInt(materialId) },
        data: {
          [fromField]: newFromStock,
          [toField]: newToStock,
        },
        select: MATERIAL_WITH_CATEGORY_SELECT,
      });

      // 7. Create transfer movement
      await tx.materialMovement.create({
        data: {
          materialId: parseInt(materialId),
          materialNombre: material.nombre,
          categoria: material.categoria,
          tipoMovimiento: "TRANSFERENCIA",
          cantidad: data.cantidad,
          inventarioOrigen: data.from,
          inventarioDestino: data.to,
          observaciones:
            data.observaciones || `Transfer from ${data.from} to ${data.to}`,
          stockAnterior: stockAnterior,
          stockNuevo: stockAnterior, // Total doesn't change in transfers
          createdBy: userId,
          createdByName: userName,
        },
      });

      // 8. Return updated material with calculated total
      return {
        ...materialActualizado,
        stockTotal:
          materialActualizado.stockFundacion + materialActualizado.stockEventos,
      };
    });
  }

  /**
   * Obtener historial de movimientos de un material (para futuro)
   */
  async getMovementHistory(materialId, limit = 10) {
    return await prisma.materialMovement.findMany({
      where: { materialId: parseInt(materialId) },
      orderBy: { fecha: "desc" },
      take: limit,
    });
  }
  /**
   * Obtener todos los materiales para reporte (SIN PAGINACIÓN)
   */
  async findAllForReport({ search = "", status, categoriaId }) {
    const where = {};

    if (search && search.trim()) {
      where.OR = [
        { nombre: { contains: search, mode: "insensitive" } },
        { categoria: { contains: search, mode: "insensitive" } },
        { descripcion: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.estado = status;
    }

    if (categoriaId) {
      where.categoriaId = parseInt(categoriaId);
    }

    const materials = await prisma.material.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        categoriaId: true,
        categoria: true,
        descripcion: true,
        stockFundacion: true,
        stockEventos: true,
        stockEventosReservado: true,
        unidadMedida: true,
        estado: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            nombre: true,
            estado: true,
          },
        },
      },
      orderBy: { nombre: "asc" },
    });

    return materials;
  }
}

export default new MaterialsRepository();

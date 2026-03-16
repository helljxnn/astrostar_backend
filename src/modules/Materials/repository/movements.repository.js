import { PrismaClient } from "../../../../generated/prisma/index.js";

const prisma = new PrismaClient();

class MovementsRepository {
  /**
   * Obtener todos los movimientos con paginación y filtros
   */
  async findAll({
    page = 1,
    limit = 10,
    materialId = null,
    tipo = null,
    origen = null,
    search = "",
  }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (materialId) {
      where.materialId = parseInt(materialId);
    }

    // Filtrar por tipo de movimiento
    if (tipo) {
      const tipoLower = tipo.toLowerCase();

      if (tipoLower === "entrada") {
        // Incluir tanto Entrada como REVERSION_ASIGNACION (son ingresos)
        where.tipoMovimiento = { in: ["Entrada", "REVERSION_ASIGNACION"] };
      } else if (tipoLower === "salida") {
        // Para salida, excluir Entrada y REVERSION_ASIGNACION
        where.tipoMovimiento = {
          notIn: ["Entrada", "REVERSION_ASIGNACION"],
        };
      } else {
        // Si se envía el tipo exacto (Entrada, Salida, Baja)
        where.tipoMovimiento = tipo;
      }
    }

    if (origen) {
      where.origen = origen;
    }

    if (search) {
      where.OR = [
        { materialNombre: { contains: search, mode: "insensitive" } },
        { categoria: { contains: search, mode: "insensitive" } },
        { observaciones: { contains: search, mode: "insensitive" } },
      ];
    }

    const [movements, total] = await Promise.all([
      prisma.materialMovement.findMany({
        where,
        skip,
        take: limit,
        include: {
          material: {
            select: {
              id: true,
              nombre: true,
              categoria: true,
              estado: true,
            },
          },
          proveedor: {
            select: {
              id: true,
              businessName: true,
              nit: true,
              entityType: true,
              email: true,
              phone: true,
              documentType: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          fecha: "desc",
        },
      }),
      prisma.materialMovement.count({ where }),
    ]);

    return {
      movements,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener movimiento por ID
   */
  async findById(id) {
    return await prisma.materialMovement.findUnique({
      where: { id: parseInt(id) },
      include: {
        material: {
          select: {
            id: true,
            nombre: true,
            categoria: true,
            estado: true,
          },
        },
        proveedor: {
          select: {
            id: true,
            businessName: true,
            nit: true,
            entityType: true,
            email: true,
            phone: true,
            documentType: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Crear movimiento (dentro de transacción)
   */
  async create(data, userId, transaction = null) {
    const prismaClient = transaction || prisma;

    return await prismaClient.materialMovement.create({
      data: {
        materialId: parseInt(data.material_id),
        materialNombre: data.material_nombre,
        categoria: data.categoria,
        tipoMovimiento: data.tipo_movimiento,
        cantidad: parseInt(data.cantidad),
        origen: data.origen,
        destino: data.destino || null,
        eventoId: data.evento_id ? parseInt(data.evento_id) : null,
        observaciones: data.observaciones || null,
        stockAnterior: data.stock_anterior,
        stockNuevo: data.stock_nuevo,
        referenceId: data.reference_id || null,
        referenceType: data.reference_type || null,
        createdBy: userId,
        createdByName: data.created_by_name || null,
      },
    });
  }

  /**
   * Register movement with stock update (atomic transaction)
   */
  async registerMovement(data, userId) {
    return await prisma.$transaction(async (tx) => {
      // 1. Get material with lock
      const material = await tx.material.findUnique({
        where: { id: parseInt(data.material_id) },
      });

      if (!material) {
        throw new Error("Material not found");
      }

      if (material.estado !== "Activo") {
        throw new Error("Cannot register movements on inactive materials");
      }

      // 2. Determine which inventory to update
      const inventoryType = data.inventario_destino || "FUNDACION";
      const stockField =
        inventoryType === "FUNDACION" ? "stockFundacion" : "stockEventos";
      const currentStock = material[stockField];

      // 3. Calculate new stock based on movement type
      let newStockValue = currentStock;

      if (data.tipo_movimiento === "Entrada") {
        // For entries, add to the specified inventory
        newStockValue += parseInt(data.cantidad);
      } else if (data.tipo_movimiento === "Salida") {
        // For exits, subtract from stock
        newStockValue -= parseInt(data.cantidad);
      }

      // 4. Validate sufficient stock for exits
      if (data.tipo_movimiento === "Salida" && newStockValue < 0) {
        throw new Error(
          `Insufficient stock. Available: ${currentStock}, Requested: ${data.cantidad}`,
        );
      }

      // 5. Calculate total stock before and after
      const stockAnterior = material.stockFundacion + material.stockEventos;
      const stockNuevo =
        inventoryType === "FUNDACION"
          ? newStockValue + material.stockEventos
          : material.stockFundacion + newStockValue;

      // 6. Update material stock
      const updateData = {
        [stockField]: newStockValue,
      };

      const materialActualizado = await tx.material.update({
        where: { id: parseInt(data.material_id) },
        data: updateData,
      });

      // 7. Create movement record
      const movement = await tx.materialMovement.create({
        data: {
          materialId: parseInt(data.material_id),
          materialNombre: data.material_nombre,
          categoria: data.categoria,
          tipoMovimiento: data.tipo_movimiento,
          cantidad: parseInt(data.cantidad),
          destino: data.destino || null,
          inventarioOrigen:
            data.tipo_movimiento === "Salida" ? inventoryType : null,
          inventarioDestino:
            data.tipo_movimiento === "Entrada" ? inventoryType : null,
          eventoId: data.evento_id ? parseInt(data.evento_id) : null,
          donacionId: data.donacion_id ? parseInt(data.donacion_id) : null,
          observaciones: data.observaciones || null,
          stockAnterior: stockAnterior,
          stockNuevo: stockNuevo,
          referenceId: data.reference_id || null,
          referenceType: data.reference_type || null,
          createdBy: userId,
          createdByName: data.created_by_name || null,
          fechaIngreso: data.fecha_ingreso
            ? new Date(data.fecha_ingreso)
            : null,
          proveedorId: data.proveedor_id || null,
        },
      });

      return movement;
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
   * Actualizar movimiento
   */
  async updateMovement(id, data) {
    return await prisma.materialMovement.update({
      where: { id: parseInt(id) },
      data: {
        observaciones:
          data.observaciones !== undefined ? data.observaciones : undefined,
        fechaIngreso: data.fecha_ingreso
          ? new Date(data.fecha_ingreso)
          : undefined,
        proveedorId:
          data.proveedor_id !== undefined ? data.proveedor_id : undefined,
      },
      include: {
        material: {
          select: {
            id: true,
            nombre: true,
            categoria: true,
            estado: true,
          },
        },
        proveedor: {
          select: {
            id: true,
            businessName: true,
            nit: true,
            entityType: true,
            email: true,
            phone: true,
            documentType: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Obtener historial de movimientos de un material
   */
  async getHistoryByMaterial(materialId, limit = 10) {
    return await prisma.materialMovement.findMany({
      where: {
        materialId: parseInt(materialId),
      },
      take: limit,
      orderBy: {
        fecha: "desc",
      },
    });
  }

  /**
   * Obtener estadísticas de movimientos
   */
  async getStatistics(materialId = null, startDate = null, endDate = null) {
    const where = {};

    if (materialId) {
      where.materialId = parseInt(materialId);
    }

    if (startDate || endDate) {
      where.fecha = {};
      if (startDate) where.fecha.gte = new Date(startDate);
      if (endDate) where.fecha.lte = new Date(endDate);
    }

    const [
      totalEntradas,
      totalSalidas,
      totalMovimientos,
      movimientosPorOrigen,
    ] = await Promise.all([
      prisma.materialMovement.aggregate({
        where: { ...where, tipoMovimiento: "Entrada" },
        _sum: { cantidad: true },
        _count: true,
      }),
      prisma.materialMovement.aggregate({
        where: { ...where, tipoMovimiento: "Salida" },
        _sum: { cantidad: true },
        _count: true,
      }),
      prisma.materialMovement.count({ where }),
      prisma.materialMovement.groupBy({
        by: ["origen"],
        where,
        _sum: { cantidad: true },
        _count: true,
      }),
    ]);

    return {
      totalEntradas: totalEntradas._sum.cantidad || 0,
      cantidadEntradas: totalEntradas._count || 0,
      totalSalidas: totalSalidas._sum.cantidad || 0,
      cantidadSalidas: totalSalidas._count || 0,
      totalMovimientos,
      stockNeto:
        (totalEntradas._sum.cantidad || 0) - (totalSalidas._sum.cantidad || 0),
      movimientosPorOrigen: movimientosPorOrigen.map((item) => ({
        origen: item.origen,
        cantidad: item._sum.cantidad,
        movimientos: item._count,
      })),
    };
  }

  /**
   * Obtener movimientos por rango de fechas
   */
  async findByDateRange(startDate, endDate, filters = {}) {
    const where = {
      fecha: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      ...filters,
    };

    return await prisma.materialMovement.findMany({
      where,
      include: {
        material: {
          select: {
            id: true,
            nombre: true,
            categoria: true,
          },
        },
      },
      orderBy: {
        fecha: "desc",
      },
    });
  }

  /**
   * Obtener últimos movimientos (para dashboard)
   */
  async getRecentMovements(limit = 5) {
    return await prisma.materialMovement.findMany({
      take: limit,
      orderBy: {
        fecha: "desc",
      },
      include: {
        material: {
          select: {
            id: true,
            nombre: true,
            categoria: true,
          },
        },
      },
    });
  }

  /**
   * Delete movement (with stock reversal)
   */
  async deleteMovement(id) {
    return await prisma.$transaction(async (tx) => {
      // 1. Get the movement
      const movement = await tx.materialMovement.findUnique({
        where: { id: parseInt(id) },
      });

      if (!movement) {
        throw new Error("Movement not found");
      }

      // 2. Get the material
      const material = await tx.material.findUnique({
        where: { id: movement.materialId },
      });

      if (!material) {
        throw new Error("Material not found");
      }

      // 3. Determine which inventory to reverse
      const inventoryType =
        movement.inventarioDestino || movement.inventarioOrigen || "FUNDACION";
      const stockField =
        inventoryType === "FUNDACION" ? "stockFundacion" : "stockEventos";
      let newStockValue = material[stockField];

      if (movement.tipoMovimiento === "Entrada") {
        // If it was an entry, subtract the quantity
        newStockValue -= movement.cantidad;
      } else if (
        movement.tipoMovimiento === "Salida" ||
        movement.tipoMovimiento === "Baja"
      ) {
        // If it was an exit/discharge, add the quantity back
        newStockValue += movement.cantidad;
      }

      // 4. Validate that stock won't go negative
      if (newStockValue < 0) {
        throw new Error(
          `Cannot delete movement because it would leave stock negative (${newStockValue})`,
        );
      }

      // 5. Update material stock
      await tx.material.update({
        where: { id: movement.materialId },
        data: {
          [stockField]: newStockValue,
        },
      });

      // 6. Delete the movement
      await tx.materialMovement.delete({
        where: { id: parseInt(id) },
      });

      return true;
    });
  }

  /**
   * Find movements by donation ID
   */
  async findByDonationId(donationId) {
    return await prisma.materialMovement.findMany({
      where: {
        donacionId: parseInt(donationId),
      },
      include: {
        material: {
          select: {
            id: true,
            nombre: true,
            categoria: true,
            estado: true,
            unidadMedida: true,
            stockFundacion: true,
            stockEventos: true,
          },
        },
      },
      orderBy: {
        fecha: 'desc',
      },
    });
  }

    /**
     * Obtener todos los movimientos para reporte (SIN PAGINACIÓN)
     */
    async findAllForReport({
      search = "",
      materialId,
      tipoMovimiento,
      startDate,
      endDate,
    }) {
      const where = {};

      if (search && search.trim()) {
        where.OR = [
          { observaciones: { contains: search, mode: "insensitive" } },
        ];
      }

      if (materialId) {
        where.materialId = parseInt(materialId);
      }

      if (tipoMovimiento) {
        where.tipoMovimiento = tipoMovimiento;
      }

      if (startDate || endDate) {
        where.fecha = {};
        if (startDate) {
          where.fecha.gte = new Date(startDate);
        }
        if (endDate) {
          where.fecha.lte = new Date(endDate);
        }
      }

      const movements = await prisma.materialMovement.findMany({
        where,
        include: {
          material: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
            },
          },
          proveedor: {
            select: {
              id: true,
              businessName: true,
            },
          },
        },
        orderBy: { fecha: "desc" },
      });

      return movements;
    }
}

export default new MovementsRepository();



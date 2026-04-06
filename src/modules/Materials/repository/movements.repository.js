import prisma from "../../../config/database.js";
const MATERIAL_STOCK_SELECT = {
  id: true,
  nombre: true,
  categoria: true,
  estado: true,
  stockFundacion: true,
  stockEventos: true,
};

class MovementsRepository {
  // Escapar caracteres especiales para Prisma
  escapeSearchTerm(term) {
    if (!term) return "";
    // Solo retornar el término sin escapar - Prisma maneja esto internamente
    return term.trim();
  }

  parseDateInput(value, isEnd = false) {
    if (!value) return null;

    let date;
    if (value instanceof Date) {
      date = new Date(value);
    } else if (typeof value === "string") {
      const raw = value.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        const [year, month, day] = raw.split("-").map((part) => parseInt(part, 10));
        date = new Date(year, (month || 1) - 1, day || 1);
      } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
        const [day, month, year] = raw.split("/").map((part) => parseInt(part, 10));
        date = new Date(year, (month || 1) - 1, day || 1);
      } else {
        return null;
      }
    } else {
      return null;
    }

    if (Number.isNaN(date.getTime())) return null;
    if (isEnd) {
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(0, 0, 0, 0);
    }

    return date;
  }

  buildDateRange(dateFrom, dateTo) {
    const from = this.parseDateInput(dateFrom, false);
    const to = this.parseDateInput(dateTo, true);
    if (!from && !to) return null;

    const range = {};
    if (from) range.gte = from;
    if (to) range.lte = to;
    return Object.keys(range).length > 0 ? range : null;
  }

  buildSearchConditions(search) {
    if (!search || !search.trim()) return [];

    const escapedSearch = this.escapeSearchTerm(search);
    const normalizedSearch = escapedSearch.toLowerCase();
    const conditions = [
      { materialNombre: { contains: escapedSearch, mode: "insensitive" } },
      { categoria: { contains: escapedSearch, mode: "insensitive" } },
      { observaciones: { contains: escapedSearch, mode: "insensitive" } },
      { inventarioOrigen: { contains: escapedSearch, mode: "insensitive" } },
      { inventarioDestino: { contains: escapedSearch, mode: "insensitive" } },
      {
        proveedor: {
          is: {
            OR: [
              {
                businessName: {
                  contains: escapedSearch,
                  mode: "insensitive",
                },
              },
              {
                mainContact: {
                  contains: escapedSearch,
                  mode: "insensitive",
                },
              },
              {
                email: {
                  contains: escapedSearch,
                  mode: "insensitive",
                },
              },
              { nit: { contains: escapedSearch, mode: "insensitive" } },
            ],
          },
        },
      },
    ];

    if (/^\d+$/.test(escapedSearch)) {
      conditions.push({ cantidad: parseInt(escapedSearch, 10) });
    }

    if (normalizedSearch.includes("baja")) {
      conditions.push({ tipoMovimiento: "Baja" });
    }

    if (normalizedSearch.includes("transfer")) {
      conditions.push({ tipoMovimiento: "TRANSFERENCIA" });
    }

    if (
      normalizedSearch.includes("salida por") ||
      normalizedSearch.includes("salida evento") ||
      normalizedSearch.includes("evento") ||
      normalizedSearch.includes("salida por evento")
    ) {
      conditions.push({
        tipoMovimiento: {
          in: ["SALIDA_EVENTO", "REVERSO_SALIDA_EVENTO", "ASIGNACION_EVENTO"],
        },
      });
    }

    if (normalizedSearch === "salida" || normalizedSearch.includes("salida ")) {
      conditions.push({
        tipoMovimiento: {
          in: [
            "Salida",
            "Baja",
            "TRANSFERENCIA",
            "SALIDA_EVENTO",
            "REVERSO_SALIDA_EVENTO",
            "ASIGNACION_EVENTO",
          ],
        },
      });
    }

    const searchDateRange = this.buildDateRange(escapedSearch, escapedSearch);
    if (searchDateRange) {
      conditions.push({ fecha: searchDateRange });
      conditions.push({ fechaIngreso: searchDateRange });
    }

    return conditions;
  }

  resolveFilterDateField(tipoMovimiento) {
    const normalizedType = String(tipoMovimiento || "")
      .trim()
      .toLowerCase();

    if (["entrada", "ingreso", "ingresos"].includes(normalizedType)) {
      return "fechaIngreso";
    }

    return "fecha";
  }

  buildLegacyOrigenFilter(origen) {
    if (!origen) return null;

    const normalized = String(origen).trim().toUpperCase();
    if (!["FUNDACION", "EVENTOS"].includes(normalized)) {
      return null;
    }

    return {
      OR: [{ inventarioOrigen: normalized }, { inventarioDestino: normalized }],
    };
  }

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
    dateFrom = null,
    dateTo = null,
    inventarioDestino = null,
    tipoSalida = null,
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
        where.tipoMovimiento = { in: ["Entrada", "REVERSION_ASIGNACION"] };
      } else if (tipoLower === "salida") {
        where.tipoMovimiento = {
          notIn: ["Entrada", "REVERSION_ASIGNACION"],
        };
      } else {
        where.tipoMovimiento = tipo;
      }
    }

    const legacyOriginFilter = this.buildLegacyOrigenFilter(origen);
    if (legacyOriginFilter) {
      where.AND = [...(where.AND || []), legacyOriginFilter];
    }

    if (inventarioDestino) {
      where.inventarioDestino = inventarioDestino;
    }

    if (tipoSalida) {
      if (tipoSalida === "Baja") {
        where.tipoMovimiento = "Baja";
      } else if (tipoSalida === "TRANSFERENCIA") {
        where.tipoMovimiento = "TRANSFERENCIA";
      } else if (tipoSalida === "SALIDA_EVENTO") {
        where.tipoMovimiento = { in: ["SALIDA_EVENTO", "ASIGNACION_EVENTO"] };
      }
    }

    // Búsqueda - usar OR simple sin AND
    if (search && search.trim()) {
      where.OR = this.buildSearchConditions(search);
    }

    const dateRange = this.buildDateRange(dateFrom, dateTo);
    if (dateRange) {
      where[this.resolveFilterDateField(tipo)] = dateRange;
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
        select: MATERIAL_STOCK_SELECT,
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
        select: MATERIAL_STOCK_SELECT,
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
      movementsForOriginStats,
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
      prisma.materialMovement.findMany({
        where,
        select: {
          cantidad: true,
          inventarioOrigen: true,
          inventarioDestino: true,
          destino: true,
          tipoMovimiento: true,
        },
      }),
    ]);

    const originStatsMap = new Map();
    movementsForOriginStats.forEach((movement) => {
      const originKey =
        movement.inventarioDestino ||
        movement.inventarioOrigen ||
        movement.destino ||
        movement.tipoMovimiento ||
        "SIN_ORIGEN";

      const current = originStatsMap.get(originKey) || {
        origen: originKey,
        cantidad: 0,
        movimientos: 0,
      };

      current.cantidad += movement.cantidad || 0;
      current.movimientos += 1;
      originStatsMap.set(originKey, current);
    });

    return {
      totalEntradas: totalEntradas._sum.cantidad || 0,
      cantidadEntradas: totalEntradas._count || 0,
      totalSalidas: totalSalidas._sum.cantidad || 0,
      cantidadSalidas: totalSalidas._count || 0,
      totalMovimientos,
      stockNeto:
        (totalEntradas._sum.cantidad || 0) - (totalSalidas._sum.cantidad || 0),
      movimientosPorOrigen: Array.from(originStatsMap.values()),
    };
  }

  /**
   * Obtener movimientos por rango de fechas
   */
  async findByDateRange(startDate, endDate, filters = {}) {
    const normalizedFilters = { ...filters };
    const legacyOriginFilter = this.buildLegacyOrigenFilter(
      normalizedFilters.origen,
    );
    delete normalizedFilters.origen;

    const where = {
      fecha: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      ...normalizedFilters,
    };

    if (legacyOriginFilter) {
      where.AND = [...(where.AND || []), legacyOriginFilter];
    }

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

       const systemMovements = [
         "Salida",
         "Baja",
         "ASIGNACION_EVENTO",
         "SALIDA_EVENTO",
         "REVERSION_ASIGNACION",
         "TRANSFERENCIA",
       ];

       if (systemMovements.includes(movement.tipoMovimiento)) {
         const error = new Error(
           "Cannot delete automatic system movements",
         );
         error.statusCode = 403;
         throw error;
       }

      // 2. Get the material
      const material = await tx.material.findUnique({
        where: { id: movement.materialId },
        select: MATERIAL_STOCK_SELECT,
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
        select: MATERIAL_STOCK_SELECT,
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
        fecha: "desc",
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
    inventarioDestino,
    tipoSalida,
  }) {
    const where = {};

    if (inventarioDestino) {
      where.inventarioDestino = inventarioDestino;
    }

    if (tipoSalida) {
      if (tipoSalida === "Baja") {
        where.tipoMovimiento = "Baja";
      } else if (tipoSalida === "TRANSFERENCIA") {
        where.tipoMovimiento = "TRANSFERENCIA";
      } else if (tipoSalida === "SALIDA_EVENTO") {
        where.tipoMovimiento = { in: ["SALIDA_EVENTO", "ASIGNACION_EVENTO"] };
      }
    }

    if (search && search.trim()) {
      where.AND = [
        ...(where.AND || []),
        { OR: this.buildSearchConditions(search) },
      ];
    }

    if (materialId) {
      where.materialId = parseInt(materialId);
    }

    if (tipoMovimiento) {
      const tipoLower = String(tipoMovimiento).toLowerCase();
      if (["entrada", "ingreso", "ingresos"].includes(tipoLower)) {
        where.tipoMovimiento = { in: ["Entrada", "REVERSION_ASIGNACION"] };
      } else if (["salida", "salidas"].includes(tipoLower)) {
        where.tipoMovimiento = { notIn: ["Entrada", "REVERSION_ASIGNACION"] };
      } else {
        where.tipoMovimiento = tipoMovimiento;
      }
    }

    const dateRange = this.buildDateRange(startDate, endDate);
    if (dateRange) {
      where[this.resolveFilterDateField(tipoMovimiento)] = dateRange;
    }

    const movements = await prisma.materialMovement.findMany({
      where,
      include: {
        material: {
          select: {
            id: true,
            nombre: true,
            categoria: true,
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

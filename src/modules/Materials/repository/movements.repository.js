import { PrismaClient } from '../../../../generated/prisma/index.js';

const prisma = new PrismaClient();

class MovementsRepository {
  /**
   * Obtener todos los movimientos con paginación y filtros
   */
  async findAll({ page = 1, limit = 10, materialId = null, tipo = null, origen = null, search = '' }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (materialId) {
      where.materialId = parseInt(materialId);
    }

    if (tipo) {
      where.tipoMovimiento = tipo;
    }

    if (origen) {
      where.origen = origen;
    }

    if (search) {
      where.OR = [
        { materialNombre: { contains: search, mode: 'insensitive' } },
        { categoria: { contains: search, mode: 'insensitive' } },
        { observaciones: { contains: search, mode: 'insensitive' } },
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
        },
        orderBy: {
          fecha: 'desc',
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
   * Registrar movimiento con actualización de stock (transacción atómica)
   */
  async registerMovement(data, userId) {
    return await prisma.$transaction(async (tx) => {
      // 1. Obtener material con bloqueo
      const material = await tx.material.findUnique({
        where: { id: parseInt(data.material_id) },
      });

      if (!material) {
        throw new Error('Material no encontrado');
      }

      if (material.estado !== 'Activo') {
        throw new Error('No se pueden registrar movimientos en materiales inactivos');
      }

      // 2. Calcular stock actual
      const movements = await tx.materialMovement.findMany({
        where: { materialId: parseInt(data.material_id) },
        select: {
          tipoMovimiento: true,
          cantidad: true,
        },
      });

      let stockActual = 0;
      movements.forEach((mov) => {
        if (mov.tipoMovimiento === 'Entrada') {
          stockActual += mov.cantidad;
        } else if (mov.tipoMovimiento === 'Salida') {
          stockActual -= mov.cantidad;
        }
      });

      // 3. Calcular nuevo stock
      let stockNuevo = stockActual;
      if (data.tipo_movimiento === 'Entrada') {
        stockNuevo += parseInt(data.cantidad);
      } else if (data.tipo_movimiento === 'Salida') {
        stockNuevo -= parseInt(data.cantidad);
      }

      // 4. Validar stock suficiente para salidas
      if (data.tipo_movimiento === 'Salida' && stockNuevo < 0) {
        throw new Error(
          `Stock insuficiente. Stock actual: ${stockActual}, Cantidad solicitada: ${data.cantidad}`
        );
      }

      // 5. Crear movimiento
      const movement = await tx.materialMovement.create({
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
          stockAnterior: stockActual,
          stockNuevo: stockNuevo,
          referenceId: data.reference_id || null,
          referenceType: data.reference_type || null,
          createdBy: userId,
          createdByName: data.created_by_name || null,
        },
      });

      return movement;
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
        fecha: 'desc',
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

    const [totalEntradas, totalSalidas, totalMovimientos, movimientosPorOrigen] = await Promise.all([
      prisma.materialMovement.aggregate({
        where: { ...where, tipoMovimiento: 'Entrada' },
        _sum: { cantidad: true },
        _count: true,
      }),
      prisma.materialMovement.aggregate({
        where: { ...where, tipoMovimiento: 'Salida' },
        _sum: { cantidad: true },
        _count: true,
      }),
      prisma.materialMovement.count({ where }),
      prisma.materialMovement.groupBy({
        by: ['origen'],
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
      stockNeto: (totalEntradas._sum.cantidad || 0) - (totalSalidas._sum.cantidad || 0),
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
        fecha: 'desc',
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
        fecha: 'desc',
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
}

export default new MovementsRepository();

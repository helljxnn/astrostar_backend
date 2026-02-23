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

    // Filtrar por tipo de movimiento
    if (tipo) {
      const tipoLower = tipo.toLowerCase();
      
      if (tipoLower === 'entrada') {
        where.tipoMovimiento = 'Entrada';
      } else if (tipoLower === 'salida') {
        // Para salida, excluir solo Entrada (así incluye Salida, Baja, etc.)
        where.tipoMovimiento = { not: 'Entrada' };
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
   * Registrar movimiento con actualización de stock (transacción atómica)
   */
  async registerMovement(data, userId) {
    return await prisma.$transaction(async (tx) => {
      console.log('🔍 DEBUG registerMovement - data recibida:', JSON.stringify(data, null, 2));
      
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
      const stockActual = material.stock;
      console.log('📊 Stock actual:', stockActual);

      // 3. Calcular nuevo stock según tipo de movimiento
      let nuevoStock = stockActual;
      
      console.log('🎯 Tipo movimiento:', data.tipo_movimiento);
      
      if (data.tipo_movimiento === 'Entrada') {
        // Para ingresos, TODO va al stock único
        nuevoStock += parseInt(data.cantidad);
        console.log('✅ Sumando al stock:', parseInt(data.cantidad));
      } else if (data.tipo_movimiento === 'Salida') {
        // Para salidas, restar del stock
        nuevoStock -= parseInt(data.cantidad);
        console.log('➖ Restando del stock:', parseInt(data.cantidad));
      }

      console.log('📊 Nuevo stock:', nuevoStock);

      // 4. Validar stock suficiente para salidas
      if (data.tipo_movimiento === 'Salida' && nuevoStock < 0) {
        throw new Error(
          `Stock insuficiente. Stock disponible: ${stockActual}, Cantidad solicitada: ${data.cantidad}`
        );
      }

      // 5. Actualizar stock del material
      const materialActualizado = await tx.material.update({
        where: { id: parseInt(data.material_id) },
        data: {
          stock: nuevoStock,
        },
      });
      
      console.log('✅ Material actualizado en BD - Stock:', materialActualizado.stock);

      // 6. Mapear destino_stock a valor del enum
      let destinoStockEnum = null;
      if (data.destino_stock) {
        destinoStockEnum = data.destino_stock === 'USO_INTERNO' ? 'USO_INTERNO' : 'EVENTOS';
      }

      // 7. Crear movimiento
      const movement = await tx.materialMovement.create({
        data: {
          materialId: parseInt(data.material_id),
          materialNombre: data.material_nombre,
          categoria: data.categoria,
          tipoMovimiento: data.tipo_movimiento,
          cantidad: parseInt(data.cantidad),
          destino: data.destino || null,
          destinoStock: destinoStockEnum,  // Solo informativo
          eventoId: data.evento_id ? parseInt(data.evento_id) : null,
          donacionId: data.donacion_id ? parseInt(data.donacion_id) : null,
          observaciones: data.observaciones || null,
          stockAnterior: stockActual,
          stockNuevo: nuevoStock,
          referenceId: data.reference_id || null,
          referenceType: data.reference_type || null,
          createdBy: userId,
          createdByName: data.created_by_name || null,
          // Campos para ingresos
          fechaIngreso: data.fecha_ingreso ? new Date(data.fecha_ingreso) : null,
          proveedorId: data.proveedor_id || null,
        },
      });

      // 8. Si es ingreso para EVENTOS, crear asignación
      if (data.tipo_movimiento === 'Entrada' && data.destino_stock === 'EVENTOS' && data.evento_id) {
        await tx.eventMaterialAssignment.create({
          data: {
            materialId: parseInt(data.material_id),
            eventoId: parseInt(data.evento_id),
            cantidadAsignada: parseInt(data.cantidad),
            estado: 'RESERVADO',
            fechaAsignacion: new Date(),
            observaciones: data.observaciones || null,
            createdBy: userId,
            createdByName: data.created_by_name || null,
          },
        });
        console.log('✅ Asignación a evento creada');
      }

      return movement;
    });
  }

  /**
   * Registrar baja de material (transacción atómica)
   */
  async registerDischarge(data, userId) {
    return await prisma.$transaction(async (tx) => {
      // 1. Obtener material con bloqueo
      const material = await tx.material.findUnique({
        where: { id: parseInt(data.material_id) },
      });

      if (!material) {
        throw new Error('Material no encontrado');
      }

      if (material.estado !== 'Activo') {
        throw new Error('No se pueden registrar bajas en materiales inactivos');
      }

      // 2. Validar stock suficiente
      const cantidad = parseInt(data.cantidad);
      if (cantidad > material.stockDisponible) {
        throw new Error(
          `Stock insuficiente. Stock disponible: ${material.stockDisponible}, Cantidad solicitada: ${cantidad}`
        );
      }

      // 3. Calcular stock actual y nuevo
      const stockActual = material.stockDisponible + material.stockEventos;
      const nuevoStockDisponible = material.stockDisponible - cantidad;
      const stockNuevo = nuevoStockDisponible + material.stockEventos;

      // 4. Actualizar stock del material
      await tx.material.update({
        where: { id: parseInt(data.material_id) },
        data: {
          stockDisponible: nuevoStockDisponible,
        },
      });

      // 5. Mapear tipo_baja a valor del enum
      const tipoBajaEnum = this.mapTipoBajaToEnum(data.tipo_baja);

      // 6. Crear movimiento de baja
      const movement = await tx.materialMovement.create({
        data: {
          materialId: parseInt(data.material_id),
          materialNombre: data.material_nombre,
          categoria: data.categoria,
          tipoMovimiento: 'Baja',
          cantidad: cantidad,
          origen: data.origen,
          destino: null,
          observaciones: data.observaciones || null,
          stockAnterior: stockActual,
          stockNuevo: stockNuevo,
          createdBy: userId,
          createdByName: data.created_by_name || null,
          tipoBaja: tipoBajaEnum,
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
      'DAÑO O DETERIORO': 'DanoDeterioro',
      'DANO O DETERIORO': 'DanoDeterioro',
      'PÉRDIDA': 'Perdida',
      'PERDIDA': 'Perdida',
      'ROBO': 'Robo',
      'AJUSTE DE INVENTARIO': 'AjusteInventario',
      'OTRO': 'Otro',
    };
    
    return mapeo[tipoBajaNormalizado] || 'Otro';
  }

  /**
   * Actualizar movimiento
   */
  async updateMovement(id, data) {
    return await prisma.materialMovement.update({
      where: { id: parseInt(id) },
      data: {
        observaciones: data.observaciones !== undefined ? data.observaciones : undefined,
        fechaIngreso: data.fecha_ingreso ? new Date(data.fecha_ingreso) : undefined,
        proveedorId: data.proveedor_id !== undefined ? data.proveedor_id : undefined,
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

  /**
   * Eliminar movimiento (con reversión de stock)
   */
  async deleteMovement(id) {
    return await prisma.$transaction(async (tx) => {
      // 1. Obtener el movimiento
      const movement = await tx.materialMovement.findUnique({
        where: { id: parseInt(id) },
      });

      if (!movement) {
        throw new Error('Movimiento no encontrado');
      }

      // 2. Obtener el material
      const material = await tx.material.findUnique({
        where: { id: movement.materialId },
      });

      if (!material) {
        throw new Error('Material no encontrado');
      }

      // 3. Revertir el stock según el tipo de movimiento
      let nuevoStock = material.stock;
      
      if (movement.tipoMovimiento === 'Entrada') {
        // Si era una entrada, restar la cantidad
        nuevoStock -= movement.cantidad;
      } else if (movement.tipoMovimiento === 'Salida' || movement.tipoMovimiento === 'Baja') {
        // Si era una salida/baja, sumar la cantidad
        nuevoStock += movement.cantidad;
      }

      // 4. Validar que el stock no quede negativo
      if (nuevoStock < 0) {
        throw new Error(
          `No se puede eliminar el movimiento porque dejaría el stock en negativo (${nuevoStock})`
        );
      }

      // 5. Actualizar el stock del material
      await tx.material.update({
        where: { id: movement.materialId },
        data: {
          stock: nuevoStock,
        },
      });

      // 6. Si el movimiento tenía asignación a evento, eliminarla también
      if (movement.tipoMovimiento === 'Entrada' && movement.destinoStock === 'EVENTOS' && movement.eventoId) {
        await tx.eventMaterialAssignment.deleteMany({
          where: {
            materialId: movement.materialId,
            eventoId: movement.eventoId,
            estado: 'RESERVADO',
            cantidadAsignada: movement.cantidad,
          },
        });
      }

      // 7. Eliminar el movimiento
      await tx.materialMovement.delete({
        where: { id: parseInt(id) },
      });

      return true;
    });
  }
}

export default new MovementsRepository();

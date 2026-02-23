import { PrismaClient } from '../../../../generated/prisma/index.js';

const prisma = new PrismaClient();

class MaterialsRepository {
  /**
   * Obtener todos los materiales con paginación y búsqueda
   */
  async findAll({ page = 1, limit = 10, search = '', estado = null, categoriaId = null }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { categoria: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (estado) {
      where.estado = estado;
    }

    if (categoriaId) {
      where.categoriaId = parseInt(categoriaId);
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
          stockDisponible: true,
          stockEventos: true,
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
          createdAt: 'desc',
        },
      }),
      prisma.material.count({ where }),
    ]);

    // Calcular stock_total para cada material
    const materialsWithTotal = materials.map(material => ({
      ...material,
      stockTotal: material.stockDisponible + material.stockEventos,
    }));

    return {
      materials: materialsWithTotal,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener material por ID
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
        stockDisponible: true,
        stockEventos: true,
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

    // Agregar stock_total calculado
    return {
      ...material,
      stockTotal: material.stockDisponible + material.stockEventos,
    };
  }

  /**
   * Verificar si existe un material con el mismo nombre en la misma categoría
   */
  async existsByNameAndCategory(nombre, categoriaId, excludeId = null) {
    const where = {
      nombre: {
        equals: nombre.trim(),
        mode: 'insensitive',
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
   * Crear material
   */
  async create(data, userId) {
    // Obtener nombre de la categoría
    const category = await prisma.materialCategory.findUnique({
      where: { id: parseInt(data.categoria_id) },
      select: { nombre: true, estado: true },
    });

    if (!category) {
      throw new Error('Categoría no encontrada');
    }

    if (category.estado !== 'Activo') {
      throw new Error('No se puede crear material con una categoría inactiva');
    }

    const material = await prisma.material.create({
      data: {
        nombre: data.nombre.trim(),
        categoriaId: parseInt(data.categoria_id),
        categoria: category.nombre,
        descripcion: data.descripcion?.trim() || null,
        unidadMedida: data.unidad_medida?.trim().toLowerCase() || 'unidad',
        stockDisponible: 0, // Inicia en 0
        stockEventos: 0, // Inicia en 0
        estado: 'Activo',
        createdBy: userId,
      },
      include: {
        category: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    // Agregar stock_total calculado
    return {
      ...material,
      stockTotal: material.stockDisponible + material.stockEventos,
    };
  }

  /**
   * Actualizar material
   * IMPORTANTE: No se puede cambiar nombre ni categoría si tiene movimientos
   */
  async update(id, data, userId) {
    const material = await this.findById(id);
    if (!material) {
      throw new Error('Material no encontrado');
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
          'No se puede cambiar el nombre del material porque tiene movimientos registrados. Para mantener la trazabilidad del inventario, el nombre debe permanecer igual.'
        );
      }

      // Validar que no intenten cambiar la categoría
      if (data.categoria_id && parseInt(data.categoria_id) !== material.categoriaId) {
        throw new Error(
          'No se puede cambiar la categoría del material porque tiene movimientos registrados. Para mantener la trazabilidad del inventario, la categoría debe permanecer igual.'
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
          throw new Error('Categoría no encontrada');
        }

        if (category.estado !== 'Activo') {
          throw new Error('No se puede asignar una categoría inactiva');
        }

        updateData.categoriaId = parseInt(data.categoria_id);
        updateData.categoria = category.nombre;
      }
    }

    // La unidad de medida siempre es "unidad", no se actualiza

    const materialActualizado = await prisma.material.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    // Agregar stock_total calculado
    return {
      ...materialActualizado,
      stockTotal: materialActualizado.stockDisponible + materialActualizado.stockEventos,
    };
  }

  /**
   * Cambiar estado del material
   */
  async toggleStatus(id, userId) {
    const material = await this.findById(id);
    if (!material) {
      throw new Error('Material no encontrado');
    }

    const newStatus = material.estado === 'Activo' ? 'Inactivo' : 'Activo';

    const materialActualizado = await prisma.material.update({
      where: { id: parseInt(id) },
      data: {
        estado: newStatus,
        updatedBy: userId,
      },
    });

    // Agregar stock_total calculado
    return {
      ...materialActualizado,
      stockTotal: materialActualizado.stockDisponible + materialActualizado.stockEventos,
    };
  }

  /**
   * Eliminar material (solo si no tiene movimientos)
   */
  async delete(id) {
    // Verificar si tiene movimientos
    const movementsCount = await prisma.materialMovement.count({
      where: { materialId: parseInt(id) },
    });

    if (movementsCount > 0) {
      throw new Error(
        `No se puede eliminar el material porque tiene ${movementsCount} movimiento(s) registrado(s). Cambie el estado a Inactivo en su lugar.`
      );
    }

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
      if (mov.tipoMovimiento === 'Entrada') {
        stock += mov.cantidad;
      } else if (mov.tipoMovimiento === 'Salida') {
        stock -= mov.cantidad;
      }
    });

    return stock;
  }

  /**
   * Registrar baja de material (transacción atómica)
   */
  async registerDischarge(materialId, data, userId, userName) {
    return await prisma.$transaction(async (tx) => {
      // 1. Obtener material con bloqueo
      const material = await tx.material.findUnique({
        where: { id: parseInt(materialId) },
      });

      if (!material) {
        throw new Error('Material no encontrado');
      }

      if (material.estado !== 'Activo') {
        throw new Error('No se pueden registrar bajas en materiales inactivos');
      }

      // 2. Calcular nuevo stock según el origen
      let nuevoStockDisponible = material.stockDisponible;
      let nuevoStockEventos = material.stockEventos;

      if (data.origenStock === 'USO_INTERNO') {
        // Validar stock disponible suficiente
        if (material.stockDisponible < data.cantidad) {
          throw new Error(
            `Stock disponible insuficiente. Stock disponible: ${material.stockDisponible}, Cantidad solicitada: ${data.cantidad}`
          );
        }
        nuevoStockDisponible -= data.cantidad;
      } else if (data.origenStock === 'EVENTOS') {
        // Validar stock de eventos suficiente
        if (material.stockEventos < data.cantidad) {
          throw new Error(
            `Stock de eventos insuficiente. Stock eventos: ${material.stockEventos}, Cantidad solicitada: ${data.cantidad}`
          );
        }
        nuevoStockEventos -= data.cantidad;
      }

      const stockAnterior = material.stockDisponible + material.stockEventos;
      const stockNuevo = nuevoStockDisponible + nuevoStockEventos;

      // 3. Actualizar stock del material
      const materialActualizado = await tx.material.update({
        where: { id: parseInt(materialId) },
        data: {
          stockDisponible: nuevoStockDisponible,
          stockEventos: nuevoStockEventos,
        },
        include: {
          category: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      });

      // 4. Mapear tipo_baja a valor del enum de Prisma
      let tipoBajaEnum;
      const tipoBajaNormalizado = data.tipo_baja.toUpperCase().trim();
      
      switch (tipoBajaNormalizado) {
        case 'DAÑO O DETERIORO':
        case 'DANO O DETERIORO':
          tipoBajaEnum = 'DanoDeterioro';
          break;
        case 'PÉRDIDA':
        case 'PERDIDA':
          tipoBajaEnum = 'Perdida';
          break;
        case 'ROBO':
          tipoBajaEnum = 'Robo';
          break;
        case 'AJUSTE DE INVENTARIO':
          tipoBajaEnum = 'AjusteInventario';
          break;
        default:
          tipoBajaEnum = 'Otro';
      }

      // 5. Mapear origen_stock a valor del enum
      const origenStockEnum = data.origenStock === 'USO_INTERNO' ? 'USO_INTERNO' : 'EVENTOS';

      // 6. Crear movimiento de baja
      await tx.materialMovement.create({
        data: {
          materialId: parseInt(materialId),
          materialNombre: material.nombre,
          categoria: material.categoria,
          tipoMovimiento: 'Baja',
          cantidad: data.cantidad,
          destinoStock: origenStockEnum,  // Reutilizar campo para indicar origen
          tipoBaja: tipoBajaEnum,  // Usar valor del enum de Prisma
          observaciones: data.descripcion,
          stockAnterior: stockAnterior,
          stockNuevo: stockNuevo,
          createdBy: userId,
          createdByName: userName,
        },
      });

      // 7. Retornar material actualizado con stock_total
      return {
        ...materialActualizado,
        stockTotal: materialActualizado.stockDisponible + materialActualizado.stockEventos,
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
   * Obtener historial de movimientos de un material (para futuro)
   */
  async getMovementHistory(materialId, limit = 10) {
    return await prisma.materialMovement.findMany({
      where: { materialId: parseInt(materialId) },
      orderBy: { fecha: 'desc' },
      take: limit,
    });
  }
}

export default new MaterialsRepository();

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
        include: {
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

    return {
      materials,
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
    return await prisma.material.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: {
          select: {
            id: true,
            nombre: true,
            estado: true,
          },
        },
      },
    });
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

    return await prisma.material.create({
      data: {
        nombre: data.nombre.trim(),
        categoriaId: parseInt(data.categoria_id),
        categoria: category.nombre,
        descripcion: data.descripcion?.trim() || null,
        stockActual: 0, // Inicia en 0
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

    return await prisma.material.update({
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

    return await prisma.material.update({
      where: { id: parseInt(id) },
      data: {
        estado: newStatus,
        updatedBy: userId,
      },
    });
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

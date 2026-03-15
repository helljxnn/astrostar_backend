import { PrismaClient } from '../../../../generated/prisma/index.js';

const prisma = new PrismaClient();

class CategoriesRepository {
  /**
   * Obtener todas las categorías con filtros
   */
  async findAll({ page = 1, limit = 10, search = '', estado = null }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (estado) {
      where.estado = estado;
    }

    const [categories, total] = await Promise.all([
      prisma.materialCategory.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { materials: true },
          },
        },
        orderBy: {
          nombre: 'asc',
        },
      }),
      prisma.materialCategory.count({ where }),
    ]);

    return {
      categories,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener categoría por ID
   */
  async findById(id) {
    return await prisma.materialCategory.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { materials: true },
        },
      },
    });
  }

  /**
   * Verificar si existe una categoría con el mismo nombre
   */
  async existsByName(nombre, excludeId = null) {
    const where = {
      nombre: {
        equals: nombre.trim(),
        mode: 'insensitive',
      },
    };

    if (excludeId) {
      where.NOT = { id: parseInt(excludeId) };
    }

    const category = await prisma.materialCategory.findFirst({ where });
    return !!category;
  }

  /**
   * Crear categoría
   */
  async create(data, userId) {
    return await prisma.materialCategory.create({
      data: {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion?.trim() || null,
        estado: 'Activo',
        createdBy: userId,
      },
    });
  }

  /**
   * Actualizar categoría
   */
  async update(id, data, userId) {
    return await prisma.materialCategory.update({
      where: { id: parseInt(id) },
      data: {
        nombre: data.nombre?.trim(),
        descripcion: data.descripcion?.trim() || null,
        estado: data.estado,
        updatedBy: userId,
      },
    });
  }

  /**
   * Cambiar estado de la categoría
   */
  async toggleStatus(id, userId) {
    const category = await this.findById(id);
    if (!category) {
      throw new Error('Categoría no encontrada');
    }

    const newStatus = category.estado === 'Activo' ? 'Inactivo' : 'Activo';

    return await prisma.materialCategory.update({
      where: { id: parseInt(id) },
      data: {
        estado: newStatus,
        updatedBy: userId,
      },
    });
  }

  /**
   * Eliminar categoría (solo si no tiene materiales)
   */
  async delete(id) {
    // Verificar si tiene materiales asociados
    const materialsCount = await prisma.material.count({
      where: { categoriaId: parseInt(id) },
    });

    if (materialsCount > 0) {
      throw new Error(
        `No se puede eliminar la categoría porque tiene ${materialsCount} material(es) asociado(s)`
      );
    }

    return await prisma.materialCategory.delete({
      where: { id: parseInt(id) },
    });
  }

  /**
   * Obtener solo categorías activas (para selectores)
   */
  async findAllActive() {
    return await prisma.materialCategory.findMany({
      where: { estado: 'Activo' },
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        nombre: true,
      },
    });
  }

  /**
   * Obtener todas las categorías para reporte (SIN PAGINACIÓN)
   */
  async findAllForReport({ search = '', estado = null }) {
    const where = {};

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (estado !== null) {
      where.estado = estado;
    }

    const result = await prisma.materialCategory.findMany({
      where,
      orderBy: { nombre: 'asc' },
    });

    return { categories: result };
  }
}

export default new CategoriesRepository();

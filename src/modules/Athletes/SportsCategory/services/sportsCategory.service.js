import prisma from '../../../../config/database.js';

export class SportsCategoryService {

  async getAllSportsCategories({ page = 1, limit = 10, search = '', status = '' }) {
    try {
      // Convertir a números
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const skip = (pageNum - 1) * limitNum;
      const where = {};

      if (search) {
        where.OR = [
          { nombre: { contains: search, mode: 'insensitive' } },
          { descripcion: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (status) {
        const map = { Active: 'Activo', Inactive: 'Inactivo' };
        where.estado = map[status] || status;
      }

      const [cats, total] = await Promise.all([
        prisma.sportsCategory.findMany({ where, skip, take: limitNum, orderBy: { createdAt: 'desc' } }),
        prisma.sportsCategory.count({ where })
      ]);

      return {
        success: true,
        data: cats.map(c => ({
          id: c.id,
          name: c.nombre,
          description: c.descripcion,
          minAge: c.edadMinima,
          maxAge: c.edadMaxima,
          status: c.estado === 'Activo' ? 'Active' : 'Inactive',
          publish: c.publicar,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt
        })),
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
          limit: limitNum
        }
      };
    } catch (error) {
      console.error('❌ Error in getAllSportsCategories service:', error);
      throw error;
    }
  }

  async createSportsCategory(data) {
    const { nombre, descripcion, edadMinima, edadMaxima, estado = 'Activo', publicar = false } = data;

    if (edadMinima >= edadMaxima) {
      return { success: false, message: 'La edad máxima debe ser mayor que la mínima.', statusCode: 400 };
    }

    const exists = await prisma.sportsCategory.findFirst({
      where: { nombre: { equals: nombre.trim(), mode: 'insensitive' } }
    });
    if (exists) return { success: false, message: `El nombre "${nombre}" ya está en uso.`, statusCode: 409 };

    const cat = await prisma.sportsCategory.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        edadMinima,
        edadMaxima,
        estado,
        publicar,
        ...(data.archivo && { archivo: data.archivo })
      }
    });

    return {
      success: true,
      data: {
        id: cat.id,
        name: cat.nombre,
        description: cat.descripcion,
        minAge: cat.edadMinima,
        maxAge: cat.edadMaxima,
        status: cat.estado === 'Activo' ? 'Active' : 'Inactive',
        publish: cat.publicar,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt
      },
      message: 'Categoría creada exitosamente.',
      statusCode: 201
    };
  }

  async getSportsCategoryById(id) {
    const cat = await prisma.sportsCategory.findUnique({ where: { id: Number(id) } });
    if (!cat) return { success: false, message: `Categoría con ID ${id} no encontrada.`, statusCode: 404 };

    return {
      success: true,
      data: {
        id: cat.id,
        name: cat.nombre,
        description: cat.descripcion,
        minAge: cat.edadMinima,
        maxAge: cat.edadMaxima,
        status: cat.estado === 'Activo' ? 'Active' : 'Inactive',
        publish: cat.publicar,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt
      },
      statusCode: 200
    };
  }

  async updateSportsCategory(id, data) {
    const cat = await prisma.sportsCategory.findUnique({ where: { id: Number(id) } });
    if (!cat) return { success: false, message: `Categoría con ID ${id} no encontrada.`, statusCode: 404 };

    if (data.nombre && data.nombre.trim() !== cat.nombre) {
      const dup = await prisma.sportsCategory.findFirst({
        where: { nombre: { equals: data.nombre.trim(), mode: 'insensitive' }, NOT: { id: cat.id } }
      });
      if (dup) return { success: false, message: `El nombre "${data.nombre}" ya está en uso.`, statusCode: 409 };
    }

    if (data.edadMinima !== undefined && data.edadMaxima !== undefined && data.edadMinima >= data.edadMaxima) {
      return { success: false, message: 'La edad máxima debe ser mayor que la mínima.', statusCode: 400 };
    }

    const upd = await prisma.sportsCategory.update({
      where: { id: cat.id },
      data: {
        ...(data.nombre && { nombre: data.nombre.trim() }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion?.trim() || null }),
        ...(data.edadMinima !== undefined && { edadMinima: data.edadMinima }),
        ...(data.edadMaxima !== undefined && { edadMaxima: data.edadMaxima }),
        ...(data.estado !== undefined && { estado: data.estado }),
        ...(data.publicar !== undefined && { publicar: data.publicar }),
        ...(data.archivo && { archivo: data.archivo })
      }
    });

    return {
      success: true,
      data: {
        id: upd.id,
        name: upd.nombre,
        description: upd.descripcion,
        minAge: upd.edadMinima,
        maxAge: upd.edadMaxima,
        status: upd.estado === 'Activo' ? 'Active' : 'Inactive',
        publish: upd.publicar,
        createdAt: upd.createdAt,
        updatedAt: upd.updatedAt
      },
      message: 'Categoría actualizada exitosamente.',
      statusCode: 200
    };
  }

  async deleteSportsCategory(id) {
    await prisma.sportsCategory.delete({ where: { id: Number(id) } });
    return { success: true, message: 'Categoría eliminada exitosamente.', statusCode: 200 };
  }

  async getSportsCategoryStats() {
    const [total, active, inactive] = await Promise.all([
      prisma.sportsCategory.count(),
      prisma.sportsCategory.count({ where: { estado: 'Activo' } }),
      prisma.sportsCategory.count({ where: { estado: 'Inactivo' } })
    ]);

    return {
      success: true,
      data: { total, active, inactive },
      message: 'Estadísticas de categorías recuperadas exitosamente.'
    };
  }

  async checkCategoryNameExists(name, excludeId = null) {
    const where = {
      nombre: { equals: name.trim(), mode: 'insensitive' }
    };

    if (excludeId) {
      where.NOT = { id: Number(excludeId) };
    }

    const exists = await prisma.sportsCategory.findFirst({ where });

    if (exists) {
      return {
        success: true,
        data: {
          available: false,
          message: `El nombre "${name}" ya está en uso.`,
          existingCategory: exists.nombre
        }
      };
    }

    return {
      success: true,
      data: {
        available: true,
        message: 'Nombre disponible.'
      }
    };
  }

}

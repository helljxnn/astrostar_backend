import prisma from '../../../../config/database.js';

export class SportsCategoryService {

  // =============================================================================
  // 📊 OPERACIONES DE LECTURA (GET)
  // =============================================================================

  /**
   * Obtiene todas las categorías con paginación, búsqueda y filtros
   */
  async getAllSportsCategories({ page = 1, limit = 10, search = '', status = '' }) {
    const skip = (page - 1) * limit;
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
      prisma.sportsCategory.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
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
        page: Number(page),
        pages: Math.ceil(total / limit),
        limit: Number(limit)
      }
    };
  }

  /**
   * Obtiene una categoría por ID
   */
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

  // =============================================================================
  // ✍️ OPERACIONES DE ESCRITURA (CREATE, UPDATE, DELETE)
  // =============================================================================

  /**
   * Crea una nueva categoría deportiva
   */
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

  /**
   * Actualiza una categoría existente por ID
   */
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

  /**
   * Elimina una categoría por ID
   */
  async deleteSportsCategory(id) {
    await prisma.sportsCategory.delete({ where: { id: Number(id) } });
    return { success: true, message: 'Categoría eliminada exitosamente.', statusCode: 200 };
  }

  // =============================================================================
  // 🔍 OPERACIONES DE VALIDACIÓN Y UTILIDADES
  // =============================================================================

  /**
   * Verifica disponibilidad de nombre de categoría (para validación en tiempo real)
   * @param {string} name - Nombre a verificar
   * @param {string|number|null|undefined} excludeId - ID a excluir (para edición)
   */
  async checkCategoryNameExists(name, excludeId) {
    try {
      const trimmedName = name?.trim();
      if (!trimmedName || trimmedName.length < 3) {
        return {
          success: false,
          message: "El nombre debe tener al menos 3 caracteres.",
          data: { available: false }
        };
      }

      // Convertir excludeId a número si es posible
      let excludeIdNum = null;
      if (excludeId !== undefined && excludeId !== null && excludeId !== '') {
        excludeIdNum = Number(excludeId);
        if (isNaN(excludeIdNum)) {
          return {
            success: false,
            message: "El parámetro 'excludeId' debe ser un número entero válido.",
            data: { available: false }
          };
        }
      }

      // Buscar categoría con mismo nombre, excluyendo excludeIdNum si existe
      const where = {
        nombre: { equals: trimmedName, mode: 'insensitive' }
      };

      if (excludeIdNum !== null) {
        where.NOT = { id: excludeIdNum };
      }

      const existing = await prisma.sportsCategory.findFirst({ where });

      return {
        success: true,
        data: {
          available: !existing,
          message: existing
            ? `El nombre "${trimmedName}" ya está en uso.`
            : "Nombre disponible."
        }
      };
    } catch (error) {
      console.error("Error checking name availability:", error);
      return {
        success: false,
        message: "Error interno al verificar el nombre.",
        data: { available: false }
      };
    }
  }

}
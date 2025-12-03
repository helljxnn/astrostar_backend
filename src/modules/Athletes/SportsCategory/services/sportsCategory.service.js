import prisma from "../../../../config/database.js";

export class SportsCategoryService {

  /**
   * Obtener todas las categorías con paginación y filtros
   */
  async getAllSportsCategories({ page = 1, limit = 10, search = "", status = "" }) {
    try {
      const skip = (page - 1) * limit;
      const where = {};

      // Búsqueda por nombre o descripción
      if (search && search.trim()) {
        where.OR = [
          { nombre: { contains: search.trim(), mode: "insensitive" } },
          { descripcion: { contains: search.trim(), mode: "insensitive" } },
        ];
      }

      // Filtrar por estado
      if (status && status.trim()) {
        const statusMap = {
          "Active": "Activo",
          "Inactive": "Inactivo",
          "Activo": "Activo",
          "Inactivo": "Inactivo"
        };
        where.estado = statusMap[status] || status;
      }

      // Ejecutar queries
      const [categories, total] = await Promise.all([
        prisma.sportsCategory.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.sportsCategory.count({ where }),
      ]);

      return {
        success: true,
        data: categories.map((cat) => this._formatCategory(cat)),
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
      };
    } catch (error) {
      console.error("Error en getAllSportsCategories:", error);
      return {
        success: false,
        message: "Error al obtener las categorías deportivas.",
        statusCode: 500,
      };
    }
  }

  /**
   * Obtener categorías públicas con imágenes (para landing)
   */
  async getPublicCategories() {
    try {
      const categories = await prisma.sportsCategory.findMany({
        where: {
          estado: "Activo",
          publicar: true,
        },
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          edadMinima: true,
          edadMaxima: true,
          archivo: true, // ✅ URL de la imagen de Cloudinary
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return {
        success: true,
        data: categories.map((cat) => ({
          id: cat.id,
          name: cat.nombre,
          description: cat.descripcion,
          minAge: cat.edadMinima,
          maxAge: cat.edadMaxima,
          imageUrl: cat.archivo, // ✅ Campo para frontend
          createdAt: cat.createdAt,
        })),
      };
    } catch (error) {
      console.error("Error en getPublicCategories:", error);
      return {
        success: false,
        message: "Error al obtener categorías públicas.",
        statusCode: 500,
      };
    }
  }

  /**
   * Obtener categoría por ID
   */
  async getSportsCategoryById(id) {
    try {
      const category = await prisma.sportsCategory.findUnique({
        where: { id: Number(id) },
      });

      if (!category) {
        return {
          success: false,
          message: `Categoría con ID ${id} no encontrada.`,
          statusCode: 404,
        };
      }

      return {
        success: true,
        statusCode: 200,
        data: this._formatCategory(category),
      };
    } catch (error) {
      console.error("Error en getSportsCategoryById:", error);
      return {
        success: false,
        message: "Error al obtener la categoría.",
        statusCode: 500,
      };
    }
  }

  /**
   * Crear nueva categoría
   */
  async createSportsCategory(data) {
    try {
      const { nombre, edadMinima, edadMaxima } = data;

      // Validar edades
      if (Number(edadMinima) >= Number(edadMaxima)) {
        return {
          success: false,
          message: "La edad máxima debe ser mayor que la mínima.",
          statusCode: 400,
        };
      }

      // Verificar nombre duplicado
      const existing = await prisma.sportsCategory.findFirst({
        where: {
          nombre: {
            equals: nombre.trim(),
            mode: "insensitive",
          },
        },
      });

      if (existing) {
        return {
          success: false,
          message: `El nombre "${nombre}" ya está en uso.`,
          statusCode: 409,
        };
      }

      // Crear categoría
      const category = await prisma.sportsCategory.create({
        data: {
          nombre: nombre.trim(),
          descripcion: data.descripcion || null,
          edadMinima: Number(edadMinima),
          edadMaxima: Number(edadMaxima),
          estado: data.estado || "Activo",
          publicar: data.publicar === true || data.publicar === "true" || false,
          archivo: data.archivo || null, // URL de Cloudinary
        },
      });

      return {
        success: true,
        statusCode: 201,
        message: "Categoría creada exitosamente.",
        data: this._formatCategory(category),
      };
    } catch (error) {
      console.error("Error en createSportsCategory:", error);
      return {
        success: false,
        message: "Error al crear la categoría.",
        statusCode: 500,
      };
    }
  }

  /**
   * Actualizar categoría
   */
  async updateSportsCategory(id, data) {
    try {
      const category = await prisma.sportsCategory.findUnique({
        where: { id: Number(id) },
      });

      if (!category) {
        return {
          success: false,
          statusCode: 404,
          message: `Categoría con ID ${id} no encontrada.`,
        };
      }

      // Validar edades si se proporcionan
      if (data.edadMinima || data.edadMaxima) {
        const minAge = data.edadMinima ? Number(data.edadMinima) : category.edadMinima;
        const maxAge = data.edadMaxima ? Number(data.edadMaxima) : category.edadMaxima;
        
        if (minAge >= maxAge) {
          return {
            success: false,
            message: "La edad máxima debe ser mayor que la mínima.",
            statusCode: 400,
          };
        }
      }

      // Verificar nombre duplicado (si se cambia)
      if (data.nombre && data.nombre.trim() !== category.nombre) {
        const existing = await prisma.sportsCategory.findFirst({
          where: {
            nombre: {
              equals: data.nombre.trim(),
              mode: "insensitive",
            },
            NOT: { id: Number(id) },
          },
        });

        if (existing) {
          return {
            success: false,
            message: `El nombre "${data.nombre}" ya está en uso.`,
            statusCode: 409,
          };
        }
      }

      // Preparar datos para actualizar
      const updateData = {};
      if (data.nombre !== undefined) updateData.nombre = data.nombre.trim();
      if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
      if (data.edadMinima !== undefined) updateData.edadMinima = Number(data.edadMinima);
      if (data.edadMaxima !== undefined) updateData.edadMaxima = Number(data.edadMaxima);
      if (data.estado !== undefined) updateData.estado = data.estado;
      if (data.publicar !== undefined) updateData.publicar = data.publicar === true || data.publicar === "true";
      if (data.archivo !== undefined) updateData.archivo = data.archivo; // URL de Cloudinary

      // Actualizar
      const updated = await prisma.sportsCategory.update({
        where: { id: Number(id) },
        data: updateData,
      });

      return {
        success: true,
        statusCode: 200,
        message: "Categoría actualizada exitosamente.",
        data: this._formatCategory(updated),
      };
    } catch (error) {
      console.error("Error en updateSportsCategory:", error);
      return {
        success: false,
        message: "Error al actualizar la categoría.",
        statusCode: 500,
      };
    }
  }

  /**
   * Eliminar categoría
   */
  async deleteSportsCategory(id) {
    try {
      const category = await prisma.sportsCategory.findUnique({
        where: { id: Number(id) },
        include: {
          inscriptions: true,
          participants: true,
          ServiceCategory: true,
        },
      });

      if (!category) {
        return {
          success: false,
          statusCode: 404,
          message: `Categoría con ID ${id} no encontrada.`,
        };
      }

      // Verificar si hay inscripciones activas
      if (category.inscriptions && category.inscriptions.length > 0) {
        return {
          success: false,
          statusCode: 400,
          message: `No se puede eliminar la categoría porque tiene ${category.inscriptions.length} inscripción(es) asociada(s).`,
        };
      }

      // Verificar si hay participantes
      if (category.participants && category.participants.length > 0) {
        return {
          success: false,
          statusCode: 400,
          message: `No se puede eliminar la categoría porque tiene ${category.participants.length} participante(s) asociado(s).`,
        };
      }

      // Verificar si hay servicios/eventos asociados
      if (category.ServiceCategory && category.ServiceCategory.length > 0) {
        return {
          success: false,
          statusCode: 400,
          message: `No se puede eliminar la categoría porque está asociada a ${category.ServiceCategory.length} evento(s).`,
        };
      }

      await prisma.sportsCategory.delete({
        where: { id: Number(id) },
      });

      return {
        success: true,
        statusCode: 200,
        message: "Categoría eliminada exitosamente.",
      };
    } catch (error) {
      console.error("Error en deleteSportsCategory:", error);
      
      // Manejar errores específicos de Prisma
      if (error.code === 'P2003') {
        return {
          success: false,
          statusCode: 400,
          message: "No se puede eliminar la categoría porque tiene registros relacionados.",
        };
      }

      return {
        success: false,
        message: "Error al eliminar la categoría.",
        statusCode: 500,
      };
    }
  }

  /**
   * Verificar disponibilidad de nombre
   */
  async checkCategoryNameExists(name, excludeId) {
    try {
      const trimmed = name.trim();

      if (trimmed.length < 3) {
        return {
          success: true,
          data: {
            available: false,
            message: "El nombre debe tener al menos 3 caracteres.",
          },
        };
      }

      const where = {
        nombre: {
          equals: trimmed,
          mode: "insensitive",
        },
      };

      if (excludeId) {
        where.NOT = { id: Number(excludeId) };
      }

      const exists = await prisma.sportsCategory.findFirst({ where });

      return {
        success: true,
        data: {
          available: !exists,
          message: exists ? "Nombre ya en uso." : "Nombre disponible.",
        },
      };
    } catch (error) {
      console.error("Error en checkCategoryNameExists:", error);
      return {
        success: false,
        data: { available: false },
        message: "Error al verificar disponibilidad.",
        statusCode: 500,
      };
    }
  }

  /**
   * Obtener atletas de una categoría
   */
  async getAthletesByCategory(id) {
    try {
      const athletes = await prisma.inscription.findMany({
        where: {
          sportsCategoryId: Number(id),
          status: "Active",
        },
        include: {
          athlete: {
            include: {
              user: true,
            },
          },
        },
      });

      return {
        success: true,
        data: athletes.map((inscription) => ({
          id: inscription.athlete.id,
          name: `${inscription.athlete.user.firstName} ${inscription.athlete.user.lastName}`,
          email: inscription.athlete.user.email,
          status: inscription.status,
        })),
      };
    } catch (error) {
      console.error("Error en getAthletesByCategory:", error);
      return {
        success: false,
        message: "Error al obtener atletas.",
        statusCode: 500,
      };
    }
  }

  /**
   * Obtener estadísticas de categorías
   */
  async getSportsCategoryStats() {
    try {
      const stats = await prisma.sportsCategory.aggregate({
        _count: true,
      });

      const published = await prisma.sportsCategory.count({
        where: { publicar: true },
      });

      return {
        success: true,
        data: {
          total: stats._count,
          published,
          active: await prisma.sportsCategory.count({
            where: { estado: "Activo" },
          }),
        },
      };
    } catch (error) {
      console.error("Error en getSportsCategoryStats:", error);
      return {
        success: false,
        message: "Error al obtener estadísticas.",
        statusCode: 500,
      };
    }
  }

  /**
   * Formato estándar para categorías
   */
  _formatCategory(category) {
    return {
      id: category.id,
      name: category.nombre,
      description: category.descripcion,
      minAge: category.edadMinima,
      maxAge: category.edadMaxima,
      status: category.estado,
      publish: category.publicar,
      imageUrl: category.archivo, // ✅ URL de Cloudinary
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
import categoriesRepository from '../repository/categories.repository.js';

class CategoriesService {
  /**
   * Obtener todas las categorías con paginación
   */
  async getAll({ page = 1, limit = 10, search = '', estado = null }) {
    try {
      const result = await categoriesRepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search: search.toString().trim(),
        estado,
      });

      return {
        success: true,
        data: result.categories,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.pages,
        },
      };
    } catch (error) {
      console.error('Service error - getAll:', error);
      throw error;
    }
  }

  /**
   * Obtener categoría por ID
   */
  async getById(id) {
    try {
      const category = await categoriesRepository.findById(id);

      if (!category) {
        return {
          success: false,
          statusCode: 404,
          message: 'Categoría no encontrada',
        };
      }

      return {
        success: true,
        data: category,
      };
    } catch (error) {
      console.error('Service error - getById:', error);
      throw error;
    }
  }

  /**
   * Crear categoría
   */
  async create(data, userId) {
    try {
      // Validar datos
      this.validateCategoryData(data);

      // Validar nombre único
      const exists = await categoriesRepository.existsByName(data.nombre);
      if (exists) {
        return {
          success: false,
          statusCode: 400,
          message: 'Ya existe una categoría con este nombre',
        };
      }

      const category = await categoriesRepository.create(data, userId);

      return {
        success: true,
        data: category,
        message: `Categoría "${category.nombre}" creada exitosamente`,
      };
    } catch (error) {
      console.error('Service error - create:', error);
      throw error;
    }
  }

  /**
   * Actualizar categoría
   */
  async update(id, data, userId) {
    try {
      // Validar datos
      this.validateCategoryData(data);

      // Verificar que existe
      const exists = await categoriesRepository.findById(id);
      if (!exists) {
        return {
          success: false,
          statusCode: 404,
          message: 'Categoría no encontrada',
        };
      }

      // Validar nombre único (excepto el mismo registro)
      const nameExists = await categoriesRepository.existsByName(data.nombre, id);
      if (nameExists) {
        return {
          success: false,
          statusCode: 400,
          message: 'Ya existe otra categoría con este nombre',
        };
      }

      const category = await categoriesRepository.update(id, data, userId);

      return {
        success: true,
        data: category,
        message: `Categoría "${category.nombre}" actualizada exitosamente`,
      };
    } catch (error) {
      console.error('Service error - update:', error);
      throw error;
    }
  }

  /**
   * Cambiar estado de categoría
   */
  async toggleStatus(id, userId) {
    try {
      const category = await categoriesRepository.toggleStatus(id, userId);

      return {
        success: true,
        data: category,
        message: `Estado actualizado a "${category.estado}"`,
      };
    } catch (error) {
      console.error('Service error - toggleStatus:', error);
      throw error;
    }
  }

  /**
   * Eliminar categoría
   */
  async delete(id) {
    try {
      await categoriesRepository.delete(id);

      return {
        success: true,
        message: 'Categoría eliminada exitosamente',
      };
    } catch (error) {
      if (error.message.includes('material(es) asociado(s)')) {
        return {
          success: false,
          statusCode: 400,
          message: error.message,
        };
      }
      console.error('Service error - delete:', error);
      throw error;
    }
  }

  /**
   * Obtener categorías activas (para selectores)
   */
  async getActiveCategories() {
    try {
      const categories = await categoriesRepository.findAllActive();

      return {
        success: true,
        data: categories,
      };
    } catch (error) {
      console.error('Service error - getActiveCategories:', error);
      throw error;
    }
  }

  /**
   * Verificar disponibilidad de nombre
   */
  async checkNameAvailability(nombre, excludeId = null) {
    try {
      const exists = await categoriesRepository.existsByName(nombre, excludeId);

      return {
        success: true,
        available: !exists,
        message: exists ? 'El nombre ya está en uso' : 'Nombre disponible',
      };
    } catch (error) {
      console.error('Service error - checkNameAvailability:', error);
      throw error;
    }
  }

  /**
   * Validar datos de la categoría
   */
  validateCategoryData(data) {
    if (!data.nombre || !data.nombre.trim()) {
      throw new Error('El nombre es obligatorio');
    }

    if (data.nombre.trim().length < 3) {
      throw new Error('El nombre debe tener al menos 3 caracteres');
    }

    if (data.nombre.trim().length > 100) {
      throw new Error('El nombre no puede exceder 100 caracteres');
    }
  }

  /**
   * Obtener todas las categorías para reporte (SIN PAGINACIÓN)
   */
  async getAllForReport({ search = '', estado = null }) {
    try {
      const result = await categoriesRepository.findAllForReport({
        search: search.toString().trim(),
        estado,
      });

      return {
        success: true,
        data: result.categories,
      };
    } catch (error) {
      console.error('Service error - getAllForReport:', error);
      throw error;
    }
  }
}

export default new CategoriesService();


import materialsRepository from '../repository/materials.repository.js';
import categoriesRepository from '../repository/categories.repository.js';

class MaterialsService {
  /**
   * Obtener todos los materiales con paginación
   */
  async getAll({ page = 1, limit = 10, search = '', estado = null, categoriaId = null }) {
    try {
      const result = await materialsRepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search: search.toString().trim(),
        estado,
        categoriaId,
      });

      return {
        success: true,
        data: result.materials,
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
   * Obtener material por ID
   */
  async getById(id) {
    try {
      const material = await materialsRepository.findById(id);

      if (!material) {
        return {
          success: false,
          statusCode: 404,
          message: 'Material no encontrado',
        };
      }

      return {
        success: true,
        data: material,
      };
    } catch (error) {
      console.error('Service error - getById:', error);
      throw error;
    }
  }

  /**
   * Crear material
   */
  async create(data, userId) {
    try {
      // Validar datos
      this.validateMaterialData(data);

      // Verificar que la categoría existe y está activa
      const category = await categoriesRepository.findById(data.categoria_id);
      if (!category) {
        return {
          success: false,
          statusCode: 404,
          message: 'La categoría no existe',
        };
      }

      if (category.estado !== 'Activo') {
        return {
          success: false,
          statusCode: 400,
          message: 'No se pueden crear materiales en categorías inactivas',
        };
      }

      // Verificar nombre único por categoría
      const exists = await materialsRepository.existsByNameAndCategory(
        data.nombre,
        data.categoria_id
      );

      if (exists) {
        return {
          success: false,
          statusCode: 400,
          message: 'Ya existe un material con este nombre en esta categoría',
        };
      }

      // Crear material (stock inicial = 0, se actualiza con movimientos)
      const material = await materialsRepository.create(data, userId);

      return {
        success: true,
        data: material,
        message: `Material "${material.nombre}" creado exitosamente`,
      };
    } catch (error) {
      console.error('Service error - create:', error);
      throw error;
    }
  }

  /**
   * Actualizar material
   * IMPORTANTE: No permite cambiar nombre ni categoría si tiene movimientos
   */
  async update(id, data, userId) {
    try {
      // Validar datos
      this.validateMaterialData(data);

      // Verificar que el material existe
      const existingMaterial = await materialsRepository.findById(id);
      if (!existingMaterial) {
        return {
          success: false,
          statusCode: 404,
          message: 'Material no encontrado',
        };
      }

      // Si se cambia el nombre o categoría, validar unicidad
      if (data.nombre || data.categoria_id) {
        const nombre = data.nombre || existingMaterial.nombre;
        const categoriaId = data.categoria_id || existingMaterial.categoriaId;

        const exists = await materialsRepository.existsByNameAndCategory(
          nombre,
          categoriaId,
          id
        );

        if (exists) {
          return {
            success: false,
            statusCode: 400,
            message: 'Ya existe un material con este nombre en esta categoría',
          };
        }
      }

      // Si se cambia la categoría, verificar que existe
      if (data.categoria_id) {
        const category = await categoriesRepository.findById(data.categoria_id);
        if (!category) {
          return {
            success: false,
            statusCode: 404,
            message: 'La categoría no existe',
          };
        }
      }

      // Actualizar material (el repository valida si tiene movimientos)
      const material = await materialsRepository.update(id, data, userId);

      return {
        success: true,
        data: material,
        message: `Material "${material.nombre}" actualizado exitosamente`,
      };
    } catch (error) {
      // Errores específicos de validación
      if (error.message.includes('tiene movimientos registrados')) {
        return {
          success: false,
          statusCode: 400,
          message: error.message,
        };
      }
      console.error('Service error - update:', error);
      throw error;
    }
  }

  /**
   * Cambiar estado del material
   */
  async toggleStatus(id, userId) {
    try {
      const material = await materialsRepository.toggleStatus(id, userId);

      return {
        success: true,
        data: material,
        message: `Estado actualizado a "${material.estado}"`,
      };
    } catch (error) {
      console.error('Service error - toggleStatus:', error);
      throw error;
    }
  }

  /**
   * Eliminar material (solo si no tiene movimientos)
   */
  async delete(id) {
    try {
      await materialsRepository.delete(id);

      return {
        success: true,
        message: 'Material eliminado exitosamente',
      };
    } catch (error) {
      if (error.message.includes('movimiento(s) registrado(s)')) {
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
   * Obtener historial de movimientos de un material
   */
  async getMovementHistory(materialId, limit = 10) {
    try {
      const history = await materialsRepository.getMovementHistory(materialId, limit);

      return {
        success: true,
        data: history,
      };
    } catch (error) {
      console.error('Service error - getMovementHistory:', error);
      throw error;
    }
  }

  /**
   * Verificar disponibilidad de nombre en categoría
   */
  async checkNameAvailability(nombre, categoriaId, excludeId = null) {
    try {
      const exists = await materialsRepository.existsByNameAndCategory(
        nombre,
        categoriaId,
        excludeId
      );

      return {
        success: true,
        available: !exists,
        message: exists ? 'El nombre ya está en uso en esta categoría' : 'Nombre disponible',
      };
    } catch (error) {
      console.error('Service error - checkNameAvailability:', error);
      throw error;
    }
  }

  /**
   * Validar datos del material
   */
  validateMaterialData(data) {
    if (!data.nombre || !data.nombre.trim()) {
      throw new Error('El nombre es obligatorio');
    }

    if (data.nombre.trim().length < 3) {
      throw new Error('El nombre debe tener al menos 3 caracteres');
    }

    if (data.nombre.trim().length > 255) {
      throw new Error('El nombre no puede exceder 255 caracteres');
    }

    if (!data.categoria_id) {
      throw new Error('La categoría es obligatoria');
    }

    if (data.descripcion && data.descripcion.length > 1000) {
      throw new Error('La descripción no puede exceder 1000 caracteres');
    }
  }
}

export default new MaterialsService();

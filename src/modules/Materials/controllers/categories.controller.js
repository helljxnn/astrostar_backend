import categoriesService from '../services/categories.service.js';

class CategoriesController {
  /**
   * GET /api/materials/categories
   * Listar todas las categorías con paginación
   */
  async getAll(req, res) {
    try {
      const { page = 1, limit = 10, search = '', estado } = req.query;

      const result = await categoriesService.getAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        estado,
      });

      return res.json(result);
    } catch (error) {
      console.error('CategoriesController.getAll - Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener categorías',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * GET /api/materials/categories/active
   * Obtener solo categorías activas (para selectores)
   */
  async getActive(req, res) {
    try {
      const result = await categoriesService.getActiveCategories();
      return res.json(result);
    } catch (error) {
      console.error('CategoriesController.getActive - Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * GET /api/materials/categories/:id
   * Obtener categoría por ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
        });
      }

      const result = await categoriesService.getById(parseInt(id));

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('CategoriesController.getById - Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * POST /api/materials/categories
   * Crear nueva categoría
   */
  async create(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
      }

      const result = await categoriesService.create(req.body, userId);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      console.error('CategoriesController.create - Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al crear categoría',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * PUT /api/materials/categories/:id
   * Actualizar categoría
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
      }

      const result = await categoriesService.update(parseInt(id), req.body, userId);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('CategoriesController.update - Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al actualizar categoría',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * PATCH /api/materials/categories/:id/status
   * Cambiar estado de categoría
   */
  async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
      }

      const result = await categoriesService.toggleStatus(parseInt(id), userId);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('CategoriesController.toggleStatus - Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * DELETE /api/materials/categories/:id
   * Eliminar categoría (solo si no tiene materiales)
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
        });
      }

      const result = await categoriesService.delete(parseInt(id));

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('CategoriesController.delete - Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al eliminar categoría',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * GET /api/materials/categories/check-name
   * Verificar disponibilidad de nombre
   */
  async checkName(req, res) {
    try {
      const { nombre, excludeId } = req.query;

      if (!nombre) {
        return res.status(400).json({
          success: false,
          message: 'El nombre es requerido',
        });
      }

      const result = await categoriesService.checkNameAvailability(
        nombre,
        excludeId ? parseInt(excludeId) : null
      );

      return res.json(result);
    } catch (error) {
      console.error('CategoriesController.checkName - Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * GET /api/materials/categories/report
   * Obtener todas las categorías para reporte (sin paginación)
   */
  async getAllForReport(req, res) {
    try {
      const { search = '', estado } = req.query;

      const result = await categoriesService.getAllForReport({
        search,
        estado,
      });

      return res.json({
        success: true,
        data: result.data,
        message: `Se encontraron ${result.data.length} categorías para el reporte.`,
      });
    } catch (error) {
      console.error('CategoriesController.getAllForReport - Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener categorías para reporte',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

export default new CategoriesController();


import movementsService from '../services/movements.service.js';

class MovementsController {
  /**
   * GET /api/materials/material-movements
   * Listar todos los movimientos con paginación
   */
  async getAll(req, res) {
    try {
      const { page = 1, limit = 10, materialId, tipo, origen, search = '' } = req.query;

      const result = await movementsService.getAll({
        page: parseInt(page),
        limit: parseInt(limit),
        materialId: materialId ? parseInt(materialId) : null,
        tipo,
        origen,
        search,
      });

      return res.json(result);
    } catch (error) {
      console.error('Controller error - getAll:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener movimientos',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * GET /api/materials/material-movements/:id
   * Obtener movimiento por ID
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

      const result = await movementsService.getById(parseInt(id));

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Controller error - getById:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * POST /api/materials/material-movements
   * Registrar nuevo movimiento (Entrada o Salida)
   */
  async create(req, res) {
    try {
      const userId = req.user?.id;
      const userName = req.user ? `${req.user.firstName} ${req.user.lastName}` : null;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
      }

      const result = await movementsService.registerMovement(req.body, userId, userName);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      console.error('Controller error - create:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al registrar movimiento',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * PUT /api/materials/material-movements/:id
   * Actualizar movimiento existente
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userName = req.user ? `${req.user.firstName} ${req.user.lastName}` : null;

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

      const result = await movementsService.updateMovement(parseInt(id), req.body, userId, userName);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Controller error - update:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al actualizar movimiento',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * DELETE /api/materials/material-movements/:id
   * Eliminar movimiento (solo permitido para Entradas)
   */
  async delete(req, res) {
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

      const result = await movementsService.deleteMovement(parseInt(id));

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Controller error - delete:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al eliminar movimiento',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * GET /api/materials/material-movements/history/:materialId
   * Obtener historial de movimientos de un material
   */
  async getHistory(req, res) {
    try {
      const { materialId } = req.params;
      const { limit = 10 } = req.query;

      if (isNaN(materialId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de material inválido',
        });
      }

      const result = await movementsService.getMaterialHistory(
        parseInt(materialId),
        parseInt(limit)
      );

      return res.json(result);
    } catch (error) {
      console.error('Controller error - getHistory:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * GET /api/materials/material-movements/statistics
   * Obtener estadísticas de movimientos
   */
  async getStatistics(req, res) {
    try {
      const { materialId, startDate, endDate } = req.query;

      const result = await movementsService.getStatistics(
        materialId ? parseInt(materialId) : null,
        startDate || null,
        endDate || null
      );

      return res.json(result);
    } catch (error) {
      console.error('Controller error - getStatistics:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * GET /api/materials/material-movements/recent
   * Obtener últimos movimientos (para dashboard)
   */
  async getRecent(req, res) {
    try {
      const { limit = 5 } = req.query;

      const result = await movementsService.getRecentMovements(parseInt(limit));

      return res.json(result);
    } catch (error) {
      console.error('Controller error - getRecent:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * GET /api/materials/material-movements/date-range
   * Obtener movimientos por rango de fechas
   */
  async getByDateRange(req, res) {
    try {
      const { startDate, endDate, materialId, tipo, origen } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Las fechas de inicio y fin son requeridas',
        });
      }

      const filters = {};
      if (materialId) filters.materialId = parseInt(materialId);
      if (tipo) filters.tipoMovimiento = tipo;
      if (origen) filters.origen = origen;

      const result = await movementsService.getByDateRange(startDate, endDate, filters);

      return res.json(result);
    } catch (error) {
      console.error('Controller error - getByDateRange:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * GET /api/materials/material-movements/report
   * Obtener todos los movimientos para reporte (SIN PAGINACIÓN)
   */
  async getAllForReport(req, res) {
    try {
      const { search = "", materialId, tipoMovimiento, startDate, endDate } = req.query;

      const result = await movementsService.getAllForReport({
        search,
        materialId: materialId ? parseInt(materialId) : undefined,
        tipoMovimiento,
        startDate,
        endDate,
      });

      return res.json(result);
    } catch (error) {
      console.error("Controller error - getAllForReport:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener movimientos para reporte",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

export default new MovementsController();


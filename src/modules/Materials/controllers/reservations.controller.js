import reservationsService from '../services/reservations.service.js';

class ReservationsController {
  /**
   * GET /api/materials/reservations
   * Listar todas las reservas con paginación
   */
  async getAll(req, res) {
    try {
      const { page = 1, limit = 10, materialId, eventoId, estado } = req.query;

      const result = await reservationsService.getAll({
        page: parseInt(page),
        limit: parseInt(limit),
        materialId: materialId ? parseInt(materialId) : null,
        eventoId: eventoId ? parseInt(eventoId) : null,
        estado,
      });

      return res.json(result);
    } catch (error) {
      console.error('Controller error - getAll:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener reservas',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * GET /api/materials/reservations/:id
   * Obtener reserva por ID
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

      const result = await reservationsService.getById(parseInt(id));

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
   * POST /api/materials/reservations
   * Crear nueva reserva
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

      const result = await reservationsService.create(req.body, userId, userName);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      console.error('Controller error - create:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al crear reserva',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * PUT /api/materials/reservations/:id/confirm
   * Confirmar reserva
   */
  async confirm(req, res) {
    try {
      const { id } = req.params;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
        });
      }

      const result = await reservationsService.confirm(parseInt(id));

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Controller error - confirm:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al confirmar reserva',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * PUT /api/materials/reservations/:id/consume
   * Consumir material reservado
   */
  async consume(req, res) {
    try {
      const { id } = req.params;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
        });
      }

      const result = await reservationsService.consume(parseInt(id));

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Controller error - consume:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al consumir reserva',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * PUT /api/materials/reservations/:id/cancel
   * Cancelar reserva
   */
  async cancel(req, res) {
    try {
      const { id } = req.params;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
        });
      }

      const result = await reservationsService.cancel(parseInt(id));

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Controller error - cancel:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al cancelar reserva',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

export default new ReservationsController();

import eventAssignmentsService from '../services/eventAssignments.service.js';

class EventAssignmentsController {
  /**
   * GET /api/materials/events/:eventoId/assignments
   * Obtener asignaciones de un evento
   */
  async getByEvento(req, res) {
    try {
      const { eventoId } = req.params;

      if (isNaN(eventoId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de evento inválido',
        });
      }

      const result = await eventAssignmentsService.getByEvento(parseInt(eventoId));

      return res.json(result);
    } catch (error) {
      console.error('Controller error - getByEvento:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * POST /api/materials/events/:eventoId/finalize
   * Finalizar evento y descontar materiales usados
   */
  async finalizeEvent(req, res) {
    try {
      const { eventoId } = req.params;
      const userId = req.user?.id;

      if (isNaN(eventoId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de evento inválido',
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
      }

      const result = await eventAssignmentsService.finalizeEvent(
        parseInt(eventoId),
        req.body,
        userId
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Controller error - finalizeEvent:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al finalizar evento',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * PATCH /api/materials/assignments/:id/cancel
   * Cancelar asignación
   */
  async cancelAssignment(req, res) {
    try {
      const { id } = req.params;
      const { observaciones } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
        });
      }

      const result = await eventAssignmentsService.cancelAssignment(parseInt(id), observaciones);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Controller error - cancelAssignment:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

export default new EventAssignmentsController();

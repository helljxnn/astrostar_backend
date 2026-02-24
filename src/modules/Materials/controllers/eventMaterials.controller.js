import eventMaterialsService from '../services/eventMaterials.service.js';

class EventMaterialsController {
  /**
   * GET /api/materials/events/:eventoId/materials
   * Get materials assigned to an event
   */
  async getByEvent(req, res) {
    try {
      const { eventoId } = req.params;

      if (isNaN(eventoId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid event ID',
        });
      }

      const result = await eventMaterialsService.getByEvent(parseInt(eventoId));

      return res.json(result);
    } catch (error) {
      console.error('Controller error - getByEvent:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * POST /api/materials/events/:eventoId/materials
   * Assign material to event (immediate deduction)
   */
  async assignMaterial(req, res) {
    try {
      const { eventoId } = req.params;
      const userId = req.user?.id;
      const userName = req.user ? `${req.user.firstName} ${req.user.lastName}` : null;

      if (isNaN(eventoId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid event ID',
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const result = await eventMaterialsService.assignMaterial(
        parseInt(eventoId),
        req.body,
        userId,
        userName
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      console.error('Controller error - assignMaterial:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while assigning material',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * DELETE /api/materials/events/:eventoId/materials/:assignmentId
   * Remove material assignment (reversal)
   */
  async removeAssignment(req, res) {
    try {
      const { assignmentId } = req.params;
      const userId = req.user?.id;
      const userName = req.user ? `${req.user.firstName} ${req.user.lastName}` : null;

      if (isNaN(assignmentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid assignment ID',
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const result = await eventMaterialsService.removeAssignment(
        parseInt(assignmentId),
        userId,
        userName
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Controller error - removeAssignment:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while removing assignment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * POST /api/materials/events/:eventoId/finalize
   * Finalize event - Deduct real stock and create movements
   */
  async finalizeEvent(req, res) {
    try {
      const { eventoId } = req.params;
      const userId = req.user?.id;
      const userName = req.user ? `${req.user.firstName} ${req.user.lastName}` : null;

      if (isNaN(eventoId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid event ID',
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const result = await eventMaterialsService.finalizeEvent(
        parseInt(eventoId),
        userId,
        userName
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Controller error - finalizeEvent:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while finalizing event',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

export default new EventMaterialsController();

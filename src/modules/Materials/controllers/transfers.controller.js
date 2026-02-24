import transfersService from '../services/transfers.service.js';

class TransfersController {
  /**
   * POST /api/materials/materials/:id/transfer
   * Transfer stock between inventories
   */
  async transferStock(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userName = req.user ? `${req.user.firstName} ${req.user.lastName}` : null;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid ID',
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const result = await transfersService.transferStock(
        parseInt(id),
        req.body,
        userId,
        userName
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Controller error - transferStock:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while transferring stock',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

export default new TransfersController();

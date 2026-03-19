import transfersService from '../services/transfers.service.js';

const isTransferNotFoundError = (message = "") => {
  const normalized = String(message).toLowerCase();
  return normalized.includes("material no encontrado") || normalized.includes("material not found");
};

const isTransferBusinessError = (message = "") => {
  const normalized = String(message).toLowerCase();
  const hints = [
    "stock insuficiente",
    "insufficient stock",
    "no se puede transferir",
    "cannot transfer stock",
    "inventario origen",
    "inventario destino",
    "source inventory",
    "destination inventory",
    "cantidad",
    "quantity",
    "must be different",
    "deben ser diferentes",
    "observaciones",
    "observations",
    "fundacion o eventos",
  ];

  return hints.some((hint) => normalized.includes(hint));
};

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
      const message = transfersService.normalizeTransferMessage(error?.message);

      if (isTransferNotFoundError(message)) {
        return res.status(404).json({
          success: false,
          message,
        });
      }

      if (isTransferBusinessError(message)) {
        return res.status(400).json({
          success: false,
          message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al transferir stock',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

export default new TransfersController();

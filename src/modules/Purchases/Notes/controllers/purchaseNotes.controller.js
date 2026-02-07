import { PurchaseNotesService } from "../services/purchaseNotes.service.js";

export class PurchaseNotesController {
  constructor() {
    this.purchaseNotesService = new PurchaseNotesService();
  }

  getNotesByPurchase = async (req, res) => {
    try {
      const purchaseId = parseInt(req.params.purchaseId);

      if (isNaN(purchaseId)) {
        return res.status(400).json({
          success: false,
          message: "ID de compra inválido",
        });
      }

      const result = await this.purchaseNotesService.getNotesByPurchase(purchaseId);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: `Se encontraron ${result.data.length} nota(s).`,
      });
    } catch (error) {
      console.error("Error in getNotesByPurchase controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener las notas",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  createNote = async (req, res) => {
    try {
      const purchaseId = parseInt(req.params.purchaseId);
      const { note } = req.body;
      const userId = req.user?.id;

      if (isNaN(purchaseId)) {
        return res.status(400).json({
          success: false,
          message: "ID de compra inválido",
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const result = await this.purchaseNotesService.createNote(
        purchaseId,
        note,
        userId
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      console.error("Error in createNote controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al crear la nota",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };
}

export default new PurchaseNotesController();

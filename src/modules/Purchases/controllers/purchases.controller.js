import { PurchasesService } from "../services/purchases.service.js";

export class PurchasesController {
  constructor() {
    this.purchasesService = new PurchasesService();
  }

  getAllPurchases = async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "", providerId, status } = req.query;

      const result = await this.purchasesService.getAllPurchases({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        providerId,
        status,
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: `Se encontraron ${result.pagination?.total || 0} compras.`,
      });
    } catch (error) {
      console.error("Error in getAllPurchases controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener compras",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  getPurchaseById = async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de compra inválido",
        });
      }

      const result = await this.purchasesService.getPurchaseById(id);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: "Compra encontrada exitosamente.",
      });
    } catch (error) {
      console.error("Error in getPurchaseById controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener compra",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  createPurchase = async (req, res) => {
    try {
      console.log("=== DATOS RECIBIDOS EN BACKEND ===");
      console.log(JSON.stringify(req.body, null, 2));
      console.log("===================================");

      const result = await this.purchasesService.createPurchase(req.body);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      console.error("Error in createPurchase controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al crear compra",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  updatePurchase = async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de compra inválido",
        });
      }

      console.log("=== DATOS PARA ACTUALIZAR COMPRA ===");
      console.log("ID:", id);
      console.log("Datos completos:", JSON.stringify(req.body, null, 2));
      console.log("====================================");

      const result = await this.purchasesService.updatePurchase(id, req.body);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      console.error("Error in updatePurchase controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al actualizar compra",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  changePurchaseStatus = async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de compra inválido",
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "El estado es requerido",
        });
      }

      const result = await this.purchasesService.changePurchaseStatus(id, status);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      console.error("Error in changePurchaseStatus controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al cambiar estado",
      });
    }
  };

  getPurchaseStats = async (req, res) => {
    try {
      const result = await this.purchasesService.getPurchaseStats();

      res.json({
        success: true,
        data: result.data,
        message: "Estadísticas obtenidas exitosamente.",
      });
    } catch (error) {
      console.error("Error in getPurchaseStats controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener estadísticas",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };
}

export default new PurchasesController();

import { PurchasesService } from "../services/purchases.service.js";
import prisma from "../../../config/database.js";

export class PurchasesController {
  constructor() {
    this.purchasesService = new PurchasesService();
  }

  getAllPurchases = async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "", providerId } = req.query;

      const result = await this.purchasesService.getAllPurchases({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        providerId,
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
      console.log("Body:", req.body);
      console.log("File:", req.file);
      console.log("===================================");

      // Procesar datos que pueden venir en diferentes formatos
      const proveedor = req.body.proveedor || req.body.provider_name;
      const concepto = req.body.concepto || req.body.concept;
      const fechaCompra = req.body.fechaCompra || req.body.purchase_date || req.body.purchaseDate;
      const montoTotal = req.body.montoTotal || req.body.total_amount || req.body.totalAmount;
      const metodoPago = req.body.metodoPago || req.body.payment_method || req.body.paymentMethod || "No especificado";
      const observaciones = req.body.observaciones || req.body.notes;

      console.log("=== DATOS EXTRAÍDOS ===");
      console.log("Proveedor:", proveedor);
      console.log("Concepto:", concepto);
      console.log("Fecha:", fechaCompra);
      console.log("Monto:", montoTotal);
      console.log("Método de pago:", metodoPago);
      console.log("Observaciones:", observaciones);
      console.log("=======================");

      // Validar campos requeridos
      if (!proveedor) {
        return res.status(400).json({
          success: false,
          message: "El proveedor es requerido",
        });
      }

      if (!concepto) {
        return res.status(400).json({
          success: false,
          message: "El concepto es requerido",
        });
      }

      if (!fechaCompra) {
        return res.status(400).json({
          success: false,
          message: "La fecha de compra es requerida",
        });
      }

      if (!montoTotal) {
        return res.status(400).json({
          success: false,
          message: "El monto total es requerido",
        });
      }

      // Buscar el proveedor por nombre
      const provider = await prisma.provider.findFirst({
        where: {
          businessName: {
            equals: proveedor,
            mode: "insensitive",
          },
          status: "Active",
        },
      });

      if (!provider) {
        return res.status(400).json({
          success: false,
          message: `No se encontró un proveedor activo con el nombre "${proveedor}"`,
        });
      }

      // Subir factura a Base de Datos si existe
      let invoiceData = null;
      let invoiceName = null;
      let invoiceMimeType = null;
      let invoiceSize = null;

      console.log("🔍 VERIFICANDO ARCHIVO:");
      console.log("req.file existe?", !!req.file);
      if (req.file) {
        console.log("req.file.buffer existe?", !!req.file.buffer);
        console.log("req.file.size:", req.file.size);
        console.log("req.file.originalname:", req.file.originalname);
        console.log("req.file.mimetype:", req.file.mimetype);
        
        // Validar tamaño (5MB máximo)
        const maxSize = 5 * 1024 * 1024;
        if (req.file.size > maxSize) {
          return res.status(400).json({
            success: false,
            message: "El archivo excede el tamaño máximo permitido de 5MB",
          });
        }

        // Convertir a Base64
        invoiceData = req.file.buffer.toString('base64');
        invoiceName = req.file.originalname;
        invoiceMimeType = req.file.mimetype;
        invoiceSize = req.file.size;
        
        console.log("✅ Archivo convertido a Base64");
        console.log("Base64 length:", invoiceData.length);
      } else {
        console.log("⚠️ NO HAY ARCHIVO EN req.file");
      }

      // Crear los datos de la compra
      const purchaseData = {
        providerId: provider.id,
        purchaseDate: fechaCompra,
        concept: concepto,
        totalAmount: montoTotal,
        paymentMethod: metodoPago,
        notes: observaciones || null,
        invoiceData: invoiceData,
        invoiceName: invoiceName,
        invoiceMimeType: invoiceMimeType,
        invoiceSize: invoiceSize,
      };

      console.log("=== DATOS PROCESADOS ===");
      console.log(JSON.stringify(purchaseData, null, 2));
      console.log("========================");

      const result = await this.purchasesService.createPurchase(purchaseData);

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

  downloadInvoice = async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de compra inválido",
        });
      }

      const result = await this.purchasesService.downloadInvoice(id);

      if (!result.success) {
        return res.status(result.statusCode || 404).json({
          success: false,
          message: result.message,
        });
      }

      // Configurar headers para descarga
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Length', result.fileBuffer.length);

      // Enviar el archivo
      return res.send(result.fileBuffer);
    } catch (error) {
      console.error("Error in downloadInvoice controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al descargar factura",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  uploadInvoice = async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de compra inválido",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No se proporcionó ningún archivo",
        });
      }

      const result = await this.purchasesService.uploadInvoice(
        id,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      console.error("Error in uploadInvoice controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al subir factura",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  deleteInvoice = async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de compra inválido",
        });
      }

      const result = await this.purchasesService.deleteInvoice(id);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      console.error("Error in deleteInvoice controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al eliminar factura",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };
}

export default new PurchasesController();

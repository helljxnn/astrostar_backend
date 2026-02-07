import { PurchasesRepository } from "../repository/purchases.repository.js";
import prisma from "../../../config/database.js";

export class PurchasesService {
  constructor() {
    this.purchasesRepository = new PurchasesRepository();
  }

  async getAllPurchases({ page = 1, limit = 10, search = "", providerId }) {
    try {
      const result = await this.purchasesRepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        providerId,
      });

      return {
        success: true,
        data: result.purchases,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("Service error - getAllPurchases:", error);
      throw error;
    }
  }

  async getPurchaseById(id) {
    try {
      const purchase = await this.purchasesRepository.findById(id);

      if (!purchase) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró la compra con ID ${id}.`,
        };
      }

      return {
        success: true,
        data: purchase,
      };
    } catch (error) {
      console.error("Service error - getPurchaseById:", error);
      throw error;
    }
  }

  async createPurchase(purchaseData) {
    try {
      console.log("🔍 SERVICE: Iniciando createPurchase con datos:");
      console.log("- providerId:", purchaseData.providerId);
      console.log("- concept:", purchaseData.concept);
      console.log("- invoiceName:", purchaseData.invoiceName);
      console.log("- invoiceData existe?", !!purchaseData.invoiceData);
      console.log("- invoiceData length:", purchaseData.invoiceData?.length || 0);
      console.log("- invoiceMimeType:", purchaseData.invoiceMimeType);
      console.log("- invoiceSize:", purchaseData.invoiceSize);

      // Validar que el proveedor existe y está activo
      const provider = await prisma.provider.findUnique({
        where: { id: purchaseData.providerId },
      });

      if (!provider) {
        return {
          success: false,
          statusCode: 404,
          message: "El proveedor seleccionado no existe.",
        };
      }

      if (provider.status !== "Active") {
        return {
          success: false,
          statusCode: 400,
          message: "El proveedor seleccionado no está activo.",
        };
      }

      // Generar número de compra automático
      const purchaseNumber = await this.purchasesRepository.generatePurchaseNumber();
      console.log("✅ SERVICE: Número de compra generado:", purchaseNumber);

      // Crear la compra
      const newPurchase = await this.purchasesRepository.create({
        purchaseNumber,
        providerId: purchaseData.providerId,
        employeeId: purchaseData.employeeId,
        purchaseDate: new Date(purchaseData.purchaseDate),
        concept: purchaseData.concept,
        totalAmount: parseFloat(purchaseData.totalAmount),
        paymentMethod: purchaseData.paymentMethod,
        notes: purchaseData.notes || null,
        invoiceData: purchaseData.invoiceData || null,
        invoiceName: purchaseData.invoiceName || null,
        invoiceMimeType: purchaseData.invoiceMimeType || null,
        invoiceSize: purchaseData.invoiceSize || null,
      });

      console.log("✅ SERVICE: Compra creada exitosamente:", newPurchase.id);

      return {
        success: true,
        data: newPurchase,
        message: `Compra "${purchaseNumber}" creada exitosamente.`,
      };
    } catch (error) {
      console.error("Service error - createPurchase:", error);
      throw error;
    }
  }

  async updatePurchase(id, updateData) {
    try {
      const existingPurchase = await this.purchasesRepository.findById(id);
      if (!existingPurchase) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró la compra con ID ${id}.`,
        };
      }

      // Si se actualiza el proveedor, validar que existe y está activo
      if (updateData.providerId) {
        const provider = await prisma.provider.findUnique({
          where: { id: updateData.providerId },
        });

        if (!provider) {
          return {
            success: false,
            statusCode: 404,
            message: "El proveedor seleccionado no existe.",
          };
        }

        if (provider.status !== "Active") {
          return {
            success: false,
            statusCode: 400,
            message: "El proveedor seleccionado no está activo.",
          };
        }
      }

      // Preparar datos de actualización
      const dataToUpdate = {};

      if (updateData.providerId) dataToUpdate.providerId = updateData.providerId;
      if (updateData.purchaseDate) dataToUpdate.purchaseDate = new Date(updateData.purchaseDate);
      if (updateData.concept) dataToUpdate.concept = updateData.concept;
      if (updateData.totalAmount) dataToUpdate.totalAmount = parseFloat(updateData.totalAmount);
      if (updateData.paymentMethod) dataToUpdate.paymentMethod = updateData.paymentMethod;
      if (updateData.notes !== undefined) dataToUpdate.notes = updateData.notes;
      if (updateData.invoiceUrl !== undefined) dataToUpdate.invoiceUrl = updateData.invoiceUrl;
      if (updateData.invoiceName !== undefined) dataToUpdate.invoiceName = updateData.invoiceName;

      const updatedPurchase = await this.purchasesRepository.update(id, dataToUpdate);

      return {
        success: true,
        data: updatedPurchase,
        message: `Compra "${updatedPurchase.purchaseNumber}" actualizada exitosamente.`,
      };
    } catch (error) {
      console.error("Service error - updatePurchase:", error);
      throw error;
    }
  }

  async getPurchaseStats() {
    try {
      const stats = await this.purchasesRepository.getStats();
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error("Service error - getPurchaseStats:", error);
      throw error;
    }
  }

  async uploadInvoice(purchaseId, fileBuffer, fileName, mimeType) {
    try {
      const purchase = await this.purchasesRepository.findById(purchaseId);

      if (!purchase) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró la compra con ID ${purchaseId}.`,
        };
      }

      // Validar tamaño (5MB máximo)
      const maxSize = 5 * 1024 * 1024;
      if (fileBuffer.length > maxSize) {
        return {
          success: false,
          statusCode: 400,
          message: "El archivo excede el tamaño máximo permitido de 5MB",
        };
      }

      // Convertir a Base64
      const base64Data = fileBuffer.toString('base64');

      // Actualizar la compra con la factura
      const updatedPurchase = await this.purchasesRepository.update(purchaseId, {
        invoiceData: base64Data,
        invoiceName: fileName,
        invoiceMimeType: mimeType,
        invoiceSize: fileBuffer.length,
      });

      return {
        success: true,
        data: updatedPurchase,
        message: "Factura subida exitosamente.",
      };
    } catch (error) {
      console.error("Service error - uploadInvoice:", error);
      throw error;
    }
  }

  async downloadInvoice(id) {
    try {
      const purchase = await this.purchasesRepository.findById(id);

      if (!purchase) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró la compra con ID ${id}.`,
        };
      }

      if (!purchase.invoiceData) {
        return {
          success: false,
          statusCode: 404,
          message: "No hay factura disponible para esta compra.",
        };
      }

      // Convertir Base64 a Buffer
      const fileBuffer = Buffer.from(purchase.invoiceData, 'base64');

      return {
        success: true,
        fileBuffer: fileBuffer,
        fileName: purchase.invoiceName || `factura-${purchase.purchaseNumber}.pdf`,
        mimeType: purchase.invoiceMimeType || 'application/pdf',
      };
    } catch (error) {
      console.error("Service error - downloadInvoice:", error);
      throw error;
    }
  }

  async deleteInvoice(id) {
    try {
      const purchase = await this.purchasesRepository.findById(id);

      if (!purchase) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró la compra con ID ${id}.`,
        };
      }

      if (!purchase.invoiceData) {
        return {
          success: false,
          statusCode: 404,
          message: "No hay factura para eliminar.",
        };
      }

      // Actualizar la compra eliminando la factura
      const updatedPurchase = await this.purchasesRepository.update(id, {
        invoiceData: null,
        invoiceName: null,
        invoiceMimeType: null,
        invoiceSize: null,
      });

      return {
        success: true,
        data: updatedPurchase,
        message: "Factura eliminada exitosamente.",
      };
    } catch (error) {
      console.error("Service error - deleteInvoice:", error);
      throw error;
    }
  }
}

import { PurchasesRepository } from "../repository/purchases.repository.js";
import prisma from "../../../config/database.js";

export class PurchasesService {
  constructor() {
    this.purchasesRepository = new PurchasesRepository();
  }

  async getAllPurchases({ page = 1, limit = 10, search = "", providerId, status }) {
    try {
      const result = await this.purchasesRepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        providerId,
        status,
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
      console.log("🔍 SERVICE: Iniciando createPurchase con datos:", JSON.stringify(purchaseData, null, 2));

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

      // Calcular el monto total de los items
      const totalAmount = purchaseData.items.reduce((sum, item) => {
        return sum + parseFloat(item.subtotal);
      }, 0);

      // Crear la compra con sus items
      const newPurchase = await this.purchasesRepository.create({
        purchaseNumber,
        providerId: purchaseData.providerId,
        employeeId: purchaseData.employeeId,
        purchaseDate: new Date(purchaseData.purchaseDate),
        deliveryDate: purchaseData.deliveryDate ? new Date(purchaseData.deliveryDate) : null,
        totalAmount,
        status: purchaseData.status || "Pending",
        notes: purchaseData.notes || null,
        items: {
          create: purchaseData.items.map((item) => ({
            productName: item.productName,
            description: item.description || null,
            quantity: parseInt(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            subtotal: parseFloat(item.subtotal),
          })),
        },
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
      if (updateData.deliveryDate !== undefined) {
        dataToUpdate.deliveryDate = updateData.deliveryDate ? new Date(updateData.deliveryDate) : null;
      }
      if (updateData.status) dataToUpdate.status = updateData.status;
      if (updateData.notes !== undefined) dataToUpdate.notes = updateData.notes;

      // Si se actualizan los items, recalcular el total
      if (updateData.items) {
        const totalAmount = updateData.items.reduce((sum, item) => {
          return sum + parseFloat(item.subtotal);
        }, 0);
        dataToUpdate.totalAmount = totalAmount;

        // Eliminar items antiguos y crear nuevos
        await prisma.purchaseItem.deleteMany({
          where: { purchaseId: id },
        });

        dataToUpdate.items = {
          create: updateData.items.map((item) => ({
            productName: item.productName,
            description: item.description || null,
            quantity: parseInt(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            subtotal: parseFloat(item.subtotal),
          })),
        };
      }

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

  async changePurchaseStatus(id, status) {
    try {
      const existingPurchase = await this.purchasesRepository.findById(id);
      if (!existingPurchase) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró la compra con ID ${id}.`,
        };
      }

      const updatedPurchase = await this.purchasesRepository.changeStatus(id, status);

      return {
        success: true,
        data: updatedPurchase,
        message: `Estado de la compra "${updatedPurchase.purchaseNumber}" cambiado a "${status}" exitosamente.`,
      };
    } catch (error) {
      console.error("Service error - changePurchaseStatus:", error);
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
}

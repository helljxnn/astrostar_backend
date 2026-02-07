import { PurchaseNotesRepository } from "../repository/purchaseNotes.repository.js";
import { PurchasesRepository } from "../../repository/purchases.repository.js";

export class PurchaseNotesService {
  constructor() {
    this.purchaseNotesRepository = new PurchaseNotesRepository();
    this.purchasesRepository = new PurchasesRepository();
  }

  async getNotesByPurchase(purchaseId) {
    try {
      // Verificar que la compra existe
      const purchase = await this.purchasesRepository.findById(purchaseId);
      if (!purchase) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró la compra con ID ${purchaseId}.`,
        };
      }

      // Obtener las notas
      const notes = await this.purchaseNotesRepository.findByPurchaseId(purchaseId);

      // Formatear respuesta
      const formattedNotes = notes.map((note) => ({
        id: note.id,
        text: note.note,
        createdAt: note.createdAt,
        createdBy: {
          id: note.creator.id,
          name: `${note.creator.firstName} ${note.creator.lastName}`,
          email: note.creator.email,
        },
      }));

      return {
        success: true,
        data: formattedNotes,
      };
    } catch (error) {
      console.error("Service error - getNotesByPurchase:", error);
      throw error;
    }
  }

  async createNote(purchaseId, noteText, userId) {
    try {
      // Validar que el texto no esté vacío
      if (!noteText || noteText.trim() === "") {
        return {
          success: false,
          statusCode: 400,
          message: "El texto de la nota es requerido.",
        };
      }

      // Verificar que la compra existe
      const purchase = await this.purchasesRepository.findById(purchaseId);
      if (!purchase) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró la compra con ID ${purchaseId}.`,
        };
      }

      // Crear la nota
      const newNote = await this.purchaseNotesRepository.create({
        purchaseId,
        note: noteText.trim(),
        createdBy: userId,
      });

      return {
        success: true,
        data: {
          id: newNote.id,
          text: newNote.note,
          createdAt: newNote.createdAt,
          createdBy: {
            id: newNote.creator.id,
            name: `${newNote.creator.firstName} ${newNote.creator.lastName}`,
            email: newNote.creator.email,
          },
        },
        message: "Nota creada exitosamente.",
      };
    } catch (error) {
      console.error("Service error - createNote:", error);
      throw error;
    }
  }
}

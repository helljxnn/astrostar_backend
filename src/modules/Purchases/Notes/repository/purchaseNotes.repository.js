import prisma from "../../../../config/database.js";

export class PurchaseNotesRepository {
  async findByPurchaseId(purchaseId) {
    try {
      return await prisma.purchaseNote.findMany({
        where: { purchaseId },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (error) {
      console.error("Repository error - findByPurchaseId:", error);
      throw error;
    }
  }

  async create(noteData) {
    try {
      return await prisma.purchaseNote.create({
        data: noteData,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Repository error - create:", error);
      throw error;
    }
  }

  async findById(id) {
    try {
      return await prisma.purchaseNote.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Repository error - findById:", error);
      throw error;
    }
  }

  async count(purchaseId) {
    try {
      return await prisma.purchaseNote.count({
        where: { purchaseId },
      });
    } catch (error) {
      console.error("Repository error - count:", error);
      throw error;
    }
  }
}

import prisma from "../../../config/database.js";

export class PurchasesRepository {
  async findAll({ page = 1, limit = 10, search = "", providerId, status }) {
    try {
      const skip = (page - 1) * limit;
      const where = {};

      // Filtro de búsqueda
      if (search) {
        where.OR = [
          { purchaseNumber: { contains: search, mode: "insensitive" } },
          { provider: { businessName: { contains: search, mode: "insensitive" } } },
        ];
      }

      // Filtro por proveedor
      if (providerId) {
        where.providerId = parseInt(providerId);
      }

      // Filtro por estado
      if (status) {
        where.status = status;
      }

      const [purchases, total] = await Promise.all([
        prisma.purchase.findMany({
          where,
          skip,
          take: limit,
          include: {
            provider: {
              select: {
                id: true,
                businessName: true,
                nit: true,
              },
            },
            employee: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        prisma.purchase.count({ where }),
      ]);

      // Transformar los datos al formato que espera el frontend
      const transformedPurchases = purchases.map((purchase) => ({
        id: purchase.id,
        numeroCompra: purchase.purchaseNumber,
        proveedor: purchase.provider?.businessName || "N/A",
        fechaCompra: purchase.purchaseDate,
        montoTotal: purchase.totalAmount,
        metodoPago: "N/A", // Este campo no existe en el modelo actual
        estado: purchase.status,
        observaciones: purchase.notes,
        createdAt: purchase.createdAt,
        updatedAt: purchase.updatedAt,
        // Mantener también los campos originales para compatibilidad
        purchaseNumber: purchase.purchaseNumber,
        purchaseDate: purchase.purchaseDate,
        totalAmount: purchase.totalAmount,
        status: purchase.status,
        notes: purchase.notes,
        provider: purchase.provider,
        employee: purchase.employee,
      }));

      return {
        purchases: transformedPurchases,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Repository error - findAll:", error);
      throw error;
    }
  }

  async findById(id) {
    try {
      const purchase = await prisma.purchase.findUnique({
        where: { id },
        include: {
          provider: {
            select: {
              id: true,
              businessName: true,
              nit: true,
              phone: true,
              email: true,
            },
          },
          employee: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          items: {
            orderBy: {
              id: "asc",
            },
          },
        },
      });

      if (!purchase) return null;

      // Transformar al formato que espera el frontend
      return {
        id: purchase.id,
        numeroCompra: purchase.purchaseNumber,
        proveedor: purchase.provider?.businessName || "N/A",
        fechaCompra: purchase.purchaseDate,
        montoTotal: purchase.totalAmount,
        metodoPago: "N/A",
        estado: purchase.status,
        observaciones: purchase.notes,
        createdAt: purchase.createdAt,
        updatedAt: purchase.updatedAt,
        // Mantener campos originales
        purchaseNumber: purchase.purchaseNumber,
        purchaseDate: purchase.purchaseDate,
        deliveryDate: purchase.deliveryDate,
        totalAmount: purchase.totalAmount,
        status: purchase.status,
        notes: purchase.notes,
        provider: purchase.provider,
        employee: purchase.employee,
        items: purchase.items,
      };
    } catch (error) {
      console.error("Repository error - findById:", error);
      throw error;
    }
  }

  async findByPurchaseNumber(purchaseNumber) {
    try {
      return await prisma.purchase.findUnique({
        where: { purchaseNumber },
      });
    } catch (error) {
      console.error("Repository error - findByPurchaseNumber:", error);
      throw error;
    }
  }

  async create(purchaseData) {
    try {
      return await prisma.purchase.create({
        data: purchaseData,
        include: {
          provider: {
            select: {
              id: true,
              businessName: true,
              nit: true,
            },
          },
          employee: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          items: true,
        },
      });
    } catch (error) {
      console.error("Repository error - create:", error);
      throw error;
    }
  }

  async update(id, updateData) {
    try {
      return await prisma.purchase.update({
        where: { id },
        data: updateData,
        include: {
          provider: {
            select: {
              id: true,
              businessName: true,
              nit: true,
            },
          },
          employee: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          items: true,
        },
      });
    } catch (error) {
      console.error("Repository error - update:", error);
      throw error;
    }
  }

  async changeStatus(id, status) {
    try {
      return await prisma.purchase.update({
        where: { id },
        data: { status },
        include: {
          provider: {
            select: {
              id: true,
              businessName: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Repository error - changeStatus:", error);
      throw error;
    }
  }

  async getStats() {
    try {
      const [
        totalPurchases,
        pendingPurchases,
        receivedPurchases,
        partialPurchases,
        cancelledPurchases,
        totalAmount,
      ] = await Promise.all([
        prisma.purchase.count(),
        prisma.purchase.count({ where: { status: "Pending" } }),
        prisma.purchase.count({ where: { status: "Received" } }),
        prisma.purchase.count({ where: { status: "Partial" } }),
        prisma.purchase.count({ where: { status: "Cancelled" } }),
        prisma.purchase.aggregate({
          _sum: {
            totalAmount: true,
          },
          where: {
            status: {
              not: "Cancelled",
            },
          },
        }),
      ]);

      return {
        totalPurchases,
        byStatus: {
          pending: pendingPurchases,
          received: receivedPurchases,
          partial: partialPurchases,
          cancelled: cancelledPurchases,
        },
        totalAmount: totalAmount._sum.totalAmount || 0,
      };
    } catch (error) {
      console.error("Repository error - getStats:", error);
      throw error;
    }
  }

  async generatePurchaseNumber() {
    try {
      const year = new Date().getFullYear();
      const prefix = `PC-${year}-`;

      const lastPurchase = await prisma.purchase.findFirst({
        where: {
          purchaseNumber: {
            startsWith: prefix,
          },
        },
        orderBy: {
          purchaseNumber: "desc",
        },
      });

      let nextNumber = 1;
      if (lastPurchase) {
        const lastNumber = parseInt(
          lastPurchase.purchaseNumber.split("-")[2]
        );
        nextNumber = lastNumber + 1;
      }

      return `${prefix}${String(nextNumber).padStart(4, "0")}`;
    } catch (error) {
      console.error("Repository error - generatePurchaseNumber:", error);
      throw error;
    }
  }
}

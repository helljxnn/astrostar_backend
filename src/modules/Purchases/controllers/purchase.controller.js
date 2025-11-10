import prisma from "../../../config/database.js";
import { v4 as uuidv4 } from 'uuid';

export class PurchaseController {
  /**
   * Creates a new purchase and updates equipment stock.
   */
  Create = async (req, res) => {
    try {
      const { providerId, purchaseDate, deliveryDate, notes, items } = req.body;

      if (!providerId || !items || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Fields 'providerId' and 'items' are required, and 'items' cannot be empty.",
        });
      }

      // Basic validation for each item
      for (const item of items) {
        if (!item.sportsEquipmentId || !item.quantity || !item.unitPrice) {
          return res.status(400).json({
            success: false,
            message: "Each item must have 'sportsEquipmentId', 'quantity', and 'unitPrice'.",
          });
        }
        if (parseInt(item.quantity) <= 0 || parseFloat(item.unitPrice) < 0) {
            return res.status(400).json({
                success: false,
                message: "Item quantity must be positive and unit price cannot be negative.",
            });
        }
      }

      const totalAmount = items.reduce((acc, item) => {
        const subtotal = item.quantity * item.unitPrice;
        return acc + subtotal;
      }, 0);

      const result = await prisma.$transaction(async (tx) => {
        // 1. Create the Purchase
        const newPurchase = await tx.purchase.create({
          data: {
            purchaseNumber: `PN-${uuidv4().slice(0, 8).toUpperCase()}`,
            purchaseDate: new Date(purchaseDate),
            deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
            totalAmount,
            notes,
            providerId: parseInt(providerId),
            status: 'Received', // Assuming status is Received upon creation
          },
        });

        // 2. Create PurchaseItems and update SportsEquipment stock
        for (const item of items) {
          const quantity = parseInt(item.quantity);
          const unitPrice = parseFloat(item.unitPrice);

          await tx.purchaseItem.create({
            data: {
              purchaseId: newPurchase.id,
              sportsEquipmentId: parseInt(item.sportsEquipmentId),
              productName: item.productName, // Assuming name is passed from frontend
              quantity,
              unitPrice,
              subtotal: quantity * unitPrice,
            },
          });

          await tx.sportsEquipment.update({
            where: { id: parseInt(item.sportsEquipmentId) },
            data: {
              quantityInitial: { increment: quantity },
              quantityTotal: { increment: quantity },
            },
          });
        }

        return newPurchase;
      });

      res.status(201).json({
        success: true,
        message: "Purchase created successfully and stock updated.",
        data: result,
      });

    } catch (error) {
      console.error("Error creating purchase:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while creating purchase.",
      });
    }
  };

  /**
   * Gets all purchases with pagination.
   */
  GetAll = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = search
        ? {
            OR: [
              { purchaseNumber: { contains: search, mode: "insensitive" } },
              { provider: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {};

        const [purchases, total] = await prisma.$transaction([
            prisma.purchase.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { purchaseDate: "desc" },
                include: { provider: { select: { businessName: true } } },
            }),
            prisma.purchase.count({ where }),
        ]);

        res.status(200).json({
            success: true,
            message: `Found ${purchases.length} of ${total} purchases.`,
            data: purchases,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching purchases:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
  };

  /**
   * Gets a single purchase by ID, including its items.
   */
  GetById = async (req, res) => {
    try {
        const { id } = req.params;
        const purchase = await prisma.purchase.findUnique({
            where: { id: parseInt(id) },
            include: {
                provider: true,
                items: {
                    include: {
                        sportsEquipment: { select: { name: true } },
                    },
                },
            },
        });

        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: `Purchase with ID ${id} not found.`,
            });
        }

        res.status(200).json({
            success: true,
            message: "Purchase found.",
            data: purchase,
        });
    } catch (error) {
        console.error("Error fetching purchase by ID:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
  };
}

import prisma from "../../../config/database.js";
import { v4 as uuidv4 } from "uuid";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configuración de Cloudinary (asegúrate de tener las variables en tu .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class PurchaseController {
  /**
   * Crea una nueva compra, actualiza el stock y sube imágenes de evidencia.
   */
  Create = async (req, res) => {
    try {
      const {
        providerId,
        invoiceNumber,
        purchaseDate,
        registrationDate,
        totalAmount,
        observations,
        items,
      } = req.body;
      const files = req.files; // Archivos de imagen desde multer

      if (!providerId || !items || !items.length) {
        return res.status(400).json({
          success: false,
          message: "El proveedor y los artículos son obligatorios.",
        });
      }

      if (!invoiceNumber || !purchaseDate || !totalAmount) {
        return res.status(400).json({
          success: false,
          message:
            "invoiceNumber, purchaseDate y totalAmount son campos obligatorios.",
        });
      }

      const parsedItems = JSON.parse(items);

      for (const item of parsedItems) {
        if (!item.sportsEquipmentId || !item.quantity || !item.unitPrice) {
          return res.status(400).json({
            success: false,
            message:
              "Cada artículo debe tener ID de material, cantidad y precio.",
          });
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        const newPurchase = await tx.purchase.create({
          data: {
            invoiceNumber,
            purchaseDate: new Date(purchaseDate),
            registrationDate: registrationDate
              ? new Date(registrationDate)
              : null,
            totalAmount: parseFloat(totalAmount),
            observations,
            notes,
            providerId: parseInt(providerId),
            status: "Received",
          },
        });

        for (const item of parsedItems) {
          await tx.purchaseItem.create({
            data: {
              purchaseId: newPurchase.id,
              sportsEquipmentId: parseInt(item.sportsEquipmentId),
              productName: item.productName,
              quantity: parseInt(item.quantity),
              unitPrice: parseFloat(item.unitPrice),
              subtotal: parseInt(item.quantity) * parseFloat(item.unitPrice),
            },
          });

          await tx.sportsEquipment.update({
            where: { id: parseInt(item.sportsEquipmentId) },
            data: {
              quantityInitial: { increment: parseInt(item.quantity) },
              quantityTotal: { increment: parseInt(item.quantity) },
            },
          });
        }

        // Subir imágenes a Cloudinary si existen
        if (files && files.length > 0) {
          const uploadPromises = files.map((file) => {
            return new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                { folder: "purchase_invoices" },
                (error, result) => {
                  if (error) return reject(error);
                  resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                  });
                }
              );
              uploadStream.end(file.buffer);
            });
          });

          const uploadedImages = await Promise.all(uploadPromises);

          await tx.purchaseImage.createMany({
            data: uploadedImages.map((img) => ({
              ...img,
              purchaseId: newPurchase.id,
            })),
          });
        }

        return newPurchase;
      });

      res.status(201).json({
        success: true,
        message: "Compra creada exitosamente.",
        data: result,
      });
    } catch (error) {
      console.error("Error creando la compra:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al crear la compra.",
      });
    }
  };

  /**
   * Obtiene todas las compras con paginación y búsqueda.
   */
  GetAll = async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "" } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = search
        ? {
            OR: [
              { purchaseNumber: { contains: search, mode: "insensitive" } },
              {
                provider: {
                  businessName: { contains: search, mode: "insensitive" },
                },
              },
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
        message: `Se encontraron ${purchases.length} de ${total} compras.`,
        data: purchases,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error obteniendo compras:", error);
      res
        .status(500)
        .json({ success: false, message: "Error interno del servidor." });
    }
  };

  /**
   * Obtiene una compra por su ID, incluyendo artículos e imágenes.
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
          images: true, // Incluir imágenes
        },
      });

      if (!purchase) {
        return res.status(404).json({
          success: false,
          message: `Compra con ID ${id} no encontrada.`,
        });
      }

      res.status(200).json({
        success: true,
        message: "Compra encontrada.",
        data: purchase,
      });
    } catch (error) {
      console.error("Error obteniendo compra por ID:", error);
      res
        .status(500)
        .json({ success: false, message: "Error interno del servidor." });
    }
  };

  /**
   * Anula una compra y revierte el stock de los artículos.
   */
  Cancel = async (req, res) => {
    try {
      const { id } = req.params;

      const purchaseToCancel = await prisma.purchase.findUnique({
        where: { id: parseInt(id) },
        include: { items: true },
      });

      if (!purchaseToCancel) {
        return res
          .status(404)
          .json({ success: false, message: "Compra no encontrada." });
      }

      if (purchaseToCancel.status === "Cancelled") {
        return res
          .status(400)
          .json({ success: false, message: "Esta compra ya ha sido anulada." });
      }

      await prisma.$transaction(async (tx) => {
        // Revertir el stock por cada artículo en la compra
        for (const item of purchaseToCancel.items) {
          await tx.sportsEquipment.update({
            where: { id: item.sportsEquipmentId },
            data: {
              quantityInitial: { decrement: item.quantity },
              quantityTotal: { decrement: item.quantity },
            },
          });
        }

        // Actualizar el estado de la compra a 'Cancelled'
        await tx.purchase.update({
          where: { id: parseInt(id) },
          data: { status: "Cancelled" },
        });
      });

      res.status(200).json({
        success: true,
        message: "La compra ha sido anulada y el stock revertido.",
      });
    } catch (error) {
      console.error("Error anulando la compra:", error);
      res
        .status(500)
        .json({ success: false, message: "Error interno del servidor." });
    }
  };

  /**
   * Obtiene todos los proveedores con paginación y búsqueda por nombre o NIT.
   */
  GetProviders = async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "" } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {
        status: "Active", // Solo traer proveedores activos
        ...(search && {
          OR: [
            { businessName: { contains: search, mode: "insensitive" } },
            { nit: { contains: search, mode: "insensitive" } },
          ],
        }),
      };

      const [providers, total] = await prisma.$transaction([
        prisma.provider.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { businessName: "asc" },
        }),
        prisma.provider.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        message: `Se encontraron ${providers.length} de ${total} proveedores.`,
        data: providers,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error obteniendo proveedores:", error);
      res
        .status(500)
        .json({ success: false, message: "Error interno del servidor." });
    }
  };

  /**
   * Obtiene todo el material deportivo con paginación y búsqueda por nombre.
   * Ideal para seleccionar artículos al crear una compra.
   */
  GetSportsEquipment = async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "" } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {
        status: "Activated",
        ...(search && {
          name: { contains: search, mode: "insensitive" },
        }),
      };

      const [equipments, total] = await prisma.$transaction([
        prisma.sportsEquipment.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { name: "asc" },
        }),
        prisma.sportsEquipment.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        message: `Se encontraron ${equipments.length} de ${total} materiales deportivos.`,
        data: equipments,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error obteniendo material deportivo:", error);
      res
        .status(500)
        .json({ success: false, message: "Error interno del servidor." });
    }
  };
}

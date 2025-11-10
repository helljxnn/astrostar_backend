import prisma from "../../../config/database.js";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class SportsEquipment {
  /**
   * Crea un nuevo material deportivo. La cantidad inicial siempre es 0.
   */
  Create = async (req, res) => {
    try {
      const { name } = req.body;

      if (!name || name.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Please provide the name of the sports equipment.",
        });
      }

      const newEquipment = await prisma.sportsEquipment.create({
        data: {
          name: name.trim(),
          quantityInitial: 0, // Siempre inicializa en cero
          quantityTotal: 0,
        },
      });

      res.status(201).json({
        success: true,
        message: "Sports equipment created successfully.",
        data: newEquipment,
      });
    } catch (error) {
      console.error("Error creating sports equipment:", error);
      if (error.code === "P2002") {
        return res.status(400).json({
          success: false,
          message: `Equipment with the name "${req.body.name}" already exists.`,
        });
      }
      res.status(500).json({
        success: false,
        message: "Internal server error. Please try again.",
      });
    }
  };

  /**
   * Obtiene todos los materiales deportivos con paginación y búsqueda.
   */
  GetAll = async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "" } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { status: { contains: search, mode: "insensitive" } },
            ],
          }
        : {};

      const [equipments, total] = await prisma.$transaction([
        prisma.sportsEquipment.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { id: "desc" },
        }),
        prisma.sportsEquipment.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        message: `Found ${equipments.length} of ${total} equipment items.`,
        data: equipments,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching all sports equipment:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  };

  /**
   * Obtiene un material deportivo por su ID.
   */
  GetById = async (req, res) => {
    try {
      const { id } = req.params;
      const equipment = await prisma.sportsEquipment.findUnique({
        where: { id: parseInt(id) },
        include: {
          disposals: {
            include: { images: true }, // Incluye las bajas y sus imágenes
          },
        },
      });

      if (!equipment) {
        return res.status(404).json({
          success: false,
          message: `Sports equipment with ID ${id} not found.`,
        });
      }

      res.status(200).json({
        success: true,
        message: "Sports equipment found.",
        data: equipment,
      });
    } catch (error) {
      console.error("Error fetching sports equipment by ID:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  };

  /**
   * Actualiza el nombre o estado de un material deportivo.
   */
  Update = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, status } = req.body;

      const updatedEquipment = await prisma.sportsEquipment.update({
        where: { id: parseInt(id) },
        data: {
          name: name ? name.trim() : undefined,
          status: status,
        },
      });

      res.status(200).json({
        success: true,
        message: "Sports equipment updated successfully.",
        data: updatedEquipment,
      });
    } catch (error) {
      console.error("Error updating sports equipment:", error);
      if (error.code === "P2025") {
        return res.status(404).json({
          success: false,
          message: `Sports equipment with ID ${req.params.id} not found.`,
        });
      }
      res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  };

  /**
   * Elimina un material deportivo si no tiene registros asociados.
   */
  Delete = async (req, res) => {
    try {
      const { id } = req.params;

      await prisma.sportsEquipment.delete({
        where: { id: parseInt(id) },
      });

      res.status(200).json({
        success: true,
        message: "Sports equipment deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting sports equipment:", error);
      if (error.code === "P2003") {
        return res.status(400).json({
          success: false,
          message:
            "Cannot delete this equipment because it is associated with purchases or disposals.",
        });
      }
      res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  };

  /**
   * Crea un registro de baja para un material, subiendo imágenes si se proporcionan.
   */
  CreateDisposal = async (req, res) => {
    const { id } = req.params;
    const { quantity, reason, observation } = req.body;
    // Asegurarse de que 'files' sea siempre un array, incluso si no se envían archivos.
    const files = req.files || [];

    try {
      if (!quantity || !reason) {
        return res.status(400).json({
          success: false,
          message: "Fields 'quantity' and 'reason' are required.",
        });
      }

      const quantityToDispose = parseInt(quantity);
      if (isNaN(quantityToDispose) || quantityToDispose <= 0) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be a positive number.",
        });
      }

      const equipment = await prisma.sportsEquipment.findUnique({
        where: { id: parseInt(id) },
      });

      if (!equipment) {
        return res.status(404).json({
          success: false,
          message: `Sports equipment with ID ${id} not found.`,
        });
      }

      if (equipment.quantityTotal < quantityToDispose) {
        return res.status(400).json({
          success: false,
          message: `La cantidad a dar de baja (${quantityToDispose}) supera el total disponible (${equipment.quantityTotal}). La operación no puede dejar un saldo negativo.`,
        });
      }

      // Subir imágenes a Cloudinary
      const uploadPromises = files.map((file) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "sports_equipment_disposals" },
            (error, result) => {
              if (error) return reject(error);
              resolve({ url: result.secure_url, publicId: result.public_id });
            }
          );
          uploadStream.end(file.buffer);
        });
      });

      const uploadedImages = await Promise.all(uploadPromises);

      // Realizar operaciones en una transacción
      const result = await prisma.$transaction(async (tx) => {
        const newDisposal = await tx.sportsDisposals.create({
          data: {
            quantity: quantityToDispose,
            reason,
            observation,
            sportsEquipmentId: parseInt(id),
          },
        });

        if (uploadedImages.length > 0) {
          await tx.sportsDisposalImage.createMany({
            data: uploadedImages.map((img) => ({
              url: img.url,
              publicId: img.publicId,
              disposalId: newDisposal.id,
            })),
          });
        }

        const updatedEquipment = await tx.sportsEquipment.update({
          where: { id: parseInt(id) },
          data: {
            quantityTotal: {
              decrement: quantityToDispose,
            },
          },
        });

        return { newDisposal, updatedEquipment };
      });

      res.status(201).json({
        success: true,
        message: `Successfully disposed of ${quantityToDispose} item(s).`,
        data: result,
      });
    } catch (error) {
      console.error("Error creating disposal:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while creating disposal.",
      });
    }
  };
}

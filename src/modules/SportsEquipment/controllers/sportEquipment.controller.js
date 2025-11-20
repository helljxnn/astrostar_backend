import prisma from "../../../config/database.js";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

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
          message: "Por favor, proporcione el nombre del material deportivo.",
        });
      }

      const newEquipment = await prisma.sportsEquipments.create({
        data: {
          name: name.trim(),
          quantityInitial: 0, // Siempre inicializa en cero
          quantityTotal: 0,
        },
      });

      res.status(201).json({
        success: true,
        message: "Material deportivo creado exitosamente.",
        data: newEquipment,
      });
    } catch (error) {
      console.error("Error creating sports equipment:", error);
      if (error.code === "P2002") {
        return res.status(400).json({
          success: false,
          message: `El material con el nombre "${req.body.name}" ya existe.`,
        });
      }
      res.status(500).json({
        success: false,
        message: "Error interno del servidor. Por favor, inténtelo de nuevo.",
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
            name: { contains: search, mode: "insensitive" },
          }
        : {};

      const [equipments, total] = await prisma.$transaction([
        prisma.sportsEquipments.findMany({
          // Corregido: usar 'sportsEquipments'
          where,
          skip,
          take: parseInt(limit),
          orderBy: { id: "desc" },
        }),
        prisma.sportsEquipments.count({ where }), // Corregido: usar 'sportsEquipments'
      ]);

      res.status(200).json({
        success: true,
        message: `Se encontraron ${equipments.length} de ${total} materiales deportivos.`,
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
        message: "Error interno del servidor.",
      });
    }
  };

  /**
   * Obtiene un material deportivo por su ID.
   */
  GetById = async (req, res) => {
    try {
      const { id } = req.params;
      const equipment = await prisma.sportsEquipments.findUnique({
        // Corregido: usar 'sportsEquipments'
        where: { id: parseInt(id) },
        include: {
          disposals: true, // Corregido: las imágenes son campos directos en Disposals
        },
      });

      if (!equipment) {
        return res.status(404).json({
          success: false,
          message: `No se encontró el material deportivo con el ID ${id}.`,
        });
      }

      res.status(200).json({
        success: true,
        message: "Material deportivo encontrado.",
        data: equipment,
      });
    } catch (error) {
      console.error("Error fetching sports equipment by ID:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
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

      const updatedEquipment = await prisma.sportsEquipments.update({
        // Corregido: usar 'sportsEquipments'
        where: { id: parseInt(id) },
        data: {
          name: name ? name.trim() : undefined,
          status: status,
        },
      });

      res.status(200).json({
        success: true,
        message: "Material deportivo actualizado exitosamente.",
        data: updatedEquipment,
      });
    } catch (error) {
      console.error("Error updating sports equipment:", error);
      if (error.code === "P2025") {
        return res.status(404).json({
          success: false,
          message: `No se encontró el material deportivo con el ID ${req.params.id}.`,
        });
      }
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
      });
    }
  };

  /**
   * Elimina un material deportivo si no tiene registros asociados.
   */
  Delete = async (req, res) => {
    try {
      const { id } = req.params;

      // 1. Verificar si el material deportivo existe
      const equipment = await prisma.sportsEquipments.findUnique({
        where: { id: parseInt(id) },
        include: {
          _count: {
            select: { disposals: true },
          },
        },
      });

      if (!equipment) {
        return res.status(404).json({
          success: false,
          message: `No se encontró el material deportivo con el ID ${id}.`,
        });
      }

      // 2. Verificar si tiene bajas (disposals) asociadas
      if (equipment._count.disposals > 0) {
        return res.status(400).json({
          success: false,
          message: `No se puede eliminar '${equipment.name}' porque tiene ${equipment._count.disposals} registro(s) de baja asociados.`,
        });
      }

      // 3. Proceder con la eliminación si no hay registros asociados
      await prisma.sportsEquipments.delete({
        // Corregido: usar 'sportsEquipments'
        where: { id: parseInt(id) },
      });

      res.status(200).json({
        success: true,
        message: "Material deportivo eliminado exitosamente.",
      });
    } catch (error) {
      console.error("Error deleting sports equipment:", error);
      // Manejo de error genérico en caso de que otra restricción falle
      if (error.code === "P2003") {
        // Foreign key constraint failed
        return res.status(409).json({
          // 409 Conflict es más apropiado aquí
          success: false,
          message:
            "La eliminación falló debido a un conflicto en la base de datos. Asegúrese de que no tenga otros registros asociados.",
        });
      }
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
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
          message: "Los campos 'quantity' y 'reason' son obligatorios.",
        });
      }

      const quantityToDispose = parseInt(quantity);
      if (isNaN(quantityToDispose) || quantityToDispose <= 0) {
        return res.status(400).json({
          success: false,
          message: "La cantidad debe ser un número positivo.",
        });
      }

      const equipment = await prisma.sportsEquipments.findUnique({
        // Corregido: usar 'sportsEquipments'
        where: { id: parseInt(id) },
      });

      if (!equipment) {
        return res.status(404).json({
          success: false,
          message: `No se encontró el material deportivo con el ID ${id}.`,
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
        const newDisposal = await tx.disposals.create({
          // Corregido: usar 'disposals'
          data: {
            quantity: quantityToDispose,
            reason,
            observations: observation, // Corregido: el campo es 'observations'
            sportsEquipmentId: parseInt(id),
            imageUrl1: uploadedImages.length > 0 ? uploadedImages[0].url : null, // Añadido: guardar URL de la primera imagen
            imageUrl2: uploadedImages.length > 1 ? uploadedImages[1].url : null, // Añadido: guardar URL de la segunda imagen
          },
        });

        // Eliminado: ya no se usa el modelo 'sportsDisposalImage'

        const updatedEquipment = await tx.sportsEquipments.update({
          // Corregido: usar 'sportsEquipments'
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
        message: `Se ha(n) dado de baja ${quantityToDispose} artículo(s) exitosamente.`,
        data: result,
      });
    } catch (error) {
      console.error("Error creating disposal:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al crear la baja.",
      });
    }
  };

  /**
   * Obtiene una lista de todos los materiales deportivos y verifica si pueden ser eliminados.
   */
  GetDeletionCheck = async (req, res) => {
    try {
      const equipments = await prisma.sportsEquipments.findMany({
        include: {
          _count: {
            select: { disposals: true },
          },
        },
      });

      // Obtener todos los nombres de productos de los items de compra
      const purchaseItems = await prisma.purchaseItem.findMany({
        select: { productName: true },
        distinct: ["productName"],
      });
      const purchasedProductNames = new Set(
        purchaseItems.map((item) => item.productName)
      );

      const deletionStatus = equipments.map((equipment) => {
        let canBeDeleted = true;
        let reason = "";

        if (equipment._count.disposals > 0) {
          canBeDeleted = false;
          reason = `Tiene ${equipment._count.disposals} registro(s) de baja asociados.`;
        } else if (purchasedProductNames.has(equipment.name)) {
          canBeDeleted = false;
          reason = "Está asociado a uno o más registros de compras.";
        }

        return {
          ...equipment,
          canBeDeleted,
          reason: canBeDeleted ? "Se puede eliminar." : reason,
        };
      });

      res.status(200).json({ success: true, data: deletionStatus });
    } catch (error) {
      console.error("Error fetching deletion check for equipment:", error);
      res
        .status(500)
        .json({ success: false, message: "Error interno del servidor." });
    }
  };
}

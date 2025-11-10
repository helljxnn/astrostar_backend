import prisma from "../../../config/database.js";

export class SportsEquipment {
  /**
   * Creates a new piece of sports equipment.
   */
  Create = async (req, res) => {
    try {
      const { name, quantityInitial } = req.body;

      if (!name || name.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Please provide the name of the sports equipment.",
        });
      }

      const initialQty = quantityInitial ? parseInt(quantityInitial) : 0;

      const newEquipment = await prisma.sportsEquipment.create({
        data: {
          name: name.trim(),
          quantityInitial: initialQty,
          quantityTotal: initialQty, // Total quantity is same as initial on creation
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
   * Gets a single piece of sports equipment by ID.
   */
  GetById = async (req, res) => {
    try {
      const { id } = req.params;
      const equipment = await prisma.sportsEquipment.findUnique({
        where: { id: parseInt(id) },
        include: { disposals: true }, // Include disposal history
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
   * Gets all sports equipment with pagination and search.
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
   * Updates sports equipment (name and status).
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
   * Deletes a piece of sports equipment.
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
          message: "Cannot delete this equipment because it is associated with purchases or disposals.",
        });
      }
      res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  };

  /**
   * Creates a disposal record for a piece of sports equipment.
   */
  CreateDisposal = async (req, res) => {
    try {
      const { id } = req.params; // ID of the SportsEquipment
      const { quantity, reason, observation } = req.body;

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
          message: `Cannot dispose ${quantityToDispose} items. Only ${equipment.quantityTotal} items are available.`,
        });
      }

      // Perform operations in a transaction
      const [newDisposal, updatedEquipment] = await prisma.$transaction([
        prisma.sportsDisposals.create({
          data: {
            quantity: quantityToDispose,
            reason,
            observation,
            sportsEquipmentId: parseInt(id),
          },
        }),
        prisma.sportsEquipment.update({
          where: { id: parseInt(id) },
          data: {
            quantityTotal: {
              decrement: quantityToDispose,
            },
          },
        }),
      ]);

      res.status(201).json({
        success: true,
        message: `Successfully disposed of ${quantityToDispose} item(s).`,
        data: { newDisposal, updatedEquipment },
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


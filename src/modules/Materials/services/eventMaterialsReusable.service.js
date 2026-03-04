import { PrismaClient } from "../../../../generated/prisma/index.js";

const prisma = new PrismaClient();

class EventMaterialsReusableService {
  /**
   * Get reusable materials assigned to an event
   */
  async getByEvent(eventoId) {
    try {
      const materials = await prisma.eventMaterialReusable.findMany({
        where: {
          eventoId: parseInt(eventoId),
        },
        include: {
          material: {
            select: {
              id: true,
              nombre: true,
              categoria: true,
              stockFundacion: true,
              estado: true,
              unidadMedida: true,
              esReutilizable: true,
            },
          },
        },
        orderBy: {
          fechaAsignacion: "desc",
        },
      });

      return {
        success: true,
        data: materials,
      };
    } catch (error) {
      console.error("Service error - getByEvent:", error);
      throw error;
    }
  }

  /**
   * Assign reusable material to event (planning only, no stock deduction)
   */
  async assignMaterial(eventoId, data, userId, userName) {
    try {
      console.log("🔄 Assigning reusable material to event (planning)...");

      // 1. Validate data
      this.validateAssignmentData(data);

      // 2. Get material
      const material = await prisma.material.findUnique({
        where: { id: parseInt(data.material_id) },
      });

      if (!material) {
        return {
          success: false,
          statusCode: 404,
          message: "Material not found",
        };
      }

      if (material.estado !== "Activo") {
        return {
          success: false,
          statusCode: 400,
          message: "Cannot assign inactive materials",
        };
      }

      if (!material.esReutilizable) {
        return {
          success: false,
          statusCode: 400,
          message: "This material is not marked as reusable",
        };
      }

      // 3. Get event details
      const event = await prisma.service.findUnique({
        where: { id: parseInt(eventoId) },
      });

      if (!event) {
        return {
          success: false,
          statusCode: 404,
          message: "Event not found",
        };
      }

      // 4. Check availability (no overlap with other events)
      const cantidad = parseInt(data.cantidad);
      const isAvailable = await this.checkMaterialAvailability(
        parseInt(data.material_id),
        cantidad,
        event.startDate,
        event.endDate,
        parseInt(eventoId),
      );

      if (!isAvailable.available) {
        return {
          success: false,
          statusCode: 400,
          message: isAvailable.message,
          conflictingEvents: isAvailable.conflictingEvents,
        };
      }

      // 5. Create assignment (no stock deduction)
      const assignment = await prisma.eventMaterialReusable.create({
        data: {
          materialId: parseInt(data.material_id),
          eventoId: parseInt(eventoId),
          cantidad: cantidad,
          observaciones: data.observaciones || null,
          createdBy: userId,
          createdByName: userName || null,
        },
        include: {
          material: true,
        },
      });

      console.log("✅ Reusable material assigned successfully (planning only)");

      return {
        success: true,
        data: assignment,
        message: `Successfully planned ${cantidad} units of "${material.nombre}" for event`,
      };
    } catch (error) {
      console.error("❌ Error assigning reusable material:", error.message);
      throw error;
    }
  }

  /**
   * Check if material is available for the event dates
   */
  async checkMaterialAvailability(
    materialId,
    cantidad,
    startDate,
    endDate,
    excludeEventoId = null,
  ) {
    try {
      // Get material stock
      const material = await prisma.material.findUnique({
        where: { id: materialId },
      });

      if (!material) {
        return {
          available: false,
          message: "Material not found",
        };
      }

      // Check if enough stock in foundation
      if (material.stockFundacion < cantidad) {
        return {
          available: false,
          message: `Insufficient stock. Available: ${material.stockFundacion}, Requested: ${cantidad}`,
        };
      }

      // Find overlapping events
      const overlappingAssignments =
        await prisma.eventMaterialReusable.findMany({
          where: {
            materialId: materialId,
            eventoId: {
              not: excludeEventoId,
            },
            evento: {
              OR: [
                {
                  AND: [
                    { startDate: { lte: endDate } },
                    { endDate: { gte: startDate } },
                  ],
                },
              ],
            },
          },
          include: {
            evento: {
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
              },
            },
          },
        });

      if (overlappingAssignments.length === 0) {
        return {
          available: true,
          message: "Material is available",
        };
      }

      // Calculate total quantity used in overlapping events
      const totalUsed = overlappingAssignments.reduce(
        (sum, assignment) => sum + assignment.cantidad,
        0,
      );
      const availableQuantity = material.stockFundacion - totalUsed;

      if (availableQuantity < cantidad) {
        return {
          available: false,
          message: `Material not available for these dates. Available: ${availableQuantity}, Requested: ${cantidad}`,
          conflictingEvents: overlappingAssignments.map((a) => ({
            id: a.evento.id,
            name: a.evento.name,
            startDate: a.evento.startDate,
            endDate: a.evento.endDate,
            cantidad: a.cantidad,
          })),
        };
      }

      return {
        available: true,
        message: "Material is available",
      };
    } catch (error) {
      console.error("❌ Error checking availability:", error.message);
      throw error;
    }
  }

  /**
   * Remove reusable material assignment
   */
  async removeAssignment(assignmentId, userId, userName) {
    try {
      console.log("🔄 Removing reusable material assignment...");

      // 1. Get assignment
      const assignment = await prisma.eventMaterialReusable.findUnique({
        where: { id: parseInt(assignmentId) },
        include: { material: true },
      });

      if (!assignment) {
        return {
          success: false,
          statusCode: 404,
          message: "Assignment not found",
        };
      }

      // 2. Delete assignment (no stock changes)
      await prisma.eventMaterialReusable.delete({
        where: { id: parseInt(assignmentId) },
      });

      console.log("✅ Assignment removed successfully");

      return {
        success: true,
        message: `Successfully removed ${assignment.cantidad} units`,
      };
    } catch (error) {
      console.error("❌ Error removing assignment:", error.message);
      throw error;
    }
  }

  /**
   * Get material availability for a date range
   */
  async getMaterialAvailability(
    materialId,
    startDate,
    endDate,
    excludeEventoId = null,
  ) {
    try {
      const result = await this.checkMaterialAvailability(
        parseInt(materialId),
        0, // Just checking, not reserving
        new Date(startDate),
        new Date(endDate),
        excludeEventoId ? parseInt(excludeEventoId) : null,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("❌ Error getting availability:", error.message);
      throw error;
    }
  }

  /**
   * Validate assignment data
   */
  validateAssignmentData(data) {
    if (!data.material_id) {
      throw new Error("Material is required");
    }

    if (!data.cantidad) {
      throw new Error("Quantity is required");
    }

    const cantidad = parseInt(data.cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      throw new Error("Quantity must be a positive number");
    }

    if (data.observaciones && data.observaciones.length > 1000) {
      throw new Error("Observations cannot exceed 1000 characters");
    }
  }
}

export default new EventMaterialsReusableService();

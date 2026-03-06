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
   * Get all assignments for a specific material (to see which events are using it)
   */
  async getMaterialAssignments(materialId, options = {}) {
    try {
      const {
        includeCompleted = false,
        startDate = null,
        endDate = null,
      } = options;

      const whereClause = {
        materialId: parseInt(materialId),
        bloqueado: false,
        // No filtrar por tipo aquí, ya que algunos materiales reutilizables
        // pueden tener asignaciones guardadas como CONSUMIBLE
      };

      // Filter by date range if provided
      if (startDate || endDate) {
        const eventoFilter = {};
        if (startDate) {
          eventoFilter.endDate = { gte: new Date(startDate) };
        }
        if (endDate) {
          eventoFilter.startDate = { lte: new Date(endDate) };
        }
        whereClause.evento = { is: eventoFilter };
      }

      // Filter out completed events if requested
      if (!includeCompleted) {
        if (whereClause.evento) {
          whereClause.evento.is = {
            ...whereClause.evento.is,
            endDate: { gte: new Date() },
          };
        } else {
          whereClause.evento = {
            is: {
              endDate: { gte: new Date() },
            },
          };
        }
      }

      const assignments = await prisma.eventMaterial.findMany({
        where: whereClause,
        include: {
          evento: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
              status: true,
              location: true,
            },
          },
          material: {
            select: {
              id: true,
              nombre: true,
              stockFundacion: true,
              unidadMedida: true,
            },
          },
        },
        orderBy: {
          evento: {
            startDate: "asc",
          },
        },
      });

      // Calculate availability summary
      const material = await prisma.material.findUnique({
        where: { id: parseInt(materialId) },
        select: {
          stockFundacion: true,
          stockEventos: true,
          nombre: true,
        },
      });

      const totalAssigned = assignments.reduce((sum, a) => sum + a.cantidad, 0);
      const maxConcurrent = this.calculateMaxConcurrentUsage(assignments);

      return {
        success: true,
        data: {
          material: {
            id: parseInt(materialId),
            nombre: material?.nombre,
            stockTotal:
              (material?.stockFundacion || 0) + (material?.stockEventos || 0),
          },
          assignments: assignments.map((a) => ({
            id: a.id,
            cantidad: a.cantidad,
            observaciones: a.observaciones,
            fechaAsignacion: a.fechaAsignacion,
            evento: {
              id: a.evento.id,
              nombre: a.evento.name,
              fechaInicio: a.evento.startDate,
              fechaFin: a.evento.endDate,
              estado: a.evento.status,
              ubicacion: a.evento.location,
            },
          })),
          summary: {
            totalAsignaciones: assignments.length,
            totalUnidadesAsignadas: totalAssigned,
            usoMaximoConcurrente: maxConcurrent,
            disponibleMinimo: (material?.stockFundacion || 0) - maxConcurrent,
          },
        },
      };
    } catch (error) {
      console.error("Error getting material assignments:", error);
      throw error;
    }
  }

  /**
   * Calculate maximum concurrent usage across all assignments
   */
  calculateMaxConcurrentUsage(assignments) {
    if (assignments.length === 0) return 0;

    // Create events for start and end dates
    const events = [];
    assignments.forEach((assignment) => {
      events.push({
        date: new Date(assignment.evento.startDate),
        type: "start",
        cantidad: assignment.cantidad,
      });
      events.push({
        date: new Date(assignment.evento.endDate),
        type: "end",
        cantidad: assignment.cantidad,
      });
    });

    // Sort events by date
    events.sort((a, b) => {
      if (a.date.getTime() !== b.date.getTime()) {
        return a.date.getTime() - b.date.getTime();
      }
      // If same date, process 'end' before 'start'
      return a.type === "end" ? -1 : 1;
    });

    // Calculate maximum concurrent usage
    let currentUsage = 0;
    let maxUsage = 0;

    events.forEach((event) => {
      if (event.type === "start") {
        currentUsage += event.cantidad;
        maxUsage = Math.max(maxUsage, currentUsage);
      } else {
        currentUsage -= event.cantidad;
      }
    });

    return maxUsage;
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

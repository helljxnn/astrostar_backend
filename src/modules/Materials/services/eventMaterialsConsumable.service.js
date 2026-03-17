import { PrismaClient } from "../../../../generated/prisma/index.js";

const prisma = new PrismaClient();

class EventMaterialsConsumableService {
  /**
   * Get consumable materials assigned to an event (including donations)
   */
  async getByEvent(eventoId) {
    try {
      const materials = await prisma.eventMaterial.findMany({
        where: {
          eventoId: parseInt(eventoId),
          tipo: "CONSUMIBLE",
        },
        include: {
          material: {
            select: {
              id: true,
              nombre: true,
              categoria: true,
              stockEventos: true,
              estado: true,
              unidadMedida: true,
            },
          },
          donacion: {
            select: {
              id: true,
              code: true,
              donorSponsor: {
                select: {
                  id: true,
                  name: true,
                },
              },
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
   * Load donations assigned to event as consumable materials
   */
  async loadDonationMaterials(eventoId, userId, userName) {
    try {
      // 1. Get donations assigned to this event
      const donations = await prisma.donation.findMany({
        where: {
          serviceId: parseInt(eventoId),
          type: "ESPECIE",
          status: {
            in: ["Verificada", "Ejecutada"],
          },
        },
        include: {
          details: true,
        },
      });

      if (donations.length === 0) {
        return {
          success: true,
          data: [],
          message: "No donations found for this event",
        };
      }

      const loadedMaterials = [];

      // 2. Process each donation
      for (const donation of donations) {
        for (const detail of donation.details) {
          // Check if material exists by description
          const material = await prisma.material.findFirst({
            where: {
              nombre: {
                contains: detail.description,
                mode: "insensitive",
              },
              estado: "Activo",
            },
          });

          if (!material) {
            continue;
          }

          // Check if already loaded
          const existing = await prisma.eventMaterial.findFirst({
            where: {
              eventoId: parseInt(eventoId),
              materialId: material.id,
              donacionId: donation.id,
            },
          });

          if (existing) {
            continue;
          }

          // Create consumable material assignment (locked)
          const assignment = await prisma.eventMaterial.create({
            data: {
              materialId: material.id,
              eventoId: parseInt(eventoId),
              cantidad: parseInt(detail.quantity || 1),
              tipo: "CONSUMIBLE",
              donacionId: donation.id,
              bloqueado: true, // Cannot be removed
              observaciones: `Donación ${donation.code}`,
              createdBy: userId,
              createdByName: userName || null,
            },
            include: {
              material: true,
              donacion: {
                include: {
                  donorSponsor: true,
                },
              },
            },
          });

          loadedMaterials.push(assignment);
        }
      }

      return {
        success: true,
        data: loadedMaterials,
        message: `Successfully loaded ${loadedMaterials.length} donation materials`,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Assign consumable material to event (manual)
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

      // 3. Check available stock (real stock, not reserved)
      const cantidad = parseInt(data.cantidad);

      if (material.stockEventos < cantidad) {
        return {
          success: false,
          statusCode: 400,
          message: `Insufficient stock. Available: ${material.stockEventos}, Requested: ${cantidad}`,
        };
      }

      // 4. Get event to check if it has started
      const event = await prisma.service.findUnique({
        where: { id: parseInt(eventoId) },
        select: { startDate: true },
      });

      if (!event) {
        return {
          success: false,
          statusCode: 404,
          message: "Event not found",
        };
      }

      // 5. Create assignment with IMMEDIATE stock deduction
      const assignment = await prisma.$transaction(async (tx) => {
        const stockAnterior = material.stockFundacion + material.stockEventos;
        const newStockEventos = material.stockEventos - cantidad;
        const stockNuevo = material.stockFundacion + newStockEventos;

        // Deduct stock IMMEDIATELY
        await tx.material.update({
          where: { id: parseInt(data.material_id) },
          data: {
            stockEventos: newStockEventos,
          },
        });

        // Create movement record
        await tx.materialMovement.create({
          data: {
            materialId: parseInt(data.material_id),
            materialNombre: material.nombre,
            categoria: material.categoria,
            tipoMovimiento: "ASIGNACION_EVENTO",
            cantidad: cantidad,
            inventarioOrigen: "EVENTOS",
            eventoId: parseInt(eventoId),
            observaciones:
              data.observaciones || `Asignado al evento "${event.name}"`,
            stockAnterior: stockAnterior,
            stockNuevo: stockNuevo,
            createdBy: userId,
            createdByName: userName || null,
          },
        });

        // Create assignment
        return await tx.eventMaterial.create({
          data: {
            materialId: parseInt(data.material_id),
            eventoId: parseInt(eventoId),
            cantidad: cantidad,
            tipo: "CONSUMIBLE",
            bloqueado: false,
            observaciones: data.observaciones || null,
            createdBy: userId,
            createdByName: userName || null,
          },
          include: {
            material: true,
          },
        });
      });

      return {
        success: true,
        data: assignment,
        message: `Successfully assigned ${cantidad} units of "${material.nombre}"`,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove consumable material assignment (only if event hasn't started and not locked)
   */
  async removeAssignment(assignmentId, userId, userName) {
    try {
      // 1. Get assignment with event info
      const assignment = await prisma.eventMaterial.findUnique({
        where: { id: parseInt(assignmentId) },
        include: {
          material: true,
          evento: {
            select: {
              id: true,
              name: true,
              startDate: true,
            },
          },
        },
      });

      if (!assignment) {
        return {
          success: false,
          statusCode: 404,
          message: "Assignment not found",
        };
      }

      // 2. Check if locked (from donation) - Special handling
      if (assignment.bloqueado) {
        // Materials from donations CAN be removed if event is cancelled
        // They will be added to event stock for future use

        // Check if event has started
        const now = new Date();
        const eventStartDate = new Date(assignment.evento.startDate);

        if (eventStartDate <= now) {
          return {
            success: false,
            statusCode: 400,
            message:
              "Cannot remove materials from events that have already started",
          };
        }

        // Remove assignment and ADD to event stock (first time in stock)
        await prisma.$transaction(async (tx) => {
          const material = assignment.material;
          const stockAnterior = material.stockEventos;
          const newStockEventos = material.stockEventos + assignment.cantidad;

          // ADD to event stock (material is now available)
          await tx.material.update({
            where: { id: assignment.materialId },
            data: {
              stockEventos: newStockEventos,
            },
          });

          // Create movement record (entry to stock from cancelled event)
          await tx.materialMovement.create({
            data: {
              materialId: assignment.materialId,
              materialNombre: material.nombre,
              categoria: material.categoria,
              tipoMovimiento: "Entrada",
              cantidad: assignment.cantidad,
              inventarioDestino: "EVENTOS",
              eventoId: assignment.eventoId,
              donacionId: assignment.donacionId,
              observaciones: `Ingreso al stock desde evento cancelado "${assignment.evento.name}" (Donación)`,
              stockAnterior: stockAnterior,
              stockNuevo: newStockEventos,
              createdBy: userId,
              createdByName: userName || null,
            },
          });

          // Delete assignment
          await tx.eventMaterial.delete({
            where: { id: parseInt(assignmentId) },
          });
        });

        return {
          success: true,
          message: `Successfully removed ${assignment.cantidad} units from donation and added to event stock`,
        };
      }

      // 3. Check if event has started (for non-donation materials)
      const now = new Date();
      const eventStartDate = new Date(assignment.evento.startDate);

      if (eventStartDate <= now) {
        return {
          success: false,
          statusCode: 400,
          message:
            "Cannot remove materials from events that have already started",
        };
      }

      // 4. Remove assignment and REVERT stock deduction
      await prisma.$transaction(async (tx) => {
        const material = assignment.material;
        const stockAnterior = material.stockFundacion + material.stockEventos;
        const newStockEventos = material.stockEventos + assignment.cantidad;
        const stockNuevo = material.stockFundacion + newStockEventos;

        // Revert stock deduction
        await tx.material.update({
          where: { id: assignment.materialId },
          data: {
            stockEventos: newStockEventos,
          },
        });

        // Create movement record (reversal)
        await tx.materialMovement.create({
          data: {
            materialId: assignment.materialId,
            materialNombre: material.nombre,
            categoria: material.categoria,
            tipoMovimiento: "REVERSION_ASIGNACION",
            cantidad: assignment.cantidad,
            inventarioDestino: "EVENTOS",
            eventoId: assignment.eventoId,
            observaciones: `Reversión de asignación al evento "${assignment.evento.name}"`,
            stockAnterior: stockAnterior,
            stockNuevo: stockNuevo,
            createdBy: userId,
            createdByName: userName || null,
          },
        });

        // Delete assignment
        await tx.eventMaterial.delete({
          where: { id: parseInt(assignmentId) },
        });
      });

      return {
        success: true,
        message: `Successfully removed ${assignment.cantidad} units and reverted stock`,
      };
    } catch (error) {
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

export default new EventMaterialsConsumableService();


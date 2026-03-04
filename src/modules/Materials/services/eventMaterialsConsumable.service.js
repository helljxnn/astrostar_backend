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
            console.log(
              `⚠️ Material not found for donation detail: ${detail.description}`,
            );
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
            console.log(`⚠️ Material already loaded: ${material.nombre}`);
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
      console.error("❌ Error loading donation materials:", error.message);
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

      // 3. Check available stock
      const cantidad = parseInt(data.cantidad);
      const stockDisponible =
        material.stockEventos - material.stockEventosReservado;

      if (stockDisponible < cantidad) {
        return {
          success: false,
          statusCode: 400,
          message: `Insufficient stock. Available: ${stockDisponible}, Requested: ${cantidad}`,
        };
      }

      // 4. Create assignment
      const assignment = await prisma.$transaction(async (tx) => {
        // Reserve stock
        await tx.material.update({
          where: { id: parseInt(data.material_id) },
          data: {
            stockEventosReservado: {
              increment: cantidad,
            },
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
      console.error("❌ Error assigning consumable material:", error.message);
      throw error;
    }
  }

  /**
   * Remove consumable material assignment (only if not locked)
   */
  async removeAssignment(assignmentId, userId, userName) {
    try {
      // 1. Get assignment
      const assignment = await prisma.eventMaterial.findUnique({
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

      // 2. Check if locked (from donation)
      if (assignment.bloqueado) {
        return {
          success: false,
          statusCode: 400,
          message: "Cannot remove donation materials",
        };
      }

      // 3. Remove assignment
      await prisma.$transaction(async (tx) => {
        // Unreserve stock
        await tx.material.update({
          where: { id: assignment.materialId },
          data: {
            stockEventosReservado: {
              decrement: assignment.cantidad,
            },
          },
        });

        // Delete assignment
        await tx.eventMaterial.delete({
          where: { id: parseInt(assignmentId) },
        });
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
   * Finalize event - Deduct real stock for consumables
   */
  async finalizeEvent(eventoId, userId, userName) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Get all consumable assignments
        const assignments = await tx.eventMaterial.findMany({
          where: {
            eventoId: parseInt(eventoId),
            tipo: "CONSUMIBLE",
          },
          include: { material: true },
        });

        if (assignments.length === 0) {
          return [];
        }

        const processedMaterials = [];

        for (const assignment of assignments) {
          const material = assignment.material;

          // Validate stock
          if (material.stockEventos < assignment.cantidad) {
            throw new Error(
              `Insufficient stock for "${material.nombre}". Available: ${material.stockEventos}, Required: ${assignment.cantidad}`,
            );
          }

          // Calculate stock
          const stockAnterior = material.stockFundacion + material.stockEventos;
          const newStockEventos = material.stockEventos - assignment.cantidad;
          const newStockReservado =
            material.stockEventosReservado - assignment.cantidad;
          const stockNuevo = material.stockFundacion + newStockEventos;

          // Deduct stock
          await tx.material.update({
            where: { id: material.id },
            data: {
              stockEventos: newStockEventos,
              stockEventosReservado: newStockReservado,
            },
          });

          // Create movement
          await tx.materialMovement.create({
            data: {
              materialId: material.id,
              materialNombre: material.nombre,
              categoria: material.categoria,
              tipoMovimiento: "SALIDA_EVENTO",
              cantidad: assignment.cantidad,
              inventarioOrigen: "EVENTOS",
              eventoId: parseInt(eventoId),
              donacionId: assignment.donacionId,
              observaciones: assignment.observaciones || "Event finalized",
              stockAnterior: stockAnterior,
              stockNuevo: stockNuevo,
              createdBy: userId,
              createdByName: userName || null,
            },
          });

          processedMaterials.push({
            materialId: material.id,
            materialNombre: material.nombre,
            cantidad: assignment.cantidad,
            stockAnterior: material.stockEventos,
            stockNuevo: newStockEventos,
          });
        }

        return processedMaterials;
      });

      return {
        success: true,
        data: result,
        message: `Successfully deducted ${result.length} consumable material(s)`,
      };
    } catch (error) {
      console.error("❌ Error finalizing event:", error.message);

      if (error.message.includes("Insufficient")) {
        return {
          success: false,
          statusCode: 400,
          message: error.message,
        };
      }

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

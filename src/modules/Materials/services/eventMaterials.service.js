import materialsRepository from "../repository/materials.repository.js";
import { PrismaClient } from "../../../../generated/prisma/index.js";

const prisma = new PrismaClient();

class EventMaterialsService {
  /**
   * Get materials assigned to an event
   */
  async getByEvent(eventoId) {
    try {
      const materials = await prisma.eventMaterial.findMany({
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
              stockEventos: true,
              estado: true,
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
   * Assign material to event (RESERVES stock, does NOT deduct immediately)
   */
  async assignMaterial(eventoId, data, userId, userName) {
    try {
      // 1. Validate data
      this.validateAssignmentData(data);

      // 2. Get material for validations
      const material = await materialsRepository.findById(data.material_id);
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
          message: "Cannot assign inactive materials to events",
        };
      }

      // 3. Calculate available stock (stock - reserved)
      const cantidad = parseInt(data.cantidad);
      const stockDisponible =
        material.stockEventos - material.stockEventosReservado;

      if (stockDisponible < cantidad) {
        return {
          success: false,
          statusCode: 400,
          message: `Insufficient available stock. Available: ${stockDisponible}, Requested: ${cantidad}`,
        };
      }

      // 4. Execute assignment (atomic transaction) - ONLY INCREMENT RESERVED
      const result = await prisma.$transaction(async (tx) => {
        // 4.1. Lock material row to prevent race conditions
        const lockedMaterial = await tx.material.findUnique({
          where: { id: parseInt(data.material_id) },
        });

        // 4.2. Increment reserved stock (DO NOT deduct real stock)
        await tx.material.update({
          where: { id: parseInt(data.material_id) },
          data: {
            stockEventosReservado: {
              increment: cantidad,
            },
          },
        });

        // 4.3. Create assignment record
        const assignment = await tx.eventMaterial.create({
          data: {
            materialId: parseInt(data.material_id),
            eventoId: parseInt(eventoId),
            cantidad: cantidad,
            observaciones: data.observaciones || null,
            createdBy: userId,
            createdByName: userName || null,
          },
          include: {
            material: {
              select: {
                id: true,
                nombre: true,
                categoria: true,
                stockFundacion: true,
                stockEventos: true,
                stockEventosReservado: true,
              },
            },
          },
        });

        // 4.4. NO create movement here - movement is created when event is finalized

        return assignment;
      });

      return {
        success: true,
        data: result,
        message: `Successfully reserved ${cantidad} units of "${material.nombre}" for event`,
      };
    } catch (error) {
      console.error("❌ Error assigning material to event:", error.message);

      if (
        error.message.includes("Insufficient") ||
        error.message.includes("insuficiente")
      ) {
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
   * Remove assignment (UNRESERVES stock, does NOT return to real stock)
   */
  async removeAssignment(assignmentId, userId, userName) {
    try {
      // 1. Get assignment
      const assignment = await prisma.eventMaterial.findUnique({
        where: { id: parseInt(assignmentId) },
        include: {
          material: true,
        },
      });

      if (!assignment) {
        return {
          success: false,
          statusCode: 404,
          message: "Assignment not found",
        };
      }

      // 2. Execute removal (atomic transaction) - ONLY DECREMENT RESERVED
      const result = await prisma.$transaction(async (tx) => {
        // 2.1. Decrement reserved stock (DO NOT return to real stock)
        await tx.material.update({
          where: { id: assignment.materialId },
          data: {
            stockEventosReservado: {
              decrement: assignment.cantidad,
            },
          },
        });

        // 2.2. NO create reversal movement (stock was never deducted)

        // 2.3. Delete assignment
        await tx.eventMaterial.delete({
          where: { id: parseInt(assignmentId) },
        });

        return true;
      });

      return {
        success: true,
        message: `Successfully unreserved ${assignment.cantidad} units`,
      };
    } catch (error) {
      console.error("❌ Error removing assignment:", error.message);
      throw error;
    }
  }

  /**
   * Finalize event - DEDUCT real stock and create movements (CRITICAL OPERATION)
   */
  async finalizeEvent(eventoId, userId, userName) {
    try {
      // Execute in atomic transaction
      const result = await prisma.$transaction(async (tx) => {
        // 1. Get all assignments for this event
        const assignments = await tx.eventMaterial.findMany({
          where: { eventoId: parseInt(eventoId) },
          include: {
            material: true,
          },
        });

        if (assignments.length === 0) {
          throw new Error("No materials assigned to this event");
        }

        const processedMaterials = [];

        // 2. Process each material assignment
        for (const assignment of assignments) {
          const material = assignment.material;

          // 2.1. Validate sufficient real stock
          if (material.stockEventos < assignment.cantidad) {
            throw new Error(
              `Insufficient real stock for "${material.nombre}". Available: ${material.stockEventos}, Required: ${assignment.cantidad}`,
            );
          }

          // 2.2. Calculate stock before and after
          const stockAnterior = material.stockFundacion + material.stockEventos;
          const newStockEventos = material.stockEventos - assignment.cantidad;
          const newStockReservado =
            material.stockEventosReservado - assignment.cantidad;
          const stockNuevo = material.stockFundacion + newStockEventos;

          // 2.3. Deduct REAL stock AND decrement reserved
          await tx.material.update({
            where: { id: material.id },
            data: {
              stockEventos: newStockEventos,
              stockEventosReservado: newStockReservado,
            },
          });

          // 2.4. Create movement record (NOW we create the movement)
          await tx.materialMovement.create({
            data: {
              materialId: material.id,
              materialNombre: material.nombre,
              categoria: material.categoria,
              tipoMovimiento: "SALIDA_EVENTO",
              cantidad: assignment.cantidad,
              inventarioOrigen: "EVENTOS",
              eventoId: parseInt(eventoId),
              observaciones:
                assignment.observaciones || `Event finalized - stock deducted`,
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
        message: `Event finalized successfully. ${result.length} material(s) deducted from real stock.`,
      };
    } catch (error) {
      console.error("❌ Error finalizing event:", error.message);

      if (
        error.message.includes("Insufficient") ||
        error.message.includes("No materials")
      ) {
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
    // Material
    if (!data.material_id) {
      throw new Error("Material is required");
    }

    // Quantity
    if (!data.cantidad) {
      throw new Error("Quantity is required");
    }

    const cantidad = parseInt(data.cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      throw new Error("Quantity must be a positive number");
    }

    // Observations
    if (data.observaciones && data.observaciones.length > 1000) {
      throw new Error("Observations cannot exceed 1000 characters");
    }
  }
}

export default new EventMaterialsService();

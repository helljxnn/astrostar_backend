import materialsRepository from '../repository/materials.repository.js';
import { PrismaClient } from '../../../../generated/prisma/index.js';

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
          fechaAsignacion: 'desc',
        },
      });

      return {
        success: true,
        data: materials,
      };
    } catch (error) {
      console.error('Service error - getByEvent:', error);
      throw error;
    }
  }

  /**
   * Assign material to event (IMMEDIATE DEDUCTION from stock_eventos)
   */
  async assignMaterial(eventoId, data, userId, userName) {
    try {
      console.log('🔄 Starting material assignment to event...');

      // 1. Validate data
      this.validateAssignmentData(data);

      // 2. Get material for validations
      const material = await materialsRepository.findById(data.material_id);
      if (!material) {
        return {
          success: false,
          statusCode: 404,
          message: 'Material not found',
        };
      }

      if (material.estado !== 'Activo') {
        return {
          success: false,
          statusCode: 400,
          message: 'Cannot assign inactive materials to events',
        };
      }

      // 3. Validate sufficient stock in EVENTOS inventory
      const cantidad = parseInt(data.cantidad);
      if (material.stockEventos < cantidad) {
        return {
          success: false,
          statusCode: 400,
          message: `Insufficient stock in EVENTOS inventory. Available: ${material.stockEventos}, Requested: ${cantidad}`,
        };
      }

      // 4. Execute assignment (atomic transaction)
      const result = await prisma.$transaction(async (tx) => {
        // 4.1. Deduct from stock_eventos IMMEDIATELY
        const stockAnterior = material.stockFundacion + material.stockEventos;
        const newStockEventos = material.stockEventos - cantidad;
        const stockNuevo = material.stockFundacion + newStockEventos;

        const updatedMaterial = await tx.material.update({
          where: { id: parseInt(data.material_id) },
          data: {
            stockEventos: newStockEventos,
          },
        });

        // 4.2. Create assignment record
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
              },
            },
          },
        });

        // 4.3. Create movement record
        await tx.materialMovement.create({
          data: {
            materialId: parseInt(data.material_id),
            materialNombre: material.nombre,
            categoria: material.categoria,
            tipoMovimiento: 'SALIDA_EVENTO',
            cantidad: cantidad,
            inventarioOrigen: 'EVENTOS',
            eventoId: parseInt(eventoId),
            observaciones: data.observaciones || `Material assigned to event`,
            stockAnterior: stockAnterior,
            stockNuevo: stockNuevo,
            createdBy: userId,
            createdByName: userName || null,
          },
        });

        return assignment;
      });

      console.log('✅ Material assigned to event successfully');

      return {
        success: true,
        data: result,
        message: `Successfully assigned ${cantidad} units of "${material.nombre}" to event`,
      };
    } catch (error) {
      console.error('❌ Error assigning material to event:', error.message);

      if (error.message.includes('Insufficient stock') || error.message.includes('insuficiente')) {
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
   * Remove assignment (REVERSAL - returns stock to stock_eventos)
   */
  async removeAssignment(assignmentId, userId, userName) {
    try {
      console.log('🔄 Starting assignment removal...');

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
          message: 'Assignment not found',
        };
      }

      // 2. Execute removal (atomic transaction)
      const result = await prisma.$transaction(async (tx) => {
        // 2.1. Return stock to stock_eventos
        const stockAnterior = assignment.material.stockFundacion + assignment.material.stockEventos;
        const newStockEventos = assignment.material.stockEventos + assignment.cantidad;
        const stockNuevo = assignment.material.stockFundacion + newStockEventos;

        await tx.material.update({
          where: { id: assignment.materialId },
          data: {
            stockEventos: newStockEventos,
          },
        });

        // 2.2. Create reversal movement
        await tx.materialMovement.create({
          data: {
            materialId: assignment.materialId,
            materialNombre: assignment.material.nombre,
            categoria: assignment.material.categoria,
            tipoMovimiento: 'REVERSO_SALIDA_EVENTO',
            cantidad: assignment.cantidad,
            inventarioDestino: 'EVENTOS',
            eventoId: assignment.eventoId,
            observaciones: `Reversal of event assignment`,
            stockAnterior: stockAnterior,
            stockNuevo: stockNuevo,
            createdBy: userId,
            createdByName: userName || null,
          },
        });

        // 2.3. Delete assignment
        await tx.eventMaterial.delete({
          where: { id: parseInt(assignmentId) },
        });

        return true;
      });

      console.log('✅ Assignment removed successfully');

      return {
        success: true,
        message: `Successfully removed assignment and returned ${assignment.cantidad} units to stock`,
      };
    } catch (error) {
      console.error('❌ Error removing assignment:', error.message);
      throw error;
    }
  }

  /**
   * Validate assignment data
   */
  validateAssignmentData(data) {
    // Material
    if (!data.material_id) {
      throw new Error('Material is required');
    }

    // Quantity
    if (!data.cantidad) {
      throw new Error('Quantity is required');
    }

    const cantidad = parseInt(data.cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      throw new Error('Quantity must be a positive number');
    }

    // Observations
    if (data.observaciones && data.observaciones.length > 1000) {
      throw new Error('Observations cannot exceed 1000 characters');
    }
  }
}

export default new EventMaterialsService();

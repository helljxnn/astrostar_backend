import eventAssignmentsRepository from '../repository/eventAssignments.repository.js';
import materialsRepository from '../repository/materials.repository.js';
import { PrismaClient } from '../../../../generated/prisma/index.js';

const prisma = new PrismaClient();

class EventAssignmentsService {
  /**
   * Obtener asignaciones de un evento
   */
  async getByEvento(eventoId) {
    try {
      const assignments = await eventAssignmentsRepository.findByEvento(eventoId);

      return {
        success: true,
        data: assignments,
      };
    } catch (error) {
      console.error('Service error - getByEvento:', error);
      throw error;
    }
  }

  /**
   * Obtener asignaciones de un material
   */
  async getByMaterial(materialId) {
    try {
      const assignments = await eventAssignmentsRepository.findByMaterial(materialId);

      return {
        success: true,
        data: assignments,
      };
    } catch (error) {
      console.error('Service error - getByMaterial:', error);
      throw error;
    }
  }

  /**
   * Finalizar evento (descontar materiales usados del stock)
   */
  async finalizeEvent(eventoId, data, userId) {
    try {
      // Validar datos
      if (!data.materiales || !Array.isArray(data.materiales)) {
        return {
          success: false,
          statusCode: 400,
          message: 'Debe proporcionar un array de materiales',
        };
      }

      // Transacción atómica
      const result = await prisma.$transaction(async (tx) => {
        const resultados = [];

        for (const item of data.materiales) {
          // 1. Obtener asignación
          const assignment = await tx.eventMaterialAssignment.findFirst({
            where: {
              eventoId: parseInt(eventoId),
              materialId: parseInt(item.material_id),
              estado: 'RESERVADO',
            },
            include: {
              material: true,
            },
          });

          if (!assignment) {
            throw new Error(`No se encontró asignación para material ID ${item.material_id}`);
          }

          // 2. Validar cantidades
          const cantidadUsada = parseInt(item.cantidad_usada);
          const cantidadDevuelta = parseInt(item.cantidad_devuelta);

          if (cantidadUsada + cantidadDevuelta > assignment.cantidadAsignada) {
            throw new Error(
              `Las cantidades no coinciden para "${assignment.material.nombre}". Asignado: ${assignment.cantidadAsignada}, Usado + Devuelto: ${cantidadUsada + cantidadDevuelta}`
            );
          }

          // 3. Validar stock suficiente
          if (assignment.material.stock < cantidadUsada) {
            throw new Error(
              `Stock insuficiente para "${assignment.material.nombre}". Stock: ${assignment.material.stock}, Cantidad a descontar: ${cantidadUsada}`
            );
          }

          // 4. Descontar del stock solo lo usado
          const nuevoStock = assignment.material.stock - cantidadUsada;

          await tx.material.update({
            where: { id: assignment.materialId },
            data: { stock: nuevoStock },
          });

          // 5. Actualizar asignación
          const assignmentFinalizado = await tx.eventMaterialAssignment.update({
            where: { id: assignment.id },
            data: {
              cantidadUsada,
              cantidadDevuelta,
              estado: 'USADO',
              fechaFinalizacion: new Date(),
              observaciones: item.observaciones || null,
            },
            include: {
              material: {
                select: {
                  id: true,
                  nombre: true,
                  categoria: true,
                  stock: true,
                },
              },
            },
          });

          // 6. Crear movimiento de salida por lo usado
          if (cantidadUsada > 0) {
            await tx.materialMovement.create({
              data: {
                materialId: assignment.materialId,
                materialNombre: assignment.material.nombre,
                categoria: assignment.material.categoria,
                tipoMovimiento: 'Salida',
                cantidad: cantidadUsada,
                destino: 'Evento',
                eventoId: parseInt(eventoId),
                observaciones: `Finalización de evento - Material usado`,
                stockAnterior: assignment.material.stock,
                stockNuevo: nuevoStock,
                createdBy: userId,
                createdByName: null,
              },
            });
          }

          resultados.push(assignmentFinalizado);
        }

        return resultados;
      });

      return {
        success: true,
        data: result,
        message: 'Evento finalizado exitosamente. Stock actualizado.',
      };
    } catch (error) {
      console.error('Service error - finalizeEvent:', error);

      if (error.message.includes('no coinciden') || error.message.includes('insuficiente')) {
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
   * Cancelar asignación
   */
  async cancelAssignment(id, observaciones = null) {
    try {
      const assignment = await eventAssignmentsRepository.findById(id);

      if (!assignment) {
        return {
          success: false,
          statusCode: 404,
          message: 'Asignación no encontrada',
        };
      }

      if (assignment.estado !== 'RESERVADO') {
        return {
          success: false,
          statusCode: 400,
          message: 'Solo se pueden cancelar asignaciones en estado RESERVADO',
        };
      }

      const cancelada = await eventAssignmentsRepository.cancel(id, observaciones);

      return {
        success: true,
        data: cancelada,
        message: 'Asignación cancelada exitosamente',
      };
    } catch (error) {
      console.error('Service error - cancelAssignment:', error);
      throw error;
    }
  }
}

export default new EventAssignmentsService();

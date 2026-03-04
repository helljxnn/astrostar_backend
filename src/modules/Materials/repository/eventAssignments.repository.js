import { PrismaClient } from '../../../../generated/prisma/index.js';

const prisma = new PrismaClient();

class EventAssignmentsRepository {
  /**
   * Obtener todas las asignaciones con filtros
   */
  async findAll({ eventoId = null, materialId = null, estado = null }) {
    const where = {};

    if (eventoId) {
      where.eventoId = parseInt(eventoId);
    }

    if (materialId) {
      where.materialId = parseInt(materialId);
    }

    if (estado) {
      where.estado = estado;
    }

    return await prisma.eventMaterialAssignment.findMany({
      where,
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
      orderBy: {
        fechaAsignacion: 'desc',
      },
    });
  }

  /**
   * Obtener asignación por ID
   */
  async findById(id) {
    return await prisma.eventMaterialAssignment.findUnique({
      where: { id: parseInt(id) },
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
  }

  /**
   * Obtener asignaciones de un evento
   */
  async findByEvento(eventoId) {
    return await this.findAll({ eventoId });
  }

  /**
   * Obtener asignaciones de un material
   */
  async findByMaterial(materialId) {
    return await this.findAll({ materialId });
  }

  /**
   * Crear asignación (dentro de transacción)
   */
  async create(data, userId, userName, transaction = null) {
    const prismaClient = transaction || prisma;

    return await prismaClient.eventMaterialAssignment.create({
      data: {
        materialId: parseInt(data.material_id),
        eventoId: parseInt(data.evento_id),
        cantidadAsignada: parseInt(data.cantidad_asignada),
        estado: 'RESERVADO',
        fechaAsignacion: new Date(),
        observaciones: data.observaciones || null,
        createdBy: userId,
        createdByName: userName,
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
  }

  /**
   * Finalizar asignación (marcar como usada/devuelta)
   */
  async finalize(id, data, transaction = null) {
    const prismaClient = transaction || prisma;

    return await prismaClient.eventMaterialAssignment.update({
      where: { id: parseInt(id) },
      data: {
        cantidadUsada: parseInt(data.cantidad_usada),
        cantidadDevuelta: parseInt(data.cantidad_devuelta),
        estado: 'USADO',
        fechaFinalizacion: new Date(),
        observaciones: data.observaciones || null,
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
  }

  /**
   * Cancelar asignación
   */
  async cancel(id, observaciones = null) {
    return await prisma.eventMaterialAssignment.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'CANCELADO',
        observaciones,
      },
    });
  }

  /**
   * Calcular stock reservado total de un material
   */
  async calculateReservedStock(materialId) {
    const result = await prisma.eventMaterialAssignment.aggregate({
      where: {
        materialId: parseInt(materialId),
        estado: 'RESERVADO',
      },
      _sum: {
        cantidadAsignada: true,
      },
    });

    return result._sum.cantidadAsignada || 0;
  }
}

export default new EventAssignmentsRepository();

import { PrismaClient } from '../../../../generated/prisma/index.js';

const prisma = new PrismaClient();

/**
 * Repository for Event Materials (simplified - no virtual reservations)
 * Materials assigned to events are immediately deducted from stock_eventos
 */
class EventMaterialsRepository {
  /**
   * Get all materials assigned to an event
   */
  async findByEvent(eventoId) {
    return await prisma.eventMaterial.findMany({
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
          },
        },
      },
      orderBy: {
        fechaAsignacion: 'desc',
      },
    });
  }

  /**
   * Get all materials assigned to a specific material
   */
  async findByMaterial(materialId) {
    return await prisma.eventMaterial.findMany({
      where: {
        materialId: parseInt(materialId),
      },
      orderBy: {
        fechaAsignacion: 'desc',
      },
    });
  }

  /**
   * Assign material to event (stock already deducted)
   */
  async create(data, userId, userName) {
    return await prisma.eventMaterial.create({
      data: {
        materialId: parseInt(data.material_id),
        eventoId: parseInt(data.evento_id),
        cantidad: parseInt(data.cantidad),
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
            stockFundacion: true,
            stockEventos: true,
          },
        },
      },
    });
  }

  /**
   * Remove assignment (stock will be returned)
   */
  async delete(id) {
    return await prisma.eventMaterial.delete({
      where: { id: parseInt(id) },
    });
  }

  /**
   * Get assignment by ID
   */
  async findById(id) {
    return await prisma.eventMaterial.findUnique({
      where: { id: parseInt(id) },
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
  }
}

export default new EventMaterialsRepository();

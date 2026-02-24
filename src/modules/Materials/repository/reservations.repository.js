import { PrismaClient } from '../../../../generated/prisma/index.js';

const prisma = new PrismaClient();

class ReservationsRepository {
  /**
   * Obtener todas las reservas con paginación y filtros
   */
  async findAll({ page = 1, limit = 10, materialId = null, eventoId = null, estado = null }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (materialId) {
      where.materialId = parseInt(materialId);
    }

    if (eventoId) {
      where.eventoId = parseInt(eventoId);
    }

    if (estado) {
      where.estado = estado;
    }

    const [reservations, total] = await Promise.all([
      prisma.materialReservation.findMany({
        where,
        skip,
        take: limit,
        include: {
          material: {
            select: {
              id: true,
              nombre: true,
              categoria: true,
              stockDisponible: true,
              stockEventos: true,
            },
          },
        },
        orderBy: {
          fechaReserva: 'desc',
        },
      }),
      prisma.materialReservation.count({ where }),
    ]);

    return {
      reservations,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener reserva por ID
   */
  async findById(id) {
    return await prisma.materialReservation.findUnique({
      where: { id: parseInt(id) },
      include: {
        material: {
          select: {
            id: true,
            nombre: true,
            categoria: true,
            stockDisponible: true,
            stockEventos: true,
          },
        },
      },
    });
  }

  /**
   * Obtener reservas activas de un material
   */
  async findByMaterial(materialId) {
    return await prisma.materialReservation.findMany({
      where: {
        materialId: parseInt(materialId),
        estado: {
          in: ['Pendiente', 'Confirmada'],
        },
      },
      orderBy: {
        fechaEvento: 'asc',
      },
    });
  }

  /**
   * Crear reserva
   */
  async create(data, userId, userName) {
    return await prisma.materialReservation.create({
      data: {
        materialId: parseInt(data.material_id),
        eventoId: parseInt(data.evento_id),
        cantidadReservada: parseInt(data.cantidad),
        estado: 'Pendiente',
        fechaEvento: new Date(data.fecha_evento),
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
          },
        },
      },
    });
  }

  /**
   * Confirmar reserva (transacción atómica)
   */
  async confirm(id) {
    return await prisma.$transaction(async (tx) => {
      // 1. Obtener reserva
      const reservation = await tx.materialReservation.findUnique({
        where: { id: parseInt(id) },
      });

      if (!reservation) {
        throw new Error('Reserva no encontrada');
      }

      if (reservation.estado !== 'Pendiente') {
        throw new Error('Solo se pueden confirmar reservas en estado Pendiente');
      }

      // 2. Obtener material
      const material = await tx.material.findUnique({
        where: { id: reservation.materialId },
      });

      if (!material) {
        throw new Error('Material no encontrado');
      }

      // 3. Validar stock disponible
      if (material.stockDisponible < reservation.cantidadReservada) {
        throw new Error(
          `Stock insuficiente. Stock disponible: ${material.stockDisponible}, Cantidad requerida: ${reservation.cantidadReservada}`
        );
      }

      // 4. Actualizar stock del material (disponible -> reservado)
      await tx.material.update({
        where: { id: reservation.materialId },
        data: {
          stockDisponible: material.stockDisponible - reservation.cantidadReservada,
          stockEventos: material.stockEventos + reservation.cantidadReservada,
        },
      });

      // 5. Actualizar estado de la reserva
      const reservationUpdated = await tx.materialReservation.update({
        where: { id: parseInt(id) },
        data: {
          estado: 'Confirmada',
        },
        include: {
          material: {
            select: {
              id: true,
              nombre: true,
              categoria: true,
              stockDisponible: true,
              stockEventos: true,
            },
          },
        },
      });

      return reservationUpdated;
    });
  }

  /**
   * Consumir reserva (transacción atómica)
   */
  async consume(id) {
    return await prisma.$transaction(async (tx) => {
      // 1. Obtener reserva
      const reservation = await tx.materialReservation.findUnique({
        where: { id: parseInt(id) },
        include: {
          material: true,
        },
      });

      if (!reservation) {
        throw new Error('Reserva no encontrada');
      }

      if (reservation.estado !== 'Confirmada') {
        throw new Error('Solo se pueden consumir reservas en estado Confirmada');
      }

      const material = reservation.material;
      const stockAnterior = material.stockDisponible + material.stockEventos;
      const nuevostockEventos = material.stockEventos - reservation.cantidadReservada;
      const stockNuevo = material.stockDisponible + nuevostockEventos;

      // 2. Actualizar stock del material (reducir reservado)
      await tx.material.update({
        where: { id: reservation.materialId },
        data: {
          stockEventos: nuevostockEventos,
        },
      });

      // 3. Crear movimiento de consumo
      await tx.materialMovement.create({
        data: {
          materialId: reservation.materialId,
          materialNombre: material.nombre,
          categoria: material.categoria,
          tipoMovimiento: 'Consumo',
          cantidad: reservation.cantidadReservada,
          origen: 'ConsumoInterno',
          destino: 'Evento',
          eventoId: reservation.eventoId,
          reservationId: reservation.id,
          observaciones: `Consumo por evento. ${reservation.observaciones || ''}`,
          stockAnterior: stockAnterior,
          stockNuevo: stockNuevo,
          createdBy: reservation.createdBy,
          createdByName: reservation.createdByName,
        },
      });

      // 4. Actualizar estado de la reserva
      const reservationUpdated = await tx.materialReservation.update({
        where: { id: parseInt(id) },
        data: {
          estado: 'Consumida',
        },
        include: {
          material: {
            select: {
              id: true,
              nombre: true,
              categoria: true,
              stockDisponible: true,
              stockEventos: true,
            },
          },
        },
      });

      return reservationUpdated;
    });
  }

  /**
   * Cancelar reserva (transacción atómica)
   */
  async cancel(id) {
    return await prisma.$transaction(async (tx) => {
      // 1. Obtener reserva
      const reservation = await tx.materialReservation.findUnique({
        where: { id: parseInt(id) },
      });

      if (!reservation) {
        throw new Error('Reserva no encontrada');
      }

      if (reservation.estado !== 'Confirmada') {
        throw new Error('Solo se pueden cancelar reservas en estado Confirmada');
      }

      // 2. Obtener material
      const material = await tx.material.findUnique({
        where: { id: reservation.materialId },
      });

      // 3. Actualizar stock del material (reservado -> disponible)
      await tx.material.update({
        where: { id: reservation.materialId },
        data: {
          stockDisponible: material.stockDisponible + reservation.cantidadReservada,
          stockEventos: material.stockEventos - reservation.cantidadReservada,
        },
      });

      // 4. Actualizar estado de la reserva
      const reservationUpdated = await tx.materialReservation.update({
        where: { id: parseInt(id) },
        data: {
          estado: 'Cancelada',
        },
        include: {
          material: {
            select: {
              id: true,
              nombre: true,
              categoria: true,
              stockDisponible: true,
              stockEventos: true,
            },
          },
        },
      });

      return reservationUpdated;
    });
  }
}

export default new ReservationsRepository();

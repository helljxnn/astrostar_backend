import reservationsRepository from '../repository/reservations.repository.js';
import materialsRepository from '../repository/materials.repository.js';

class ReservationsService {
  /**
   * Obtener todas las reservas con paginación
   */
  async getAll({ page = 1, limit = 10, materialId = null, eventoId = null, estado = null }) {
    try {
      const result = await reservationsRepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        materialId,
        eventoId,
        estado,
      });

      return {
        success: true,
        data: result.reservations,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.pages,
        },
      };
    } catch (error) {
      console.error('Service error - getAll:', error);
      throw error;
    }
  }

  /**
   * Obtener reserva por ID
   */
  async getById(id) {
    try {
      const reservation = await reservationsRepository.findById(id);

      if (!reservation) {
        return {
          success: false,
          statusCode: 404,
          message: 'Reserva no encontrada',
        };
      }

      return {
        success: true,
        data: reservation,
      };
    } catch (error) {
      console.error('Service error - getById:', error);
      throw error;
    }
  }

  /**
   * Obtener reservas activas de un material
   */
  async getByMaterial(materialId) {
    try {
      const reservations = await reservationsRepository.findByMaterial(materialId);

      return {
        success: true,
        data: reservations,
      };
    } catch (error) {
      console.error('Service error - getByMaterial:', error);
      throw error;
    }
  }

  /**
   * Crear reserva
   */
  async create(data, userId, userName) {
    try {
      // Validar datos
      this.validateReservationData(data);

      // Verificar que el material existe y está activo
      const material = await materialsRepository.findById(data.material_id);
      if (!material) {
        return {
          success: false,
          statusCode: 404,
          message: 'Material no encontrado',
        };
      }

      if (material.estado !== 'Activo') {
        return {
          success: false,
          statusCode: 400,
          message: 'No se pueden crear reservas para materiales inactivos',
        };
      }

      // Crear reserva
      const reservation = await reservationsRepository.create(data, userId, userName);

      return {
        success: true,
        data: reservation,
        message: `Reserva creada exitosamente para "${material.nombre}"`,
      };
    } catch (error) {
      console.error('Service error - create:', error);
      throw error;
    }
  }

  /**
   * Confirmar reserva
   */
  async confirm(id) {
    try {
      const reservation = await reservationsRepository.confirm(id);

      return {
        success: true,
        data: reservation,
        message: 'Reserva confirmada exitosamente. El stock ha sido bloqueado.',
      };
    } catch (error) {
      console.error('Service error - confirm:', error);

      // Errores específicos
      if (error.message.includes('no encontrada')) {
        return {
          success: false,
          statusCode: 404,
          message: error.message,
        };
      }

      if (error.message.includes('Stock insuficiente') || error.message.includes('estado')) {
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
   * Consumir reserva
   */
  async consume(id) {
    try {
      const reservation = await reservationsRepository.consume(id);

      return {
        success: true,
        data: reservation,
        message: 'Material consumido exitosamente. El stock ha sido reducido.',
      };
    } catch (error) {
      console.error('Service error - consume:', error);

      // Errores específicos
      if (error.message.includes('no encontrada')) {
        return {
          success: false,
          statusCode: 404,
          message: error.message,
        };
      }

      if (error.message.includes('estado')) {
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
   * Cancelar reserva
   */
  async cancel(id) {
    try {
      const reservation = await reservationsRepository.cancel(id);

      return {
        success: true,
        data: reservation,
        message: 'Reserva cancelada exitosamente. El stock ha sido liberado.',
      };
    } catch (error) {
      console.error('Service error - cancel:', error);

      // Errores específicos
      if (error.message.includes('no encontrada')) {
        return {
          success: false,
          statusCode: 404,
          message: error.message,
        };
      }

      if (error.message.includes('estado')) {
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
   * Validar datos de reserva
   */
  validateReservationData(data) {
    if (!data.material_id) {
      throw new Error('El material es obligatorio');
    }

    if (!data.evento_id) {
      throw new Error('El evento es obligatorio');
    }

    if (!data.cantidad) {
      throw new Error('La cantidad es obligatoria');
    }

    const cantidad = parseInt(data.cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      throw new Error('La cantidad debe ser un número positivo');
    }

    if (!data.fecha_evento) {
      throw new Error('La fecha del evento es obligatoria');
    }

    // Validar que la fecha del evento no sea en el pasado
    const fechaEvento = new Date(data.fecha_evento);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaEvento < hoy) {
      throw new Error('La fecha del evento no puede ser en el pasado');
    }
  }
}

export default new ReservationsService();

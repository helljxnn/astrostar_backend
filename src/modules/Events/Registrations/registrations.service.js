import { RegistrationsRepository } from './registrations.repository.js';

export class RegistrationsService {
  constructor() {
    this.registrationsRepository = new RegistrationsRepository();
  }

  /**
   * Inscribir equipo a un evento
   */
  async registerTeamToEvent(data) {
    try {
      // Validar que el evento existe
      const event = await this.registrationsRepository.checkEventExists(data.serviceId);
      if (!event) {
        return {
          success: false,
          statusCode: 404,
          message: 'El evento no existe.',
        };
      }

      // Validar que el evento no esté cancelado
      if (event.status === 'Cancelado') {
        return {
          success: false,
          statusCode: 400,
          message: 'No se puede inscribir a un evento cancelado.',
        };
      }

      // Validar que el evento no haya finalizado
      if (event.status === 'Finalizado') {
        return {
          success: false,
          statusCode: 400,
          message: 'No se puede inscribir a un evento finalizado.',
        };
      }

      // Validar que el equipo existe
      const team = await this.registrationsRepository.checkTeamExists(data.teamId);
      if (!team) {
        return {
          success: false,
          statusCode: 404,
          message: 'El equipo no existe.',
        };
      }

      // Validar que el equipo esté activo
      if (team.status !== 'Active') {
        return {
          success: false,
          statusCode: 400,
          message: `No se puede inscribir un equipo con estado ${team.status}.`,
        };
      }

      // Verificar si el equipo ya está inscrito
      const existingRegistration = await this.registrationsRepository.checkTeamRegistration(
        data.serviceId,
        data.teamId
      );

      if (existingRegistration) {
        return {
          success: false,
          statusCode: 400,
          message: `El equipo "${team.name}" ya está inscrito en el evento "${event.name}".`,
        };
      }

      // Crear la inscripción
      const registration = await this.registrationsRepository.registerTeamToEvent(data);

      return {
        success: true,
        data: registration,
        message: `El equipo "${team.name}" ha sido inscrito exitosamente al evento "${event.name}".`,
      };
    } catch (error) {
      console.error('Error in registerTeamToEvent service:', error);
      throw error;
    }
  }

  /**
   * Obtener inscripciones de un evento
   */
  async getEventRegistrations(serviceId, filters = {}) {
    try {
      // Validar que el evento existe
      const event = await this.registrationsRepository.checkEventExists(serviceId);
      if (!event) {
        return {
          success: false,
          statusCode: 404,
          message: 'El evento no existe.',
        };
      }

      const registrations = await this.registrationsRepository.getEventRegistrations(
        serviceId,
        filters
      );

      return {
        success: true,
        data: {
          event: {
            id: event.id,
            name: event.name,
            status: event.status,
          },
          registrations,
          total: registrations.length,
        },
      };
    } catch (error) {
      console.error('Error in getEventRegistrations service:', error);
      throw error;
    }
  }

  /**
   * Obtener inscripciones de un equipo
   */
  async getTeamRegistrations(teamId, filters = {}) {
    try {
      // Validar que el equipo existe
      const team = await this.registrationsRepository.checkTeamExists(teamId);
      if (!team) {
        return {
          success: false,
          statusCode: 404,
          message: 'El equipo no existe.',
        };
      }

      const registrations = await this.registrationsRepository.getTeamRegistrations(
        teamId,
        filters
      );

      return {
        success: true,
        data: {
          team: {
            id: team.id,
            name: team.name,
            status: team.status,
          },
          registrations,
          total: registrations.length,
        },
      };
    } catch (error) {
      console.error('Error in getTeamRegistrations service:', error);
      throw error;
    }
  }

  /**
   * Obtener inscripción por ID
   */
  async getRegistrationById(id) {
    try {
      const registration = await this.registrationsRepository.getRegistrationById(id);

      if (!registration) {
        return {
          success: false,
          statusCode: 404,
          message: 'Inscripción no encontrada.',
        };
      }

      return {
        success: true,
        data: registration,
      };
    } catch (error) {
      console.error('Error in getRegistrationById service:', error);
      throw error;
    }
  }

  /**
   * Actualizar estado de inscripción
   */
  async updateRegistrationStatus(id, status, notes = null) {
    try {
      // Validar que la inscripción existe
      const existingRegistration = await this.registrationsRepository.getRegistrationById(id);
      if (!existingRegistration) {
        return {
          success: false,
          statusCode: 404,
          message: 'Inscripción no encontrada.',
        };
      }

      // Validar estados válidos
      const validStatuses = ['Registered', 'Confirmed', 'Cancelled', 'Attended'];
      if (!validStatuses.includes(status)) {
        return {
          success: false,
          statusCode: 400,
          message: `Estado inválido. Estados válidos: ${validStatuses.join(', ')}`,
        };
      }

      const updatedRegistration = await this.registrationsRepository.updateRegistrationStatus(
        id,
        status,
        notes
      );

      return {
        success: true,
        data: updatedRegistration,
        message: `Estado de inscripción actualizado a "${status}".`,
      };
    } catch (error) {
      console.error('Error in updateRegistrationStatus service:', error);
      throw error;
    }
  }

  /**
   * Cancelar inscripción
   */
  async cancelRegistration(id) {
    try {
      // Validar que la inscripción existe
      const existingRegistration = await this.registrationsRepository.getRegistrationById(id);
      if (!existingRegistration) {
        return {
          success: false,
          statusCode: 404,
          message: 'Inscripción no encontrada.',
        };
      }

      await this.registrationsRepository.cancelRegistration(id);

      return {
        success: true,
        message: `La inscripción del equipo "${existingRegistration.team.name}" al evento "${existingRegistration.service.name}" ha sido cancelada.`,
      };
    } catch (error) {
      console.error('Error in cancelRegistration service:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de inscripciones
   */
  async getRegistrationStats() {
    try {
      const stats = await this.registrationsRepository.getRegistrationStats();

      // Formatear estadísticas por estado
      const statusStats = {
        Registered: 0,
        Confirmed: 0,
        Cancelled: 0,
        Attended: 0,
      };

      stats.byStatus.forEach((item) => {
        statusStats[item.status] = item._count;
      });

      return {
        success: true,
        data: {
          total: stats.total,
          byStatus: statusStats,
          topEvents: stats.byEvent,
        },
      };
    } catch (error) {
      console.error('Error in getRegistrationStats service:', error);
      throw error;
    }
  }
}

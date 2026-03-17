import { RegistrationsRepository } from "./registrations.repository.js";
import { RSVPService } from "../RSVP/rsvp.service.js";

export class RegistrationsService {
  constructor() {
    this.registrationsRepository = new RegistrationsRepository();
    this.rsvpService = new RSVPService();
  }

  /**
   * Inscribir equipo a un evento
   */
  async registerTeamToEvent(data) {
    try {
      // Validar que el evento existe
      const event = await this.registrationsRepository.checkEventExists(
        data.serviceId,
      );
      if (!event) {
        return {
          success: false,
          statusCode: 404,
          message: "El evento no existe.",
        };
      }

      // Validar que el evento no esté cancelado
      if (event.status === "Cancelado") {
        return {
          success: false,
          statusCode: 400,
          message: "No se puede inscribir a un evento cancelado.",
        };
      }

      // Validar que el evento no haya finalizado
      if (event.status === "Finalizado") {
        return {
          success: false,
          statusCode: 400,
          message: "No se puede inscribir a un evento finalizado.",
        };
      }

      // Validar que el equipo existe
      const team = await this.registrationsRepository.checkTeamExists(
        data.teamId,
      );
      if (!team) {
        return {
          success: false,
          statusCode: 404,
          message: "El equipo no existe.",
        };
      }

      // Validar que el equipo esté activo
      if (team.status !== "Active") {
        return {
          success: false,
          statusCode: 400,
          message: `No se puede inscribir un equipo con estado ${team.status}.`,
        };
      }

      // VALIDACIÓN DE CATEGORÍA: Verificar que el equipo pertenezca a una categoría del evento
      const eventCategories =
        await this.registrationsRepository.getEventCategories(data.serviceId);

      let sportsCategoryId = data.sportsCategoryId || null;

      if (eventCategories && eventCategories.length > 0 && team.category) {
        const teamCategoryMatch = eventCategories.find(
          (cat) => cat.nombre.toLowerCase() === team.category.toLowerCase(),
        );

        if (!teamCategoryMatch) {
          const categoryNames = eventCategories
            .map((cat) => cat.nombre)
            .join(", ");
          return {
            success: false,
            statusCode: 400,
            message: `El equipo "${team.name}" pertenece a la categoría "${team.category}" que no está permitida en este evento. Categorías permitidas: ${categoryNames}.`,
          };
        }

        // Asignar automáticamente el sportsCategoryId si no se proporcionó
        if (!sportsCategoryId) {
          sportsCategoryId = teamCategoryMatch.id;
        }
      }

      // Verificar si el equipo ya está inscrito
      const existingRegistration =
        await this.registrationsRepository.checkTeamRegistration(
          data.serviceId,
          data.teamId,
        );

      if (existingRegistration) {
        return {
          success: false,
          statusCode: 400,
          message: `El equipo "${team.name}" ya está inscrito en el evento "${event.name}".`,
        };
      }

      // Crear la inscripción con el sportsCategoryId correcto
      const registration =
        await this.registrationsRepository.registerTeamToEvent({
          ...data,
          sportsCategoryId,
        });

      // Enviar invitación RSVP
      try {
        const rsvpResult = await this.rsvpService.createAndSendInvitation(
          registration.id,
        );
        if (!rsvpResult.success) {
          console.warn(
            `⚠️  No se pudo enviar invitación RSVP: ${rsvpResult.message}`,
          );
        }
      } catch (rsvpError) {
        console.error("❌ Error enviando invitación RSVP:", rsvpError.message);
        // No fallar la inscripción si el email falla
      }

      return {
        success: true,
        data: registration,
        message: `El equipo "${team.name}" ha sido inscrito exitosamente al evento "${event.name}".`,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener inscripciones de un evento
   */
  async getEventRegistrations(serviceId, filters = {}) {
    try {
      // Validar que el evento existe
      const event =
        await this.registrationsRepository.checkEventExists(serviceId);
      if (!event) {
        return {
          success: false,
          statusCode: 404,
          message: "El evento no existe.",
        };
      }

      const registrations =
        await this.registrationsRepository.getEventRegistrations(
          serviceId,
          filters,
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
          message: "El equipo no existe.",
        };
      }

      const registrations =
        await this.registrationsRepository.getTeamRegistrations(
          teamId,
          filters,
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
      throw error;
    }
  }

  /**
   * Obtener inscripción por ID
   */
  async getRegistrationById(id) {
    try {
      const registration =
        await this.registrationsRepository.getRegistrationById(id);

      if (!registration) {
        return {
          success: false,
          statusCode: 404,
          message: "Inscripción no encontrada.",
        };
      }

      return {
        success: true,
        data: registration,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar estado de inscripción
   */
  async updateRegistrationStatus(id, status, notes = null) {
    try {
      // Validar que la inscripción existe
      const existingRegistration =
        await this.registrationsRepository.getRegistrationById(id);
      if (!existingRegistration) {
        return {
          success: false,
          statusCode: 404,
          message: "Inscripción no encontrada.",
        };
      }

      // Validar estados válidos
      const validStatuses = [
        "Registered",
        "Confirmed",
        "Cancelled",
        "Attended",
      ];
      if (!validStatuses.includes(status)) {
        return {
          success: false,
          statusCode: 400,
          message: `Estado inválido. Estados válidos: ${validStatuses.join(", ")}`,
        };
      }

      const updatedRegistration =
        await this.registrationsRepository.updateRegistrationStatus(
          id,
          status,
          notes,
        );

      return {
        success: true,
        data: updatedRegistration,
        message: `Estado de inscripción actualizado a "${status}".`,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancelar inscripción
   */
  async cancelRegistration(id) {
    try {
      // Validar que la inscripción existe
      const existingRegistration =
        await this.registrationsRepository.getRegistrationById(id);

      if (!existingRegistration) {
        return {
          success: false,
          statusCode: 404,
          message: "Inscripción no encontrada.",
        };
      }

      await this.registrationsRepository.cancelRegistration(id);

      // Construir mensaje con validación de datos
      const teamName = existingRegistration.team?.name || "Equipo desconocido";
      const eventName =
        existingRegistration.service?.name || "Evento desconocido";

      return {
        success: true,
        message: `La inscripción del equipo "${teamName}" al evento "${eventName}" ha sido cancelada.`,
      };
    } catch (error) {
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
      throw error;
    }
  }

  /**
   * Obtener equipos disponibles para inscripción (separados por tipo)
   */
  async getAvailableTeams(filters = {}) {
    try {
      const teams =
        await this.registrationsRepository.getAvailableTeams(filters);

      // Separar equipos por tipo
      const foundationTeams = teams.filter(
        (team) => team.teamType === "Fundacion",
      );
      const temporaryTeams = teams.filter(
        (team) => team.teamType === "Temporal",
      );

      return {
        success: true,
        data: {
          foundation: foundationTeams,
          temporary: temporaryTeams,
          total: teams.length,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Inscribir múltiples equipos a un evento
   */
  async registerMultipleTeams(data) {
    try {
      const { serviceId, teamIds, notes } = data;

      // Validar que el evento existe
      const event =
        await this.registrationsRepository.checkEventExists(serviceId);
      if (!event) {
        return {
          success: false,
          statusCode: 404,
          message: "El evento no existe.",
        };
      }

      // Validar que el evento no esté cancelado o finalizado
      if (event.status === "Cancelado") {
        return {
          success: false,
          statusCode: 400,
          message: "No se puede inscribir a un evento cancelado.",
        };
      }

      if (event.status === "Finalizado") {
        return {
          success: false,
          statusCode: 400,
          message: "No se puede inscribir a un evento finalizado.",
        };
      }

      // Obtener categorías del evento una sola vez
      const eventCategories =
        await this.registrationsRepository.getEventCategories(serviceId);

      // Inscribir cada equipo
      const results = [];
      const errors = [];

      for (const teamId of teamIds) {
        try {
          // Validar que el equipo existe
          const team =
            await this.registrationsRepository.checkTeamExists(teamId);
          if (!team) {
            errors.push({
              teamId,
              error: "El equipo no existe.",
            });
            continue;
          }

          // Validar que el equipo esté activo
          if (team.status !== "Active") {
            errors.push({
              teamId,
              teamName: team.name,
              error: `El equipo no está activo (estado: ${team.status}).`,
            });
            continue;
          }

          // VALIDACIÓN DE CATEGORÍA: Verificar que el equipo pertenezca a una categoría del evento
          let sportsCategoryId = null;

          if (eventCategories && eventCategories.length > 0 && team.category) {
            const teamCategoryMatch = eventCategories.find(
              (cat) => cat.nombre.toLowerCase() === team.category.toLowerCase(),
            );

            if (!teamCategoryMatch) {
              const categoryNames = eventCategories
                .map((cat) => cat.nombre)
                .join(", ");
              errors.push({
                teamId,
                teamName: team.name,
                error: `El equipo pertenece a la categoría "${team.category}" que no está permitida en este evento. Categorías permitidas: ${categoryNames}.`,
              });
              continue;
            }

            // Asignar el sportsCategoryId correcto
            sportsCategoryId = teamCategoryMatch.id;
          }

          // Verificar si el equipo ya está inscrito
          const existingRegistration =
            await this.registrationsRepository.checkTeamRegistration(
              serviceId,
              teamId,
            );

          if (existingRegistration) {
            errors.push({
              teamId,
              teamName: team.name,
              error: "El equipo ya está inscrito en este evento.",
            });
            continue;
          }

          // Crear la inscripción con el sportsCategoryId correcto
          const registration =
            await this.registrationsRepository.createRegistration({
              serviceId,
              teamId,
              sportsCategoryId,
              notes,
              status: "Registered",
            });

          // Enviar invitación RSVP
          try {
            const rsvpResult = await this.rsvpService.createAndSendInvitation(
              registration.id,
            );
            if (!rsvpResult.success) {
              console.warn(
                `⚠️  No se pudo enviar invitación RSVP para equipo ${teamId}: ${rsvpResult.message}`,
              );
            }
          } catch (rsvpError) {
            console.error(
              `❌ Error enviando invitación RSVP para equipo ${teamId}:`,
              rsvpError.message,
            );
            // No fallar la inscripción si el email falla
          }

          results.push(registration);
        } catch (error) {
          errors.push({
            teamId,
            error: error.message,
          });
        }
      }

      return {
        success: true,
        data: {
          registered: results,
          errors: errors.length > 0 ? errors : undefined,
          total: teamIds.length,
          successful: results.length,
          failed: errors.length,
        },
        message: `Se inscribieron ${results.length} de ${teamIds.length} equipos exitosamente.`,
      };
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // MÉTODOS PARA INSCRIPCIÓN DE DEPORTISTAS
  // ============================================

  /**
   * Inscribir deportista individual a un evento
   */
  async registerAthleteToEvent(data) {
    try {
      // Validar que el evento existe
      const event = await this.registrationsRepository.checkEventExists(
        data.serviceId,
      );
      if (!event) {
        return {
          success: false,
          statusCode: 404,
          message: "El evento no existe.",
        };
      }

      // Validar que el evento no esté cancelado
      if (event.status === "Cancelado") {
        return {
          success: false,
          statusCode: 400,
          message: "No se puede inscribir a un evento cancelado.",
        };
      }

      // Validar que el evento no haya finalizado
      if (event.status === "Finalizado") {
        return {
          success: false,
          statusCode: 400,
          message: "No se puede inscribir a un evento finalizado.",
        };
      }

      // Validar que el deportista existe
      const athlete = await this.registrationsRepository.checkAthleteExists(
        data.athleteId,
      );
      if (!athlete) {
        return {
          success: false,
          statusCode: 404,
          message: "El deportista no existe.",
        };
      }

      // Validar que el deportista esté activo
      if (athlete.status !== "Active") {
        return {
          success: false,
          statusCode: 400,
          message: `No se puede inscribir un deportista con estado ${athlete.status}.`,
        };
      }

      // VALIDACIÓN DE CATEGORÍA: Verificar que el deportista tenga una inscripción activa en una categoría del evento
      let sportsCategoryId = data.sportsCategoryId || null;

      const eventCategories =
        await this.registrationsRepository.getEventCategories(data.serviceId);
      if (eventCategories && eventCategories.length > 0) {
        const athleteInscriptions =
          await this.registrationsRepository.getAthleteActiveInscriptions(
            data.athleteId,
          );

        if (!athleteInscriptions || athleteInscriptions.length === 0) {
          const categoryNames = eventCategories
            .map((cat) => cat.nombre)
            .join(", ");
          const athleteName = `${athlete.user.firstName} ${athlete.user.lastName}`;
          return {
            success: false,
            statusCode: 400,
            message: `El deportista "${athleteName}" no tiene inscripciones activas en ninguna categoría deportiva. Categorías requeridas para este evento: ${categoryNames}.`,
          };
        }

        const athleteCategoryIds = athleteInscriptions.map(
          (insc) => insc.sportsCategoryId,
        );
        const eventCategoryIds = eventCategories.map((cat) => cat.id);

        const matchingCategoryIds = athleteCategoryIds.filter((catId) =>
          eventCategoryIds.includes(catId),
        );

        if (matchingCategoryIds.length === 0) {
          const athleteCategories = athleteInscriptions
            .map((insc) => insc.sportsCategory.nombre)
            .join(", ");
          const eventCategoryNames = eventCategories
            .map((cat) => cat.nombre)
            .join(", ");
          const athleteName = `${athlete.user.firstName} ${athlete.user.lastName}`;
          return {
            success: false,
            statusCode: 400,
            message: `El deportista "${athleteName}" está inscrito en las categorías: ${athleteCategories}, pero el evento requiere: ${eventCategoryNames}.`,
          };
        }

        // Asignar automáticamente el sportsCategoryId si no se proporcionó
        // Usar la primera categoría coincidente
        if (!sportsCategoryId) {
          sportsCategoryId = matchingCategoryIds[0];
        }
      }

      // Verificar si el deportista ya está inscrito
      const existingRegistration =
        await this.registrationsRepository.checkAthleteRegistration(
          data.serviceId,
          data.athleteId,
        );

      if (existingRegistration) {
        const athleteName = `${athlete.user.firstName} ${athlete.user.lastName}`;
        return {
          success: false,
          statusCode: 400,
          message: `El deportista "${athleteName}" ya está inscrito en el evento "${event.name}".`,
        };
      }

      // Crear la inscripción con el sportsCategoryId correcto
      const registration =
        await this.registrationsRepository.registerAthleteToEvent({
          ...data,
          sportsCategoryId,
        });

      // Enviar invitación RSVP
      try {
        const rsvpResult = await this.rsvpService.createAndSendInvitation(
          registration.id,
        );
        if (!rsvpResult.success) {
          console.warn(
            `⚠️  No se pudo enviar invitación RSVP: ${rsvpResult.message}`,
          );
        }
      } catch (rsvpError) {
        console.error("❌ Error enviando invitación RSVP:", rsvpError.message);
        // No fallar la inscripción si el email falla
      }

      const athleteName = `${athlete.user.firstName} ${athlete.user.lastName}`;
      return {
        success: true,
        data: registration,
        message: `El deportista "${athleteName}" ha sido inscrito exitosamente al evento "${event.name}".`,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener inscripciones individuales de un evento
   */
  async getEventAthleteRegistrations(serviceId, filters = {}) {
    try {
      // Validar que el evento existe
      const event =
        await this.registrationsRepository.checkEventExists(serviceId);
      if (!event) {
        return {
          success: false,
          statusCode: 404,
          message: "El evento no existe.",
        };
      }

      const registrations =
        await this.registrationsRepository.getEventAthleteRegistrations(
          serviceId,
          filters,
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
      throw error;
    }
  }

  /**
   * Obtener inscripciones de un deportista
   */
  async getAthleteRegistrations(athleteId, filters = {}) {
    try {
      // Validar que el deportista existe
      const athlete =
        await this.registrationsRepository.checkAthleteExists(athleteId);
      if (!athlete) {
        return {
          success: false,
          statusCode: 404,
          message: "El deportista no existe.",
        };
      }

      const registrations =
        await this.registrationsRepository.getAthleteRegistrations(
          athleteId,
          filters,
        );

      const athleteName = `${athlete.user.firstName} ${athlete.user.lastName}`;
      return {
        success: true,
        data: {
          athlete: {
            id: athlete.id,
            name: athleteName,
            status: athlete.status,
          },
          registrations,
          total: registrations.length,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener deportistas disponibles para inscripción
   */
  async getAvailableAthletes(filters = {}) {
    try {
      const athletes =
        await this.registrationsRepository.getAvailableAthletes(filters);

      return {
        success: true,
        data: {
          athletes,
          total: athletes.length,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Inscribir múltiples deportistas a un evento
   */
  async registerMultipleAthletes(data) {
    try {
      const { serviceId, athleteIds, notes } = data;

      // Validar que el evento existe
      const event =
        await this.registrationsRepository.checkEventExists(serviceId);
      if (!event) {
        return {
          success: false,
          statusCode: 404,
          message: "El evento no existe.",
        };
      }

      // Validar que el evento no esté cancelado o finalizado
      if (event.status === "Cancelado") {
        return {
          success: false,
          statusCode: 400,
          message: "No se puede inscribir a un evento cancelado.",
        };
      }

      if (event.status === "Finalizado") {
        return {
          success: false,
          statusCode: 400,
          message: "No se puede inscribir a un evento finalizado.",
        };
      }

      // Obtener categorías del evento una sola vez
      const eventCategories =
        await this.registrationsRepository.getEventCategories(serviceId);

      // Inscribir cada deportista
      const results = [];
      const errors = [];

      for (const athleteId of athleteIds) {
        try {
          // Validar que el deportista existe
          const athlete =
            await this.registrationsRepository.checkAthleteExists(athleteId);
          if (!athlete) {
            errors.push({
              athleteId,
              error: "El deportista no existe.",
            });
            continue;
          }

          // Validar que el deportista esté activo
          if (athlete.status !== "Active") {
            const athleteName = `${athlete.user.firstName} ${athlete.user.lastName}`;
            errors.push({
              athleteId,
              athleteName,
              error: `El deportista no está activo (estado: ${athlete.status}).`,
            });
            continue;
          }

          // VALIDACIÓN DE CATEGORÍA: Verificar que el deportista tenga una inscripción activa en una categoría del evento
          if (eventCategories && eventCategories.length > 0) {
            const athleteInscriptions =
              await this.registrationsRepository.getAthleteActiveInscriptions(
                athleteId,
              );
            const athleteName = `${athlete.user.firstName} ${athlete.user.lastName}`;

            if (!athleteInscriptions || athleteInscriptions.length === 0) {
              const categoryNames = eventCategories
                .map((cat) => cat.nombre)
                .join(", ");
              errors.push({
                athleteId,
                athleteName,
                error: `El deportista no tiene inscripciones activas en ninguna categoría deportiva. Categorías requeridas: ${categoryNames}.`,
              });
              continue;
            }

            const athleteCategoryIds = athleteInscriptions.map(
              (insc) => insc.sportsCategoryId,
            );
            const eventCategoryIds = eventCategories.map((cat) => cat.id);

            const hasMatchingCategory = athleteCategoryIds.some((catId) =>
              eventCategoryIds.includes(catId),
            );

            if (!hasMatchingCategory) {
              const athleteCategories = athleteInscriptions
                .map((insc) => insc.sportsCategory.nombre)
                .join(", ");
              const eventCategoryNames = eventCategories
                .map((cat) => cat.nombre)
                .join(", ");
              errors.push({
                athleteId,
                athleteName,
                error: `El deportista está inscrito en las categorías: ${athleteCategories}, pero el evento requiere: ${eventCategoryNames}.`,
              });
              continue;
            }
          }

          // Verificar si el deportista ya está inscrito
          const existingRegistration =
            await this.registrationsRepository.checkAthleteRegistration(
              serviceId,
              athleteId,
            );

          if (existingRegistration) {
            const athleteName = `${athlete.user.firstName} ${athlete.user.lastName}`;
            errors.push({
              athleteId,
              athleteName,
              error: "El deportista ya está inscrito en este evento.",
            });
            continue;
          }

          // Crear la inscripción
          const registration =
            await this.registrationsRepository.createAthleteRegistration({
              serviceId,
              athleteId,
              notes,
              status: "Registered",
            });

          // Enviar invitación RSVP
          try {
            const rsvpResult = await this.rsvpService.createAndSendInvitation(
              registration.id,
            );
            if (!rsvpResult.success) {
              console.warn(
                `⚠️  No se pudo enviar invitación RSVP para deportista ${athleteId}: ${rsvpResult.message}`,
              );
            }
          } catch (rsvpError) {
            console.error(
              `❌ Error enviando invitación RSVP para deportista ${athleteId}:`,
              rsvpError.message,
            );
            // No fallar la inscripción si el email falla
          }

          results.push(registration);
        } catch (error) {
          errors.push({
            athleteId,
            error: error.message,
          });
        }
      }

      return {
        success: true,
        data: {
          registered: results,
          errors: errors.length > 0 ? errors : undefined,
          total: athleteIds.length,
          successful: results.length,
          failed: errors.length,
        },
        message: `Se inscribieron ${results.length} de ${athleteIds.length} deportistas exitosamente.`,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener equipos disponibles filtrados por categorías del evento (optimizado)
   */
  async getTeamsByEventCategories(serviceId) {
    try {
      // Validar que el evento existe
      const event =
        await this.registrationsRepository.checkEventExists(serviceId);
      if (!event) {
        return {
          success: false,
          statusCode: 404,
          message: "El evento no existe.",
        };
      }

      const teams =
        await this.registrationsRepository.getTeamsByEventCategories(serviceId);

      // Separar equipos por tipo
      const foundationTeams = teams.filter(
        (team) => team.teamType === "Fundacion",
      );
      const temporaryTeams = teams.filter(
        (team) => team.teamType === "Temporal",
      );

      return {
        success: true,
        data: {
          foundation: foundationTeams,
          temporary: temporaryTeams,
          total: teams.length,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener deportistas disponibles filtrados por categorías del evento
   */
  async getAthletesByEventCategories(serviceId) {
    try {
      // Validar que el evento existe
      const event =
        await this.registrationsRepository.checkEventExists(serviceId);
      if (!event) {
        return {
          success: false,
          statusCode: 404,
          message: "El evento no existe.",
        };
      }

      const athletes =
        await this.registrationsRepository.getAthletesByEventCategories(
          serviceId,
        );

      return {
        success: true,
        data: {
          athletes,
          total: athletes.length,
        },
        message: "Deportistas obtenidos exitosamente.",
      };
    } catch (error) {
      throw error;
    }
  }
}


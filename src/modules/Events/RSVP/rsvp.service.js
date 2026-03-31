import { RSVPRepository } from "./rsvp.repository.js";
import eventEmailService from "../services/EventEmailService.js";
import { generateRSVPToken } from "../../../utils/tokenGenerator.js";
import { generateICS } from "../../../utils/icsGenerator.js";
import prisma from "../../../config/database.js";

export class RSVPService {
  constructor() {
    this.rsvpRepository = new RSVPRepository();
  }

  /**
   * Crear y enviar invitación RSVP
   */
  async createAndSendInvitation(participantId) {
    try {
      // Obtener datos del participante
      const participant = await prisma.participant.findUnique({
        where: { id: participantId },
        include: {
          service: true,
          athlete: { include: { user: true, guardian: true } },
          team: {
            include: {
              members: {
                where: {
                  employeeId: { not: null },
                  isActive: true,
                },
                include: {
                  employee: { include: { user: true } },
                },
              },
            },
          },
        },
      });

      if (!participant) {
        return {
          success: false,
          statusCode: 404,
          message: "Participante no encontrado",
        };
      }

      // Determinar tipo de invitación y destinatario
      let recipientEmail, recipientName, invitationType;

      if (participant.type === "Individual") {
        // Deportista individual
        invitationType = "INDIVIDUAL";
        recipientEmail = participant.athlete.user.email;
        recipientName = `${participant.athlete.user.firstName} ${participant.athlete.user.lastName}`;
      } else if (participant.type === "Team") {
        // Equipo - buscar entrenador
        invitationType = "TEAM";
        const coach = participant.team.members.find((m) => m.employeeId);

        if (!coach) {
          return {
            success: false,
            statusCode: 400,
            message: "El equipo no tiene un entrenador asignado",
          };
        }

        recipientEmail = coach.employee.user.email;
        recipientName = `${coach.employee.user.firstName} ${coach.employee.user.lastName}`;
      } else {
        return {
          success: false,
          statusCode: 400,
          message: "Tipo de participante no válido",
        };
      }

      // Calcular fecha de expiración (24h antes del evento)
      const eventStart = new Date(participant.service.startDate);
      const expiresAt = new Date(eventStart.getTime() - 24 * 60 * 60 * 1000);

      // Generar token seguro
      const token = generateRSVPToken();

      // Crear invitación
      const invitation = await this.rsvpRepository.createInvitation({
        participantId,
        token,
        status: "PENDING",
        invitationType,
        recipientEmail,
        recipientName,
        expiresAt,
      });

      // Generar archivo .ics
      const icsContent = generateICS(participant.service, invitation);

      // Enviar email
      const emailResult = await eventEmailService.sendRSVPInvitation(
        invitation,
        participant.service,
        participant,
        icsContent,
      );

      if (!emailResult.success) {
        console.error("Error enviando email RSVP:", emailResult.error);
      }

      return {
        success: true,
        data: {
          invitationId: invitation.id,
          token: invitation.token,
          recipientEmail: invitation.recipientEmail,
          expiresAt: invitation.expiresAt,
        },
        message: "Invitación creada y enviada exitosamente",
      };
    } catch (error) {
      console.error("Error en createAndSendInvitation:", error);
      throw error;
    }
  }

  /**
   * Procesar respuesta RSVP (confirmar/declinar)
   */
  async processRSVPResponse(token, action) {
    try {
      // Validar token
      const invitation = await this.rsvpRepository.findByToken(token);

      if (!invitation) {
        return {
          success: false,
          statusCode: 404,
          error: "Token inválido",
          message:
            "El enlace que utilizaste no es válido. Por favor verifica el correo original.",
        };
      }

      // Verificar expiración
      if (new Date() > invitation.expiresAt) {
        return {
          success: false,
          statusCode: 400,
          error: "Token expirado",
          message:
            "Este enlace ha expirado. El evento ya pasó o está muy próximo.",
        };
      }

      // Determinar nuevo estado
      const newStatus = action === "confirm" ? "CONFIRMED" : "DECLINED";

      // Permitir idempotencia - si ya respondió lo mismo, mostrar mensaje de éxito
      if (invitation.status === newStatus) {
        return {
          success: true,
          alreadyProcessed: true,
          data: {
            status: invitation.status,
            event: invitation.participant.service,
          },
          message:
            newStatus === "CONFIRMED"
              ? "Tu asistencia ya fue confirmada anteriormente. ¡Te esperamos en el evento!"
              : "Ya habías indicado que no podrás asistir.",
        };
      }

      // No permitir cambio de estado una vez respondido (de CONFIRMED a DECLINED o viceversa)
      if (invitation.status !== "PENDING") {
        return {
          success: false,
          statusCode: 400,
          error: "Ya respondido",
          message: `Esta invitación ya fue respondida como "${invitation.status === "CONFIRMED" ? "Confirmo asistencia" : "No podré asistir"}". Si necesitas cambiar tu respuesta, contacta a la organización.`,
        };
      }

      // Actualizar estado
      const updatedInvitation = await this.rsvpRepository.updateStatus(
        invitation.id,
        newStatus,
      );

      return {
        success: true,
        data: {
          status: updatedInvitation.status,
          event: updatedInvitation.participant.service,
        },
        message:
          action === "confirm"
            ? "¡Asistencia confirmada! Te esperamos en el evento."
            : "Hemos registrado que no podrás asistir. Esperamos verte en futuros eventos.",
      };
    } catch (error) {
      console.error("Error en processRSVPResponse:", error);
      throw error;
    }
  }

  /**
   * Obtener estado de invitación
   */
  async getInvitationStatus(token) {
    try {
      const invitation = await this.rsvpRepository.findByToken(token);

      if (!invitation) {
        return {
          success: false,
          statusCode: 404,
          message: "Invitación no encontrada",
        };
      }

      return {
        success: true,
        data: {
          status: invitation.status,
          eventName: invitation.participant.service.name,
          eventDate: invitation.participant.service.startDate,
          respondedAt: invitation.respondedAt,
        },
      };
    } catch (error) {
      console.error("Error en getInvitationStatus:", error);
      throw error;
    }
  }

  /**
   * Reenviar invitación
   */
  async resendInvitation(invitationId) {
    try {
      const parsedInvitationId = Number.parseInt(invitationId, 10);

      if (!Number.isInteger(parsedInvitationId) || parsedInvitationId <= 0) {
        return {
          success: false,
          statusCode: 400,
          message: "invitationId invalido",
        };
      }

      const invitation = await this.rsvpRepository.findById(parsedInvitationId);

      if (!invitation) {
        return {
          success: false,
          statusCode: 404,
          message: "Invitación no encontrada",
        };
      }

      // Generar archivo .ics
      const icsContent = generateICS(
        invitation.participant.service,
        invitation,
      );

      // Reenviar email
      const emailResult = await eventEmailService.sendRSVPInvitation(
        invitation,
        invitation.participant.service,
        invitation.participant,
        icsContent,
      );

      if (!emailResult.success) {
        return {
          success: false,
          statusCode: 500,
          message: "Error al reenviar el email",
        };
      }

      return {
        success: true,
        message: "Invitación reenviada exitosamente",
      };
    } catch (error) {
      console.error("Error en resendInvitation:", error);
      throw error;
    }
  }
}

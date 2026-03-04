/**
 * Servicio de Email para Eventos - AstroStar
 * Maneja todos los emails relacionados con eventos
 */

import { BaseEmailService } from "../../../services/email/BaseEmailService.js";

export class EventEmailService extends BaseEmailService {
  /**
   * Enviar invitación RSVP para evento
   */
  async sendRSVPInvitation(invitation, event, participant, icsContent) {
    try {
      const ready = await this.ensureTransporter();
      if (!ready.ok) {
        console.warn("⚠️  Invitación RSVP no enviada:", ready.reason);
        if (this.shouldSimulate()) {
          return {
            success: true,
            messageId: "simulated-" + Date.now(),
            simulated: true,
          };
        }
        return { success: false, error: ready.reason };
      }

      const { getRSVPInvitationHTML } =
        await import("../../../templates/rsvpInvitationTemplate.js");
      const { formatEventDate, formatEventTime } =
        await import("../../../utils/dateFormatter.js");

      const baseUrl =
        process.env.BACKEND_URL ||
        process.env.FRONTEND_URL ||
        "http://localhost:4000";
      const confirmUrl = `${baseUrl}/api/rsvp?token=${invitation.token}&action=confirm`;
      const declineUrl = `${baseUrl}/api/rsvp?token=${invitation.token}&action=decline`;

      const emailData = {
        recipientName: invitation.recipientName,
        isTeam: invitation.invitationType === "TEAM",
        teamName: participant.team?.name || "",
        eventName: event.name,
        eventDate: formatEventDate(event.startDate),
        eventTime: formatEventTime(event.startTime, event.endTime),
        eventLocation: event.location,
        confirmUrl,
        declineUrl,
      };

      const htmlContent = getRSVPInvitationHTML(emailData);

      const mailOptions = {
        from: `"AstroStar Eventos" <${process.env.EMAIL_USER}>`,
        to: invitation.recipientEmail,
        subject: `Confirmación de Asistencia - ${event.name}`,
        html: htmlContent,
        attachments: [
          {
            filename: `evento-${event.id}.ics`,
            content: icsContent,
            contentType: "text/calendar; charset=utf-8; method=REQUEST",
          },
        ],
      };

      const result = await this.sendMailWithFallback(mailOptions);
      return result;
    } catch (error) {
      console.error("❌ Error enviando invitación RSVP:", error.message);
      if (this.shouldSimulate()) {
        return {
          success: true,
          messageId: "simulated-" + Date.now(),
          simulated: true,
        };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar recordatorio de invitación pendiente
   */
  async sendRSVPReminder(invitation, event, participant) {
    try {
      const ready = await this.ensureTransporter();
      if (!ready.ok) {
        console.warn("⚠️  Recordatorio RSVP no enviado:", ready.reason);
        if (this.shouldSimulate()) {
          return {
            success: true,
            messageId: "simulated-" + Date.now(),
            simulated: true,
          };
        }
        return { success: false, error: ready.reason };
      }

      const { getRSVPReminderHTML } =
        await import("../../../templates/rsvpReminderTemplate.js");
      const { formatEventDate, formatEventTime } =
        await import("../../../utils/dateFormatter.js");

      const baseUrl =
        process.env.BACKEND_URL ||
        process.env.FRONTEND_URL ||
        "http://localhost:4000";
      const confirmUrl = `${baseUrl}/api/rsvp?token=${invitation.token}&action=confirm`;
      const declineUrl = `${baseUrl}/api/rsvp?token=${invitation.token}&action=decline`;

      const emailData = {
        recipientName: invitation.recipientName,
        isTeam: invitation.invitationType === "TEAM",
        teamName: participant.team?.name || "",
        eventName: event.name,
        eventDate: formatEventDate(event.startDate),
        eventTime: formatEventTime(event.startTime, event.endTime),
        eventLocation: event.location,
        confirmUrl,
        declineUrl,
      };

      const htmlContent = getRSVPReminderHTML(emailData);

      const mailOptions = {
        from: `"AstroStar Eventos" <${process.env.EMAIL_USER}>`,
        to: invitation.recipientEmail,
        subject: `⏰ Recordatorio: Confirma tu asistencia a ${event.name}`,
        html: htmlContent,
      };

      const result = await this.sendMailWithFallback(mailOptions);
      return result;
    } catch (error) {
      console.error("❌ Error enviando recordatorio RSVP:", error.message);
      if (this.shouldSimulate()) {
        return {
          success: true,
          messageId: "simulated-" + Date.now(),
          simulated: true,
        };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar recordatorio de evento confirmado
   */
  async sendConfirmedEventReminder(invitation, event, participant) {
    try {
      const ready = await this.ensureTransporter();
      if (!ready.ok) {
        console.warn(
          "⚠️  Recordatorio de evento confirmado no enviado:",
          ready.reason,
        );
        if (this.shouldSimulate()) {
          return {
            success: true,
            messageId: "simulated-" + Date.now(),
            simulated: true,
          };
        }
        return { success: false, error: ready.reason };
      }

      const { getConfirmedReminderHTML } =
        await import("../../../templates/rsvpReminderTemplate.js");
      const { formatEventDate, formatEventTime } =
        await import("../../../utils/dateFormatter.js");

      const emailData = {
        recipientName: invitation.recipientName,
        isTeam: invitation.invitationType === "TEAM",
        teamName: participant.team?.name || "",
        eventName: event.name,
        eventDate: formatEventDate(event.startDate),
        eventTime: formatEventTime(event.startTime, event.endTime),
        eventLocation: event.location,
      };

      const htmlContent = getConfirmedReminderHTML(emailData);

      const mailOptions = {
        from: `"AstroStar Eventos" <${process.env.EMAIL_USER}>`,
        to: invitation.recipientEmail,
        subject: `🔔 Recordatorio: ${event.name} - Evento Confirmado`,
        html: htmlContent,
      };

      const result = await this.sendMailWithFallback(mailOptions);
      return result;
    } catch (error) {
      console.error(
        "❌ Error enviando recordatorio de evento confirmado:",
        error.message,
      );
      if (this.shouldSimulate()) {
        return {
          success: true,
          messageId: "simulated-" + Date.now(),
          simulated: true,
        };
      }
      return { success: false, error: error.message };
    }
  }
}

// Exportar instancia singleton
export default new EventEmailService();

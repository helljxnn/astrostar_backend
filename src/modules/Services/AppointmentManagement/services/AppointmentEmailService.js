/**
 * Servicio de Email para Citas - AstroStar
 * Maneja todos los emails relacionados con citas médicas/deportivas
 */

import { BaseEmailService } from "../../../../services/email/BaseEmailService.js";

export class AppointmentEmailService extends BaseEmailService {
  /**
   * Enviar recordatorio de cita
   */
  async sendAppointmentReminder(
    appointment,
    athleteEmail,
    athleteName,
    specialistName,
  ) {
    try {
      const formattedDate = this.formatDate(appointment.date);

      const mailOptions = {
        from: this.getDefaultFrom(),
        to: athleteEmail,
        subject: `🔔 Recordatorio: Cita programada - ${formattedDate}`,
        html: this.generateReminderTemplate(
          athleteName,
          formattedDate,
          appointment.startTime,
          appointment.endTime,
          specialistName,
          appointment.description,
        ),
        text: this.generateReminderText(
          athleteName,
          formattedDate,
          appointment.startTime,
          appointment.endTime,
          specialistName,
        ),
      };

      return await this.sendMailWithFallback(mailOptions);
    } catch (error) {
      console.error("❌ Error enviando recordatorio de cita:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar propuesta de reagendamiento
   */
  async sendRescheduleProposal(
    appointment,
    athleteEmail,
    athleteName,
    specialistName,
    rescheduleToken,
  ) {
    try {
      const currentDate = this.formatDate(appointment.date);
      const proposedDate = this.formatDate(appointment.proposedDate);

      const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const acceptUrl = `${baseUrl}/appointments/reschedule/${rescheduleToken}/accept`;
      const declineUrl = `${baseUrl}/appointments/reschedule/${rescheduleToken}/decline`;

      const mailOptions = {
        from: this.getDefaultFrom(),
        to: athleteEmail,
        subject: `📅 Propuesta de Reagendamiento - Cita con ${specialistName}`,
        html: this.generateRescheduleProposalTemplate(
          athleteName,
          currentDate,
          appointment.startTime,
          proposedDate,
          appointment.proposedStartTime,
          appointment.proposedEndTime,
          specialistName,
          appointment.rescheduleReason,
          acceptUrl,
          declineUrl,
        ),
      };

      return await this.sendMailWithFallback(mailOptions);
    } catch (error) {
      console.error("❌ Error enviando propuesta de reagendamiento:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar confirmación de reagendamiento
   */
  async sendRescheduleConfirmation(
    appointment,
    athleteEmail,
    athleteName,
    specialistName,
  ) {
    try {
      const newDate = this.formatDate(appointment.date);

      const mailOptions = {
        from: this.getDefaultFrom(),
        to: athleteEmail,
        subject: `✅ Cita Reagendada - ${newDate}`,
        html: this.generateRescheduleConfirmationTemplate(
          athleteName,
          newDate,
          appointment.startTime,
          appointment.endTime,
          specialistName,
        ),
      };

      return await this.sendMailWithFallback(mailOptions);
    } catch (error) {
      console.error("❌ Error enviando confirmación de reagendamiento:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generar token de reagendamiento
   */
  generateRescheduleToken() {
    return require("crypto").randomBytes(32).toString("hex");
  }

  /**
   * Template HTML para recordatorio de cita
   */
  generateReminderTemplate(
    athleteName,
    date,
    startTime,
    endTime,
    specialistName,
    description,
  ) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recordatorio de Cita</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .appointment-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .detail-item { margin: 10px 0; padding: 10px; background: #f0f4ff; border-radius: 5px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 Recordatorio de Cita</h1>
        </div>
        
        <div class="content">
            <h2>Hola ${athleteName},</h2>
            
            <p>Te recordamos que tienes una cita programada:</p>
            
            <div class="appointment-box">
                <h3>📅 Detalles de la Cita</h3>
                <div class="detail-item">
                    <strong>📅 Fecha:</strong> ${date}
                </div>
                <div class="detail-item">
                    <strong>🕐 Horario:</strong> ${startTime} - ${endTime}
                </div>
                <div class="detail-item">
                    <strong>👨‍⚕️ Especialista:</strong> ${specialistName}
                </div>
                ${
                  description
                    ? `<div class="detail-item">
                    <strong>📝 Descripción:</strong> ${description}
                </div>`
                    : ""
                }
            </div>
            
            <p><strong>Por favor:</strong></p>
            <ul>
                <li>Llega 10 minutos antes</li>
                <li>Trae tu documento de identidad</li>
                <li>Si no puedes asistir, avísanos con anticipación</li>
            </ul>
            
            <p>¡Te esperamos!</p>
            
            <p>Saludos,<br><strong>Equipo AstroStar</strong></p>
        </div>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} AstroStar - Sistema de Gestión Deportiva</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Texto plano para recordatorio
   */
  generateReminderText(athleteName, date, startTime, endTime, specialistName) {
    return `Recordatorio de Cita - AstroStar

Hola ${athleteName},

Te recordamos que tienes una cita programada:

DETALLES:
- Fecha: ${date}
- Horario: ${startTime} - ${endTime}
- Especialista: ${specialistName}

Por favor:
- Llega 10 minutos antes
- Trae tu documento de identidad
- Si no puedes asistir, avísanos con anticipación

¡Te esperamos!

Saludos,
Equipo AstroStar`;
  }

  /**
   * Template para propuesta de reagendamiento
   */
  generateRescheduleProposalTemplate(
    athleteName,
    currentDate,
    currentTime,
    proposedDate,
    proposedStartTime,
    proposedEndTime,
    specialistName,
    reason,
    acceptUrl,
    declineUrl,
  ) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Propuesta de Reagendamiento</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .date-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .old-date { text-decoration: line-through; color: #999; }
        .new-date { color: #667eea; font-weight: bold; }
        .buttons { text-align: center; margin: 30px 0; }
        .button { display: inline-block; padding: 12px 30px; margin: 0 10px; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .accept { background-color: #10b981; color: white; }
        .decline { background-color: #ef4444; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📅 Propuesta de Reagendamiento</h1>
        </div>
        
        <div class="content">
            <h2>Hola ${athleteName},</h2>
            
            <p>Necesitamos reagendar tu cita con ${specialistName}.</p>
            
            ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ""}
            
            <div class="date-box">
                <h3>Cambio de Fecha</h3>
                <p class="old-date">
                    <strong>Fecha actual:</strong> ${currentDate} a las ${currentTime}
                </p>
                <p class="new-date">
                    <strong>Nueva fecha propuesta:</strong> ${proposedDate}<br>
                    <strong>Horario:</strong> ${proposedStartTime} - ${proposedEndTime}
                </p>
            </div>
            
            <p>Por favor, confirma si puedes asistir en la nueva fecha:</p>
            
            <div class="buttons">
                <a href="${acceptUrl}" class="button accept">✓ Aceptar</a>
                <a href="${declineUrl}" class="button decline">✗ Rechazar</a>
            </div>
            
            <p>Si rechazas, nos pondremos en contacto contigo para buscar otra fecha.</p>
            
            <p>Saludos,<br><strong>Equipo AstroStar</strong></p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Template para confirmación de reagendamiento
   */
  generateRescheduleConfirmationTemplate(
    athleteName,
    newDate,
    startTime,
    endTime,
    specialistName,
  ) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cita Reagendada</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .appointment-box { background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .detail-item { margin: 10px 0; padding: 10px; background: #f0fdf4; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Cita Reagendada</h1>
        </div>
        
        <div class="content">
            <h2>Hola ${athleteName},</h2>
            
            <p>Tu cita ha sido reagendada exitosamente.</p>
            
            <div class="appointment-box">
                <h3>📅 Nueva Fecha de la Cita</h3>
                <div class="detail-item">
                    <strong>📅 Fecha:</strong> ${newDate}
                </div>
                <div class="detail-item">
                    <strong>🕐 Horario:</strong> ${startTime} - ${endTime}
                </div>
                <div class="detail-item">
                    <strong>👨‍⚕️ Especialista:</strong> ${specialistName}
                </div>
            </div>
            
            <p>¡Te esperamos en la nueva fecha!</p>
            
            <p>Saludos,<br><strong>Equipo AstroStar</strong></p>
        </div>
    </div>
</body>
</html>`;
  }
}

// Exportar instancia singleton
export default new AppointmentEmailService();

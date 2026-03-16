/**
 * Servicio de Email para Deportistas - AstroStar
 * Maneja todos los emails relacionados con deportistas
 */

import { BaseEmailService } from "../../../services/email/BaseEmailService.js";

export class AthleteEmailService extends BaseEmailService {
  /**
   * Enviar email de bienvenida a nuevo deportista
   */
  async sendAthleteWelcomeEmail(athleteData, credentials) {
    try {
      const { email, firstName, lastName } = athleteData;
      const { email: loginEmail, temporaryPassword } = credentials;

      const mailOptions = {
        from: this.getDefaultFrom(),
        to: email,
        subject: "🎉 Bienvenido a AstroStar - Credenciales de Acceso",
        html: this.generateAthleteWelcomeEmailTemplate(
          firstName,
          lastName,
          loginEmail,
          temporaryPassword,
        ),
        text: this.generateAthleteWelcomeEmailText(
          firstName,
          lastName,
          loginEmail,
          temporaryPassword,
        ),
      };

      const result = await this.sendMailWithFallback(mailOptions);
      return {
        success: result.success,
        messageId: result.messageId,
        message: result.success
          ? "Email enviado exitosamente"
          : "Error enviando email",
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Error enviando email",
      };
    }
  }

  /**
   * Generar template HTML para email de bienvenida de deportista
   */
  generateAthleteWelcomeEmailTemplate(firstName, lastName, email, password) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a AstroStar</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .credentials-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .credential-item { margin: 10px 0; padding: 10px; background: #f0f4ff; border-radius: 5px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌟 ¡Bienvenido a AstroStar!</h1>
            <p>Sistema de Gestión Deportiva</p>
        </div>
        
        <div class="content">
            <h2>Hola ${firstName} ${lastName},</h2>
            
            <p>¡Nos complace darte la bienvenida a AstroStar! Tu cuenta de deportista ha sido creada exitosamente.</p>
            
            <div class="credentials-box">
                <h3>🔐 Tus Credenciales de Acceso</h3>
                <div class="credential-item">
                    <strong>📧 Usuario:</strong> ${email}
                </div>
                <div class="credential-item">
                    <strong>🔑 Contraseña:</strong> <code>${password}</code>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/login" class="button">
                    🚀 Acceder al Sistema
                </a>
            </div>
            
            <p>¡Esperamos que tengas una excelente experiencia en AstroStar!</p>
            
            <p>Saludos cordiales,<br>
            <strong>Equipo AstroStar</strong></p>
        </div>
        
        <div class="footer">
            <p>Este es un email automático del sistema AstroStar. Por favor no respondas a este mensaje.</p>
            <p>© ${new Date().getFullYear()} AstroStar - Sistema de Gestión Deportiva</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generar texto plano para email de bienvenida de deportista
   */
  generateAthleteWelcomeEmailText(firstName, lastName, email, password) {
    return `¡Bienvenido a AstroStar!

Hola ${firstName} ${lastName},

Nos complace darte la bienvenida a AstroStar. Tu cuenta de deportista ha sido creada exitosamente.

CREDENCIALES DE ACCESO:
- Usuario: ${email}
- Contraseña: ${password}

Accede al sistema en: ${process.env.FRONTEND_URL || "http://localhost:3000"}/login

¡Esperamos que tengas una excelente experiencia en AstroStar!

Saludos cordiales,
Equipo AstroStar

---
Este es un email automático del sistema AstroStar.
© ${new Date().getFullYear()} AstroStar - Sistema de Gestión Deportiva`;
  }

  /**
   * Notificar al deportista que se creó una cita
   */
  async sendAppointmentNotification({
    to,
    athleteName,
    date,
    time,
    specialistName,
  }) {
    if (!to) {
      return { success: false, message: "Correo destinatario no definido" };
    }

    const ready = await this.ensureTransporter();
    if (!ready.ok) {
      return { success: false, error: ready.reason };
    }

    const subject = "Nueva cita programada";
    const plainText = `Hola ${athleteName || "deportista"}, se programó una cita para el ${date} a las ${time}${
      specialistName ? ` con ${specialistName}` : ""
    }. Ingresa al módulo de citas para más detalles.`;

    const html = `
      <p>Hola ${athleteName || "deportista"},</p>
      <p>Se programó una cita para el <strong>${date}</strong> a las <strong>${time}</strong>${
        specialistName ? ` con <strong>${specialistName}</strong>` : ""
      }.</p>
      <p>Por favor ingresa al módulo de citas para más detalles.</p>
    `;

    const mailOptions = {
      from: this.getDefaultFrom(),
      to,
      subject,
      text: plainText,
      html,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar correo de cita con formato compatible con Google Calendar
   */
  async sendAppointmentCalendarEmail({ to, athleteName, appointmentData }) {
    try {
      const { date, startTime, endTime, specialistName, description } =
        appointmentData;

      const startDateTime = this.createISODateTime(date, startTime);
      const endDateTime = this.createISODateTime(date, endTime);

      const subject = `Cita programada - ${this.formatDateForSubject(date)} ${startTime}`;

      const htmlContent = this.generateAppointmentCalendarTemplate({
        athleteName,
        date,
        startTime,
        endTime,
        specialistName,
        description,
        startDateTime,
        endDateTime,
      });

      const textContent = this.generateAppointmentCalendarText({
        athleteName,
        date,
        startTime,
        endTime,
        specialistName,
        description,
      });

      const icsContent = this.generateICSFile({
        startDateTime,
        endDateTime,
        summary: `Cita con ${specialistName}`,
        description: description || "Cita programada en AstroStar",
        location: "AstroStar - Centro Deportivo",
        attendeeEmail: to,
        athleteName,
      });

      const mailOptions = {
        from: this.getDefaultFrom(),
        to,
        subject,
        text: textContent,
        html: htmlContent,
        attachments: [
          {
            filename: "cita-astrostar.ics",
            content: icsContent,
            contentType: "text/calendar; charset=utf-8; method=REQUEST",
          },
        ],
      };

      const result = await this.sendMailWithFallback(mailOptions);
      return result;
    } catch (error) {
      console.error("Error sending appointment calendar email:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crear fecha y hora en formato ISO
   */
  createISODateTime(date, time) {
    const [hours, minutes] = time.split(":");
    const appointmentDate = new Date(date);
    appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return appointmentDate.toISOString();
  }

  /**
   * Formatear fecha para el asunto del correo
   */
  formatDateForSubject(date) {
    const appointmentDate = new Date(date);
    return appointmentDate.toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  /**
   * Generar archivo ICS para calendario
   */
  generateICSFile({
    startDateTime,
    endDateTime,
    summary,
    description,
    location,
    attendeeEmail,
    athleteName,
  }) {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    const formatICSDate = (date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const uid = `appointment-${Date.now()}@astrostar.com`;
    const dtstamp = formatICSDate(new Date());

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AstroStar//Appointment System//ES
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${formatICSDate(start)}
DTEND:${formatICSDate(end)}
SUMMARY:${summary}
DESCRIPTION:${description}
LOCATION:${location}
ORGANIZER;CN=AstroStar:mailto:${process.env.EMAIL_USER || "astrostar.system@gmail.com"}
ATTENDEE;CN=${athleteName};RSVP=TRUE:mailto:${attendeeEmail}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Recordatorio: Cita en 15 minutos
END:VALARM
BEGIN:VALARM
TRIGGER:-PT1H
ACTION:DISPLAY
DESCRIPTION:Recordatorio: Cita en 1 hora
END:VALARM
END:VEVENT
END:VCALENDAR`;
  }

  /**
   * Generar template HTML para correo de cita con calendario
   */
  generateAppointmentCalendarTemplate({
    athleteName,
    date,
    startTime,
    endTime,
    specialistName,
    description,
  }) {
    const formattedDate = this.formatDate(date);

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cita Programada - AstroStar</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .credentials-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .credential-item { margin: 10px 0; padding: 10px; background: #f0f4ff; border-radius: 5px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌟 ¡Cita Programada!</h1>
            <p>Sistema de Gestión Deportiva</p>
        </div>
        
        <div class="content">
            <h2>Hola ${athleteName},</h2>
            
            <p>¡Se ha programado una cita para ti en AstroStar! A continuación encontrarás todos los detalles.</p>
            
            <div class="credentials-box">
                <h3>📅 Detalles de tu Cita</h3>
                <div class="credential-item">
                    <strong>📅 Fecha:</strong> ${formattedDate}
                </div>
                <div class="credential-item">
                    <strong>🕐 Horario:</strong> ${startTime} - ${endTime}
                </div>
                <div class="credential-item">
                    <strong>👨‍⚕️ Especialista:</strong> ${specialistName}
                </div>
                <div class="credential-item">
                    <strong>📍 Ubicación:</strong> AstroStar - Centro Deportivo
                </div>
                ${
                  description
                    ? `<div class="credential-item">
                    <strong>📝 Descripción:</strong> ${description}
                </div>`
                    : ""
                }
            </div>
            
            <div class="warning">
                <strong>🔔 Recordatorios Automáticos:</strong>
                <ul>
                    <li>Recibirás una notificación 1 hora antes de la cita</li>
                    <li>Recibirás una notificación 15 minutos antes de la cita</li>
                    <li>Si agregas el evento a tu calendario, también recibirás recordatorios allí</li>
                </ul>
            </div>
            
            <h3>📋 Próximos Pasos:</h3>
            <ol>
                <li>Llega 10 minutos antes de tu cita</li>
                <li>Trae tu documento de identidad</li>
                <li>Si necesitas cancelar o reprogramar, contacta con anticipación</li>
                <li>Puedes usar el archivo adjunto (.ics) para agregarlo a cualquier aplicación de calendario</li>
            </ol>
            
            <p>Si tienes alguna pregunta o necesitas hacer cambios, no dudes en contactar al equipo de soporte.</p>
            
            <p>¡Te esperamos!</p>
            
            <p>Saludos cordiales,<br>
            <strong>Equipo AstroStar</strong></p>
        </div>
        
        <div class="footer">
            <p>Este es un email automático del sistema AstroStar. Por favor no respondas a este mensaje.</p>
            <p>© ${new Date().getFullYear()} AstroStar - Sistema de Gestión Deportiva</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generar texto plano para correo de cita
   */
  generateAppointmentCalendarText({
    athleteName,
    date,
    startTime,
    endTime,
    specialistName,
    description,
  }) {
    const formattedDate = this.formatDate(date);

    return `Cita Programada - AstroStar

Hola ${athleteName},

Se ha programado una cita para ti:

DETALLES DE LA CITA:
- Fecha: ${formattedDate}
- Hora: ${startTime} - ${endTime}
- Especialista: ${specialistName}
- Ubicación: AstroStar - Centro Deportivo
${description ? `- Descripción: ${description}` : ""}

RECORDATORIOS:
- Recibirás notificaciones 1 hora y 15 minutos antes de la cita
- Llega 10 minutos antes de tu cita
- Trae tu documento de identidad

AGREGAR A CALENDARIO:
- Usa el archivo adjunto (.ics) para agregar la cita a tu calendario
- Compatible con Google Calendar, Outlook, Apple Calendar y otros

Si necesitas cancelar o reprogramar, contacta con anticipación.

¡Te esperamos!

Saludos cordiales,
Equipo AstroStar

---
Este es un email automático del sistema AstroStar.
© ${new Date().getFullYear()} AstroStar - Sistema de Gestión Deportiva`;
  }
}

// Exportar instancia singleton
export default new AthleteEmailService();

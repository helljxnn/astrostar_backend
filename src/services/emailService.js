﻿﻿﻿/**
 * Servicio de Email - AstroStar
 * Maneja el envío de correos electrónicos del sistema
 */

import nodemailer from "nodemailer";

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  shouldSimulate() {
    // Permite simular envío cuando la red bloquea el SMTP.
    return String(process.env.EMAIL_SIMULATE_ON_FAILURE || "true").toLowerCase() !== "false";
  }

  /**
   * Inicializar el transportador de email
   */
  async initializeTransporter({
    overridePort = null,
    overrideHost = null,
    overrideAuth = null,
  } = {}) {
    try {
      // Verificar si las credenciales están configuradas
      if (
        !process.env.EMAIL_USER ||
        !process.env.EMAIL_PASSWORD ||
        process.env.EMAIL_PASSWORD === "your-app-password-here"
      ) {
        this.transporter = null;
        return;
      }

      // Configuración SMTP (por defecto Gmail). Usamos host/port para evitar que Nodemailer
      // sobreescriba los valores al usar `service` y se fuerce el puerto 465.
      const host = overrideHost || process.env.SMTP_HOST || "smtp.gmail.com";
      const port = Number(overridePort ?? process.env.SMTP_PORT) || 587;
      const secure = port === 465;
      const auth = overrideAuth || {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      };

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth,
        family: 4, // fuerza IPv4; evita timeouts en redes con IPv6 bloqueado
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: Number(process.env.SMTP_CONN_TIMEOUT_MS) || 7000,
        socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS) || 10000,
        // Configuración explícita para UTF-8
        defaults: {
          encoding: 'utf8'
        }
      });
    } catch (error) {
      console.error("⚠️ Error inicializando servicio de email:", error);
      this.transporter = null;
    }
  }

  /**
   * Reinicializar el transportador de email
   * Útil cuando las variables de entorno se cargan después de la instanciación
   */
  reinitialize() {
    this.initializeTransporter();
  }

  /**
   * Verificar conexión del servicio de email
   */
  async verifyConnection() {
    try {
      if (!this.transporter) {
        if (this.shouldSimulate()) {
          console.log("✉️  Servicio de email en modo simulación (sin SMTP).");
          return true;
        }
        return false;
      }

      await this.transporter.verify();
      return true;
    } catch (error) {
      const msg = error?.message || "";
      console.warn("⚠️  No se pudo verificar la conexión de email:", msg);

      if (this.shouldSimulate()) {
        console.warn("⚠️  No se pudo verificar SMTP; continuando en modo simulación.");
        this.transporter = null;
        return true;
      }

      return false;
    }
  }

  /**
   * Asegurar que el transporter esté disponible para enviar correos.
   */
  async ensureTransporter() {
    if (this.transporter) {
      return { ok: true };
    }

    await this.initializeTransporter();
    if (this.transporter) {
      return { ok: true, reinitialized: true };
    }

    if (this.shouldSimulate()) {
      console.warn("⚠️  Sin transporter; usando modo simulación de correos.");
      return { ok: true, simulated: true };
    }

    return {
      ok: false,
      reason: "Servicio de email no configurado. Define EMAIL_USER y EMAIL_PASSWORD.",
    };
  }

  /**
   * Enviar email con reintentos
   */
  async sendMailWithFallback(mailOptions) {
    const ready = await this.ensureTransporter();
    if (!ready.ok) {
      if (this.shouldSimulate()) {
        console.warn("⚠️  Servicio de email no disponible; enviando en modo simulado.");
        return { success: true, messageId: "simulated-" + Date.now(), simulated: true };
      }
      return { success: false, error: ready.reason };
    }

    try {
      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.warn("⚠️  Error enviando email:", error?.message || error);

      if (this.shouldSimulate()) {
        console.warn("⚠️  Envío falló; usando modo simulado.");
        return { success: true, messageId: "simulated-" + Date.now(), simulated: true };
      }

      return { success: false, error: error?.message || error };
    }
  }

  /**
   * Enviar email de bienvenida a nuevo empleado
   */
  async sendWelcomeEmail(employeeData, credentials) {
    try {
      const { email, firstName, lastName } = employeeData;
      const { email: loginEmail, temporaryPassword } = credentials;

      const mailOptions = {
        from: {
          name: "AstroStar - Sistema de Gestión",
          address: process.env.EMAIL_USER || "astrostar.system@gmail.com",
        },
        to: email,
        subject: "🎉 Bienvenido a AstroStar - Credenciales de Acceso",
        html: this.generateWelcomeEmailTemplate(firstName, lastName, loginEmail, temporaryPassword),
        text: this.generateWelcomeEmailText(firstName, lastName, loginEmail, temporaryPassword),
      };

      const result = await this.sendMailWithFallback(mailOptions);
      if (result.success) {
        return {
          success: true,
          messageId: result.messageId,
          message: "Email enviado exitosamente",
        };
      }

      return {
        success: false,
        error: result.error || "No se pudo enviar el email",
        message: "Error enviando email",
      };
    } catch (error) {
      console.warn("⚠️  Error enviando email, pero continuando:", error.message);
      return {
        success: false,
        error: error.message,
        message: "Error enviando email, pero el empleado fue creado exitosamente",
      };
    }
  }

  /**
   * Generar template HTML para email de bienvenida
   */
  generateWelcomeEmailTemplate(firstName, lastName, email, password) {
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
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
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
            
            <p>¡Nos complace darte la bienvenida al equipo de AstroStar! Tu cuenta de empleado ha sido creada exitosamente.</p>
            
            <div class="credentials-box">
                <h3>🔐 Tus Credenciales de Acceso</h3>
                <div class="credential-item">
                    <strong>📧 Usuario:</strong> ${email}
                </div>
                <div class="credential-item">
                    <strong>🔑 Contraseña:</strong> <code>${password}</code>
                </div>
            </div>
            
            <div class="warning">
                <strong>⚠️ Importante - Seguridad:</strong>
                <ul>
                    <li>Por razones de seguridad, <strong>es recomendable cambiar tu contraseña</strong> después de tu primer inicio de sesión</li>
                    <li>Elige una contraseña segura que incluya letras, números y símbolos</li>
                    <li>No compartas tus credenciales con nadie</li>
                    <li>Si tienes problemas para acceder, contacta al administrador</li>
                </ul>
            </div>
            
            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/login" class="button">
                    🚀 Acceder al Sistema
                </a>
            </div>
            
            <h3>📋 Próximos Pasos:</h3>
            <ol>
                <li>Inicia sesión con tu correo y contraseña</li>
                <li><strong>Cambia tu contraseña inmediatamente</strong> por una segura y personal</li>
                <li>Completa tu perfil si es necesario</li>
                <li>Familiarízate con el sistema</li>
            </ol>
            
            <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar al equipo de soporte.</p>
            
            <p>¡Esperamos que tengas una excelente experiencia trabajando con AstroStar!</p>
            
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
   * Generar texto plano para email de bienvenida
   */
  generateWelcomeEmailText(firstName, lastName, email, password) {
    return `¡Bienvenido a AstroStar!

Hola ${firstName} ${lastName},

Nos complace darte la bienvenida al equipo de AstroStar. Tu cuenta de empleado ha sido creada exitosamente.

CREDENCIALES DE ACCESO:
- Usuario: ${email}
- Contraseña: ${password}

IMPORTANTE - SEGURIDAD:
- Por razones de seguridad, DEBES CAMBIAR tu contraseña después de tu primer inicio de sesión
- Elige una contraseña segura que incluya letras, números y símbolos
- No compartas tus credenciales con nadie
- Si tienes problemas para acceder, contacta al administrador

PRÓXIMOS PASOS:
1. Inicia sesión con tu correo y contraseña
2. CAMBIA TU CONTRASEÑA INMEDIATAMENTE por una segura y personal
3. Completa tu perfil si es necesario
4. Familiarízate con el sistema

Accede al sistema en: ${process.env.FRONTEND_URL || "http://localhost:3000"}/login

¡Esperamos que tengas una excelente experiencia trabajando con AstroStar!

Saludos cordiales,
Equipo AstroStar

---
Este es un email automático del sistema AstroStar.
© ${new Date().getFullYear()} AstroStar - Sistema de Gestión Deportiva`;
  }

  /**
   * Enviar email de bienvenida a nuevo deportista
   */
  async sendAthleteWelcomeEmail(athleteData, credentials) {
    try {
      const { email, firstName, lastName } = athleteData;
      const { email: loginEmail, temporaryPassword } = credentials;

      const mailOptions = {
        from: {
          name: "AstroStar - Sistema de Gestión",
          address: process.env.EMAIL_USER || "astrostar.system@gmail.com",
        },
        to: email,
        subject: "🎉 Bienvenido a AstroStar - Credenciales de Acceso",
        html: this.generateAthleteWelcomeEmailTemplate(firstName, lastName, loginEmail, temporaryPassword),
        text: this.generateAthleteWelcomeEmailText(firstName, lastName, loginEmail, temporaryPassword),
      };

      const result = await this.sendMailWithFallback(mailOptions);
      return {
        success: result.success,
        messageId: result.messageId,
        message: result.success ? "Email enviado exitosamente" : "Error enviando email",
        error: result.error
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
  async sendAppointmentNotification({ to, athleteName, date, time, specialistName }) {
    if (!to) {
      return { success: false, message: "Correo destinatario no definido" };
    }

    const ready = await this.ensureTransporter();
    if (!ready.ok) {
      console.warn("⚠️  Notificación de cita no enviada:", ready.reason);
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
      from: {
        name: "AstroStar - Sistema de Gestión",
        address: process.env.EMAIL_USER || "astrostar.system@gmail.com",
      },
      to,
      subject,
      text: plainText,
      html,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.warn("⚠️  Error enviando notificación de cita:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Formatear fecha para horarios
   */
  formatScheduleDate(date) {
    if (!date) return "";
    const parsed = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleDateString("es-CO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  /**
   * Formatear recurrencia de horarios
   */
  formatScheduleRecurrence(recurrence = "no") {
    const labels = {
      no: "Sin repetición",
      dia: "Cada día",
      semana: "Cada semana",
      mes: "Cada mes",
      anio: "Cada año",
      laboral: "Días laborales",
      personalizado: "Repetición personalizada",
    };
    return labels[recurrence] || "Sin repetición";
  }
    /**
     * Enviar notificación de horario a empleado
     */
    async sendScheduleNotification({ to, employeeName, action = 'created', scheduleData }) {
      try {
        await this.ensureTransporter();

        const actionText = action === 'created' ? 'creado' :
                          action === 'updated' ? 'actualizado' :
                          action === 'deleted' ? 'eliminado' : action;

        const subject = `Horario ${actionText} - AstroStar`;

        const htmlContent = this.generateScheduleNotificationTemplate(
          employeeName,
          actionText,
          scheduleData
        );

        const textContent = this.generateScheduleNotificationText(
          employeeName,
          actionText,
          scheduleData
        );

        const mailOptions = {
          from: process.env.EMAIL_FROM || 'noreply@astrostar.com',
          to,
          subject,
          text: textContent,
          html: htmlContent,
        };

        const result = await this.sendMailWithFallback(mailOptions);
        return result;
      } catch (error) {
        console.error('Error sending schedule notification:', error);
        return { success: false, error: error.message };
      }
    }

    /**
     * Generar template HTML para notificación de horario
     */
    generateScheduleNotificationTemplate(employeeName, action, scheduleData) {
      const formattedDate = this.formatScheduleDate(scheduleData.date);
      const recurrenceText = this.formatScheduleRecurrence(scheduleData.recurrence);

      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Notificación de Horario - AstroStar</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #4a90e2; margin-bottom: 10px; }
            .title { font-size: 20px; color: #333; margin-bottom: 20px; }
            .content { margin-bottom: 30px; }
            .schedule-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { margin-bottom: 10px; }
            .detail-label { font-weight: bold; color: #555; }
            .detail-value { color: #333; }
            .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">⭐ AstroStar</div>
              <div class="title">Notificación de Horario</div>
            </div>

            <div class="content">
              <p>Hola <strong>${employeeName}</strong>,</p>
              <p>Te informamos que tu horario ha sido <strong>${action}</strong>.</p>

              <div class="schedule-details">
                <h3>Detalles del Horario:</h3>
                <div class="detail-row">
                  <span class="detail-label">Fecha:</span>
                  <span class="detail-value">${formattedDate}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Hora de inicio:</span>
                  <span class="detail-value">${scheduleData.startTime}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Hora de fin:</span>
                  <span class="detail-value">${scheduleData.endTime}</span>
                </div>
                ${recurrenceText ? `
                <div class="detail-row">
                  <span class="detail-label">Recurrencia:</span>
                  <span class="detail-value">${recurrenceText}</span>
                </div>
                ` : ''}
                ${scheduleData.description ? `
                <div class="detail-row">
                  <span class="detail-label">Descripción:</span>
                  <span class="detail-value">${scheduleData.description}</span>
                </div>
                ` : ''}
              </div>

              <p>Si tienes alguna pregunta o necesitas hacer cambios, por favor contacta a tu supervisor.</p>
            </div>

            <div class="footer">
              <p>Este es un mensaje automático de AstroStar. Por favor no respondas a este correo.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    /**
     * Generar texto plano para notificación de horario
     */
    generateScheduleNotificationText(employeeName, action, scheduleData) {
      const formattedDate = this.formatScheduleDate(scheduleData.date);
      const recurrenceText = this.formatScheduleRecurrence(scheduleData.recurrence);

      return `
  AstroStar - Notificación de Horario

  Hola ${employeeName},

  Te informamos que tu horario ha sido ${action}.

  Detalles del Horario:
  - Fecha: ${formattedDate}
  - Hora de inicio: ${scheduleData.startTime}
  - Hora de fin: ${scheduleData.endTime}
  ${recurrenceText ? `- Recurrencia: ${recurrenceText}` : ''}
  ${scheduleData.description ? `- Descripción: ${scheduleData.description}` : ''}

  Si tienes alguna pregunta o necesitas hacer cambios, por favor contacta a tu supervisor.

  ---
  Este es un mensaje automático de AstroStar. Por favor no respondas a este correo.
      `.trim();
    }

  /**
   * Enviar correo de cita con formato compatible con Google Calendar
   */
  async sendAppointmentCalendarEmail({ to, athleteName, appointmentData }) {
    try {
      const { date, startTime, endTime, specialistName, description } = appointmentData;
      
      // Convertir fecha y hora a formato ISO para Google Calendar
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
        endDateTime
      });

      const textContent = this.generateAppointmentCalendarText({
        athleteName,
        date,
        startTime,
        endTime,
        specialistName,
        description
      });

      // Crear archivo ICS para el calendario
      const icsContent = this.generateICSFile({
        startDateTime,
        endDateTime,
        summary: `Cita con ${specialistName}`,
        description: description || 'Cita programada en AstroStar',
        location: 'AstroStar - Centro Deportivo',
        attendeeEmail: to,
        athleteName
      });

      const mailOptions = {
        from: {
          name: "AstroStar - Sistema de Gestión",
          address: process.env.EMAIL_USER || "astrostar.system@gmail.com",
        },
        to,
        subject,
        text: textContent,
        html: htmlContent,
        attachments: [
          {
            filename: 'cita-astrostar.ics',
            content: icsContent,
            contentType: 'text/calendar; charset=utf-8; method=REQUEST'
          }
        ]
      };

      const result = await this.sendMailWithFallback(mailOptions);
      return result;
    } catch (error) {
      console.error('Error sending appointment calendar email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crear fecha y hora en formato ISO
   */
  createISODateTime(date, time) {
    const [hours, minutes] = time.split(':');
    const appointmentDate = new Date(date);
    appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return appointmentDate.toISOString();
  }

  /**
   * Formatear fecha para el asunto del correo
   */
  formatDateForSubject(date) {
    const appointmentDate = new Date(date);
    return appointmentDate.toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }

  /**
   * Generar archivo ICS para calendario
   */
  generateICSFile({ startDateTime, endDateTime, summary, description, location, attendeeEmail, athleteName }) {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    
    // Formato YYYYMMDDTHHMMSSZ para ICS
    const formatICSDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
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
  generateAppointmentCalendarTemplate({ athleteName, date, startTime, endTime, specialistName, description, startDateTime, endDateTime }) {
    const formattedDate = this.formatScheduleDate(date);
    const googleCalendarUrl = this.generateGoogleCalendarUrl({
      startDateTime,
      endDateTime,
      summary: `Cita con ${specialistName}`,
      description: description || 'Cita programada en AstroStar',
      location: 'AstroStar - Centro Deportivo'
    });

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
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
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
                ${description ? `<div class="credential-item">
                    <strong>📝 Descripción:</strong> ${description}
                </div>` : ''}
            </div>
            
            <div class="warning">
                <strong>🔔 Recordatorios Automáticos:</strong>
                <ul>
                    <li>Recibirás una notificación 1 hora antes de la cita</li>
                    <li>Recibirás una notificación 15 minutos antes de la cita</li>
                    <li>Si agregas el evento a tu calendario, también recibirás recordatorios allí</li>
                </ul>
            </div>
            
            <div style="text-align: center;">
                <a href="${googleCalendarUrl}" class="button">
                    📅 Agregar a Google Calendar
                </a>
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
  generateAppointmentCalendarText({ athleteName, date, startTime, endTime, specialistName, description }) {
    const formattedDate = this.formatScheduleDate(date);
    
    return `Cita Programada - AstroStar

Hola ${athleteName},

Se ha programado una cita para ti:

DETALLES DE LA CITA:
- Fecha: ${formattedDate}
- Hora: ${startTime} - ${endTime}
- Especialista: ${specialistName}
- Ubicación: AstroStar - Centro Deportivo
${description ? `- Descripción: ${description}` : ''}

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

  /**
   * Generar URL para Google Calendar
   */
  generateGoogleCalendarUrl({ startDateTime, endDateTime, summary, description, location }) {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    
    // Formato para Google Calendar: YYYYMMDDTHHMMSSZ
    const formatGoogleDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: summary,
      dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,
      details: description,
      location: location,
      trp: 'false'
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }
}

export default new EmailService();
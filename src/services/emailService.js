/**
 * Servicio de Email - AstroStar
 * Maneja el envío de correos electrónicos del sistema
 */

import nodemailer from "nodemailer";

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Inicializar el transportador de email
   */
  async initializeTransporter() {
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD || process.env.EMAIL_PASSWORD === "your-app-password-here") {
        console.log("??  Credenciales de email no configuradas");
        this.transporter = null;
        return;
      }

      const normalizedPass = String(process.env.EMAIL_PASSWORD).replace(/\s+/g, "").trim();
      const baseHost = process.env.SMTP_HOST || "smtp.gmail.com";
      const portEnv = parseInt(process.env.SMTP_PORT || "587", 10);

      const configs = [
        { host: baseHost, port: portEnv, secure: false, requireTLS: true },
        { host: baseHost, port: 465, secure: true },
      ];

      const common = {
        auth: { user: process.env.EMAIL_USER, pass: normalizedPass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 8000,
        socketTimeout: 8000,
        family: 4,
      };

      let transporter = null;
      for (const cfg of configs) {
        try {
          const candidate = nodemailer.createTransport({ ...common, ...cfg });
          await Promise.race([
            candidate.verify(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout verificaci?n SMTP")), 6000)),
          ]);
          transporter = candidate;
          console.log('? Servicio de email inicializado correctamente en ' + cfg.host + ' puerto ' + cfg.port);
          break;
        } catch (err) {
          console.warn('??  Transporte SMTP fall? en puerto ' + cfg.port + ': ' + (err?.message || err));
        }
      }

      if (!transporter) {
        console.error('? No se pudo inicializar ning?n transporte SMTP (probado 587 y 465).');
      }
      this.transporter = transporter;
    } catch (error) {
      console.error('? Error inicializando servicio de email:', error);
      this.transporter = null;
    }
  }

  /**
   * Asegurar que el transporter est? listo
   */
  async ensureTransporter() {
    if (!this.transporter) {
      await this.initializeTransporter();
    }
    if (!this.transporter) {
      return { ok: false, reason: 'Transporter no configurado' };
    }
    return { ok: true };
  }

  /**
   * Verificar conexión del servicio de email
   */
  async verifyConnection() {
    try {
      if (!this.transporter) {
        console.log("📧 Servicio de email en modo simulación");
        return false;
      }

      await this.transporter.verify();
      return true;
    } catch (error) {
      console.warn("⚠️  No se pudo verificar la conexión de email:", error?.message || error);
      return false;
    }
  }

  /**
   * Enviar email de bienvenida a nuevo empleado
   */
  async sendWelcomeEmail(employeeData, credentials) {
    try {
      const { email, firstName, lastName } = employeeData;
      const { email: loginEmail, temporaryPassword } = credentials;

      // Si no hay transporter configurado, simular envío inmediatamente
      if (!this.transporter) {
        console.log("📧 Simulando envío de email de bienvenida a:", email);
        return { success: true, messageId: "simulated-" + Date.now() };
      }

      // Verificar conexión con timeout corto
      const connectionTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout de conexión")), 5000),
      );

      try {
        await Promise.race([this.transporter.verify(), connectionTimeout]);
      } catch (verifyError) {
        console.warn(
          "⚠️  No se pudo verificar conexión de email, simulando envío:",
          verifyError.message,
        );
        return { success: true, messageId: "simulated-fallback-" + Date.now() };
      }

      const mailOptions = {
        from: {
          name: "AstroStar - Sistema de Gestión",
          address: process.env.EMAIL_USER || "astrostar.system@gmail.com",
        },
        to: email,
        subject: "🎉 Bienvenido a AstroStar - Credenciales de Acceso",
        html: this.generateWelcomeEmailTemplate(
          firstName,
          lastName,
          loginEmail,
          temporaryPassword,
        ),
        text: this.generateWelcomeEmailText(
          firstName,
          lastName,
          loginEmail,
          temporaryPassword,
        ),
      };

      // Enviar email con timeout
      const sendTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout de envío")), 10000),
      );

      const result = await Promise.race([
        this.transporter.sendMail(mailOptions),
        sendTimeout,
      ]);

      return {
        success: true,
        messageId: result.messageId,
        message: "Email enviado exitosamente",
      };
    } catch (error) {
      console.warn(
        "⚠️  Error enviando email, pero continuando:",
        error.message,
      );
      return {
        success: false,
        error: error.message,
        message:
          "Error enviando email, pero el empleado fue creado exitosamente",
      };
    }
  }

  /**
   * Generar template HTML para email de bienvenida
   */
  generateWelcomeEmailTemplate(firstName, lastName, email, password) {
    return `
    <!DOCTYPE html>
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
                        <strong>🔑 Contraseña:</strong> <code> Tu documento de identidad</code>
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
                    <a href="${
                      process.env.FRONTEND_URL || "http://localhost:3000"
                    }/login" class="button">
                        🚀 Acceder al Sistema
                    </a>
                </div>
                
                <h3>📋 Próximos Pasos:</h3>
                <ol>
                    <li>Inicia sesión con tu correo y tu documento de identidad como contraseña</li>
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
    </html>
    `;
  }

  /**
   * Generar texto plano para email de bienvenida
   */
  generateWelcomeEmailText(firstName, lastName, email, password) {
    return `
¡Bienvenido a AstroStar!

Hola ${firstName} ${lastName},

Nos complace darte la bienvenida al equipo de AstroStar. Tu cuenta de empleado ha sido creada exitosamente.

CREDENCIALES DE ACCESO:
- Usuario: ${email}
- Contraseña Inicial: ${password} (Tu número de documento de identidad)

IMPORTANTE - SEGURIDAD:
- Tu contraseña inicial es tu número de documento de identidad
- Por razones de seguridad, DEBES CAMBIARLA INMEDIATAMENTE después de tu primer inicio de sesión
- Elige una contraseña segura que incluya letras, números y símbolos
- No compartas tus credenciales con nadie
- Si tienes problemas para acceder, contacta al administrador

PRÓXIMOS PASOS:
1. Inicia sesión con tu correo y tu documento de identidad como contraseña
2. CAMBIA TU CONTRASEÑA INMEDIATAMENTE por una segura y personal
3. Completa tu perfil si es necesario
4. Familiarízate con el sistema

Accede al sistema en: ${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/login

¡Esperamos que tengas una excelente experiencia trabajando con AstroStar!

Saludos cordiales,
Equipo AstroStar

---
Este es un email automático del sistema AstroStar.
© ${new Date().getFullYear()} AstroStar - Sistema de Gestión Deportiva
    `;
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

      // Si no hay transporter configurado, simular envío
      if (!this.transporter) {
        return { success: true, messageId: "simulated-" + Date.now() };
      }

      const result = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId,
        message: "Email enviado exitosamente",
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
   * Notificar al deportista que se creó una cita
   */
    async sendAppointmentNotification({ to, athleteName, date, time, specialistName }) {
    if (!to) {
      return { success: false, message: "Correo destinatario no definido" };
    }

    const ready = await this.ensureTransporter();
    if (!ready.ok) {
      console.warn("??  Notificaci?n de cita no enviada:", ready.reason);
      return { success: false, error: ready.reason };
    }

    const subject = "Nueva cita programada";
    const plainText = `Hola ${athleteName || "deportista"}, se program? una cita para el ${date} a las ${time}${
      specialistName ? ` con ${specialistName}` : ""
    }. Ingresa al m?dulo de citas para m?s detalles.`;

    const html = `
      <p>Hola ${athleteName || "deportista"},</p>
      <p>Se program? una cita para el <strong>${date}</strong> a las <strong>${time}</strong>${
        specialistName ? ` con <strong>${specialistName}</strong>` : ""
      }.</p>
      <p>Por favor ingresa al m?dulo de citas para m?s detalles.</p>
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

  generateScheduleNotificationTemplate({
    employeeName,
    actionTitle,
    scheduleDate,
    timeRange,
    recurrenceLabel,
    description,
  }) {
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const hasDescription = description && String(description).trim() !== "";
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${actionTitle} - AstroStar</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 640px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 28px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: #f8f9fb; padding: 28px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
        .badge { display: inline-block; padding: 6px 12px; background: #e5e7ff; color: #4c51bf; border-radius: 999px; font-weight: 600; font-size: 13px; letter-spacing: 0.3px; }
        .card { background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px 18px; margin: 18px 0; }
        .card h3 { margin: 0 0 8px 0; color: #111827; }
        .detail { margin: 6px 0; font-size: 14px; color: #374151; }
        .highlight { color: #4c51bf; font-weight: 700; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 22px; text-decoration: none; border-radius: 8px; margin-top: 18px; font-weight: 600; }
        .footer { text-align: center; margin-top: 18px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="badge">${actionTitle}</div>
          <h1 style="margin: 10px 0 0 0;">Horario de trabajo</h1>
          <p style="margin: 8px 0 0 0; opacity: .9;">AstroStar - Sistema de Gestión</p>
        </div>
        <div class="content">
          <p>Hola <strong>${employeeName}</strong>,</p>
          <p>Tu horario ha sido <strong>${actionTitle.toLowerCase()}</strong>. Aquí están los detalles:</p>

          <div class="card">
            <h3>Detalle del horario</h3>
            <p class="detail">📅 <span class="highlight">${scheduleDate}</span></p>
            <p class="detail">⏰ <span class="highlight">${timeRange}</span></p>
            <p class="detail">🔁 ${recurrenceLabel}</p>
            ${hasDescription ? `<p class="detail">📝 ${description}</p>` : ""}
          </div>

          <div class="card" style="background:#f0f4ff;">
            <h3>¿Qué debo hacer?</h3>
            <ul style="margin: 8px 0 0 16px; padding: 0; color:#374151;">
              <li>Revisa tu agenda y confirma disponibilidad.</li>
              <li>Si detectas algún conflicto, contacta al coordinador.</li>
              <li>Guarda este correo como referencia.</li>
            </ul>
          </div>

          <div style="text-align:center;">
            <a class="button" href="${baseUrl}/login">Abrir AstroStar</a>
          </div>

          <p style="margin-top:16px; color:#4b5563; font-size:14px;">
            Este correo se envió al email registrado en tu perfil. Si no reconoces este cambio, responde a tu coordinador.
          </p>
        </div>
        <div class="footer">
          <p>Este es un correo automático. Por favor no respondas a este mensaje.</p>
          <p>© ${new Date().getFullYear()} AstroStar</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  generateScheduleNotificationText({
    employeeName,
    actionTitle,
    scheduleDate,
    timeRange,
    recurrenceLabel,
    description,
  }) {
    return `${actionTitle} - AstroStar

Hola ${employeeName},

Tu horario ha sido ${actionTitle.toLowerCase()}.

Fecha: ${scheduleDate}
Horario: ${timeRange}
Repetición: ${recurrenceLabel}
${description ? `Descripción: ${description}\n` : ""} 
Si necesitas cambios, contacta a tu coordinador.

Este correo fue enviado al email registrado en tu perfil.
`;
  }

  /**
   * Notificar al empleado cuando se crea o actualiza su horario
   */
  async sendEmployeeScheduleNotification({
    to,
    employeeName,
    action = "created",
    scheduleDate,
    startTime,
    endTime,
    recurrence = "no",
    description = "",
  }) {
    if (!to) {
      return { success: false, message: "Correo destinatario no definido" };
    }

    const ready = await this.ensureTransporter();
    if (!ready.ok) {
      console.warn("⚠️  Notificación de horario no enviada:", ready.reason);
      return { success: false, error: ready.reason };
    }

    const actionTitle =
      action === "updated" ? "Horario actualizado" : "Nuevo horario asignado";
    const formattedDate = this.formatScheduleDate(scheduleDate);
    const timeRange =
      startTime && endTime ? `${startTime} - ${endTime}` : startTime || "";
    const recurrenceLabel = this.formatScheduleRecurrence(recurrence);

    const mailOptions = {
      from: {
        name: "AstroStar - Sistema de Gestión",
        address: process.env.EMAIL_USER || "astrostar.system@gmail.com",
      },
      to,
      subject: `${actionTitle} - AstroStar`,
      html: this.generateScheduleNotificationTemplate({
        employeeName,
        actionTitle,
        scheduleDate: formattedDate,
        timeRange,
        recurrenceLabel,
        description,
      }),
      text: this.generateScheduleNotificationText({
        employeeName,
        actionTitle,
        scheduleDate: formattedDate,
        timeRange,
        recurrenceLabel,
        description,
      }),
    };

    if (!this.transporter) {
      console.log("📧 (simulado) Notificación de horario ->", to);
      return { success: true, simulated: true };
    }

    try {
      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.warn("⚠️  Error enviando notificación de horario:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generar template HTML para email de bienvenida de deportista
   */
  generateAthleteWelcomeEmailTemplate(firstName, lastName, email, password) {
    return `
    <!DOCTYPE html>
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
                
                <p>¡Nos complace darte la bienvenida a AstroStar! Tu cuenta de <strong>deportista</strong> ha sido creada exitosamente.</p>
                
                <div class="credentials-box">
                    <h3>🔐 Tus Credenciales de Acceso</h3>
                    <div class="credential-item">
                        <strong>📧 Usuario:</strong> ${email}
                    </div>
                    <div class="credential-item">
                        <strong>🔑 Contraseña:</strong> Tu documento de identidad
                    </div>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Importante - Seguridad:</strong>
                    <ul>
                        <li>Por razones de seguridad, es recomendable cambiar tu contraseña después de tu primer inicio de sesión</li>
                        <li>Elige una contraseña segura que incluya letras, números y símbolos</li>
                        <li>No compartas tus credenciales con nadie</li>
                        <li>Si tienes problemas para acceder, contacta al administrador</li>
                    </ul>
                </div>
                
                <div style="text-align: center;">
                    <a href="${
                      process.env.FRONTEND_URL || "http://localhost:3000"
                    }/login" class="button">
                        🚀 Acceder al Sistema
                    </a>
                </div>
                
                <h3>📋 Próximos Pasos:</h3>
                <ol>
                    <li>Inicia sesión con tu correo y tu documento de identidad como contraseña</li>
                    <li><strong>Cambia tu contraseña inmediatamente</strong> por una segura y personal</li>
                    <li>Completa tu perfil si es necesario</li>
                    <li>Revisa tu información deportiva y categoría</li>
                </ol>
                
                <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar al equipo de soporte.</p>
                
                <p>¡Esperamos que tengas una excelente experiencia deportiva con AstroStar!</p>
                
                <p>Saludos cordiales,<br>
                <strong>Equipo AstroStar</strong></p>
            </div>
            
            <div class="footer">
                <p>Este es un email automático del sistema AstroStar. Por favor no respondas a este mensaje.</p>
                <p>© ${new Date().getFullYear()} AstroStar - Sistema de Gestión Deportiva</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generar texto plano para email de bienvenida de deportista
   */
  generateAthleteWelcomeEmailText(firstName, lastName, email, password) {
    return `
¡Bienvenido a AstroStar!

Hola ${firstName} ${lastName},

Nos complace darte la bienvenida a AstroStar. Tu cuenta de deportista ha sido creada exitosamente.

CREDENCIALES DE ACCESO:
- Usuario: ${email}
- Contraseña: Tu documento de identidad

IMPORTANTE - SEGURIDAD:
- Tu contraseña inicial es tu número de documento de identidad
- Por razones de seguridad, DEBES CAMBIARLA INMEDIATAMENTE después de tu primer inicio de sesión
- Elige una contraseña segura que incluya letras, números y símbolos
- No compartas tus credenciales con nadie
- Si tienes problemas para acceder, contacta al administrador

PRÓXIMOS PASOS:
1. Inicia sesión con tu correo y tu documento de identidad como contraseña
2. CAMBIA TU CONTRASEÑA INMEDIATAMENTE por una segura y personal
3. Completa tu perfil si es necesario
4. Revisa tu información deportiva y categoría

Accede al sistema en: ${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/login

¡Esperamos que tengas una excelente experiencia deportiva con AstroStar!

Saludos cordiales,
Equipo AstroStar

---
Este es un email automático del sistema AstroStar.
© ${new Date().getFullYear()} AstroStar - Sistema de Gestión Deportiva
    `;
  }

  /**
   * Enviar email de recuperación de contraseña
   */
  async sendPasswordResetEmail(email, resetToken) {
    try {
      console.log("📧 Intentando enviar email de recuperación a:", email);

      const mailOptions = {
        from: {
          name: "AstroStar - Sistema de Gestión",
          address: process.env.EMAIL_USER || "astrostar.system@gmail.com",
        },
        to: email,
        subject: "🔐 Recuperación de Contraseña - AstroStar",
        html: this.generatePasswordResetTemplate(email, resetToken),
        text: `Recuperación de contraseña para AstroStar\n\nHaz clic en el siguiente enlace para restablecer tu contraseña:\n${process.env.FRONTEND_URL}/reset-password?token=${resetToken}\n\nEste enlace expira en 1 hora.`,
      };

      if (!this.transporter) {
        console.log("⚠️  Transporter no configurado, simulando envío");
        return { success: true, messageId: "simulated-reset-" + Date.now() };
      }

      console.log("📤 Enviando email...");
      const result = await this.transporter.sendMail(mailOptions);
      console.log(
        "✅ Email enviado exitosamente. MessageId:",
        result.messageId,
      );
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("❌ Error enviando email de recuperación:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generar template para recuperación de contraseña
   */
  generatePasswordResetTemplate(email, resetToken) {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de Contraseña</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 25px 0; border-radius: 10px; }
            .code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Recuperación de Contraseña</h1>
                <p style="margin: 0; opacity: 0.9;">AstroStar - Sistema de Gestión</p>
            </div>
            <div class="content">
                <p>Hola,</p>
                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en AstroStar.</p>
                <p><strong>Tu código de verificación es:</strong></p>
                
                <div class="code-box">
                    <div class="code">${resetToken}</div>
                    <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Ingresa este código en la página de recuperación</p>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Importante:</strong>
                    <ul style="margin: 10px 0;">
                        <li>Este código expira en <strong>15 minutos</strong></li>
                        <li>Si no solicitaste este cambio, ignora este email</li>
                        <li>Tu contraseña actual seguirá siendo válida hasta que la cambies</li>
                        <li>Nunca compartas este código con nadie</li>
                    </ul>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                    Si tienes problemas, contacta con el administrador del sistema.
                </p>
            </div>
            <div class="footer">
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                <p>© ${new Date().getFullYear()} AstroStar. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Enviar correo de confirmación de pre-inscripción
   */
  async sendPreRegistrationEmail(preRegistrationData) {
    try {
      const {
        nombres,
        apellidos,
        numeroDocumento,
        fechaNacimiento,
        telefono,
        correo,
      } = preRegistrationData;

      const mailOptions = {
        from: {
          name: "Fundación Manuela Vanegas",
          address: process.env.EMAIL_USER || "fundacion@example.com",
        },
        to: correo,
        subject: "¡Bienvenida a la Fundación Manuela Vanegas! - Próximos Pasos",
        html: this.generatePreRegistrationTemplate(
          nombres,
          apellidos,
          numeroDocumento,
          fechaNacimiento,
          telefono,
          correo,
        ),
      };

      if (!this.transporter) {
        console.log("⚠️  Transporter no configurado, simulando envío");
        return { success: true, messageId: "simulated-prereg-" + Date.now() };
      }

      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error(
        "❌ Error enviando email de pre-inscripción:",
        error.message,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar correo de agradecimiento a donante creado desde el landing
   */
  async sendDonorLandingEmail(donorData) {
    try {
      const mailOptions = {
        from: {
          name: "Fundaci\u00f3n Manuela Vanegas",
          address: process.env.EMAIL_USER || "fundacion@example.com",
        },
        to: donorData.correo,
        subject: "Gracias por tu inter\u00e9s en apoyar la fundaci\u00f3n",
        html: this.generateDonorLandingTemplate(donorData),
      };

      if (!this.transporter) {
        console.log("ðŸ“§ (simulado) Email a donante landing ->", donorData.correo);
        return { success: true, messageId: "simulated-donor-" + Date.now() };
      }

      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("Error enviando email a donante landing:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generar template para pre-inscripción
   */
  generatePreRegistrationTemplate(
    nombres,
    apellidos,
    numeroDocumento,
    fechaNacimiento,
    telefono,
    correo,
  ) {
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de Pre-inscripción</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #B595FF 0%, #9BE9FF 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">¡Bienvenida!</h1>
                  <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Fundación Manuela Vanegas</p>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 22px;">Hola ${nombres},</h2>
                  
                  <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                    ¡Gracias por tu interés en formar parte de nuestra fundación! Hemos recibido tu pre-inscripción exitosamente.
                  </p>
                  
                  <div style="background-color: #f8f9fa; border-left: 4px solid #B595FF; padding: 20px; margin: 20px 0; border-radius: 5px;">
                    <h3 style="color: #B595FF; margin: 0 0 15px 0; font-size: 18px;">📋 Tus Datos Registrados:</h3>
                    <p style="color: #666666; margin: 5px 0; font-size: 14px;"><strong>Nombre:</strong> ${nombres} ${apellidos}</p>
                    <p style="color: #666666; margin: 5px 0; font-size: 14px;"><strong>Número de Documento:</strong> ${numeroDocumento}</p>
                    <p style="color: #666666; margin: 5px 0; font-size: 14px;"><strong>Fecha de Nacimiento:</strong> ${formatDate(
                      fechaNacimiento,
                    )}</p>
                    <p style="color: #666666; margin: 5px 0; font-size: 14px;"><strong>Teléfono:</strong> ${telefono}</p>
                    <p style="color: #666666; margin: 5px 0; font-size: 14px;"><strong>Correo:</strong> ${correo}</p>
                  </div>
                  
                  <h3 style="color: #333333; margin: 30px 0 15px 0; font-size: 20px;">🎯 Próximo Paso: Completar tu Matrícula</h3>
                  
                  <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                    Para continuar con el proceso de matrícula, te invitamos a visitarnos en:
                  </p>
                  
                  <div style="background-color: #B595FF; color: #ffffff; padding: 25px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="margin: 0 0 15px 0; font-size: 18px;">📍 Unidad Deportiva Cristo Rey</h4>
                    <p style="margin: 5px 0; font-size: 14px;"><strong>Dirección:</strong> Copacabana, Antioquia</p>
                    <p style="margin: 5px 0; font-size: 14px;"><strong>Teléfono:</strong> ${
                      process.env.CONTACT_PHONE || "(604) 123-4567"
                    }</p>
                    <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${
                      process.env.CONTACT_EMAIL || "contacto@fundacionmv.com"
                    }</p>
                    <p style="margin: 5px 0; font-size: 14px;"><strong>Horario:</strong> Lunes a Viernes, 8:00 AM - 5:00 PM</p>
                  </div>
                  
                  <h3 style="color: #333333; margin: 30px 0 15px 0; font-size: 18px;">📄 Documentos que debes traer:</h3>
                  <ul style="color: #666666; line-height: 1.8; font-size: 15px; padding-left: 20px;">
                    <li>Documento de identidad (original y copia)</li>
                    <li>Registro civil de nacimiento</li>
                    <li>Certificado médico</li>
                    <li>2 fotos tamaño cédula</li>
                    <li>Documento de identidad del acudiente (si es menor de edad)</li>
                  </ul>
                  
                  <div style="background-color: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 25px 0; border-radius: 5px;">
                    <p style="color: #1976D2; margin: 0; font-size: 14px;">
                      💡 <strong>Importante:</strong> Nuestro equipo revisará tu información y te contactaremos pronto para coordinar tu visita.
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Social Media -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                  <h4 style="color: #333333; margin: 0 0 15px 0; font-size: 16px;">Síguenos en Redes Sociales</h4>
                  <p style="margin: 10px 0;">
                    <a href="https://www.instagram.com/fundacionmv.co" target="_blank" style="color: #B595FF; text-decoration: none; margin: 0 10px;">Instagram</a> |
                    <a href="https://wa.me/573245721322" target="_blank" style="color: #B595FF; text-decoration: none; margin: 0 10px;">WhatsApp</a> |
                    <a href="mailto:fundacionmanuelavanuelvanegas@gmail.com" style="color: #B595FF; text-decoration: none; margin: 0 10px;">Email</a> |
                    <a href="https://www.youtube.com/@FundacionManuelaVanegas" target="_blank" style="color: #B595FF; text-decoration: none; margin: 0 10px;">YouTube</a>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #333333; padding: 20px; text-align: center;">
                  <p style="color: #ffffff; margin: 0; font-size: 12px;">
                    © ${new Date().getFullYear()} Fundación Manuela Vanegas. Todos los derechos reservados.
                  </p>
                  <p style="color: #999999; margin: 10px 0 0 0; font-size: 11px;">
                    Este correo fue enviado a ${correo} porque te pre-inscribiste en nuestra fundación.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;
  }

  generateDonorLandingTemplate(donor) {
    const name =
      donor.nombre ||
      donor.nombreCompleto ||
      donor.razonSocial ||
      "Amigo de la fundaci\u00f3n";

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Gracias por tu apoyo</title>
      <style>
        body { font-family: 'Arial', sans-serif; background: #f7f9fc; color: #2d2d2d; margin: 0; padding: 0; }
        a { color: #4f46e5; text-decoration: none; }
      </style>
    </head>
    <body style="font-family: Arial, sans-serif; color: #333; background: #f7f7fb; margin: 0; padding: 0;">
      <table width="100%" cellspacing="0" cellpadding="0" style="padding:24px 0;">
        <tr>
          <td align="center">
            <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:linear-gradient(135deg,#6b7bff,#9BE9FF);padding:32px;color:#fff;">
                  <h1 style="margin:0;font-size:24px;">\u00a1Gracias por tu inter\u00e9s en donar!</h1>
                  <p style="margin:6px 0 0;font-size:15px;">Fundaci\u00f3n Manuela Vanegas</p>
                </td>
              </tr>
              <tr>
                <td style="padding:28px 32px;">
                  <p style="font-size:16px;">Hola <strong>${name}</strong>,</p>
                  <p style="font-size:15px; line-height:1.6;">
                    Recibimos tu informaci\u00f3n y en breve un miembro del equipo se comunicar\u00e1 contigo para confirmar los detalles de tu apoyo. Te contactaremos por el medio que registraste para continuar el proceso.
                  </p>
                  <div style="background:#f4f6ff;border-left:4px solid #B595FF;padding:16px;border-radius:10px;margin:18px 0;">
                    <p style="margin:0;font-size:14px;color:#4a4a4a;"><strong>Tus datos registrados</strong></p>
                    <p style="margin:4px 0;font-size:14px;">Correo: ${donor.correo || "No informado"}</p>
                    <p style="margin:4px 0;font-size:14px;">Tel\u00e9fono: ${donor.telefono || "No informado"}</p>
                    <p style="margin:4px 0;font-size:14px;">Ciudad / Pa\u00eds: ${donor.ciudad || ""} ${donor.pais || ""}</p>
                    <p style="margin:4px 0;font-size:14px;">Mensaje: ${donor.descripcion || "No informado"}</p>
                  </div>
                  <div style="background:#fff7e6;border:1px solid #ffe4b5;border-radius:10px;padding:14px;margin:18px 0;">
                    <p style="margin:0;font-size:14px;color:#8a6d3b;">
                      Si ya hiciste tu donaci\u00f3n y necesitas tu certificado, escr\u00edbenos a
                      <a href="mailto:fundacionmanuelavanegas@gmail.com"><strong> fundacionmanuelavanegas@gmail.com</strong></a>.
                    </p>
                  </div>
                  <p style="font-size:14px; color:#555;">
                    Si este mensaje no corresponde a tu solicitud, por favor ign\u00f3ralo.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background:#f3f3f6;padding:16px 32px;text-align:center;font-size:12px;color:#777;">
                  \u00a9 ${new Date().getFullYear()} Fundaci\u00f3n Manuela Vanegas
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;
  }

  /**
   * Enviar código de verificación para cambio de email
   */
  async sendEmailVerificationCode(email, verificationCode, firstName) {
    try {
      console.log("📧 Intentando enviar código de verificación a:", email);

      const mailOptions = {
        from: {
          name: "AstroStar - Sistema de Gestión",
          address: process.env.EMAIL_USER || "astrostar.system@gmail.com",
        },
        to: email,
        subject: "📧 Verificación de Cambio de Correo - AstroStar",
        html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verificación de Correo</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 25px 0; border-radius: 10px; }
            .code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 Verificación de Correo Electrónico</h1>
              <p style="margin: 0; opacity: 0.9;">AstroStar - Sistema de Gestión</p>
            </div>
            <div class="content">
              <p>Hola ${firstName},</p>
              <p>Recibimos una solicitud para cambiar el correo electrónico de tu cuenta en AstroStar.</p>
              
              <p><strong>Tu código de verificación es:</strong></p>
              <div class="code-box">
                <div class="code">${verificationCode}</div>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Ingresa este código para confirmar el cambio</p>
              </div>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul style="margin: 10px 0;">
                  <li>Este código expira en <strong>15 minutos</strong></li>
                  <li>Si no solicitaste este cambio, ignora este email</li>
                  <li>Nunca compartas este código con nadie</li>
                </ul>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Si tienes problemas, contacta con el administrador del sistema.
              </p>
            </div>
            <div class="footer">
              <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              <p>© ${new Date().getFullYear()} AstroStar. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
        `,
        text: `Verificación de Cambio de Correo - AstroStar\n\nHola ${firstName},\n\nTu código de verificación es: ${verificationCode}\n\nEste código expira en 15 minutos.\n\nSi no solicitaste este cambio, ignora este email.`,
      };

      if (!this.transporter) {
        console.log("⚠️  Transporter no configurado, simulando envío");
        return {
          success: true,
          messageId: "simulated-verification-" + Date.now(),
        };
      }

      console.log("📤 Enviando email de verificación...");
      const result = await this.transporter.sendMail(mailOptions);
      console.log(
        "✅ Email de verificación enviado exitosamente. MessageId:",
        result.messageId,
      );
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("❌ Error enviando email de verificación:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar invitación RSVP para evento
   */
  async sendRSVPInvitation(invitation, event, participant, icsContent) {
    try {
      if (!this.transporter) {
        console.log("⚠️  Servicio de email no disponible");
        return { success: false, error: "Email service not configured" };
      }

      const { getRSVPInvitationHTML } =
        await import("../templates/rsvpInvitationTemplate.js");
      const { formatEventDate, formatEventTime } =
        await import("../utils/dateFormatter.js");

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

      console.log(
        `📤 Enviando invitación RSVP a: ${invitation.recipientEmail}`,
      );
      const result = await this.transporter.sendMail(mailOptions);
      console.log("✅ Invitación RSVP enviada. MessageId:", result.messageId);

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("❌ Error enviando invitación RSVP:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar recordatorio de invitación pendiente
   */
  async sendRSVPReminder(invitation, event, participant) {
    try {
      if (!this.transporter) {
        return { success: false, error: "Email service not configured" };
      }

      const { getRSVPReminderHTML } =
        await import("../templates/rsvpReminderTemplate.js");
      const { formatEventDate, formatEventTime } =
        await import("../utils/dateFormatter.js");

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

      console.log(
        `📤 Enviando recordatorio RSVP a: ${invitation.recipientEmail}`,
      );
      const result = await this.transporter.sendMail(mailOptions);

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("❌ Error enviando recordatorio RSVP:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar recordatorio de evento confirmado
   */
  async sendConfirmedEventReminder(invitation, event, participant) {
    try {
      if (!this.transporter) {
        return { success: false, error: "Email service not configured" };
      }

      const { getConfirmedReminderHTML } =
        await import("../templates/rsvpReminderTemplate.js");
      const { formatEventDate, formatEventTime } =
        await import("../utils/dateFormatter.js");

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
        subject: `📅 Recordatorio: ${event.name} es mañana`,
        html: htmlContent,
      };

      console.log(
        `📤 Enviando recordatorio de evento a: ${invitation.recipientEmail}`,
      );
      const result = await this.transporter.sendMail(mailOptions);

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("❌ Error enviando recordatorio de evento:", error.message);
      return { success: false, error: error.message };
    }
  }
}

export default new EmailService();

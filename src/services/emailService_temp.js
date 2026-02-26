?/**
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
    // Permite simular env�o cuando la red bloquea el SMTP.
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
          console.log("??  Servicio de email en modo simulaci�n (sin SMTP).");
          return true;
        }
        return false;
      }

      await this.transporter.verify();
      return true;
    } catch (error) {
      const msg = error?.message || "";
      console.warn("⚠️  No se pudo verificar la conexión de email:", msg);

      // Si falló por timeout/conexión, intentar automáticamente cambiando de puerto
      const currentPort = this.transporter?.options?.port;
      const isTimeoutOrConn =
        error?.code === "ETIMEDOUT" ||
        error?.code === "ECONNREFUSED" ||
        error?.code === "ESOCKET" ||
        /timedout/i.test(msg) ||
        /time\s*out/i.test(msg) ||
        /timeout/i.test(msg);

      if (isTimeoutOrConn) {
        const nextPort = currentPort === 465 ? 587 : 465;
        console.warn(`↻ Reintentando verificación por puerto ${nextPort}...`);
        await this.initializeTransporter({ overridePort: nextPort });
        if (this.transporter) {
          try {
            await this.transporter.verify();
            console.log(`✅ Conexión de email verificada por puerto ${nextPort}.`);
            return true;
          } catch (retryError) {
            console.warn(
              `⚠️  Verificación por puerto ${nextPort} falló:`,
              retryError?.message || retryError,
            );
          }
        }
        // Si tampoco funcionó y se permite simular, no bloquear el arranque
        if (this.shouldSimulate()) {
          console.warn("⚠️  SMTP inalcanzable; habilitando modo simulación de correos.");
          this.transporter = null;
          return true;
        }
      }

      // Último recurso: simulación
      if (this.shouldSimulate()) {
        console.warn("⚠️  No se pudo verificar SMTP; continuando en modo simulación.");
        this.transporter = null;
        return true;
      }

      // Fallback: servidor alterno si está configurado (Mailtrap u otro)
      const fallbackHost =
        process.env.FALLBACK_SMTP_HOST || process.env.MAILTRAP_HOST || null;
      const fallbackPort =
        Number(process.env.FALLBACK_SMTP_PORT || process.env.MAILTRAP_PORT) || 0;
      const fallbackUser =
        process.env.FALLBACK_EMAIL_USER || process.env.MAILTRAP_USER || null;
      const fallbackPass =
        process.env.FALLBACK_EMAIL_PASSWORD || process.env.MAILTRAP_PASSWORD || null;

      if (fallbackHost && fallbackPort && fallbackUser && fallbackPass) {
        console.warn(
          `↻ Reintentando verificación con servidor alterno ${fallbackHost}:${fallbackPort}...`,
        );
        await this.initializeTransporter({
          overrideHost: fallbackHost,
          overridePort: fallbackPort,
          overrideAuth: { user: fallbackUser, pass: fallbackPass },
        });
        if (this.transporter) {
          try {
            await this.transporter.verify();
            console.log("✅ Conexión de email verificada con servidor alterno.");
            return true;
          } catch (retryAltError) {
            console.warn(
              "⚠️  Verificación con servidor alterno falló:",
              retryAltError?.message || retryAltError,
            );
          }
        }
      }

      return false;
    }
  }

  /**
   * Asegurar que el transporter esté disponible para enviar correos.
   * Reintenta inicializar usando las variables de entorno actuales.
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
      console.warn("??  Sin transporter; usando modo simulaci�n de correos.");
      return { ok: true, simulated: true };
    }

    return {
      ok: false,
      reason:
        "Servicio de email no configurado. Define EMAIL_USER y EMAIL_PASSWORD (app password de Gmail).",
    };
  }

  /**
   * Enviar email con reintentos (puerto 465 y servidor alterno)
   */
  async sendMailWithFallback(mailOptions) {
    const ready = await this.ensureTransporter();
    if (!ready.ok) {
      if (this.shouldSimulate()) {
        console.warn("??  Servicio de email no disponible; enviando en modo simulado.");
        return { success: true, messageId: "simulated-" + Date.now(), simulated: true };
      }
      return { success: false, error: ready.reason };
    }

    const trySend = async () => {
      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    };

    try {
      return await trySend();
    } catch (error) {
      console.warn("⚠️  Error enviando email:", error?.message || error);

      // Fallback 1: reintentar cambiando puerto (465 <-> 587)
      const currentPort = this.transporter?.options?.port;
      const isTimeoutOrConn =
        error?.code === "ETIMEDOUT" ||
        error?.code === "ECONNREFUSED" ||
        /timedout/i.test(error?.message || "");

      if (isTimeoutOrConn) {
        const nextPort = currentPort === 465 ? 587 : 465;
        console.warn(`↻ Reintentando envío por puerto ${nextPort}...`);
        await this.initializeTransporter({ overridePort: nextPort });
        if (this.transporter) {
          try {
            return await trySend();
          } catch (retryError) {
            console.warn(
              `⚠️  Reintento por puerto ${nextPort} falló:`,
              retryError?.message || retryError,
            );
          }
        }

        if (this.shouldSimulate()) {
          console.warn("??  Env�o fall� por red; usando modo simulado.");
          return { success: true, messageId: "simulated-" + Date.now(), simulated: true };
        }
      }

      // Fallback 2: servidor alterno (Mailtrap u otro)
      const fallbackHost =
        process.env.FALLBACK_SMTP_HOST || process.env.MAILTRAP_HOST || null;
      const fallbackPort =
        Number(process.env.FALLBACK_SMTP_PORT || process.env.MAILTRAP_PORT) || 0;
      const fallbackUser =
        process.env.FALLBACK_EMAIL_USER || process.env.MAILTRAP_USER || null;
      const fallbackPass =
        process.env.FALLBACK_EMAIL_PASSWORD || process.env.MAILTRAP_PASSWORD || null;

      if (fallbackHost && fallbackPort && fallbackUser && fallbackPass) {
        console.warn(
          `↻ Reintentando envío con servidor alterno ${fallbackHost}:${fallbackPort}...`,
        );
        await this.initializeTransporter({
          overrideHost: fallbackHost,
          overridePort: fallbackPort,
          overrideAuth: { user: fallbackUser, pass: fallbackPass },
        });
        if (this.transporter) {
          try {
            const altResult = await trySend();
            return { ...altResult, retriedWithFallback: true, fallbackHost, fallbackPort };
          } catch (retryAltError) {
            console.warn(
              "⚠️  Reintento con servidor alterno falló:",
              retryAltError?.message || retryAltError,
            );
            return { success: false, error: retryAltError?.message || retryAltError };
          }
        }
      }

      if (isTimeoutOrConn && this.shouldSimulate()) {
        console.warn("??  Todos los intentos fallaron; env�o simulado.");
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
          name: "AstroStar - Sistema de Gesti\u00f3n",
          address: process.env.EMAIL_USER || "astrostar.system@gmail.com",
        },
        to: email,
        subject: "\ud83c\udf89 Bienvenido a AstroStar - Credenciales de Acceso",
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

      const result = await this.sendMailWithFallback(mailOptions);
      if (result.success) {
        return {
          success: true,
          messageId: result.messageId,
          message: "Email enviado exitosamente",
          retriedWithFallback: result.retriedWithFallback || false,
        };
      }

      return {
        success: false,
        error: result.error || "No se pudo enviar el email",
        message: "Error enviando email",
      };
    } catch (error) {
      console.warn(
        "\u26a0\ufe0f  Error enviando email, pero continuando:",
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

      // Fallback: si falla por timeout/conexión en el puerto actual, probar puerto 465
      const currentPort = this.transporter?.options?.port;
      const isTimeoutOrConn =
        error?.code === "ETIMEDOUT" ||
        error?.code === "ECONNREFUSED" ||
        /timedout/i.test(error?.message || "");

      if (isTimeoutOrConn && currentPort !== 465) {
        console.warn("↻ Reintentando envío por puerto 465...");
        await this.initializeTransporter({ overridePort: 465 });
        if (this.transporter) {
          try {
            const retryResult = await this.transporter.sendMail(mailOptions);
            return { success: true, messageId: retryResult.messageId, retriedWith465: true };
          } catch (retryError) {
            console.warn("⚠️  Reintento falló:", retryError.message);
            // continuar a posible fallback
          }
        }
      }

      // Fallback 2: usar servidor alterno (por ej. Mailtrap) si está configurado
      const fallbackHost =
        process.env.FALLBACK_SMTP_HOST || process.env.MAILTRAP_HOST || null;
      const fallbackPort =
        Number(process.env.FALLBACK_SMTP_PORT || process.env.MAILTRAP_PORT) || 0;
      const fallbackUser =
        process.env.FALLBACK_EMAIL_USER || process.env.MAILTRAP_USER || null;
      const fallbackPass =
        process.env.FALLBACK_EMAIL_PASSWORD || process.env.MAILTRAP_PASSWORD || null;

      if (fallbackHost && fallbackPort && fallbackUser && fallbackPass) {
        console.warn(
          `↻ Reintentando con servidor alterno ${fallbackHost}:${fallbackPort}...`,
        );
        await this.initializeTransporter({
          overrideHost: fallbackHost,
          overridePort: fallbackPort,
          overrideAuth: { user: fallbackUser, pass: fallbackPass },
        });
        if (this.transporter) {
          try {
            const retryAlt = await this.transporter.sendMail(mailOptions);
            return {
              success: true,
              messageId: retryAlt.messageId,
              retriedWithFallback: true,
              fallbackHost,
              fallbackPort,
            };
          } catch (retryAltError) {
            console.warn("⚠️  Reintento con servidor alterno falló:", retryAltError.message);
            return { success: false, error: retryAltError.message };
          }
        }
      }

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
        return { success: true, messageId: "simulated-reset-" + Date.now() };
      }

      const result = await this.transporter.sendMail(mailOptions);
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
      console.log('📧 [EmailService] Iniciando envío de email de pre-inscripción');
      console.log('📧 [EmailService] Datos recibidos:', preRegistrationData);
      
      const {
        firstName,
        middleName,
        lastName,
        secondLastName,
        identification,
        birthDate,
        phoneNumber,
        email,
      } = preRegistrationData;

      // Construir nombre completo
      const nombreCompleto = [firstName, middleName, lastName, secondLastName]
        .filter(Boolean)
        .join(' ');

      console.log('📧 [EmailService] Nombre completo construido:', nombreCompleto);
      console.log('📧 [EmailService] Correo destino:', email);

      const mailOptions = {
        from: {
          name: "Fundación Manuela Vanegas",
          address: process.env.EMAIL_USER || "fundacion@example.com",
        },
        to: email,
        subject: "¡Bienvenida a la Fundación Manuela Vanegas! - Próximos Pasos",
        html: this.generatePreRegistrationTemplate(
          firstName,
          nombreCompleto,
          identification,
          birthDate,
          phoneNumber,
          email
        ),
      };

      if (!this.transporter) {
        console.log("⚠️  [EmailService] Transporter no configurado, simulando envío");
        return { success: true, messageId: "simulated-prereg-" + Date.now() };
      }

      console.log('📤 [EmailService] Enviando email...');
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ [EmailService] Email enviado exitosamente. MessageId:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error(
        "❌ [EmailService] Error enviando email de pre-inscripción:",
        error.message
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

      const result = await this.sendMailWithFallback(mailOptions);
      if (result.success) {
        if (result.simulated) {
          console.log("?? (simulado) Email a donante landing ->", donorData.correo);
        }
        return { success: true, messageId: result.messageId, simulated: !!result.simulated };
      }

      return { success: false, error: result.error || "No se pudo enviar el email" };
    } catch (error) {
      console.error("Error enviando email a donante landing:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generar template para pre-inscripción
   */
  generatePreRegistrationTemplate(
    firstName,
    nombreCompleto,
    identification,
    birthDate,
    phoneNumber,
    email
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
                  <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 22px;">Hola ${firstName},</h2>
                  
                  <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                    ¡Gracias por tu interés en formar parte de nuestra fundación! Hemos recibido tu pre-inscripción exitosamente.
                  </p>
                  
                  <div style="background-color: #f8f9fa; border-left: 4px solid #B595FF; padding: 20px; margin: 20px 0; border-radius: 5px;">
                    <h3 style="color: #B595FF; margin: 0 0 15px 0; font-size: 18px;">📋 Tus Datos Registrados:</h3>
                    <p style="color: #666666; margin: 5px 0; font-size: 14px;"><strong>Nombre:</strong> ${nombreCompleto}</p>
                    <p style="color: #666666; margin: 5px 0; font-size: 14px;"><strong>Número de Documento:</strong> ${identification}</p>
                    <p style="color: #666666; margin: 5px 0; font-size: 14px;"><strong>Fecha de Nacimiento:</strong> ${formatDate(
                      birthDate
                    )}</p>
                    <p style="color: #666666; margin: 5px 0; font-size: 14px;"><strong>Teléfono:</strong> ${phoneNumber}</p>
                    <p style="color: #666666; margin: 5px 0; font-size: 14px;"><strong>Correo:</strong> ${email}</p>
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
                    Este correo fue enviado a ${email} porque te pre-inscribiste en nuestra fundación.
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
        return {
          success: true,
          messageId: "simulated-verification-" + Date.now(),
        };
      }

      const result = await this.transporter.sendMail(mailOptions);
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

      const result = await this.transporter.sendMail(mailOptions);
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

      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("❌ Error enviando recordatorio de evento:", error.message);
      return { success: false, error: error.message };
    }
  }

    /**
     * Enviar correo de bienvenida a donante desde landing
     */
    async sendDonorWelcomeEmail(donorData) {
      try {
        const { generateDonorWelcomeHTML, generateDonorWelcomeText } = await import('../templates/donorWelcomeTemplate.js');

        const mailOptions = {
          from: {
            name: "Fundaci�n Manuela Vanegas",
            address: process.env.EMAIL_USER || "fundacion@example.com",
          },
          to: donorData.correo,
          subject: "�Gracias por tu inter�s en donar! - Fundaci�n Manuela Vanegas",
          html: generateDonorWelcomeHTML(donorData),
          text: generateDonorWelcomeText(donorData),
        };

        const result = await this.sendMailWithFallback(mailOptions);
        if (result.success) {
          if (result.simulated) {
            console.log("?? (simulado) Email de bienvenida a donante ->", donorData.correo);
          }
          return { success: true, messageId: result.messageId, simulated: !!result.simulated };
        }

        return { success: false, error: result.error || "No se pudo enviar el email" };
      } catch (error) {
        console.error("Error enviando email de bienvenida a donante:", error.message);
        return { success: false, error: error.message };
      }
    }

    /**
     * Enviar notificaci�n de horario a empleado (crear, editar, novedad)
     */
    async sendScheduleNotification({ to, employeeName, action, scheduleData }) {
      try {
        if (!to) {
          return { success: false, message: "Correo destinatario no definido" };
        }

        const ready = await this.ensureTransporter();
        if (!ready.ok) {
          console.warn("??  Notificaci�n de horario no enviada:", ready.reason);
          if (ready.simulated) {
            console.log("?? (simulado) Notificaci�n de horario ->", to);
            return { success: true, simulated: true };
          }
          return { success: false, error: ready.reason };
        }

        const actionTitles = {
          created: "Nuevo horario asignado",
          updated: "Horario actualizado",
          novelty: "Novedad en horario"
        };

        const actionTitle = actionTitles[action] || "Notificaci�n de horario";
        const formattedDate = this.formatScheduleDate(scheduleData.date);
        const timeRange = scheduleData.startTime && scheduleData.endTime
          ? `${scheduleData.startTime} - ${scheduleData.endTime}`
          : scheduleData.startTime || "";
        const recurrenceLabel = this.formatScheduleRecurrence(scheduleData.recurrence || "no");

        const mailOptions = {
          from: {
            name: "AstroStar - Sistema de Gesti�n",
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
            description: scheduleData.description || scheduleData.motivoCancelacion || "",
          }),
          text: this.generateScheduleNotificationText({
            employeeName,
            actionTitle,
            scheduleDate: formattedDate,
            timeRange,
            recurrenceLabel,
            description: scheduleData.description || scheduleData.motivoCancelacion || "",
          }),
        };

        const result = await this.sendMailWithFallback(mailOptions);
        return result;
      } catch (error) {
        console.error("Error enviando notificaci�n de horario:", error.message);
        return { success: false, error: error.message };
      }
    }

    /**
     * Enviar notificaci�n de asistencia a deportista
     */
    async sendAttendanceNotification({ to, athleteName, date, status, observation }) {
      try {
        if (!to) {
          return { success: false, message: "Correo destinatario no definido" };
        }

        const { generateAttendanceNotificationHTML, generateAttendanceNotificationText } =
          await import('../templates/attendanceNotificationTemplate.js');

        const ready = await this.ensureTransporter();
        if (!ready.ok) {
          console.warn("??  Notificaci�n de asistencia no enviada:", ready.reason);
          if (ready.simulated) {
            console.log("?? (simulado) Notificaci�n de asistencia ->", to);
            return { success: true, simulated: true };
          }
          return { success: false, error: ready.reason };
        }

        const formattedDate = new Date(date).toLocaleDateString("es-CO", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const mailOptions = {
          from: {
            name: "AstroStar - Sistema de Gesti�n",
            address: process.env.EMAIL_USER || "astrostar.system@gmail.com",
          },
          to,
          subject: `Registro de Asistencia - ${formattedDate}`,
          html: generateAttendanceNotificationHTML({
            athleteName,
            date: formattedDate,
            status,
            observation: observation || "",
          }),
          text: generateAttendanceNotificationText({
            athleteName,
            date: formattedDate,
            status,
            observation: observation || "",
          }),
        };

        const result = await this.sendMailWithFallback(mailOptions);
        return result;
      } catch (error) {
        console.error("Error enviando notificaci�n de asistencia:", error.message);
        return { success: false, error: error.message };
      }
    }

    /**
     * Enviar alerta de ausencias (m�s del 50%)
     */
    async sendAbsenceAlert({ to, athleteName, absencePercentage, totalDays, absentDays, period }) {
      try {
        if (!to) {
          return { success: false, message: "Correo destinatario no definido" };
        }

        const { generateAbsenceAlertHTML, generateAbsenceAlertText } =
          await import('../templates/attendanceNotificationTemplate.js');

        const ready = await this.ensureTransporter();
        if (!ready.ok) {
          console.warn("??  Alerta de ausencias no enviada:", ready.reason);
          if (ready.simulated) {
            console.log("?? (simulado) Alerta de ausencias ->", to);
            return { success: true, simulated: true };
          }
          return { success: false, error: ready.reason };
        }

        const mailOptions = {
          from: {
            name: "AstroStar - Sistema de Gesti�n",
            address: process.env.EMAIL_USER || "astrostar.system@gmail.com",
          },
          to,
          subject: `?? Alerta: Inasistencias superiores al 50%`,
          html: generateAbsenceAlertHTML({
            athleteName,
            absencePercentage,
            totalDays,
            absentDays,
            period: period || "",
          }),
          text: generateAbsenceAlertText({
            athleteName,
            absencePercentage,
            totalDays,
            absentDays,
            period: period || "",
          }),
        };

        const result = await this.sendMailWithFallback(mailOptions);
        return result;
      } catch (error) {
        console.error("Error enviando alerta de ausencias:", error.message);
        return { success: false, error: error.message };
      }
    }
}
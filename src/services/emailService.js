﻿﻿﻿/**
 * Servicio de Email - AstroStar
 * Maneja el envÃ­o de correos electrÃ³nicos del sistema
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
      // Verificar si las credenciales estÃ¡n configuradas
      if (
        !process.env.EMAIL_USER ||
        !process.env.EMAIL_PASSWORD ||
        process.env.EMAIL_PASSWORD === "your-app-password-here"
      ) {
        this.transporter = null;
        return;
      }

      // ConfiguraciÃ³n SMTP (por defecto Gmail). Usamos host/port para evitar que Nodemailer
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
      console.error("âš ï¸ Error inicializando servicio de email:", error);
      this.transporter = null;
    }
  }

  /**
   * Reinicializar el transportador de email
   * Ãštil cuando las variables de entorno se cargan despuÃ©s de la instanciaciÃ³n
   */
  reinitialize() {
    this.initializeTransporter();
  }

  /**
   * Verificar conexiÃ³n del servicio de email
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
      console.warn("âš ï¸  No se pudo verificar la conexiÃ³n de email:", msg);

      // Si fallÃ³ por timeout/conexiÃ³n, intentar automÃ¡ticamente cambiando de puerto
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
        console.warn(`â†» Reintentando verificaciÃ³n por puerto ${nextPort}...`);
        await this.initializeTransporter({ overridePort: nextPort });
        if (this.transporter) {
          try {
            await this.transporter.verify();
            console.log(`âœ… ConexiÃ³n de email verificada por puerto ${nextPort}.`);
            return true;
          } catch (retryError) {
            console.warn(
              `âš ï¸  VerificaciÃ³n por puerto ${nextPort} fallÃ³:`,
              retryError?.message || retryError,
            );
          }
        }
        // Si tampoco funcionÃ³ y se permite simular, no bloquear el arranque
        if (this.shouldSimulate()) {
          console.warn("âš ï¸  SMTP inalcanzable; habilitando modo simulaciÃ³n de correos.");
          this.transporter = null;
          return true;
        }
      }

      // Ãšltimo recurso: simulaciÃ³n
      if (this.shouldSimulate()) {
        console.warn("âš ï¸  No se pudo verificar SMTP; continuando en modo simulaciÃ³n.");
        this.transporter = null;
        return true;
      }

      // Fallback: servidor alterno si estÃ¡ configurado (Mailtrap u otro)
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
          `â†» Reintentando verificaciÃ³n con servidor alterno ${fallbackHost}:${fallbackPort}...`,
        );
        await this.initializeTransporter({
          overrideHost: fallbackHost,
          overridePort: fallbackPort,
          overrideAuth: { user: fallbackUser, pass: fallbackPass },
        });
        if (this.transporter) {
          try {
            await this.transporter.verify();
            console.log("âœ… ConexiÃ³n de email verificada con servidor alterno.");
            return true;
          } catch (retryAltError) {
            console.warn(
              "âš ï¸  VerificaciÃ³n con servidor alterno fallÃ³:",
              retryAltError?.message || retryAltError,
            );
          }
        }
      }

      return false;
    }
  }

  /**
   * Asegurar que el transporter estÃ© disponible para enviar correos.
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
      console.warn("⚠️  Sin transporter; usando modo simulación de correos.");
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
        console.warn("⚠️  Servicio de email no disponible; enviando en modo simulado.");
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
      console.warn("âš ï¸  Error enviando email:", error?.message || error);

      // Fallback 1: reintentar cambiando puerto (465 <-> 587)
      const currentPort = this.transporter?.options?.port;
      const isTimeoutOrConn =
        error?.code === "ETIMEDOUT" ||
        error?.code === "ECONNREFUSED" ||
        /timedout/i.test(error?.message || "");

      if (isTimeoutOrConn) {
        const nextPort = currentPort === 465 ? 587 : 465;
        console.warn(`â†» Reintentando envÃ­o por puerto ${nextPort}...`);
        await this.initializeTransporter({ overridePort: nextPort });
        if (this.transporter) {
          try {
            return await trySend();
          } catch (retryError) {
            console.warn(
              `âš ï¸  Reintento por puerto ${nextPort} fallÃ³:`,
              retryError?.message || retryError,
            );
          }
        }

        if (this.shouldSimulate()) {
          console.warn("⚠️  Envío falló por red; usando modo simulado.");
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
          `â†» Reintentando envÃ­o con servidor alterno ${fallbackHost}:${fallbackPort}...`,
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
              "âš ï¸  Reintento con servidor alterno fallÃ³:",
              retryAltError?.message || retryAltError,
            );
            return { success: false, error: retryAltError?.message || retryAltError };
          }
        }
      }

      if (isTimeoutOrConn && this.shouldSimulate()) {
        console.warn("⚠️  Todos los intentos fallaron; envío simulado.");
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
                <h1>ðŸŒŸ Â¡Bienvenido a AstroStar!</h1>
                <p>Sistema de GestiÃ³n Deportiva</p>
            </div>
            
            <div class="content">
                <h2>Hola ${firstName} ${lastName},</h2>
                
                <p>Â¡Nos complace darte la bienvenida al equipo de AstroStar! Tu cuenta de empleado ha sido creada exitosamente.</p>
                
                <div class="credentials-box">
                    <h3>ðŸ” Tus Credenciales de Acceso</h3>
                    <div class="credential-item">
                        <strong>ðŸ“§ Usuario:</strong> ${email}
                    </div>
                    <div class="credential-item">
                        <strong>ðŸ”‘ ContraseÃ±a:</strong> <code> Tu documento de identidad</code>
                    </div>
                </div>
                
                <div class="warning">
                    <strong>âš ï¸ Importante - Seguridad:</strong>
                    <ul>
                        <li>Por razones de seguridad, <strong>es recomendable cambiar tu contraseÃ±a</strong> despuÃ©s de tu primer inicio de sesiÃ³n</li>
                        <li>Elige una contraseÃ±a segura que incluya letras, nÃºmeros y sÃ­mbolos</li>
                        <li>No compartas tus credenciales con nadie</li>
                        <li>Si tienes problemas para acceder, contacta al administrador</li>
                    </ul>
                </div>
                
                <div style="text-align: center;">
                    <a href="${
                      process.env.FRONTEND_URL || "http://localhost:3000"
                    }/login" class="button">
                        ðŸš€ Acceder al Sistema
                    </a>
                </div>
                
                <h3>ðŸ“‹ PrÃ³ximos Pasos:</h3>
                <ol>
                    <li>Inicia sesiÃ³n con tu correo y tu documento de identidad como contraseÃ±a</li>
                    <li><strong>Cambia tu contraseÃ±a inmediatamente</strong> por una segura y personal</li>
                    <li>Completa tu perfil si es necesario</li>
                    <li>FamiliarÃ­zate con el sistema</li>
                </ol>
                
                <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar al equipo de soporte.</p>
                
                <p>Â¡Esperamos que tengas una excelente experiencia trabajando con AstroStar!</p>
                
                <p>Saludos cordiales,<br>
                <strong>Equipo AstroStar</strong></p>
            </div>
            
            <div class="footer">
                <p>Este es un email automÃ¡tico del sistema AstroStar. Por favor no respondas a este mensaje.</p>
                <p>Â© ${new Date().getFullYear()} AstroStar - Sistema de GestiÃ³n Deportiva</p>
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
Â¡Bienvenido a AstroStar!

Hola ${firstName} ${lastName},

Nos complace darte la bienvenida al equipo de AstroStar. Tu cuenta de empleado ha sido creada exitosamente.

CREDENCIALES DE ACCESO:
- Usuario: ${email}
- ContraseÃ±a Inicial: ${password} (Tu nÃºmero de documento de identidad)

IMPORTANTE - SEGURIDAD:
- Tu contraseÃ±a inicial es tu nÃºmero de documento de identidad
- Por razones de seguridad, DEBES CAMBIARLA INMEDIATAMENTE despuÃ©s de tu primer inicio de sesiÃ³n
- Elige una contraseÃ±a segura que incluya letras, nÃºmeros y sÃ­mbolos
- No compartas tus credenciales con nadie
- Si tienes problemas para acceder, contacta al administrador

PRÃ“XIMOS PASOS:
1. Inicia sesiÃ³n con tu correo y tu documento de identidad como contraseÃ±a
2. CAMBIA TU CONTRASEÃ‘A INMEDIATAMENTE por una segura y personal
3. Completa tu perfil si es necesario
4. FamiliarÃ­zate con el sistema

Accede al sistema en: ${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/login

Â¡Esperamos que tengas una excelente experiencia trabajando con AstroStar!

Saludos cordiales,
Equipo AstroStar

---
Este es un email automÃ¡tico del sistema AstroStar.
Â© ${new Date().getFullYear()} AstroStar - Sistema de GestiÃ³n Deportiva
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
          name: "AstroStar - Sistema de GestiÃ³n",
          address: process.env.EMAIL_USER || "astrostar.system@gmail.com",
        },
        to: email,
        subject: "ðŸŽ‰ Bienvenido a AstroStar - Credenciales de Acceso",
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

      // Si no hay transporter configurado, simular envÃ­o
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
   * Notificar al deportista que se creÃ³ una cita
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
        name: "AstroStar - Sistema de GestiÃ³n",
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
      console.warn("âš ï¸  Error enviando notificaciÃ³n de cita:", error.message);
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
   * Generar template HTML para email de bienvenida de deportista
   */
  generateAthleteWelcomeEmailTemplate(firstName, lastName, email, password) {
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
          <p style="margin: 8px 0 0 0; opacity: .9;">AstroStar - Sistema de GestiÃ³n</p>
        </div>
        <div class="content">
          <p>Hola <strong>${employeeName}</strong>,</p>
          <p>Tu horario ha sido <strong>${actionTitle.toLowerCase()}</strong>. AquÃ­ estÃ¡n los detalles:</p>

          <div class="card">
            <h3>Detalle del horario</h3>
            <p class="detail">ðŸ“… <span class="highlight">${scheduleDate}</span></p>
            <p class="detail">â° <span class="highlight">${timeRange}</span></p>
            <p class="detail">ðŸ” ${recurrenceLabel}</p>
            ${hasDescription ? `<p class="detail">ðŸ“ ${description}</p>` : ""}
          </div>

          <div class="card" style="background:#f0f4ff;">
            <h3>Â¿QuÃ© debo hacer?</h3>
            <ul style="margin: 8px 0 0 16px; padding: 0; color:#374151;">
              <li>Revisa tu agenda y confirma disponibilidad.</li>
              <li>Si detectas algÃºn conflicto, contacta al coordinador.</li>
              <li>Guarda este correo como referencia.</li>
            </ul>
          </div>

          <div style="text-align:center;">
            <a class="button" href="${baseUrl}/login">Abrir AstroStar</a>
          </div>

          <p style="margin-top:16px; color:#4b5563; font-size:14px;">
            Este correo se enviÃ³ al email registrado en tu perfil. Si no reconoces este cambio, responde a tu coordinador.
          </p>
        </div>
        <div class="footer">
          <p>Este es un correo automÃ¡tico. Por favor no respondas a este mensaje.</p>
          <p>Â© ${new Date().getFullYear()} AstroStar</p>
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
RepeticiÃ³n: ${recurrenceLabel}
${description ? `DescripciÃ³n: ${description}\n` : ""} 
Si necesitas cambios, contacta a tu coordinador.

Este correo fue enviado al email registrado en tu perfil.
`;
  }

  /**
   * Notificar al deportista que se creÃ³ una cita
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
        name: "AstroStar - Sistema de GestiÃ³n",
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
      console.warn("âš ï¸  Error enviando notificaciÃ³n de cita:", error.message);
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
      no: "Sin repeticiÃ³n",
      dia: "Cada dÃ­a",
      semana: "Cada semana",
      mes: "Cada mes",
      anio: "Cada aÃ±o",
      laboral: "DÃ­as laborales",
      personalizado: "RepeticiÃ³n personalizada",
    };
    return labels[recurrence] || "Sin repeticiÃ³n";
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
          <p style="margin: 8px 0 0 0; opacity: .9;">AstroStar - Sistema de GestiÃ³n</p>
        </div>
        <div class="content">
          <p>Hola <strong>${employeeName}</strong>,</p>
          <p>Tu horario ha sido <strong>${actionTitle.toLowerCase()}</strong>. AquÃ­ estÃ¡n los detalles:</p>

          <div class="card">
            <h3>Detalle del horario</h3>
            <p class="detail">ðŸ“… <span class="highlight">${scheduleDate}</span></p>
            <p class="detail">â° <span class="highlight">${timeRange}</span></p>
            <p class="detail">ðŸ” ${recurrenceLabel}</p>
            ${hasDescription ? `<p class="detail">ðŸ“ ${description}</p>` : ""}
          </div>

          <div class="card" style="background:#f0f4ff;">
            <h3>Â¿QuÃ© debo hacer?</h3>
            <ul style="margin: 8px 0 0 16px; padding: 0; color:#374151;">
              <li>Revisa tu agenda y confirma disponibilidad.</li>
              <li>Si detectas algÃºn conflicto, contacta al coordinador.</li>
              <li>Guarda este correo como referencia.</li>
            </ul>
          </div>

          <div style="text-align:center;">
            <a class="button" href="${baseUrl}/login">Abrir AstroStar</a>
          </div>

          <p style="margin-top:16px; color:#4b5563; font-size:14px;">
            Este correo se enviÃ³ al email registrado en tu perfil. Si no reconoces este cambio, responde a tu coordinador.
          </p>
        </div>
        <div class="footer">
          <p>Este es un correo automÃ¡tico. Por favor no respondas a este mensaje.</p>
          <p>Â© ${new Date().getFullYear()} AstroStar</p>
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
RepeticiÃ³n: ${recurrenceLabel}
${description ? `DescripciÃ³n: ${description}\n` : ""} 
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
      console.warn("âš ï¸  NotificaciÃ³n de horario no enviada:", ready.reason);
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
        name: "AstroStar - Sistema de GestiÃ³n",
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
      console.log("ðŸ“§ (simulado) NotificaciÃ³n de horario ->", to);
      return { success: true, simulated: true };
    }

    try {
      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.warn("âš ï¸  Error enviando notificaciÃ³n de horario:", error.message);

      // Fallback: si falla por timeout/conexiÃ³n en el puerto actual, probar puerto 465
      const currentPort = this.transporter?.options?.port;
      const isTimeoutOrConn =
        error?.code === "ETIMEDOUT" ||
        error?.code === "ECONNREFUSED" ||
        /timedout/i.test(error?.message || "");

      if (isTimeoutOrConn && currentPort !== 465) {
        console.warn("â†» Reintentando envÃ­o por puerto 465...");
        await this.initializeTransporter({ overridePort: 465 });
        if (this.transporter) {
          try {
            const retryResult = await this.transporter.sendMail(mailOptions);
            return { success: true, messageId: retryResult.messageId, retriedWith465: true };
          } catch (retryError) {
            console.warn("âš ï¸  Reintento fallÃ³:", retryError.message);
            // continuar a posible fallback
          }
        }
      }

      // Fallback 2: usar servidor alterno (por ej. Mailtrap) si estÃ¡ configurado
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
          `â†» Reintentando con servidor alterno ${fallbackHost}:${fallbackPort}...`,
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
            console.warn("âš ï¸  Reintento con servidor alterno fallÃ³:", retryAltError.message);
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
                <h1>ðŸŒŸ Â¡Bienvenido a AstroStar!</h1>
                <p>Sistema de GestiÃ³n Deportiva</p>
            </div>
            
            <div class="content">
                <h2>Hola ${firstName} ${lastName},</h2>
                
                <p>Â¡Nos complace darte la bienvenida a AstroStar! Tu cuenta de <strong>deportista</strong> ha sido creada exitosamente.</p>
                
                <div class="credentials-box">
                    <h3>ðŸ” Tus Credenciales de Acceso</h3>
                    <div class="credential-item">
                        <strong>ðŸ“§ Usuario:</strong> ${email}
                    </div>
                    <div class="credential-item">
                        <strong>ðŸ”‘ ContraseÃ±a:</strong> Tu documento de identidad
                    </div>
                </div>
                
                <div class="warning">
                    <strong>âš ï¸ Importante - Seguridad:</strong>
                    <ul>
                        <li>Por razones de seguridad, es recomendable cambiar tu contraseÃ±a despuÃ©s de tu primer inicio de sesiÃ³n</li>
                        <li>Elige una contraseÃ±a segura que incluya letras, nÃºmeros y sÃ­mbolos</li>
                        <li>No compartas tus credenciales con nadie</li>
                        <li>Si tienes problemas para acceder, contacta al administrador</li>
                    </ul>
                </div>
                
                <div style="text-align: center;">
                    <a href="${
                      process.env.FRONTEND_URL || "http://localhost:3000"
                    }/login" class="button">
                        ðŸš€ Acceder al Sistema
                    </a>
                </div>
                
                <h3>ðŸ“‹ PrÃ³ximos Pasos:</h3>
                <ol>
                    <li>Inicia sesiÃ³n con tu correo y tu documento de identidad como contraseÃ±a</li>
                    <li><strong>Cambia tu contraseÃ±a inmediatamente</strong> por una segura y personal</li>
                    <li>Completa tu perfil si es necesario</li>
                    <li>Revisa tu informaciÃ³n deportiva y categorÃ­a</li>
                </ol>
                
                <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar al equipo de soporte.</p>
                
                <p>Â¡Esperamos que tengas una excelente experiencia deportiva con AstroStar!</p>
                
                <p>Saludos cordiales,<br>
                <strong>Equipo AstroStar</strong></p>
            </div>
            
            <div class="footer">
                <p>Este es un email automÃ¡tico del sistema AstroStar. Por favor no respondas a este mensaje.</p>
                <p>Â© ${new Date().getFullYear()} AstroStar - Sistema de GestiÃ³n Deportiva</p>
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
Â¡Bienvenido a AstroStar!

Hola ${firstName} ${lastName},

Nos complace darte la bienvenida a AstroStar. Tu cuenta de deportista ha sido creada exitosamente.

CREDENCIALES DE ACCESO:
- Usuario: ${email}
- ContraseÃ±a: Tu documento de identidad

IMPORTANTE - SEGURIDAD:
- Tu contraseÃ±a inicial es tu nÃºmero de documento de identidad
- Por razones de seguridad, DEBES CAMBIARLA INMEDIATAMENTE despuÃ©s de tu primer inicio de sesiÃ³n
- Elige una contraseÃ±a segura que incluya letras, nÃºmeros y sÃ­mbolos
- No compartas tus credenciales con nadie
- Si tienes problemas para acceder, contacta al administrador

PRÃ“XIMOS PASOS:
1. Inicia sesiÃ³n con tu correo y tu documento de identidad como contraseÃ±a
2. CAMBIA TU CONTRASEÃ‘A INMEDIATAMENTE por una segura y personal
3. Completa tu perfil si es necesario
4. Revisa tu informaciÃ³n deportiva y categorÃ­a

Accede al sistema en: ${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/login

Â¡Esperamos que tengas una excelente experiencia deportiva con AstroStar!

Saludos cordiales,
Equipo AstroStar

---
Este es un email automÃ¡tico del sistema AstroStar.
Â© ${new Date().getFullYear()} AstroStar - Sistema de GestiÃ³n Deportiva
    `;
  }

  /**
   * Enviar email de recuperaciÃ³n de contraseÃ±a
   */
  async sendPasswordResetEmail(email, resetToken) {
    try {
      const mailOptions = {
        from: {
          name: "AstroStar - Sistema de GestiÃ³n",
          address: process.env.EMAIL_USER || "astrostar.system@gmail.com",
        },
        to: email,
        subject: "ðŸ” RecuperaciÃ³n de ContraseÃ±a - AstroStar",
        html: this.generatePasswordResetTemplate(email, resetToken),
        text: `RecuperaciÃ³n de contraseÃ±a para AstroStar\n\nHaz clic en el siguiente enlace para restablecer tu contraseÃ±a:\n${process.env.FRONTEND_URL}/reset-password?token=${resetToken}\n\nEste enlace expira en 1 hora.`,
      };

      if (!this.transporter) {
        return { success: true, messageId: "simulated-reset-" + Date.now() };
      }

      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("âŒ Error enviando email de recuperaciÃ³n:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generar template para recuperaciÃ³n de contraseÃ±a
   */
  generatePasswordResetTemplate(email, resetToken) {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RecuperaciÃ³n de ContraseÃ±a</title>
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
                <h1>ðŸ” RecuperaciÃ³n de ContraseÃ±a</h1>
                <p style="margin: 0; opacity: 0.9;">AstroStar - Sistema de GestiÃ³n</p>
            </div>
            <div class="content">
                <p>Hola,</p>
                <p>Recibimos una solicitud para restablecer la contraseÃ±a de tu cuenta en AstroStar.</p>
                <p><strong>Tu cÃ³digo de verificaciÃ³n es:</strong></p>
                
                <div class="code-box">
                    <div class="code">${resetToken}</div>
                    <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Ingresa este cÃ³digo en la pÃ¡gina de recuperaciÃ³n</p>
                </div>
                
                <div class="warning">
                    <strong>âš ï¸ Importante:</strong>
                    <ul style="margin: 10px 0;">
                        <li>Este cÃ³digo expira en <strong>15 minutos</strong></li>
                        <li>Si no solicitaste este cambio, ignora este email</li>
                        <li>Tu contraseÃ±a actual seguirÃ¡ siendo vÃ¡lida hasta que la cambies</li>
                        <li>Nunca compartas este cÃ³digo con nadie</li>
                    </ul>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                    Si tienes problemas, contacta con el administrador del sistema.
                </p>
            </div>
            <div class="footer">
                <p>Este es un correo automÃ¡tico, por favor no respondas a este mensaje.</p>
                <p>Â© ${new Date().getFullYear()} AstroStar. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Enviar correo de confirmaciÃ³n de pre-inscripciÃ³n
   */
  async sendPreRegistrationEmail(preRegistrationData) {
    try {
      console.log('ðŸ“§ [EmailService] Iniciando envÃ­o de email de pre-inscripciÃ³n');
      console.log('ðŸ“§ [EmailService] Datos recibidos:', preRegistrationData);
      
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

      console.log('ðŸ“§ [EmailService] Nombre completo construido:', nombreCompleto);
      console.log('ðŸ“§ [EmailService] Correo destino:', email);

      const mailOptions = {
        from: {
          name: "FundaciÃ³n Manuela Vanegas",
          address: process.env.EMAIL_USER || "fundacion@example.com",
        },
        to: email,
        subject: "Â¡Bienvenida a la FundaciÃ³n Manuela Vanegas! - PrÃ³ximos Pasos",
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
        console.log("âš ï¸  [EmailService] Transporter no configurado, simulando envÃ­o");
        return { success: true, messageId: "simulated-prereg-" + Date.now() };
      }

      console.log('ðŸ“¤ [EmailService] Enviando email...');
      const result = await this.transporter.sendMail(mailOptions);
      console.log('âœ… [EmailService] Email enviado exitosamente. MessageId:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error(
        "âŒ [EmailService] Error enviando email de pre-inscripciÃ³n:",
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
          console.log("📧 (simulado) Email a donante landing ->", donorData.correo);
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
   * Generar template para pre-inscripciÃ³n
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
      <title>Confirmación de Inscripción</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #B595FF 0%, #9BE9FF 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Â¡Bienvenida!</h1>
                  <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">FundaciÃ³n Manuela Vanegas</p>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 22px;">Hola ${firstName},</h2>
                  
                  <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                    ¡Gracias por tu interés en formar parte de nuestra fundación! Hemos recibido tu inscripción exitosamente.
                  </p>
                  
                  <div style="background-color: #f8f9fa; border-left: 4px solid #B595FF; padding: 20px; margin: 20px 0; border-radius: 5px;">
                    <h3 style="color: #B595FF; margin: 0 0 15px 0; font-size: 18px;">ðŸ“‹ Tus Datos Registrados:</h3>
                    <p style="color: #666666; margin: 5px 0; font-size: 14px;"><strong>Nombre:</strong> ${nombreCompleto}</p>
                    <p style="color: #666666; margin: 5px 0; font-size: 14px;"><strong>NÃºmero de Documento:</strong> ${identification}</p>
                    <p style="color: #666666; margin: 5px 0; font-size: 14px;"><strong>Fecha de Nacimiento:</strong> ${formatDate(
                      birthDate
                    )}</p>
                    <p style="color: #666666; margin: 5px 0; font-size: 14px;"><strong>TelÃ©fono:</strong> ${phoneNumber}</p>
                    <p style="color: #666666; margin: 5px 0; font-size: 14px;"><strong>Correo:</strong> ${email}</p>
                  </div>
                  
                  <h3 style="color: #333333; margin: 30px 0 15px 0; font-size: 20px;">ðŸŽ¯ PrÃ³ximo Paso: Completar tu MatrÃ­cula</h3>
                  
                  <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                    Para continuar con el proceso de matrÃ­cula, te invitamos a visitarnos en:
                  </p>
                  
                  <div style="background-color: #B595FF; color: #ffffff; padding: 25px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="margin: 0 0 15px 0; font-size: 18px;">ðŸ“ Unidad Deportiva Cristo Rey</h4>
                    <p style="margin: 5px 0; font-size: 14px;"><strong>DirecciÃ³n:</strong> Copacabana, Antioquia</p>
                    <p style="margin: 5px 0; font-size: 14px;"><strong>TelÃ©fono:</strong> ${
                      process.env.CONTACT_PHONE || "(604) 123-4567"
                    }</p>
                    <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${
                      process.env.CONTACT_EMAIL || "contacto@fundacionmv.com"
                    }</p>
                    <p style="margin: 5px 0; font-size: 14px;"><strong>Horario:</strong> Lunes a Viernes, 8:00 AM - 5:00 PM</p>
                  </div>
                  
                  <h3 style="color: #333333; margin: 30px 0 15px 0; font-size: 18px;">ðŸ“„ Documentos que debes traer:</h3>
                  <ul style="color: #666666; line-height: 1.8; font-size: 15px; padding-left: 20px;">
                    <li>Documento de identidad (copia)</li>
                    <li>Documento de identidad del acudiente (si es menor de edad)</li>
                    <li>Copia del registro civil</li>
                  </ul>
                  
                  <div style="background-color: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 25px 0; border-radius: 5px;">
                    <p style="color: #1976D2; margin: 0; font-size: 14px;">
                      ðŸ’¡ <strong>Importante:</strong> Nuestro equipo revisarÃ¡ tu informaciÃ³n y te contactaremos pronto para coordinar tu visita.
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Social Media -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                  <h4 style="color: #333333; margin: 0 0 15px 0; font-size: 16px;">SÃ­guenos en Redes Sociales</h4>
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
                    Â© ${new Date().getFullYear()} FundaciÃ³n Manuela Vanegas. Todos los derechos reservados.
                  </p>
                  <p style="color: #999999; margin: 10px 0 0 0; font-size: 11px;">
                    Este correo fue enviado a ${email} porque te inscribiste en nuestra fundación.
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
   * Enviar cÃ³digo de verificaciÃ³n para cambio de email
   */
  async sendEmailVerificationCode(email, verificationCode, firstName) {
    try {
      const mailOptions = {
        from: {
          name: "AstroStar - Sistema de GestiÃ³n",
          address: process.env.EMAIL_USER || "astrostar.system@gmail.com",
        },
        to: email,
        subject: "ðŸ“§ VerificaciÃ³n de Cambio de Correo - AstroStar",
        html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>VerificaciÃ³n de Correo</title>
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
              <h1>ðŸ“§ VerificaciÃ³n de Correo ElectrÃ³nico</h1>
              <p style="margin: 0; opacity: 0.9;">AstroStar - Sistema de GestiÃ³n</p>
            </div>
            <div class="content">
              <p>Hola ${firstName},</p>
              <p>Recibimos una solicitud para cambiar el correo electrÃ³nico de tu cuenta en AstroStar.</p>
              
              <p><strong>Tu cÃ³digo de verificaciÃ³n es:</strong></p>
              <div class="code-box">
                <div class="code">${verificationCode}</div>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Ingresa este cÃ³digo para confirmar el cambio</p>
              </div>
              
              <div class="warning">
                <strong>âš ï¸ Importante:</strong>
                <ul style="margin: 10px 0;">
                  <li>Este cÃ³digo expira en <strong>15 minutos</strong></li>
                  <li>Si no solicitaste este cambio, ignora este email</li>
                  <li>Nunca compartas este cÃ³digo con nadie</li>
                </ul>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Si tienes problemas, contacta con el administrador del sistema.
              </p>
            </div>
            <div class="footer">
              <p>Este es un correo automÃ¡tico, por favor no respondas a este mensaje.</p>
              <p>Â© ${new Date().getFullYear()} AstroStar. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
        `,
        text: `VerificaciÃ³n de Cambio de Correo - AstroStar\n\nHola ${firstName},\n\nTu cÃ³digo de verificaciÃ³n es: ${verificationCode}\n\nEste cÃ³digo expira en 15 minutos.\n\nSi no solicitaste este cambio, ignora este email.`,
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
      console.error("âŒ Error enviando email de verificaciÃ³n:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar invitaciÃ³n RSVP para evento
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
        subject: `ConfirmaciÃ³n de Asistencia - ${event.name}`,
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
      console.error("âŒ Error enviando invitaciÃ³n RSVP:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar recordatorio de invitaciÃ³n pendiente
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
        subject: `â° Recordatorio: Confirma tu asistencia a ${event.name}`,
        html: htmlContent,
      };

      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("âŒ Error enviando recordatorio RSVP:", error.message);
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
        subject: `ðŸ“… Recordatorio: ${event.name} es maÃ±ana`,
        html: htmlContent,
      };

      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("âŒ Error enviando recordatorio de evento:", error.message);
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
            name: "Fundación Manuela Vanegas",
            address: process.env.EMAIL_USER || "fundacion@example.com",
          },
          to: donorData.correo,
          subject: "¡Gracias por tu interés en donar! - Fundación Manuela Vanegas",
          html: generateDonorWelcomeHTML(donorData),
          text: generateDonorWelcomeText(donorData),
        };

        const result = await this.sendMailWithFallback(mailOptions);
        if (result.success) {
          if (result.simulated) {
            console.log("📧 (simulado) Email de bienvenida a donante ->", donorData.correo);
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
     * Enviar notificación de horario a empleado (crear, editar, novedad)
     */
    async sendScheduleNotification({ to, employeeName, action, scheduleData }) {
      try {
        if (!to) {
          return { success: false, message: "Correo destinatario no definido" };
        }

        const { generateScheduleNotificationHTML, generateScheduleNotificationText } = 
          await import('../templates/scheduleNotificationTemplate.js');

        const ready = await this.ensureTransporter();
        if (!ready.ok) {
          console.warn("⚠️  Notificación de horario no enviada:", ready.reason);
          if (ready.simulated) {
            console.log("📧 (simulado) Notificación de horario ->", to);
            return { success: true, simulated: true };
          }
          return { success: false, error: ready.reason };
        }

        const actionTitles = {
          created: "Nuevo horario asignado",
          updated: "Horario actualizado",
          novelty: "Novedad en horario"
        };

        const actionTitle = actionTitles[action] || "Notificación de horario";
        const formattedDate = this.formatScheduleDate(scheduleData.date);
        const timeRange = scheduleData.startTime && scheduleData.endTime
          ? `${scheduleData.startTime} - ${scheduleData.endTime}`
          : scheduleData.startTime || "";
        const recurrenceLabel = this.formatScheduleRecurrence(scheduleData.recurrence || "no");

        const mailOptions = {
          from: {
            name: "AstroStar - Sistema de Gestión",
            address: process.env.EMAIL_USER || "astrostar.system@gmail.com",
          },
          to,
          subject: `${actionTitle} - AstroStar`,
          html: generateScheduleNotificationHTML({
            employeeName,
            actionTitle,
            scheduleDate: formattedDate,
            timeRange,
            recurrenceLabel,
            description: scheduleData.description || scheduleData.motivoCancelacion || "",
          }),
          text: generateScheduleNotificationText({
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
        console.error("Error enviando notificación de horario:", error.message);
        return { success: false, error: error.message };
      }
    }

    /**
     * Enviar notificación de asistencia a deportista
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
          console.warn("⚠️  Notificación de asistencia no enviada:", ready.reason);
          if (ready.simulated) {
            console.log("📧 (simulado) Notificación de asistencia ->", to);
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
            name: "AstroStar - Sistema de Gestión",
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
        console.error("Error enviando notificación de asistencia:", error.message);
        return { success: false, error: error.message };
      }
    }

    /**
     * Enviar alerta de ausencias (más del 50%)
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
          console.warn("⚠️  Alerta de ausencias no enviada:", ready.reason);
          if (ready.simulated) {
            console.log("📧 (simulado) Alerta de ausencias ->", to);
            return { success: true, simulated: true };
          }
          return { success: false, error: ready.reason };
        }

        const mailOptions = {
          from: {
            name: "AstroStar - Sistema de Gestión",
            address: process.env.EMAIL_USER || "astrostar.system@gmail.com",
          },
          to,
          subject: `⚠️ Alerta: Inasistencias superiores al 50%`,
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

export default new EmailService();


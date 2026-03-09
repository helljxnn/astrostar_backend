/**
 * Servicio de Email para Empleados - AstroStar
 * Maneja todos los emails relacionados con empleados
 */

import { BaseEmailService } from "../../../../services/email/BaseEmailService.js";

export class EmployeeEmailService extends BaseEmailService {
  /**
   * Enviar email de bienvenida a nuevo empleado
   */
  async sendWelcomeEmail(employeeData, credentials) {
    try {
      const { email, firstName, lastName } = employeeData;
      const { email: loginEmail, temporaryPassword } = credentials;

      const mailOptions = {
        from: this.getDefaultFrom(),
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
                    <strong>🔑 Contraseña:</strong> Tu número de documento de identidad
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
                <li>Edita tu perfil si es necesario</li>
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
- Contraseña: Tu número de documento de identidad

IMPORTANTE - SEGURIDAD:
- Por razones de seguridad, DEBES CAMBIAR tu contraseña después de tu primer inicio de sesión
- Elige una contraseña segura que incluya letras, números y símbolos
- No compartas tus credenciales con nadie
- Si tienes problemas para acceder, contacta al administrador

PRÓXIMOS PASOS:
1. Inicia sesión con tu correo y contraseña
2. CAMBIA TU CONTRASEÑA INMEDIATAMENTE por una segura y personal
3. Edita tu perfil si es necesario
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
   * Enviar notificación de horario a empleado
   */
  async sendScheduleNotification({
    to,
    employeeName,
    action = "created",
    scheduleData,
  }) {
    try {
      await this.ensureTransporter();

      const actionText =
        action === "created"
          ? "creado"
          : action === "updated"
            ? "actualizado"
            : action === "deleted"
              ? "eliminado"
              : action;

      const subject = `Horario ${actionText} - AstroStar`;

      const htmlContent = this.generateScheduleNotificationTemplate(
        employeeName,
        actionText,
        scheduleData,
      );

      const textContent = this.generateScheduleNotificationText(
        employeeName,
        actionText,
        scheduleData,
      );

      const mailOptions = {
        from: this.getDefaultFrom(),
        to,
        subject,
        text: textContent,
        html: htmlContent,
      };

      const result = await this.sendMailWithFallback(mailOptions);
      return result;
    } catch (error) {
      console.error("Error sending schedule notification:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generar template HTML para notificación de horario
   */
  generateScheduleNotificationTemplate(employeeName, action, scheduleData) {
    const formattedDate = this.formatDate(scheduleData.date);
    const recurrenceText = this.formatScheduleRecurrence(
      scheduleData.recurrence,
    );

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
              ${
                recurrenceText
                  ? `
              <div class="detail-row">
                <span class="detail-label">Recurrencia:</span>
                <span class="detail-value">${recurrenceText}</span>
              </div>
              `
                  : ""
              }
              ${
                scheduleData.description
                  ? `
              <div class="detail-row">
                <span class="detail-label">Descripción:</span>
                <span class="detail-value">${scheduleData.description}</span>
              </div>
              `
                  : ""
              }
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
    const formattedDate = this.formatDate(scheduleData.date);
    const recurrenceText = this.formatScheduleRecurrence(
      scheduleData.recurrence,
    );

    return `
AstroStar - Notificación de Horario

Hola ${employeeName},

Te informamos que tu horario ha sido ${action}.

Detalles del Horario:
- Fecha: ${formattedDate}
- Hora de inicio: ${scheduleData.startTime}
- Hora de fin: ${scheduleData.endTime}
${recurrenceText ? `- Recurrencia: ${recurrenceText}` : ""}
${scheduleData.description ? `- Descripción: ${scheduleData.description}` : ""}

Si tienes alguna pregunta o necesitas hacer cambios, por favor contacta a tu supervisor.

---
Este es un mensaje automático de AstroStar. Por favor no respondas a este correo.
    `.trim();
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
}

// Exportar instancia singleton
export default new EmployeeEmailService();

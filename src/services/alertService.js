import logger from "../config/logger.js";
import emailService from "./emailService.js";

/**
 * Servicio de Alertas de Seguridad
 * Envía notificaciones por email y registra en logs
 */
class AlertService {
  constructor() {
    this.alertEmail = process.env.ALERT_EMAIL || "admin@astrostar.com";
    this.isProduction = process.env.NODE_ENV === "production";
  }

  /**
   * Enviar alerta crítica
   */
  async sendCriticalAlert(title, details) {
    logger.error("CRITICAL ALERT", { title, details });

    if (this.isProduction) {
      try {
        await emailService.sendEmail({
          to: this.alertEmail,
          subject: `🚨 ALERTA CRÍTICA - AstroStar: ${title}`,
          html: this.formatAlertEmail(title, details, "critical"),
        });
      } catch (error) {
        logger.error("Failed to send critical alert email", {
          error: error.message,
        });
      }
    }
  }

  /**
   * Enviar alerta de seguridad
   */
  async sendSecurityAlert(type, details) {
    logger.logSecurity(type, details);

    if (this.isProduction) {
      try {
        await emailService.sendEmail({
          to: this.alertEmail,
          subject: `⚠️ Alerta de Seguridad - AstroStar: ${type}`,
          html: this.formatAlertEmail(type, details, "security"),
        });
      } catch (error) {
        logger.error("Failed to send security alert email", {
          error: error.message,
        });
      }
    }
  }

  /**
   * Alerta de múltiples intentos de login fallidos
   */
  async alertMultipleFailedLogins(email, ip, attempts) {
    await this.sendSecurityAlert("Múltiples intentos de login fallidos", {
      email,
      ip,
      attempts,
      timestamp: new Date().toISOString(),
      action: "Revisar logs y considerar bloqueo de IP",
    });
  }

  /**
   * Alerta de actividad sospechosa
   */
  async alertSuspiciousActivity(userId, activity, details = {}) {
    await this.sendSecurityAlert("Actividad sospechosa detectada", {
      userId,
      activity,
      ...details,
      timestamp: new Date().toISOString(),
      action: "Revisar actividad del usuario inmediatamente",
    });
  }

  /**
   * Alerta de intento de acceso no autorizado
   */
  async alertUnauthorizedAccess(endpoint, ip, userAgent, details = {}) {
    await this.sendSecurityAlert("Intento de acceso no autorizado", {
      endpoint,
      ip,
      userAgent,
      ...details,
      timestamp: new Date().toISOString(),
      action: "Revisar logs de seguridad",
    });
  }

  /**
   * Alerta de error crítico en la aplicación
   */
  async alertCriticalError(error, context = {}) {
    await this.sendCriticalAlert("Error crítico en la aplicación", {
      message: error.message,
      stack: error.stack,
      ...context,
      timestamp: new Date().toISOString(),
      action: "Revisar logs y corregir inmediatamente",
    });
  }

  /**
   * Alerta de rate limiting excedido
   */
  async alertRateLimitExceeded(ip, endpoint, attempts) {
    await this.sendSecurityAlert("Rate limiting excedido", {
      ip,
      endpoint,
      attempts,
      timestamp: new Date().toISOString(),
      action: "Posible ataque DDoS o abuso de API",
    });
  }

  /**
   * Alerta de backup fallido
   */
  async alertBackupFailed(error, details = {}) {
    await this.sendCriticalAlert("Backup de base de datos fallido", {
      error: error.message,
      ...details,
      timestamp: new Date().toISOString(),
      action: "Verificar configuración de backups inmediatamente",
    });
  }

  /**
   * Alerta de uso alto de recursos
   */
  async alertHighResourceUsage(resource, usage, threshold) {
    await this.sendCriticalAlert(`Uso alto de ${resource}`, {
      resource,
      usage: `${usage}%`,
      threshold: `${threshold}%`,
      timestamp: new Date().toISOString(),
      action: "Revisar uso de recursos del servidor",
    });
  }

  /**
   * Formatear email de alerta
   */
  formatAlertEmail(title, details, severity) {
    const severityColors = {
      critical: "#dc2626",
      security: "#f59e0b",
      warning: "#eab308",
    };

    const color = severityColors[severity] || "#6b7280";
    const icon = severity === "critical" ? "🚨" : "⚠️";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${color}; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .detail { margin: 10px 0; padding: 10px; background-color: white; border-left: 3px solid ${color}; }
          .detail-label { font-weight: bold; color: #4b5563; }
          .detail-value { color: #1f2937; margin-top: 5px; }
          .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; }
          .action { background-color: #fef3c7; padding: 15px; margin-top: 20px; border-radius: 5px; border-left: 4px solid #f59e0b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${icon} ${title}</h2>
          </div>
          <div class="content">
            <p><strong>Sistema:</strong> AstroStar Backend</p>
            <p><strong>Severidad:</strong> ${severity.toUpperCase()}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-CO")}</p>
            
            <h3>Detalles:</h3>
            ${Object.entries(details)
              .map(
                ([key, value]) => `
              <div class="detail">
                <div class="detail-label">${key}:</div>
                <div class="detail-value">${typeof value === "object" ? JSON.stringify(value, null, 2) : value}</div>
              </div>
            `,
              )
              .join("")}
            
            ${
              details.action
                ? `
              <div class="action">
                <strong>Acción Requerida:</strong><br>
                ${details.action}
              </div>
            `
                : ""
            }
          </div>
          <div class="footer">
            <p>Este es un mensaje automático del sistema de monitoreo de AstroStar.</p>
            <p>No responder a este email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default new AlertService();


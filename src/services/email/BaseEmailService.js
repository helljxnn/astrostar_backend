/**
 * Servicio Base de Email - AstroStar
 * Proporciona funcionalidad común para todos los servicios de email
 */

import nodemailer from "nodemailer";

export class BaseEmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  shouldSimulate() {
    return (
      String(process.env.EMAIL_SIMULATE_ON_FAILURE || "true").toLowerCase() !==
      "false"
    );
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
      if (
        !process.env.EMAIL_USER ||
        !process.env.EMAIL_PASSWORD ||
        process.env.EMAIL_PASSWORD === "your-app-password-here"
      ) {
        this.transporter = null;
        return;
      }

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
        family: 4,
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: Number(process.env.SMTP_CONN_TIMEOUT_MS) || 7000,
        socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS) || 10000,
        defaults: {
          encoding: "utf8",
        },
      });
    } catch (error) {
      console.error("Error inicializando servicio de email:", error);
      this.transporter = null;
    }
  }

  /**
   * Reinicializar el transportador de email
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
          console.log("Servicio de email en modo simulacion (sin SMTP).");
          return true;
        }
        return false;
      }

      await this.transporter.verify();
      return true;
    } catch (error) {
      const msg = error?.message || "";
      console.warn("No se pudo verificar la conexion de email:", msg);

      if (this.shouldSimulate()) {
        console.warn("No se pudo verificar SMTP; continuando en modo simulacion.");
        this.transporter = null;
        return true;
      }

      return false;
    }
  }

  /**
   * Asegurar que el transporter esté disponible
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
      console.warn("Sin transporter; usando modo simulacion de correos.");
      return { ok: true, simulated: true };
    }

    return {
      ok: false,
      reason:
        "Servicio de email no configurado. Define EMAIL_USER y EMAIL_PASSWORD.",
    };
  }

  /**
   * Enviar email con reintentos y fallback
   */
  async sendMailWithFallback(mailOptions) {
    const ready = await this.ensureTransporter();
    if (!ready.ok) {
      if (this.shouldSimulate()) {
        console.warn("Servicio de email no disponible; enviando en modo simulado.");
        return {
          success: true,
          messageId: "simulated-" + Date.now(),
          simulated: true,
        };
      }
      return { success: false, error: ready.reason };
    }

    try {
      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.warn("Error enviando email:", error?.message || error);

      if (this.shouldSimulate()) {
        console.warn("Envio fallo; usando modo simulado.");
        return {
          success: true,
          messageId: "simulated-" + Date.now(),
          simulated: true,
        };
      }

      return { success: false, error: error?.message || error };
    }
  }

  /**
   * Obtener configuración de remitente por defecto
   */
  getDefaultFrom(name = "AstroStar - Sistema de Gestión") {
    return {
      name,
      address: process.env.EMAIL_USER || "astrostar.system@gmail.com",
    };
  }

  /**
   * Formatear fecha para emails
   */
  formatDate(date) {
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

  normalizeDisplayText(value, fallback = "") {
    if (value === null || value === undefined) {
      return fallback;
    }

    const normalized = this.repairMojibake(
      String(value).replace(/\s+/g, " ").trim(),
    );

    if (!normalized || /^(undefined|null|nan)$/i.test(normalized)) {
      return fallback;
    }

    return normalized;
  }

  repairMojibake(value) {
    const source = String(value || "");
    if (!source || !/[ÃÂâ�]/.test(source)) {
      return source;
    }

    try {
      const repaired = Buffer.from(source, "latin1").toString("utf8");
      const sourceNoise = (source.match(/[ÃÂâ�]/g) || []).length;
      const repairedNoise = (repaired.match(/[ÃÂâ�]/g) || []).length;
      return repairedNoise < sourceNoise ? repaired : source;
    } catch (error) {
      return source;
    }
  }

  escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  getSafeHtmlText(value, fallback = "") {
    return this.escapeHtml(this.normalizeDisplayText(value, fallback));
  }

  getSafeText(value, fallback = "") {
    return this.normalizeDisplayText(value, fallback);
  }

  formatFullName(parts = [], fallback = "Usuario") {
    const fullName = (Array.isArray(parts) ? parts : [parts])
      .map((part) => this.normalizeDisplayText(part))
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    return fullName || fallback;
  }
}


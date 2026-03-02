/**
 * Servicio de Rate Limiting para Seguridad - AstroStar
 * Protege contra ataques de fuerza bruta y abuso del sistema
 */

import prisma from "../config/database.js";

class RateLimitService {
  /**
   * Configuración de límites
   */
  config = {
    passwordReset: {
      maxAttemptsPerEmail: 3, // Máximo 3 intentos por email por hora
      maxAttemptsPerIP: 5, // Máximo 5 intentos por IP por hora
      windowMinutes: 60, // Ventana de tiempo: 1 hora
      blockDurationMinutes: 60, // Duración del bloqueo: 1 hora
    },
    emailVerification: {
      maxAttemptsPerEmail: 5, // Máximo 5 intentos por email por hora
      maxAttemptsPerIP: 10, // Máximo 10 intentos por IP por hora
      windowMinutes: 60, // Ventana de tiempo: 1 hora
      blockDurationMinutes: 30, // Duración del bloqueo: 30 minutos
    },
    tokenVerification: {
      maxAttempts: 5, // Máximo 5 intentos de verificar un token
      blockDurationMinutes: 15, // Bloqueo de 15 minutos después de 5 intentos fallidos
    },
  };

  /**
   * Verificar si un email o IP está bloqueado para recuperación de contraseña
   */
  async checkPasswordResetRateLimit(email, ipAddress) {
    const now = new Date();
    const windowStart = new Date(
      now.getTime() - this.config.passwordReset.windowMinutes * 60 * 1000,
    );

    // 1. Verificar si hay un bloqueo activo
    const activeBlock = await prisma.passwordResetAttempt.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, { ipAddress }],
        blockedUntil: {
          gt: now,
        },
      },
      orderBy: {
        blockedUntil: "desc",
      },
    });

    if (activeBlock) {
      const minutesRemaining = Math.ceil(
        (activeBlock.blockedUntil - now) / (1000 * 60),
      );
      return {
        allowed: false,
        reason: "blocked",
        message: `Demasiados intentos. Por favor espera ${minutesRemaining} minuto(s) antes de intentar nuevamente.`,
        blockedUntil: activeBlock.blockedUntil,
        minutesRemaining,
      };
    }

    // 2. Contar intentos recientes por email
    const emailAttempts = await prisma.passwordResetAttempt.count({
      where: {
        email: email.toLowerCase(),
        createdAt: {
          gte: windowStart,
        },
      },
    });

    if (emailAttempts >= this.config.passwordReset.maxAttemptsPerEmail) {
      // Bloquear el email
      const blockedUntil = new Date(
        now.getTime() +
          this.config.passwordReset.blockDurationMinutes * 60 * 1000,
      );

      await prisma.passwordResetAttempt.create({
        data: {
          email: email.toLowerCase(),
          ipAddress,
          success: false,
          blockedUntil,
        },
      });

      return {
        allowed: false,
        reason: "email_limit_exceeded",
        message: `Has excedido el límite de ${this.config.passwordReset.maxAttemptsPerEmail} intentos por hora. Por favor espera ${this.config.passwordReset.blockDurationMinutes} minutos.`,
        attemptsUsed: emailAttempts,
        maxAttempts: this.config.passwordReset.maxAttemptsPerEmail,
        blockedUntil,
      };
    }

    // 3. Contar intentos recientes por IP
    const ipAttempts = await prisma.passwordResetAttempt.count({
      where: {
        ipAddress,
        createdAt: {
          gte: windowStart,
        },
      },
    });

    if (ipAttempts >= this.config.passwordReset.maxAttemptsPerIP) {
      // Bloquear la IP
      const blockedUntil = new Date(
        now.getTime() +
          this.config.passwordReset.blockDurationMinutes * 60 * 1000,
      );

      await prisma.passwordResetAttempt.create({
        data: {
          email: email.toLowerCase(),
          ipAddress,
          success: false,
          blockedUntil,
        },
      });

      return {
        allowed: false,
        reason: "ip_limit_exceeded",
        message: `Demasiados intentos desde esta ubicación. Por favor espera ${this.config.passwordReset.blockDurationMinutes} minutos.`,
        attemptsUsed: ipAttempts,
        maxAttempts: this.config.passwordReset.maxAttemptsPerIP,
        blockedUntil,
      };
    }

    // 4. Permitir el intento
    return {
      allowed: true,
      attemptsRemaining: {
        email: this.config.passwordReset.maxAttemptsPerEmail - emailAttempts,
        ip: this.config.passwordReset.maxAttemptsPerIP - ipAttempts,
      },
    };
  }

  /**
   * Registrar un intento de recuperación de contraseña
   */
  async recordPasswordResetAttempt(
    email,
    ipAddress,
    userAgent,
    success = false,
  ) {
    await prisma.passwordResetAttempt.create({
      data: {
        email: email.toLowerCase(),
        ipAddress,
        userAgent,
        success,
      },
    });
  }

  /**
   * Verificar rate limit para verificación de email
   */
  async checkEmailVerificationRateLimit(email, ipAddress) {
    const now = new Date();
    const windowStart = new Date(
      now.getTime() - this.config.emailVerification.windowMinutes * 60 * 1000,
    );

    // 1. Verificar bloqueo activo
    const activeBlock = await prisma.$queryRaw`
      SELECT * FROM email_verification_attempts
      WHERE (email = ${email.toLowerCase()} OR ip_address = ${ipAddress})
      AND blocked_until > ${now}
      ORDER BY blocked_until DESC
      LIMIT 1
    `;

    if (activeBlock && activeBlock.length > 0) {
      const minutesRemaining = Math.ceil(
        (new Date(activeBlock[0].blocked_until) - now) / (1000 * 60),
      );
      return {
        allowed: false,
        reason: "blocked",
        message: `Demasiados intentos. Por favor espera ${minutesRemaining} minuto(s).`,
        minutesRemaining,
      };
    }

    // 2. Contar intentos por email
    const emailAttempts = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM email_verification_attempts
      WHERE email = ${email.toLowerCase()}
      AND created_at >= ${windowStart}
    `;

    const emailCount = parseInt(emailAttempts[0]?.count || 0);

    if (emailCount >= this.config.emailVerification.maxAttemptsPerEmail) {
      const blockedUntil = new Date(
        now.getTime() +
          this.config.emailVerification.blockDurationMinutes * 60 * 1000,
      );

      await prisma.$executeRaw`
        INSERT INTO email_verification_attempts (email, ip_address, success, blocked_until)
        VALUES (${email.toLowerCase()}, ${ipAddress}, false, ${blockedUntil})
      `;

      return {
        allowed: false,
        reason: "email_limit_exceeded",
        message: `Has excedido el límite de intentos. Por favor espera ${this.config.emailVerification.blockDurationMinutes} minutos.`,
        attemptsUsed: emailCount,
      };
    }

    // 3. Contar intentos por IP
    const ipAttempts = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM email_verification_attempts
      WHERE ip_address = ${ipAddress}
      AND created_at >= ${windowStart}
    `;

    const ipCount = parseInt(ipAttempts[0]?.count || 0);

    if (ipCount >= this.config.emailVerification.maxAttemptsPerIP) {
      const blockedUntil = new Date(
        now.getTime() +
          this.config.emailVerification.blockDurationMinutes * 60 * 1000,
      );

      await prisma.$executeRaw`
        INSERT INTO email_verification_attempts (email, ip_address, success, blocked_until)
        VALUES (${email.toLowerCase()}, ${ipAddress}, false, ${blockedUntil})
      `;

      return {
        allowed: false,
        reason: "ip_limit_exceeded",
        message: `Demasiados intentos desde esta ubicación. Por favor espera ${this.config.emailVerification.blockDurationMinutes} minutos.`,
        attemptsUsed: ipCount,
      };
    }

    return {
      allowed: true,
      attemptsRemaining: {
        email: this.config.emailVerification.maxAttemptsPerEmail - emailCount,
        ip: this.config.emailVerification.maxAttemptsPerIP - ipCount,
      },
    };
  }

  /**
   * Registrar intento de verificación de email
   */
  async recordEmailVerificationAttempt(
    email,
    ipAddress,
    userAgent,
    success = false,
  ) {
    await prisma.$executeRaw`
      INSERT INTO email_verification_attempts (email, ip_address, user_agent, success)
      VALUES (${email.toLowerCase()}, ${ipAddress}, ${userAgent}, ${success})
    `;
  }

  /**
   * Verificar intentos de verificación de token
   */
  async checkTokenVerificationAttempts(tokenId, tokenType = "password_reset") {
    const table =
      tokenType === "password_reset"
        ? "password_reset_tokens"
        : "email_verification_tokens";

    const token = await prisma.$queryRawUnsafe(
      `
      SELECT attempts FROM ${table}
      WHERE id = $1
    `,
      tokenId,
    );

    if (!token || token.length === 0) {
      return { allowed: false, reason: "token_not_found" };
    }

    const attempts = token[0].attempts || 0;

    if (attempts >= this.config.tokenVerification.maxAttempts) {
      return {
        allowed: false,
        reason: "max_attempts_exceeded",
        message: `Has excedido el número máximo de intentos para verificar este código. Por favor solicita uno nuevo.`,
        attemptsUsed: attempts,
        maxAttempts: this.config.tokenVerification.maxAttempts,
      };
    }

    return {
      allowed: true,
      attemptsRemaining: this.config.tokenVerification.maxAttempts - attempts,
    };
  }

  /**
   * Incrementar contador de intentos de verificación de token
   */
  async incrementTokenAttempts(tokenId, tokenType = "password_reset") {
    const table =
      tokenType === "password_reset"
        ? "password_reset_tokens"
        : "email_verification_tokens";

    await prisma.$executeRawUnsafe(
      `
      UPDATE ${table}
      SET attempts = attempts + 1
      WHERE id = $1
    `,
      tokenId,
    );
  }

  /**
   * Limpiar intentos antiguos (ejecutar periódicamente con cron)
   */
  async cleanupOldAttempts() {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 días

    const deletedPasswordResets = await prisma.passwordResetAttempt.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    const deletedEmailVerifications = await prisma.$executeRaw`
      DELETE FROM email_verification_attempts
      WHERE created_at < ${cutoffDate}
    `;

    console.log(`🧹 Limpieza de intentos antiguos completada:`);
    console.log(
      `   - Password resets: ${deletedPasswordResets.count} registros eliminados`,
    );
    console.log(
      `   - Email verifications: ${deletedEmailVerifications} registros eliminados`,
    );

    return {
      passwordResets: deletedPasswordResets.count,
      emailVerifications: deletedEmailVerifications,
    };
  }

  /**
   * Obtener IP del cliente desde el request
   */
  getClientIP(req) {
    return (
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.headers["x-real-ip"] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      "unknown"
    );
  }

  /**
   * Obtener User Agent del cliente
   */
  getUserAgent(req) {
    return req.headers["user-agent"] || "unknown";
  }
}

export default new RateLimitService();

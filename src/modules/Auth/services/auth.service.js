import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { AuthRepository } from "../repository/auth.repository.js";
import emailService from "../../../services/emailService.js";

export class AuthService {
  constructor() {
    this.authRepository = new AuthRepository();
  }

  getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET no está configurado en variables de entorno");
    }
    return secret;
  }

  getJwtRefreshSecret() {
    return process.env.JWT_REFRESH_SECRET || this.getJwtSecret();
  }

  /**
   * Autenticar usuario
   */
  async login(email, password) {
    try {
      // 1. Validar entrada
      if (!email || !password) {
        return {
          success: false,
          statusCode: 400,
          message: "Email y contraseña son requeridos",
        };
      }

      // 2. Buscar usuario por email
      const cleanEmail = email.toLowerCase().trim();
      const user = await this.authRepository.findByEmail(cleanEmail);

      if (!user) {
        return {
          success: false,
          statusCode: 401,
          message: "Credenciales inválidas",
        };
      }

      // 3. Verificar estado del usuario
      if (user.status !== "Active") {
        return {
          success: false,
          statusCode: 403,
          message: "Usuario inactivo. Contacte al administrador.",
        };
      }

      // 3.5. VALIDACIÓN CRÍTICA: Si es deportista, verificar que el atleta está activo
      if (user.athlete && user.athlete.status !== "Active") {
        return {
          success: false,
          statusCode: 403,
          message: "Tu cuenta de deportista está inactiva. Contacta al administrador para más información.",
        };
      }

      // 4. Verificar contraseña
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        return {
          success: false,
          statusCode: 401,
          message: "Credenciales inválidas",
        };
      }

      // 5. Generar access token (corta duracin - solo en memoria del cliente)
      const accessToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          roleId: user.roleId,
        },
        this.getJwtSecret(),
        { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" },
      );

      // 6. Generar refresh token (larga duracin - ir en cookie HttpOnly)
      const refreshToken = jwt.sign(
        {
          id: user.id,
          type: "refresh",
        },
        this.getJwtRefreshSecret(),
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" },
      );

      // 7. Guardar refresh token en la base de datos
      const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
      await this.authRepository.createRefreshToken(
        user.id,
        refreshToken,
        refreshExpiresAt,
      );

      // 8. Preparar datos de respuesta (sin contraseña)
      const userData = {
        id: user.id,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        secondLastName: user.secondLastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address,
        birthDate: user.birthDate,
        age: user.age,
        identification: user.identification,
        status: user.status,
        avatarColorIndex: user.avatarColorIndex || 0,
        documentType: user.documentType,
        role: user.role,
        employee: user.employee,
        athlete: user.athlete,
      };

      return {
        success: true,
        data: {
          user: userData,
          accessToken,
        },
        refreshToken, // Se enviar como cookie HttpOnly
      };
    } catch (error) {
      console.error("Service error - login:", error);
      throw error;
    }
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // 1. Validar entrada
      if (!currentPassword || !newPassword) {
        return {
          success: false,
          statusCode: 400,
          message: "Contraseña actual y nueva contraseña son requeridas",
        };
      }

      if (newPassword.length < 6) {
        return {
          success: false,
          statusCode: 400,
          message: "La nueva contraseña debe tener al menos 6 caracteres",
        };
      }

      // 2. Buscar usuario
      const user = await this.authRepository.findById(userId);

      if (!user) {
        return {
          success: false,
          statusCode: 404,
          message: "Usuario no encontrado",
        };
      }

      // 2.1 PROTECCIÓN: No permitir cambiar contraseña del usuario por defecto del sistema
      if (user.email === "astrostar.java@gmail.com") {
        return {
          success: false,
          statusCode: 403,
          message:
            "No se puede cambiar la contraseña del usuario por defecto del sistema",
        };
      }

      // 3. Verificar contraseña actual
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.passwordHash,
      );

      if (!isCurrentPasswordValid) {
        return {
          success: false,
          statusCode: 401,
          message: "Contraseña actual incorrecta",
        };
      }

      // 4. Hashear nueva contraseña
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // 5. Actualizar contraseña
      await this.authRepository.updatePassword(userId, newPasswordHash);

      return {
        success: true,
      };
    } catch (error) {
      console.error("Service error - changePassword:", error);
      throw error;
    }
  }

  /**
   * Solicitar recuperación de contraseña
   */
  async requestPasswordReset(email, ipAddress, userAgent) {
    try {
      // 1. Verificar rate limiting
      const rateLimitService = (
        await import("../../../services/rateLimitService.js")
      ).default;
      const rateLimitCheck = await rateLimitService.checkPasswordResetRateLimit(
        email,
        ipAddress,
      );

      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          statusCode: 429, // Too Many Requests
          message: rateLimitCheck.message,
          reason: rateLimitCheck.reason,
          blockedUntil: rateLimitCheck.blockedUntil,
          minutesRemaining: rateLimitCheck.minutesRemaining,
        };
      }

      // 2. Buscar usuario por email
      const cleanEmail = email.toLowerCase().trim();

      // 2.1 PROTECCIÓN: No permitir recuperación de contraseña del usuario por defecto
      if (cleanEmail === "astrostar.java@gmail.com") {
        // Registrar intento pero no revelar que es usuario protegido
        await rateLimitService.recordPasswordResetAttempt(
          cleanEmail,
          ipAddress,
          userAgent,
          false,
        );

        return {
          success: true,
          message:
            "Si el correo existe, recibirás instrucciones para restablecer tu contraseña",
        };
      }

      const user = await this.authRepository.findByEmail(cleanEmail);

      if (!user) {
        // Por seguridad, no revelamos si el email existe o no
        // Pero registramos el intento
        await rateLimitService.recordPasswordResetAttempt(
          cleanEmail,
          ipAddress,
          userAgent,
          false,
        );

        return {
          success: true,
          message:
            "Si el correo existe, recibirás instrucciones para restablecer tu contraseña",
        };
      }

      // 3. Verificar estado del usuario
      if (user.status !== "Active") {
        await rateLimitService.recordPasswordResetAttempt(
          cleanEmail,
          ipAddress,
          userAgent,
          false,
        );

        return {
          success: false,
          statusCode: 400,
          message: "Usuario inactivo. Contacte al administrador.",
        };
      }

      // 4. Eliminar tokens antiguos
      await this.authRepository.deleteOldTokens(user.id);

      // 5. Generar token de 6 dgitos
      const resetToken = crypto.randomInt(100000, 999999).toString();

      // 6. Calcular expiracin (15 minutos)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // 7. Guardar token en la base de datos con información de seguridad
      await this.authRepository.createPasswordResetToken(
        user.id,
        resetToken,
        expiresAt,
        ipAddress,
        userAgent,
      );

      // 8. Enviar email
      await emailService.sendPasswordResetEmail(user.email, resetToken);

      // 9. Registrar intento exitoso
      await rateLimitService.recordPasswordResetAttempt(
        cleanEmail,
        ipAddress,
        userAgent,
        true,
      );

      return {
        success: true,
        message:
          "Si el correo existe, recibirás instrucciones para restablecer tu contraseña",
        attemptsRemaining: rateLimitCheck.attemptsRemaining,
      };
    } catch (error) {
      console.error("Service error - requestPasswordReset:", error);
      throw error;
    }
  }

  /**
   * Verificar token de recuperación
   */
  async verifyResetToken(token) {
    try {
      const resetToken = await this.authRepository.findValidResetToken(token);

      if (!resetToken) {
        return {
          success: false,
          statusCode: 400,
          message: "Código inválido o expirado",
        };
      }

      // Verificar intentos de verificacin
      const rateLimitService = (
        await import("../../../services/rateLimitService.js")
      ).default;
      const attemptCheck =
        await rateLimitService.checkTokenVerificationAttempts(
          resetToken.id,
          "password_reset",
        );

      if (!attemptCheck.allowed) {
        return {
          success: false,
          statusCode: 429,
          message: attemptCheck.message,
          reason: attemptCheck.reason,
        };
      }

      return {
        success: true,
        data: {
          email: resetToken.user.email,
          tokenId: resetToken.id,
        },
      };
    } catch (error) {
      console.error("Service error - verifyResetToken:", error);
      throw error;
    }
  }

  /**
   * Restablecer contraseña con token
   */
  async resetPassword(token, newPassword) {
    try {
      // 1. Validar nueva contraseña
      if (!newPassword || newPassword.length < 6) {
        return {
          success: false,
          statusCode: 400,
          message: "La contraseña debe tener al menos 6 caracteres",
        };
      }

      // 2. Buscar token vlido
      const resetToken = await this.authRepository.findValidResetToken(token);

      if (!resetToken) {
        // Incrementar contador de intentos fallidos si el token existe
        const rateLimitService = (
          await import("../../../services/rateLimitService.js")
        ).default;

        const existingToken =
          await this.authRepository.findResetTokenByValue(token);
        if (existingToken) {
          await rateLimitService.incrementTokenAttempts(
            existingToken.id,
            "password_reset",
          );
        }

        return {
          success: false,
          statusCode: 400,
          message: "Código inválido o expirado",
        };
      }

      // 2.1 Verificar intentos de verificacin
      const rateLimitService = (
        await import("../../../services/rateLimitService.js")
      ).default;
      const attemptCheck =
        await rateLimitService.checkTokenVerificationAttempts(
          resetToken.id,
          "password_reset",
        );

      if (!attemptCheck.allowed) {
        return {
          success: false,
          statusCode: 429,
          message: attemptCheck.message,
          reason: attemptCheck.reason,
        };
      }

      // 2.2 PROTECCIÓN: No permitir resetear contraseña del usuario por defecto
      if (resetToken.user.email === "astrostar.java@gmail.com") {
        return {
          success: false,
          statusCode: 403,
          message:
            "No se puede restablecer la contraseña del usuario por defecto del sistema",
        };
      }

      // 3. Hashear nueva contraseña
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // 4. Actualizar contraseña
      await this.authRepository.updatePassword(
        resetToken.userId,
        newPasswordHash,
      );

      // 5. Marcar token como usado
      await this.authRepository.markTokenAsUsed(resetToken.id);

      return {
        success: true,
        message: "Contraseña restablecida exitosamente",
      };
    } catch (error) {
      console.error("Service error - resetPassword:", error);
      throw error;
    }
  }

  /**
   * Obtener perfil completo del usuario
   */
  async getUserProfile(userId) {
    try {
      const user = await this.authRepository.findByIdComplete(userId);

      if (!user) {
        return {
          success: false,
          statusCode: 404,
          message: "Usuario no encontrado",
        };
      }

      // Preparar datos de respuesta
      const userData = {
        id: user.id,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        secondLastName: user.secondLastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address,
        birthDate: user.birthDate,
        age: user.age,
        identification: user.identification,
        status: user.status,
        avatarColorIndex: user.avatarColorIndex || 0,
        documentType: user.documentType,
        role: user.role,
        employee: user.employee,
        athlete: user.athlete,
      };

      return {
        success: true,
        data: userData,
      };
    } catch (error) {
      console.error("Service error - getUserProfile:", error);
      throw error;
    }
  }

  /**
   * Solicitar cambio de email (envía código de verificación)
   */
  async requestEmailChange(userId, newEmail) {
    try {
      // 1. Buscar usuario
      const user = await this.authRepository.findByIdComplete(userId);

      if (!user) {
        return {
          success: false,
          statusCode: 404,
          message: "Usuario no encontrado",
        };
      }

      // 2. Validar que el nuevo email sea diferente
      if (user.email === newEmail) {
        return {
          success: false,
          statusCode: 400,
          message: "El nuevo correo es igual al actual",
        };
      }

      // 3. Verificar que el nuevo email no está en uso
      const existingUser = await this.authRepository.findByEmail(newEmail);
      if (existingUser) {
        return {
          success: false,
          statusCode: 400,
          message: "El correo electrónico ya está en uso",
        };
      }

      // 4. Eliminar tokens antiguos de cambio de email
      await this.authRepository.deleteOldEmailVerificationTokens(userId);

      // 5. Generar token de 6 dgitos
      const verificationToken = crypto.randomInt(100000, 999999).toString();

      // 6. Calcular expiracin (15 minutos)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // 7. Guardar token en la base de datos
      await this.authRepository.createEmailVerificationToken(
        userId,
        newEmail,
        verificationToken,
        expiresAt,
      );

      // 8. Enviar email con el código
      await emailService.sendEmailVerificationCode(
        newEmail,
        verificationToken,
        user.firstName,
      );

      return {
        success: true,
        message: "Código de verificación enviado al nuevo correo electrónico",
      };
    } catch (error) {
      console.error("Service error - requestEmailChange:", error);
      throw error;
    }
  }

  /**
   * Verificar código y actualizar email
   */
  async verifyAndUpdateEmail(userId, token) {
    try {
      // 1. Buscar token válido
      const verificationToken =
        await this.authRepository.findValidEmailVerificationToken(
          userId,
          token,
        );

      if (!verificationToken) {
        return {
          success: false,
          statusCode: 400,
          message: "Código inválido o expirado",
        };
      }

      // 2. Actualizar email del usuario
      const updatedUser = await this.authRepository.updateEmail(
        userId,
        verificationToken.newEmail,
      );

      // 3. Marcar token como usado
      await this.authRepository.markEmailTokenAsUsed(verificationToken.id);

      // 4. Preparar datos de respuesta
      const userData = {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        middleName: updatedUser.middleName,
        lastName: updatedUser.lastName,
        secondLastName: updatedUser.secondLastName,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        address: updatedUser.address,
        birthDate: updatedUser.birthDate,
        age: updatedUser.age,
        identification: updatedUser.identification,
        status: updatedUser.status,
        avatarColorIndex: updatedUser.avatarColorIndex || 0,
        documentType: updatedUser.documentType,
        role: updatedUser.role,
        employee: updatedUser.employee,
        athlete: updatedUser.athlete,
      };

      return {
        success: true,
        data: userData,
        message: "Correo electrónico actualizado exitosamente",
      };
    } catch (error) {
      console.error("Service error - verifyAndUpdateEmail:", error);
      throw error;
    }
  }

  /**
   * Actualizar perfil del usuario (sin email)
   */
  async updateProfile(userId, updateData) {
    try {
      // 1. Buscar usuario
      const user = await this.authRepository.findById(userId);

      if (!user) {
        return {
          success: false,
          statusCode: 404,
          message: "Usuario no encontrado",
        };
      }

      // 2. Preparar datos para actualizar (solo campos permitidos, sin email)
      const allowedFields = {
        phoneNumber: updateData.phoneNumber,
        address: updateData.address,
        avatarColorIndex: updateData.avatarColorIndex,
      };

      // Validar avatarColorIndex si se proporciona
      if (updateData.avatarColorIndex !== undefined) {
        const colorIndex = parseInt(updateData.avatarColorIndex);
        if (isNaN(colorIndex) || colorIndex < 0 || colorIndex > 5) {
          return {
            success: false,
            statusCode: 400,
            message: "El ndice de color debe estar entre 0 y 5",
          };
        }
        allowedFields.avatarColorIndex = colorIndex;
      }

      // Filtrar campos undefined
      const dataToUpdate = Object.fromEntries(
        Object.entries(allowedFields).filter(
          ([_, value]) => value !== undefined,
        ),
      );

      // Validar que haya al menos un campo para actualizar
      if (Object.keys(dataToUpdate).length === 0) {
        return {
          success: false,
          statusCode: 400,
          message: "No hay datos para actualizar",
        };
      }

      // 3. Actualizar usuario
      const updatedUser = await this.authRepository.updateProfile(
        userId,
        dataToUpdate,
      );

      // 4. Preparar datos de respuesta
      const userData = {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        middleName: updatedUser.middleName,
        lastName: updatedUser.lastName,
        secondLastName: updatedUser.secondLastName,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        address: updatedUser.address,
        birthDate: updatedUser.birthDate,
        age: updatedUser.age,
        identification: updatedUser.identification,
        status: updatedUser.status,
        avatarColorIndex: updatedUser.avatarColorIndex || 0,
        documentType: updatedUser.documentType,
        role: updatedUser.role,
        employee: updatedUser.employee,
        athlete: updatedUser.athlete,
      };

      return {
        success: true,
        data: userData,
      };
    } catch (error) {
      console.error("Service error - updateProfile:", error);
      throw error;
    }
  }

  /**
   * Refrescar access token usando refresh token (desde cookie)
   */
  async refreshAccessToken(refreshToken) {
    try {
      if (!refreshToken) {
        return {
          success: false,
          statusCode: 401,
          message: "Refresh token no proporcionado",
        };
      }

      // 1. Verificar que el refresh token sea vlido
      let decoded;
      try {
        decoded = jwt.verify(
          refreshToken,
          this.getJwtRefreshSecret(),
        );
      } catch (error) {
        return {
          success: false,
          statusCode: 401,
          message: "Refresh token inválido o expirado",
        };
      }

      // 2. Verificar que el token exista en la base de datos
      const storedToken =
        await this.authRepository.findValidRefreshToken(refreshToken);

      if (!storedToken) {
        return {
          success: false,
          statusCode: 401,
          message: "Refresh token no encontrado o expirado",
        };
      }

      // 3. Verificar que el usuario está activo
      if (storedToken.user.status !== "Active") {
        return {
          success: false,
          statusCode: 401,
          message: "Usuario inactivo",
        };
      }

      // 4. Generar nuevo access token
      const newAccessToken = jwt.sign(
        {
          id: storedToken.user.id,
          email: storedToken.user.email,
          roleId: storedToken.user.roleId,
        },
        this.getJwtSecret(),
        { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" },
      );

      return {
        success: true,
        data: {
          accessToken: newAccessToken,
        },
      };
    } catch (error) {
      console.error("Service error - refreshAccessToken:", error);
      throw error;
    }
  }

  /**
   * Cerrar sesión (invalidar refresh token desde cookie)
   */
  async logout(refreshToken) {
    try {
      if (refreshToken) {
        // Eliminar el refresh token de la base de datos
        await this.authRepository.deleteRefreshToken(refreshToken);
      }

      return {
        success: true,
        message: "Sesión cerrada exitosamente",
      };
    } catch (error) {
      console.error("Service error - logout:", error);
      throw error;
    }
  }

  /**
   * Cerrar todas las sesiones de un usuario
   */
  async logoutAll(userId) {
    try {
      // Eliminar todos los refresh tokens del usuario
      await this.authRepository.deleteUserRefreshTokens(userId);

      return {
        success: true,
        message: "Todas las sesiones cerradas exitosamente",
      };
    } catch (error) {
      console.error("Service error - logoutAll:", error);
      throw error;
    }
  }
}



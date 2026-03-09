import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { AuthRepository } from "../repository/auth.repository.js";
import emailService from "../../../services/emailService.js";

export class AuthService {
  constructor() {
    this.authRepository = new AuthRepository();
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
          message: "Email y contraseÃƒÆ’Ã‚Â±a son requeridos",
        };
      }

      // 2. Buscar usuario por email
      const cleanEmail = email.toLowerCase().trim();
      const user = await this.authRepository.findByEmail(cleanEmail);

      if (!user) {
        return {
          success: false,
          statusCode: 401,
          message: "Credenciales invÃƒÆ’Ã‚Â¡lidas",
        };
      }

      // 3. Verificar estado del usuario
      if (user.status !== "Active") {
        return {
          success: false,
          statusCode: 401,
          message: "Usuario inactivo. Contacte al administrador.",
        };
      }

      // 4. Verificar contraseÃƒÆ’Ã‚Â±a
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        return {
          success: false,
          statusCode: 401,
          message: "Credenciales invÃƒÆ’Ã‚Â¡lidas",
        };
      }

      // 5. Generar access token (corta duraciÃƒÆ’Ã‚Â³n - solo en memoria del cliente)
      const accessToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          roleId: user.roleId,
        },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" },
      );

      // 6. Generar refresh token (larga duraciÃƒÆ’Ã‚Â³n - irÃƒÆ’Ã‚Â¡ en cookie HttpOnly)
      const refreshToken = jwt.sign(
        {
          id: user.id,
          type: "refresh",
        },
        process.env.JWT_REFRESH_SECRET ||
          process.env.JWT_SECRET ||
          "your-refresh-secret",
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" },
      );

      // 7. Guardar refresh token en la base de datos
      const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dÃƒÆ’Ã‚Â­as
      await this.authRepository.createRefreshToken(
        user.id,
        refreshToken,
        refreshExpiresAt,
      );

      // 8. Preparar datos de respuesta (sin contraseÃƒÆ’Ã‚Â±a)
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
        refreshToken, // Se enviarÃƒÆ’Ã‚Â¡ como cookie HttpOnly
      };
    } catch (error) {
      console.error("Service error - login:", error);
      throw error;
    }
  }

  /**
   * Verificar la validez de un token de reseteo de contraseÃƒÆ’Ã‚Â±a
   */
  async verifyResetToken(token) {
    try {
      // 1. Validar entrada
      if (!token) {
        return {
          success: false,
          statusCode: 400,
          message: "Token de reseteo es requerido.",
        };
      }

      // 2. Hashear el token recibido para buscarlo en la base de datos
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      // 3. Buscar usuario por el token hasheado y verificar expiraciÃƒÆ’Ã‚Â³n
      const user = await this.authRepository.findByPasswordResetToken(
        hashedToken
      );

      if (!user) {
        return {
          success: false,
          statusCode: 400,
          message: "El enlace de recuperaciÃƒÆ’Ã‚Â³n es invÃƒÆ’Ã‚Â¡lido o ha expirado.",
        };
      }

      return { success: true, message: "Token vÃƒÆ’Ã‚Â¡lido." };
    } catch (error) {
      console.error("Service error - verifyResetToken:", error);
      return { success: false, statusCode: 500, message: "Error al verificar el token." };
    }
  }

  /**
   * Resetear la contraseÃƒÆ’Ã‚Â±a del usuario usando el token
   */
  async resetPassword(token, newPassword) {
    try {
      // 1. Validar entrada
      if (!token || !newPassword) {
        return {
          success: false,
          statusCode: 400,
          message: "Token y nueva contraseÃƒÆ’Ã‚Â±a son requeridos.",
        };
      }

      if (newPassword.length < 6) {
        return {
          success: false,
          statusCode: 400,
          message: "La nueva contraseÃƒÆ’Ã‚Â±a debe tener al menos 6 caracteres.",
        };
      }

      // 2. Hashear el token para buscarlo en la base de datos
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      // 3. Buscar usuario por el token y verificar expiraciÃƒÆ’Ã‚Â³n
      const user = await this.authRepository.findByPasswordResetToken(
        hashedToken
      );

      if (!user) {
        return {
          success: false,
          statusCode: 400,
          message: "El enlace de recuperaciÃƒÆ’Ã‚Â³n es invÃƒÆ’Ã‚Â¡lido o ha expirado.",
        };
      }

      // 4. Hashear la nueva contraseÃƒÆ’Ã‚Â±a
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // 5. Resetear la contraseÃƒÆ’Ã‚Â±a y limpiar los campos de reseteo
      await this.authRepository.resetPassword(user.id, newPasswordHash);

      return {
        success: true,
        message: "ContraseÃƒÆ’Ã‚Â±a restablecida exitosamente.",
      };
    } catch (error) {
      console.error("Service error - resetPassword:", error);
      return {
        success: false,
        statusCode: 500,
        message: "Error al restablecer la contraseÃƒÆ’Ã‚Â±a.",
      };
    }
  }


  /**
   * Cambiar contraseÃƒÆ’Ã‚Â±a
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // 1. Validar entrada
      if (!currentPassword || !newPassword) {
        return {
          success: false,
          statusCode: 400,
          message: "ContraseÃƒÆ’Ã‚Â±a actual y nueva contraseÃƒÆ’Ã‚Â±a son requeridas",
        };
      }

      if (newPassword.length < 6) {
        return {
          success: false,
          statusCode: 400,
          message: "La nueva contraseÃƒÆ’Ã‚Â±a debe tener al menos 6 caracteres",
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

      // 2.1 PROTECCIÃƒÆ’Ã¢â‚¬Å“N: No permitir cambiar contraseÃƒÆ’Ã‚Â±a del usuario por defecto del sistema
      if (user.email === "astrostar.java@gmail.com") {
        return {
          success: false,
          statusCode: 403,
          message:
            "No se puede cambiar la contraseÃƒÆ’Ã‚Â±a del usuario por defecto del sistema",
        };
      }

      // 3. Verificar contraseÃƒÆ’Ã‚Â±a actual
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.passwordHash,
      );

      if (!isCurrentPasswordValid) {
        return {
          success: false,
          statusCode: 401,
          message: "ContraseÃƒÆ’Ã‚Â±a actual incorrecta",
        };
      }

      // 4. Hashear nueva contraseÃƒÆ’Ã‚Â±a
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // 5. Actualizar contraseÃƒÆ’Ã‚Â±a
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
   * Solicitar recuperaciÃƒÆ’Ã‚Â³n de contraseÃƒÆ’Ã‚Â±a
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

      // 2.1 PROTECCIÃƒÆ’Ã¢â‚¬Å“N: No permitir recuperaciÃƒÆ’Ã‚Â³n de contraseÃƒÆ’Ã‚Â±a del usuario por defecto
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
            "Si el correo existe, recibirÃƒÆ’Ã‚Â¡s instrucciones para restablecer tu contraseÃƒÆ’Ã‚Â±a",
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
            "Si el correo existe, recibirÃƒÆ’Ã‚Â¡s instrucciones para restablecer tu contraseÃƒÆ’Ã‚Â±a",
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

      // 5. Generar token de 6 dÃƒÆ’Ã‚Â­gitos
      const resetToken = crypto.randomInt(100000, 999999).toString();

      // 6. Calcular expiraciÃƒÆ’Ã‚Â³n (15 minutos)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // 7. Guardar token en la base de datos con informaciÃƒÆ’Ã‚Â³n de seguridad
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
          "Si el correo existe, recibirÃƒÆ’Ã‚Â¡s instrucciones para restablecer tu contraseÃƒÆ’Ã‚Â±a",
        attemptsRemaining: rateLimitCheck.attemptsRemaining,
      };
    } catch (error) {
      console.error("Service error - requestPasswordReset:", error);
      throw error;
    }
  }

  /**
   * Verificar token de recuperaciÃƒÆ’Ã‚Â³n
   */
  async verifyResetToken(token) {
    try {
      const resetToken = await this.authRepository.findValidResetToken(token);

      if (!resetToken) {
        return {
          success: false,
          statusCode: 400,
          message: "CÃƒÆ’Ã‚Â³digo invÃƒÆ’Ã‚Â¡lido o expirado",
        };
      }

      // Verificar intentos de verificaciÃƒÆ’Ã‚Â³n
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
   * Restablecer contraseÃƒÆ’Ã‚Â±a con token
   */
  async resetPassword(token, newPassword) {
    try {
      // 1. Validar nueva contraseÃƒÆ’Ã‚Â±a
      if (!newPassword || newPassword.length < 6) {
        return {
          success: false,
          statusCode: 400,
          message: "La contraseÃƒÆ’Ã‚Â±a debe tener al menos 6 caracteres",
        };
      }

      // 2. Buscar token vÃƒÆ’Ã‚Â¡lido
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
          message: "CÃƒÆ’Ã‚Â³digo invÃƒÆ’Ã‚Â¡lido o expirado",
        };
      }

      // 2.1 Verificar intentos de verificaciÃƒÆ’Ã‚Â³n
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

      // 2.2 PROTECCIÃƒÆ’Ã¢â‚¬Å“N: No permitir resetear contraseÃƒÆ’Ã‚Â±a del usuario por defecto
      if (resetToken.user.email === "astrostar.java@gmail.com") {
        return {
          success: false,
          statusCode: 403,
          message:
            "No se puede restablecer la contraseÃƒÆ’Ã‚Â±a del usuario por defecto del sistema",
        };
      }

      // 3. Hashear nueva contraseÃƒÆ’Ã‚Â±a
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // 4. Actualizar contraseÃƒÆ’Ã‚Â±a
      await this.authRepository.updatePassword(
        resetToken.userId,
        newPasswordHash,
      );

      // 5. Marcar token como usado
      await this.authRepository.markTokenAsUsed(resetToken.id);

      return {
        success: true,
        message: "ContraseÃƒÆ’Ã‚Â±a restablecida exitosamente",
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
   * Solicitar cambio de email (envÃƒÆ’Ã‚Â­a cÃƒÆ’Ã‚Â³digo de verificaciÃƒÆ’Ã‚Â³n)
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

      // 3. Verificar que el nuevo email no estÃƒÆ’Ã‚Â© en uso
      const existingUser = await this.authRepository.findByEmail(newEmail);
      if (existingUser) {
        return {
          success: false,
          statusCode: 400,
          message: "El correo electrÃƒÆ’Ã‚Â³nico ya estÃƒÆ’Ã‚Â¡ en uso",
        };
      }

      // 4. Eliminar tokens antiguos de cambio de email
      await this.authRepository.deleteOldEmailVerificationTokens(userId);

      // 5. Generar token de 6 dÃƒÆ’Ã‚Â­gitos
      const verificationToken = crypto.randomInt(100000, 999999).toString();

      // 6. Calcular expiraciÃƒÆ’Ã‚Â³n (15 minutos)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // 7. Guardar token en la base de datos
      await this.authRepository.createEmailVerificationToken(
        userId,
        newEmail,
        verificationToken,
        expiresAt,
      );

      // 8. Enviar email con el cÃƒÆ’Ã‚Â³digo
      await emailService.sendEmailVerificationCode(
        newEmail,
        verificationToken,
        user.firstName,
      );

      return {
        success: true,
        message: "CÃƒÆ’Ã‚Â³digo de verificaciÃƒÆ’Ã‚Â³n enviado al nuevo correo electrÃƒÆ’Ã‚Â³nico",
      };
    } catch (error) {
      console.error("Service error - requestEmailChange:", error);
      throw error;
    }
  }

  /**
   * Verificar cÃƒÆ’Ã‚Â³digo y actualizar email
   */
  async verifyAndUpdateEmail(userId, token) {
    try {
      // 1. Buscar token vÃƒÆ’Ã‚Â¡lido
      const verificationToken =
        await this.authRepository.findValidEmailVerificationToken(
          userId,
          token,
        );

      if (!verificationToken) {
        return {
          success: false,
          statusCode: 400,
          message: "CÃƒÆ’Ã‚Â³digo invÃƒÆ’Ã‚Â¡lido o expirado",
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
        message: "Correo electrÃƒÆ’Ã‚Â³nico actualizado exitosamente",
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
            message: "El ÃƒÆ’Ã‚Â­ndice de color debe estar entre 0 y 5",
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

      // 1. Verificar que el refresh token sea vÃƒÆ’Ã‚Â¡lido
      let decoded;
      try {
        decoded = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET ||
            process.env.JWT_SECRET ||
            "your-refresh-secret",
        );
      } catch (error) {
        return {
          success: false,
          statusCode: 401,
          message: "Refresh token invÃƒÆ’Ã‚Â¡lido o expirado",
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

      // 3. Verificar que el usuario estÃƒÆ’Ã‚Â© activo
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
        process.env.JWT_SECRET || "your-secret-key",
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
   * Cerrar sesiÃƒÆ’Ã‚Â³n (invalidar refresh token desde cookie)
   */
  async logout(refreshToken) {
    try {
      if (refreshToken) {
        // Eliminar el refresh token de la base de datos
        await this.authRepository.deleteRefreshToken(refreshToken);
      }

      return {
        success: true,
        message: "SesiÃƒÆ’Ã‚Â³n cerrada exitosamente",
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

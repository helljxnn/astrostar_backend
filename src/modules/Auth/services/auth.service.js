import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../../../utils/mailer.js"; // <-- Deberás crear este archivo
import { AuthRepository } from "../repository/auth.repository.js";

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
          statusCode: 401,
          message: "Usuario inactivo. Contacte al administrador.",
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

      // 5. Generar token JWT
      const token = jwt.sign(
        { 
          id: user.id,
          email: user.email,
          roleId: user.roleId,
        },
        process.env.JWT_SECRET,
        { expiresIn: "5s" }
      );

      const refreshToken = jwt.sign(
        {
          id: user.id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
      );

      // Guardar el refreshToken en la base de datos para mayor seguridad
      await this.authRepository.updateUserRefreshToken(user.id, refreshToken);

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
          },
          accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      console.error("Service error - login:", error);
      throw error;
    }
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  async profile(accessToken) {
    let userId;
    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return {
          success: false,
          statusCode: 401,
          message: "Token de acceso expirado.",
        };
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return {
          success: false,
          statusCode: 403,
          message: "Token de acceso inválido.",
        };
      }
      console.error("Service error - profile (token verification):", error);
      throw error; // Re-lanzar otros errores inesperados
    }

    // Ahora que tenemos el userId, procedemos a buscar el perfil
    try {
      // 1. Buscar usuario por ID con datos completos
      const user = await this.authRepository.findProfileById(userId);

      if (!user) {
        return {
          success: false,
          statusCode: 404,
          message: "Usuario no encontrado",
        };
      }

      // 2. Verificar estado del usuario
      if (user.status !== "Active") {
        return {
          success: false,
          statusCode: 401,
          message: "Usuario inactivo. Contacte al administrador.",
        };
      }

      // 3. Verificar rol activo
      if (user.role.status !== "Active") {
        return {
          success: false,
          statusCode: 401,
          message: "Rol inactivo. Contacte al administrador.",
        };
      }

      // 4. Preparar datos de respuesta (sin contraseña)
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
        documentType: user.documentType ? user.documentType.name : null,
        idDocumentType: user.documentTypeId,
        role: user.role,
        employee: user.employee,
        athlete: user.athlete,
      };

      return { success: true, data: userData };
    } catch (error) {
      console.error("Service error - profile:", error);
      throw error;
    }
  }

  /**
   * Actualizar perfil de usuario
   */
  async updateProfile(userId, profileData) {
    try {
      // 1. Validar entrada
      if (!profileData) {
        return {
          success: false,
          statusCode: 400,
          message: "Datos de perfil son requeridos",
        };
      }

      const {
        firstName,
        middleName,
        lastName,
        secondLastName,
        documentTypeId,
        identification,
        email,
        phoneNumber,
        address,
        birthDate,
      } = profileData;

      // 2. Buscar usuario
      const user = await this.authRepository.findById(userId);

      if (!user) {
        return {
          success: false,
          statusCode: 404,
          message: "Usuario no encontrado",
        };
      }

      // 4. Preparar datos para actualizar
      const updateData = {
        firstName,
        middleName,
        lastName,
        secondLastName,
        identification,
        email,
        phoneNumber,
        address,
        birthDate: new Date(birthDate),
      };

      // Conexión condicional del tipo de documento
      if (documentTypeId) {
        updateData.documentType = {
          connect: { id: parseInt(documentTypeId) },
        };
      }

      // 5. Actualizar perfil
      await this.authRepository.updateProfile(userId, updateData);

      // 6. Obtener el usuario actualizado
      const updatedUser = await this.authRepository.findProfileById(userId);

      // 7. Preparar datos de respuesta
      const userData = {
        ...updatedUser,
        documentType: updatedUser.documentType ? updatedUser.documentType.name : null,
      };

      return {
        success: true,
        data: userData,
      };
    } catch (error) {
      console.error("Service error - updateProfile:", error);
      return {
        success: false,
        statusCode: 500,
        message: "Error al actualizar el perfil",
      };
    }
  }

  /**
   * Iniciar proceso de olvido de contraseña
   */
  async forgotPassword(email) {
    try {
      // 1. Buscar usuario por email
      const cleanEmail = email.toLowerCase().trim();
      const user = await this.authRepository.findByEmail(cleanEmail);

      // 2. Si no se encuentra el usuario, devolvemos éxito para no revelar si un email existe o no (seguridad).
      if (!user) {
        return {
          success: true,
          message:
            "Si existe una cuenta con este correo, se ha enviado un enlace para restablecer la contraseña.",
        };
      }

      // 3. Generar un token de reseteo seguro
      const resetToken = crypto.randomBytes(32).toString("hex");

      // 4. Hashear el token y guardarlo en la base de datos junto con la fecha de expiración (15 minutos)
      const passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      const passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos desde ahora

      await this.authRepository.updateUserResetToken(
        user.id,
        passwordResetToken,
        passwordResetExpires
      );

      // 5. Crear el enlace de reseteo para el frontend
      // El frontend recibirá este token, y lo usará para llamar a la API de reset-password
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      // 6. Enviar el correo electrónico
      await sendPasswordResetEmail({
        to: user.email,
        firstName: user.firstName,
        url: resetUrl,
      });

      return {
        success: true,
        message:
          "Si existe una cuenta con este correo, se ha enviado un enlace para restablecer la contraseña.",
      };
    } catch (error) {
      console.error("Service error - forgotPassword:", error);
      // No revelamos el error interno, solo un mensaje genérico
      return {
        success: false,
        statusCode: 500,
        message:
          "Ocurrió un error al procesar la solicitud. Por favor, inténtelo de nuevo más tarde.",
      };
    }
  }

  /**
   * Verificar la validez de un token de reseteo de contraseña
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

      // 3. Buscar usuario por el token hasheado y verificar expiración
      const user = await this.authRepository.findByPasswordResetToken(
        hashedToken
      );

      if (!user) {
        return {
          success: false,
          statusCode: 400,
          message: "El enlace de recuperación es inválido o ha expirado.",
        };
      }

      return { success: true, message: "Token válido." };
    } catch (error) {
      console.error("Service error - verifyResetToken:", error);
      return { success: false, statusCode: 500, message: "Error al verificar el token." };
    }
  }

  /**
   * Resetear la contraseña del usuario usando el token
   */
  async resetPassword(token, newPassword) {
    try {
      // 1. Validar entrada
      if (!token || !newPassword) {
        return {
          success: false,
          statusCode: 400,
          message: "Token y nueva contraseña son requeridos.",
        };
      }

      if (newPassword.length < 6) {
        return {
          success: false,
          statusCode: 400,
          message: "La nueva contraseña debe tener al menos 6 caracteres.",
        };
      }

      // 2. Hashear el token para buscarlo en la base de datos
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      // 3. Buscar usuario por el token y verificar expiración
      const user = await this.authRepository.findByPasswordResetToken(
        hashedToken
      );

      if (!user) {
        return {
          success: false,
          statusCode: 400,
          message: "El enlace de recuperación es inválido o ha expirado.",
        };
      }

      // 4. Hashear la nueva contraseña
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // 5. Resetear la contraseña y limpiar los campos de reseteo
      await this.authRepository.resetPassword(user.id, newPasswordHash);

      return {
        success: true,
        message: "Contraseña restablecida exitosamente.",
      };
    } catch (error) {
      console.error("Service error - resetPassword:", error);
      return {
        success: false,
        statusCode: 500,
        message: "Error al restablecer la contraseña.",
      };
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

      // 3. Verificar contraseña actual
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.passwordHash
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
   * Cerrar sesión de usuario
   */
  async logout(refreshToken) {
    try {
      if (!refreshToken) {
        return { success: true }; // No hay token, no hay nada que hacer.
      }

      // 1. Verificar el refresh token para obtener el id del usuario
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      const userId = decoded.id;

      // 2. Buscar usuario para asegurarse de que el token coincide
      const user = await this.authRepository.findById(userId);

      // Si el usuario no existe o el token no coincide, no hacemos nada.
      // Esto previene errores si el token ya fue invalidado.
      if (!user || user.refreshToken !== refreshToken) {
        return { success: true };
      }

      // 3. Limpiar el refreshToken en la base de datos
      await this.authRepository.updateUserRefreshToken(userId, null);

      return { success: true };
    } catch (error) {
      // Ignorar errores de token inválido o expirado durante el logout
      return { success: true };
    }
  }

  /**
   * Refrescar el token de acceso
   */
  async refreshToken(token) {
    try {
      if (!token) {
        return {
          success: false,
          statusCode: 401,
          message: "No se proporcionó token de refresco.",
        };
      }

      // 1. Verificar el refresh token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
      } catch (error) {
        return {
          success: false,
          statusCode: 403,
          message: "Token de refresco inválido o expirado.",
        };
      }

      const userId = decoded.id;

      // 2. Buscar usuario y comparar el token con el de la BD
      const user = await this.authRepository.findById(userId);

      if (!user) {
        return {
          success: false,
          statusCode: 404,
          message: "Usuario no encontrado.",
        };
      }

      if (user.refreshToken !== token) {
        // Medida de seguridad: si el token no coincide, podría ser un intento de reutilización de un token robado.
        // Se invalida el token actual en la BD.
        await this.authRepository.updateUserRefreshToken(userId, null);
        return {
          success: false,
          statusCode: 403,
          message: "Token de refresco no válido. Inicie sesión de nuevo.",
        };
      }

      // 3. Generar un nuevo accessToken
      const newAccessToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          roleId: user.roleId,
        },
        process.env.JWT_SECRET,
        { expiresIn: "5s" }
      );

      return {
        success: true,
        data: {
          accessToken: newAccessToken,
        },
      };
    } catch (error) {
      console.error("Service error - refreshToken:", error);
      throw error;
    }
  }
}

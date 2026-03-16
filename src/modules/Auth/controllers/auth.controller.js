import { AuthService } from "../services/auth.service.js";
import prisma from "../../../config/database.js";

export class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Iniciar sesión
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "admin@astrostar.com"
   *               password:
   *                 type: string
   *                 example: "password123"
   *     responses:
   *       200:
   *         description: Login exitoso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *                     token:
   *                       type: string
   *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *                 message:
   *                   type: string
   *                   example: "Login exitoso"
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         description: Credenciales inválidas
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  login = async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message,
        });
      }

      // Establecer refresh token en cookie HttpOnly
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true, // No accesible desde JavaScript
        secure: process.env.NODE_ENV === "production", // Solo HTTPS en producción
        sameSite: "strict", // Protección CSRF
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      });

      // Retornar solo el access token y datos del usuario
      res.json({
        success: true,
        data: result.data,
        message: "Login exitoso",
      });
    } catch (error) {
      console.error("Error en login:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/auth/me:
   *   get:
   *     summary: Obtener información del usuario autenticado
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Información del usuario obtenida exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *                 message:
   *                   type: string
   *                   example: "Usuario autenticado"
   *       401:
   *         description: No autorizado
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  me = async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await this.authService.getUserProfile(userId);

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message,
        });
      }

      res.json({
        success: true,
        data: result.data,
        message: "Usuario autenticado",
      });
    } catch (error) {
      console.error("Error obteniendo usuario:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/auth/change-password:
   *   post:
   *     summary: Cambiar contraseña
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - currentPassword
   *               - newPassword
   *             properties:
   *               currentPassword:
   *                 type: string
   *                 example: "oldPassword123"
   *               newPassword:
   *                 type: string
   *                 example: "newPassword456"
   *     responses:
   *       200:
   *         description: Contraseña cambiada exitosamente
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         description: Contraseña actual incorrecta
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  changePassword = async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      const result = await this.authService.changePassword(
        userId,
        currentPassword,
        newPassword,
      );

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message,
        });
      }

      res.json({
        success: true,
        message: "Contraseña cambiada exitosamente",
      });
    } catch (error) {
      console.error("Error cambiando contraseña:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/auth/forgot-password:
   *   post:
   *     summary: Solicitar recuperación de contraseña
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "user@example.com"
   *     responses:
   *       200:
   *         description: Instrucciones enviadas
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;

      // Obtener IP y User Agent
      const rateLimitService = (
        await import("../../../services/rateLimitService.js")
      ).default;
      const ipAddress = rateLimitService.getClientIP(req);
      const userAgent = rateLimitService.getUserAgent(req);

      const result = await this.authService.requestPasswordReset(
        email,
        ipAddress,
        userAgent,
      );

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message,
          reason: result.reason,
          blockedUntil: result.blockedUntil,
          minutesRemaining: result.minutesRemaining,
        });
      }

      res.json({
        success: true,
        message: result.message,
        attemptsRemaining: result.attemptsRemaining,
      });
    } catch (error) {
      console.error("Error en forgot-password:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/auth/verify-reset-token:
   *   post:
   *     summary: Verificar token de recuperación
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - token
   *             properties:
   *               token:
   *                 type: string
   *                 example: "123456"
   *     responses:
   *       200:
   *         description: Token válido
   *       400:
   *         description: Token inválido o expirado
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  verifyResetToken = async (req, res) => {
    try {
      const { token } = req.body;
      const result = await this.authService.verifyResetToken(token);

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message,
        });
      }

      res.json({
        success: true,
        data: result.data,
        message: "Código verificado exitosamente",
      });
    } catch (error) {
      console.error("Error en verify-reset-token:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/auth/reset-password:
   *   post:
   *     summary: Restablecer contraseña con token
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - token
   *               - newPassword
   *             properties:
   *               token:
   *                 type: string
   *                 example: "123456"
   *               newPassword:
   *                 type: string
   *                 example: "newPassword123"
   *     responses:
   *       200:
   *         description: Contraseña restablecida exitosamente
   *       400:
   *         description: Token inválido o contraseña no válida
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  resetPassword = async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      const result = await this.authService.resetPassword(token, newPassword);

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message,
        });
      }

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("Error en reset-password:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/auth/request-email-change:
   *   post:
   *     summary: Solicitar cambio de correo electrónico
   *     description: Envía un código de verificación al nuevo correo electrónico
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - newEmail
   *             properties:
   *               newEmail:
   *                 type: string
   *                 format: email
   *                 example: "nuevo@ejemplo.com"
   *     responses:
   *       200:
   *         description: Código enviado exitosamente
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         description: No autorizado
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  requestEmailChange = async (req, res) => {
    try {
      const userId = req.user.id;
      const { newEmail } = req.body;

      const result = await this.authService.requestEmailChange(
        userId,
        newEmail,
      );

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message,
        });
      }

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("Error solicitando cambio de email:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/auth/verify-email-change:
   *   post:
   *     summary: Verificar código y actualizar correo electrónico
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - token
   *             properties:
   *               token:
   *                 type: string
   *                 example: "123456"
   *     responses:
   *       200:
   *         description: Email actualizado exitosamente
   *       400:
   *         description: Código inválido o expirado
   *       401:
   *         description: No autorizado
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  verifyEmailChange = async (req, res) => {
    try {
      const userId = req.user.id;
      const { token } = req.body;

      const result = await this.authService.verifyAndUpdateEmail(userId, token);

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message,
        });
      }

      res.json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      console.error("Error verificando cambio de email:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/auth/profile:
   *   put:
   *     summary: Actualizar perfil del usuario autenticado
   *     description: Permite actualizar teléfono y dirección del usuario autenticado (el email requiere verificación)
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               phoneNumber:
   *                 type: string
   *                 example: "3001234567"
   *               address:
   *                 type: string
   *                 example: "Calle 123 #45-67"
   *     responses:
   *       200:
   *         description: Perfil actualizado exitosamente
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         description: No autorizado
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  updateProfile = async (req, res) => {
    try {
      const userId = req.user.id;
      const updateData = req.body;

      const result = await this.authService.updateProfile(userId, updateData);

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message,
        });
      }

      res.json({
        success: true,
        data: result.data,
        message: "Perfil actualizado exitosamente",
      });
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/auth/refresh:
   *   post:
   *     summary: Refrescar access token
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *     responses:
   *       200:
   *         description: Token refrescado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     accessToken:
   *                       type: string
   *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *       403:
   *         description: Refresh token inválido o expirado
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  refresh = async (req, res) => {
    try {
      // Obtener refresh token desde la cookie HttpOnly
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: "Refresh token no encontrado",
        });
      }

      const result = await this.authService.refreshAccessToken(refreshToken);

      if (!result.success) {
        // Si el refresh token es inválido, limpiar la cookie
        res.clearCookie("refreshToken");
        return res.status(result.statusCode).json({
          success: false,
          message: result.message,
        });
      }

      res.json({
        success: true,
        data: result.data,
        message: "Token refrescado exitosamente",
      });
    } catch (error) {
      console.error("Error refrescando token:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     summary: Cerrar sesión
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *     responses:
   *       200:
   *         description: Sesión cerrada exitosamente
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  logout = async (req, res) => {
    try {
      // Obtener refresh token desde la cookie
      const refreshToken = req.cookies.refreshToken;

      const result = await this.authService.logout(refreshToken);

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message,
        });
      }

      // Limpiar la cookie del refresh token
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("Error cerrando sesión:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/auth/logout-all:
   *   post:
   *     summary: Cerrar todas las sesiones del usuario
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Todas las sesiones cerradas exitosamente
   *       401:
   *         description: No autorizado
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  logoutAll = async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await this.authService.logoutAll(userId);

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message,
        });
      }

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("Error cerrando todas las sesiones:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * Obtener permisos dinámicos basados en el estado de la matrícula
   */
  getPermissions = async (req, res) => {
    try {
      const user = req.user;
      
      // Permisos base del rol
      let permissions = user.role?.permissions || {};
      
      // Si es deportista, verificar estado de matrícula para permisos dinámicos
      if (user.athlete && user.role?.name === 'Deportista') {
        // CORRECCIÓN: Una matrícula está realmente activa solo si:
        // 1. Estado es 'Vigente' Y 2. Tiene fechaInicio (fue pagada y activada)
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            athleteId: user.athlete.id,
            estado: 'Vigente',
            fechaInicio: { not: null }  // ← CORRECCIÓN CRÍTICA
          },
          orderBy: { createdAt: 'desc' }
        });

        // Si NO tiene matrícula realmente activa, solo permitir acceso a Perfil y Pagos
        if (!enrollment) {
          permissions = {
            "Perfil": { "Ver": true, "Editar": true },
            "Pagos": { "Ver": true, "Crear": true },
            "Matriculas": { "Ver": true }
          };
        } else {
          // Si tiene matrícula realmente activa, dar acceso completo
          permissions = {
            "Perfil": { "Ver": true, "Editar": true },
            "Pagos": { "Ver": true, "Crear": true },
            "Citas": { "Ver": true, "Crear": true, "Editar": true },
            "Matriculas": { "Ver": true },
            "Inscripciones": { "Ver": true },
            "Eventos": { "Ver": true }
          };
        }
      }

      res.json({
        success: true,
        data: {
          permissions,
          hasActiveEnrollment: user.athlete ? await prisma.enrollment.findFirst({
            where: {
              athleteId: user.athlete.id,
              estado: 'Vigente',
              fechaInicio: { not: null }  // ← CORRECCIÓN CRÍTICA
            }
          }) !== null : true
        }
      });
    } catch (error) {
      console.error("Error obteniendo permisos:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };;
}


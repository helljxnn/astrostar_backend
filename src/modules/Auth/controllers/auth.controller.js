import { AuthService } from "../services/auth.service.js";

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

      const { user, accessToken, refreshToken } = result.data;

      // Guardar tokens en cookies seguras
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // true en producción
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutos
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      });

      res.json({
        success: true,
        data: { user },
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
  profile = async (req, res) => {
    try {
      const accessToken = req.cookies.accessToken;

      if (!accessToken) {
        return res.status(401).json({
          success: false,
          message: "Acceso denegado. No se proporcionó token de acceso.",
        });
      }
      const result = await this.authService.profile(accessToken);

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
   * /api/auth/profile:
   *   put:
   *     summary: Actualizar perfil de usuario
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
   *               firstName:
   *                 type: string
   *               middleName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               secondLastName:
   *                 type: string
   *               documentTypeId:
   *                 type: integer
   *               identification:
   *                 type: string
   *               email:
   *                 type: string
   *                 format: email
   *               phoneNumber:
   *                 type: string
   *               address:
   *                 type: string
   *               birthDate:
   *                 type: string
   *                 format: date
   *     responses:
   *       200:
   *         description: Perfil actualizado exitosamente
   *       400:
   *         description: Datos inválidos
   *       401:
   *         description: No autorizado
   *       404:
   *         description: Usuario no encontrado
   *       500:
   *         description: Error interno del servidor
   */
  updateProfile = async (req, res) => {
    try {
      const userId = req.user.id; // ID del usuario autenticado (viene del middleware)
      const profileData = req.body;
      const result = await this.authService.updateProfile(userId, profileData);
      if (!result.success) {
        return res.status(result.statusCode).json({ success: false, message: result.message });
      }
      res.json({ success: true, message: "Perfil actualizado exitosamente", data: result.data });
    } catch (error) {
      console.error("Controller error - updateProfile:", error);
      res.status(500).json({ success: false, message: "Error interno del servidor al actualizar el perfil" });
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
        newPassword
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
   * /api/auth/logout:
   *   post:
   *     summary: Cerrar sesión
   *     tags: [Auth]
   *     description: Invalida el refresh token y limpia las cookies de autenticación.
   *     responses:
   *       200:
   *         description: Sesión cerrada exitosamente.
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  logout = async (req, res) => {
    try {
      const { refreshToken } = req.cookies;

      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      res.json({
        success: true,
        message: "Sesión cerrada exitosamente",
      });
    } catch (error) {
      console.error("Error en logout:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  /**
   * @swagger
   * /api/auth/refresh-token:
   *   post:
   *     summary: Refrescar el token de acceso
   *     tags: [Auth]
   *     description: Usa el refreshToken (almacenado en una cookie httpOnly) para obtener un nuevo accessToken.
   *     responses:
   *       200:
   *         description: Nuevo accessToken generado y enviado en una cookie.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Token de acceso refrescado."
   *       401:
   *         description: No se proporcionó token de refresco.
   *       403:
   *         description: Token de refresco inválido o expirado.
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  refreshToken = async (req, res) => {
    try {
      const { refreshToken } = req.cookies;
      const result = await this.authService.refreshToken(refreshToken);

      if (!result.success) {
        // Si falla el refresco, limpiar las cookies por seguridad
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        return res.status(result.statusCode).json({ success: false, message: result.message });
      }

      const { accessToken } = result.data;

      // Enviar el nuevo accessToken en una cookie segura
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutos
      });

      res.json({ success: true, message: "Token de acceso refrescado." });

    } catch (error) {
      console.error("Error en refreshToken:", error);
      res.status(500).json({ success: false, message: "Error interno del servidor." });
    }
  };

  /**
   * @swagger
   * /api/auth/forgot-password:
   *   post:
   *     summary: Iniciar proceso de olvido de contraseña
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
   *                 example: "usuario@ejemplo.com"
   *     responses:
   *       200:
   *         description: Respuesta genérica para no revelar si un email existe.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Si existe una cuenta con este correo, se ha enviado un enlace para restablecer la contraseña."
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;
      const result = await this.authService.forgotPassword(email);

      // Siempre devolvemos 200 OK para no dar pistas sobre la existencia de un email
      res.status(result.statusCode || 200).json({ success: result.success, message: result.message });
    } catch (error) {
      console.error("Controller error - forgotPassword:", error);
      res.status(500).json({ success: false, message: "Error interno del servidor." });
    }
  };

  /**
   * @swagger
   * /api/auth/verify-code:
   *   post:
   *     summary: Verificar la validez de un token de reseteo de contraseña
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
   *                 description: El token de reseteo recibido por correo.
   *     responses:
   *       200:
   *         description: Token válido.
   *       400:
   *         description: Token inválido o expirado.
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  verifyCode = async (req, res) => {
    try {
      const { token } = req.body;
      const result = await this.authService.verifyResetToken(token);

      if (!result.success) {
        return res.status(result.statusCode).json({ success: false, message: result.message });
      }
      res.json({ success: true, message: result.message });
    } catch (error) {
      console.error("Controller error - verifyCode:", error);
      res.status(500).json({ success: false, message: "Error interno del servidor al verificar el token." });
    }
  };

  /**
   * @swagger
   * /api/auth/reset-password:
   *   post:
   *     summary: Restablecer la contraseña del usuario
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
   *                 description: El token de reseteo recibido por correo.
   *               newPassword:
   *                 type: string
   *                 description: La nueva contraseña del usuario.
   *     responses:
   *       200:
   *         description: Contraseña restablecida exitosamente.
   *       400:
   *         description: Token inválido o expirado, o datos inválidos.
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  resetPassword = async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      const result = await this.authService.resetPassword(token, newPassword);

      if (!result.success) {
        return res.status(result.statusCode).json({ success: false, message: result.message });
      }

      res.json({ success: true, message: result.message });
    } catch (error) {
      console.error("Controller error - resetPassword:", error);
      res.status(500).json({ success: false, message: "Error interno del servidor al restablecer la contraseña." });
    }
  };
}

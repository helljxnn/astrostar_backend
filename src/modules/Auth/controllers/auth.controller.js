import { AuthService } from '../services/auth.service.js';

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
          message: result.message
        });
      }

      res.json({
        success: true,
        data: result.data,
        message: 'Login exitoso'
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      res.json({
        success: true,
        data: req.user,
        message: 'Usuario autenticado'
      });
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      
      const result = await this.authService.changePassword(userId, currentPassword, newPassword);

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message
        });
      }

      res.json({
        success: true,
        message: 'Contraseña cambiada exitosamente'
      });
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
}
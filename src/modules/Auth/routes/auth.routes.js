import express from "express";
import { Auth } from "../controllers/login.controller.js";
import { authenticateToken } from "../../../middlewares/auth.js";

const router = express.Router();
const AuthController = new Auth();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Gestión de autenticación de usuarios
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Correo electrónico del usuario.
 *           example: admin@astrostar.com
 *         password:
 *           type: string
 *           format: password
 *           description: Contraseña del usuario.
 *           example: admin123
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Bienvenido, Admin!"
 *         token:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 1
 *             firstName:
 *               type: string
 *               example: "Admin"
 *             lastName:
 *               type: string
 *               example: "AstroStar"
 *             email:
 *               type: string
 *               example: "admin@astrostar.com"
 *             role:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "Administrador"
 *                 permissions:
 *                   type: object
 *                   example: { "dashboard": { "Ver": true } }
 *     LogoutResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Sesión cerrada exitosamente."
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión de usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Credenciales inválidas o datos faltantes.
 *       401:
 *         description: Credenciales inválidas o usuario inactivo.
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/login", AuthController.Login);

/**
 * @swagger
 * /api/auth/profile:
 *   post:
 *     summary: Obtener el perfil del usuario autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: No autenticado o token inválido.
 *       404:
 *         description: Usuario no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/profile", authenticateToken, AuthController.Profile);

/**
 * @swagger
 * /api/auth/logout:
 *   get:
 *     summary: Cerrar la sesión del usuario
 *     tags: [Auth]
 *     description: Limpia las cookies de autenticación (accessToken, refreshToken) del navegador y el refreshToken de la base de datos.
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutResponse'
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/logout", AuthController.Logout);

/**
 * @swagger
 * /api/auth/refreshToken:
 *   post:
 *     summary: Refrescar el token de acceso
 *     tags: [Auth]
 *     description: Genera un nuevo accessToken utilizando el refreshToken almacenado en las cookies.
 *     responses:
 *       200:
 *         description: Nuevo token de acceso generado exitosamente.
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
 *                   example: "Nuevo access token generado."
 *       401:
 *         description: Refresh token inválido o ausente.
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/refreshToken", AuthController.RefreshToken);

/**
 * @swagger
 * /api/auth/updateProfile/{pk}:
 *   put:
 *     summary: Actualizar el perfil de un usuario
 *     tags: [Auth]
 *     description: Permite actualizar los datos del usuario según su ID.
 *     parameters:
 *       - in: path
 *         name: pk
 *         required: true
 *         description: ID del usuario que se desea actualizar.
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               firstName: "Carlos"
 *               lastName: "Pérez"
 *               phoneNumber: "3001234567"
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente.
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
 *                   example: "User updated successfully"
 *       400:
 *         description: Error al actualizar el usuario.
 *       404:
 *         description: Usuario no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.put("/updateProfile/:pk", AuthController.UpdateProfile);

/**
 * @swagger
 * /api/auth/documentType:
 *   get:
 *     summary: Obtener los tipos de documento
 *     tags: [Auth]
 *     description: Devuelve una lista de todos los tipos de documento disponibles en el sistema.
 *     responses:
 *       200:
 *         description: Tipos de documento obtenidos exitosamente.
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
 *                   example: "Tipos de documento encontrados exitosamente."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Cédula de Ciudadanía"
 *       404:
 *         description: No se encontraron tipos de documento.
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/documentType", AuthController.DocumentType);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Iniciar proceso de recuperación de contraseña
 *     tags: [Auth]
 *     description: Recibe un email y, si existe, envía un correo con un token para restablecer la contraseña.
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
 *         description: Solicitud procesada. Por seguridad, la respuesta es siempre la misma.
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
 *         description: Error interno del servidor.
 */
router.post("/forgot-password", AuthController.forgotPassword);

/**
 * @swagger
 * /api/auth/verify-code:
 *   post:
 *     summary: Verificar el código de recuperación de contraseña
 *     tags: [Auth]
 *     description: Recibe el token enviado por correo y verifica si es válido y no ha expirado.
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
 *                 description: El token recibido en el correo de recuperación.
 *                 example: "a1b2c3d4e5f6..."
 *     responses:
 *       200:
 *         description: El código es válido.
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
 *                   example: "Código verificado correctamente."
 *       400:
 *         description: El código es inválido o ha expirado.
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/verify-code", AuthController.verifyCode);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Restablecer la contraseña del usuario
 *     tags: [Auth]
 *     description: Recibe el token de recuperación y la nueva contraseña para actualizarla.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: El token de recuperación validado previamente.
 *                 example: "a1b2c3d4e5f6..."
 *               password:
 *                 type: string
 *                 format: password
 *                 description: La nueva contraseña para el usuario.
 *                 example: "newSecurePassword123!"
 *     responses:
 *       200:
 *         description: Contraseña actualizada correctamente.
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
 *                   example: "Contraseña actualizada correctamente."
 *       400:
 *         description: El token es inválido, ha expirado o la contraseña no cumple los requisitos.
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/reset-password", AuthController.resetPassword);

export default router;

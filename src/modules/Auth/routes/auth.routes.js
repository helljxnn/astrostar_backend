import express from "express";
import { Auth } from "../controllers/login.controller.js";
import { authenticateToken } from "../../../middlewares/checkToken.js";

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
 *   get:
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
router.get("/profile", authenticateToken, AuthController.Profile);

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
export default router;

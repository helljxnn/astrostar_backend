import express from "express";
import { Login } from "../controllers/login.controller.js";

const router = express.Router();
const loginController = new Login();

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
router.post("/login", loginController.Login);
export default router;

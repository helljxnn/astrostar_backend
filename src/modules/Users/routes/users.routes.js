import express from 'express';
import usersController from '../controllers/users.controller.js';
import { checkPermission } from '../../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión de usuarios (SOLO LECTURA)
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtener lista de usuarios
 *     description: Endpoint de solo lectura para visualizar usuarios con paginación y filtros
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: 
 *           type: integer
 *           default: 1
 *         description: Página actual
 *       - in: query
 *         name: limit
 *         schema: 
 *           type: integer
 *           default: 10
 *         description: Límite de resultados por página
 *       - in: query
 *         name: search
 *         schema: 
 *           type: string
 *         description: Término de búsqueda (nombre, email, identificación)
 *       - in: query
 *         name: status
 *         schema: 
 *           type: string
 *           enum: [Active, Inactive, Suspended]
 *         description: Filtrar por estado
 *       - in: query
 *         name: roleId
 *         schema: 
 *           type: integer
 *         description: Filtrar por ID de rol
 *       - in: query
 *         name: userType
 *         schema: 
 *           type: string
 *           enum: [athletes, employees, system, with-login, active, inactive]
 *         description: Tipo de usuario
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', checkPermission('Users', 'Read'), usersController.getUsers);

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Obtener estadísticas de usuarios
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: integer
 *                     activeUsers:
 *                       type: integer
 *                     inactiveUsers:
 *                       type: integer
 *                     usersByRole:
 *                       type: array
 *                     usersByType:
 *                       type: array
 *                     recentUsers:
 *                       type: integer
 */
router.get('/stats', checkPermission('Users', 'Read'), usersController.getUserStats);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: 
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: Usuario no encontrado
 *       400:
 *         description: ID inválido
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', checkPermission('Users', 'Read'), usersController.getUserById);

export default router;
import express from 'express';
import usersController from '../controllers/users.controller.js';
//import { checkPermission } from '../../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management (READ ONLY)
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get list of users
 *     description: Read-only endpoint to view users with pagination and filters
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: 
 *           type: integer
 *           default: 1
 *         description: Current page
 *       - in: query
 *         name: limit
 *         schema: 
 *           type: integer
 *           default: 10
 *         description: Results limit per page
 *       - in: query
 *         name: search
 *         schema: 
 *           type: string
 *         description: Search term (name, email, identification)
 *       - in: query
 *         name: status
 *         schema: 
 *           type: string
 *           enum: [Active, Inactive, Suspended]
 *         description: Filter by status
 *       - in: query
 *         name: roleId
 *         schema: 
 *           type: integer
 *         description: Filter by role ID
 *       - in: query
 *         name: userType
 *         schema: 
 *           type: string
 *           enum: [athletes, employees, system, with-login, active, inactive]
 *         description: User type
 *     responses:
 *       200:
 *         description: User list retrieved successfully
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
 *         description: Internal server error
 */
//router.get('/', checkPermission('Users', 'Read'), usersController.getUsers);
router.get('/', usersController.getUsers);  // Without checkPermission for now

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
//router.get('/stats', checkPermission('Users', 'Read'), usersController.getUserStats);
router.get('/stats', usersController.getUserStats);
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: 
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
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
 *         description: User not found
 *       400:
 *         description: Invalid ID
 *       500:
 *         description: Internal server error
 */
//router.get('/:id', checkPermission('Users', 'Read'), usersController.getUserById);
router.get('/:id', usersController.getUserById);

export default router;
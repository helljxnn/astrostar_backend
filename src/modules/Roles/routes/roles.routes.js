import express from 'express';
import { RoleController } from '../controllers/roles.controller.js';
import { roleValidators, handleValidationErrors } from '../validators/role.validator.js';
import { canReadRoles, canCreateRoles, canManageRoles, canDeleteRoles } from '../../../middlewares/checkRole.js';

const router = express.Router();
const roleController = new RoleController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       required:
 *         - name
 *         - description
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the role
 *         name:
 *           type: string
 *           maxLength: 50
 *           description: The name of the role
 *         description:
 *           type: string
 *           maxLength: 200
 *           description: The description of the role
 *         permissions:
 *           type: object
 *           description: The permissions object for the role
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the role was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the role was last updated
 *     RoleInput:
 *       type: object
 *       required:
 *         - name
 *         - description
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 50
 *           description: The name of the role
 *         description:
 *           type: string
 *           maxLength: 200
 *           description: The description of the role
 *         permissions:
 *           type: object
 *           description: The permissions object for the role
 */

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Roles]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name or description
 *     responses:
 *       200:
 *         description: List of all roles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Role'
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
 *                 message:
 *                   type: string
 *                   example: "Roles retrieved successfully"
 *       500:
 *         description: Server error
 */
// Temporalmente sin autenticación para pruebas
router.get('/', 
  roleValidators.getAll, 
  handleValidationErrors, 
  roleController.getAllRoles
);

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoleInput'
 *           example:
 *             name: "Administrator"
 *             description: "Full system access"
 *             permissions:
 *               Users:
 *                 Create: true
 *                 Read: true
 *                 Update: true
 *                 Delete: true
 *               Roles:
 *                 Create: true
 *                 Read: true
 *                 Update: true
 *                 Delete: true
 *     responses:
 *       201:
 *         description: Role created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
// Temporalmente sin autenticación para pruebas
router.post('/', 
  roleValidators.create, 
  handleValidationErrors, 
  roleController.createRole
);

/**
 * @swagger
 * /api/roles/check-name:
 *   get:
 *     summary: Check if role name is available
 *     tags: [Roles]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: Role name to check
 *       - in: query
 *         name: excludeId
 *         schema:
 *           type: integer
 *         description: Role ID to exclude from check (for editing)
 *     responses:
 *       200:
 *         description: Name availability check result
 *       500:
 *         description: Server error
 */
router.get('/check-name', roleController.checkRoleNameAvailability);

/**
 * @swagger
 * /api/roles/stats:
 *   get:
 *     summary: Get role statistics
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: Role statistics
 *       500:
 *         description: Server error
 */
router.get('/stats', roleController.getRoleStats);

/**
 * @swagger
 * /api/roles/permissions:
 *   get:
 *     summary: Get available permissions structure
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: Available permissions structure
 *       500:
 *         description: Server error
 */
router.get('/permissions', roleController.getAvailablePermissions);

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role found
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 */
// Temporalmente sin autenticación para pruebas
router.get('/:id', 
  roleValidators.getById, 
  handleValidationErrors, 
  roleController.getRoleById
);

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Update role by ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoleInput'
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 */
// Temporalmente sin autenticación para pruebas
router.put('/:id', 
  roleValidators.update, 
  handleValidationErrors, 
  roleController.updateRole
);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Delete role by ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 */
// Temporalmente sin autenticación para pruebas
router.delete('/:id', 
  roleValidators.delete, 
  handleValidationErrors, 
  roleController.deleteRole
);

export default router;
/**
 * @
swagger
 * /api/roles/stats:
 *   get:
 *     summary: Get role statistics
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: Role statistics
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
 *                     total:
 *                       type: integer
 *                     active:
 *                       type: integer
 *                     inactive:
 *                       type: integer
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 */

import express from "express";
import { RoleController } from "../controllers/roles.controller.js";
import {
  roleValidators,
  handleValidationErrors,
} from "../validators/role.validator.js";
import { authenticateToken } from "../../../middlewares/auth.js";
import { checkPermissions } from "../../../middlewares/checkPermissions.js";

const router = express.Router();
const roleController = new RoleController();

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Gestión de roles y permisos
 */

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Obtener listado paginado de roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Cantidad de registros por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Búsqueda por nombre o descripción
 *     responses:
 *       200:
 *         description: Roles obtenidos exitosamente
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   post:
 *     summary: Crear un nuevo rol
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoleInput'
 *     responses:
 *       201:
 *         description: Rol creado exitosamente
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/",
  authenticateToken,
  checkPermissions("roles", "Ver"),
  roleValidators.getAll,
  handleValidationErrors,
  roleController.getAllRoles,
);

router.post(
  "/",
  authenticateToken,
  checkPermissions("roles", "Crear"),
  roleValidators.create,
  handleValidationErrors,
  roleController.createRole,
);

/**
 * @swagger
 * /api/roles/check-name:
 *   get:
 *     summary: Verificar disponibilidad de nombre de rol
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del rol a validar
 *       - in: query
 *         name: excludeId
 *         schema:
 *           type: integer
 *         description: ID a excluir cuando se está editando
 *     responses:
 *       200:
 *         description: Resultado de disponibilidad del nombre
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/check-name",
  authenticateToken,
  checkPermissions("roles", "Ver"),
  roleController.checkRoleNameAvailability,
);

/**
 * @swagger
 * /api/roles/stats:
 *   get:
 *     summary: Obtener estadísticas de roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/stats",
  authenticateToken,
  checkPermissions("roles", "Ver"),
  roleController.getRoleStats,
);

/**
 * @swagger
 * /api/roles/permissions:
 *   get:
 *     summary: Obtener estructura de permisos disponibles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estructura de permisos obtenida exitosamente
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/permissions",
  authenticateToken,
  checkPermissions("roles", "Ver"),
  roleController.getAvailablePermissions,
);

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Obtener rol por ID
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del rol
 *     responses:
 *       200:
 *         description: Rol encontrado
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   put:
 *     summary: Actualizar rol por ID
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del rol
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoleInput'
 *     responses:
 *       200:
 *         description: Rol actualizado exitosamente
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         description: Operación no permitida para roles protegidos
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   delete:
 *     summary: Eliminar rol por ID
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del rol
 *     responses:
 *       200:
 *         description: Rol eliminado exitosamente
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         description: Operación no permitida para roles protegidos
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/:id",
  authenticateToken,
  checkPermissions("roles", "Ver"),
  roleValidators.getById,
  handleValidationErrors,
  roleController.getRoleById,
);

router.put(
  "/:id",
  authenticateToken,
  checkPermissions("roles", "Editar"),
  roleValidators.update,
  handleValidationErrors,
  roleController.updateRole,
);

router.delete(
  "/:id",
  authenticateToken,
  checkPermissions("roles", "Eliminar"),
  roleValidators.delete,
  handleValidationErrors,
  roleController.deleteRole,
);

export default router;

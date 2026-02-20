import express from 'express';
import materialsController from '../controllers/materials.controller.js';
import { authenticateToken } from '../../../middlewares/auth.js';
import { checkPermissions } from '../../../middlewares/checkPermissions.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Materials
 *   description: Gestión de materiales deportivos
 */

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * GET /api/materials/check-name
 * Verificar disponibilidad de nombre en categoría
 * Permiso: materials.Ver
 */
router.get(
  '/check-name',
  checkPermissions('materials', 'Ver'),
  materialsController.checkName
);

/**
 * GET /api/materials/:id/history
 * Obtener historial de movimientos de un material
 * Permiso: materials.Ver
 */
router.get(
  '/:id/history',
  checkPermissions('materials', 'Ver'),
  materialsController.getHistory
);

/**
 * GET /api/materials
 * Listar todos los materiales con paginación
 * Permiso: materials.Ver
 */
router.get(
  '/',
  checkPermissions('materials', 'Ver'),
  materialsController.getAll
);

/**
 * GET /api/materials/:id
 * Obtener material por ID
 * Permiso: materials.Ver
 */
router.get(
  '/:id',
  checkPermissions('materials', 'Ver'),
  materialsController.getById
);

/**
 * POST /api/materials
 * Crear nuevo material
 * Permiso: materials.Crear
 */
router.post(
  '/',
  checkPermissions('materials', 'Crear'),
  materialsController.create
);

/**
 * PUT /api/materials/:id
 * Actualizar material
 * Permiso: materials.Editar
 */
router.put(
  '/:id',
  checkPermissions('materials', 'Editar'),
  materialsController.update
);

/**
 * PATCH /api/materials/:id/status
 * Cambiar estado de material
 * Permiso: materials.Editar
 */
router.patch(
  '/:id/status',
  checkPermissions('materials', 'Editar'),
  materialsController.toggleStatus
);

/**
 * DELETE /api/materials/:id
 * Eliminar material (solo si no tiene movimientos)
 * Permiso: materials.Eliminar
 */
router.delete(
  '/:id',
  checkPermissions('materials', 'Eliminar'),
  materialsController.delete
);

export default router;

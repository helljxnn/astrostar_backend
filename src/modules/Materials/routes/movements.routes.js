import express from 'express';
import movementsController from '../controllers/movements.controller.js';
import { authenticateToken } from '../../../middlewares/auth.js';
import { checkPermissions } from '../../../middlewares/checkPermissions.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Material Movements
 *   description: Gestión de movimientos de inventario (entradas y salidas)
 */

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * GET /api/materials/material-movements/statistics
 * Obtener estadísticas de movimientos
 * Permiso: materialsRegistry.Ver
 */
router.get(
  '/statistics',
  checkPermissions('materialsRegistry', 'Ver'),
  movementsController.getStatistics
);

/**
 * GET /api/materials/material-movements/recent
 * Obtener últimos movimientos (para dashboard)
 * Permiso: materialsRegistry.Ver
 */
router.get(
  '/recent',
  checkPermissions('materialsRegistry', 'Ver'),
  movementsController.getRecent
);

/**
 * GET /api/materials/material-movements/date-range
 * Obtener movimientos por rango de fechas
 * Permiso: materialsRegistry.Ver
 */
router.get(
  '/date-range',
  checkPermissions('materialsRegistry', 'Ver'),
  movementsController.getByDateRange
);

/**
 * GET /api/materials/material-movements/report
 * Obtener todos los movimientos para reporte (SIN PAGINACIÓN)
 * Permiso: materialsRegistry.Ver
 */
router.get(
  '/report',
  checkPermissions('materialsRegistry', 'Ver'),
  movementsController.getAllForReport
);

/**
 * GET /api/materials/material-movements/history/:materialId
 * Obtener historial de movimientos de un material
 * Permiso: materialsRegistry.Ver
 */
router.get(
  '/history/:materialId',
  checkPermissions('materialsRegistry', 'Ver'),
  movementsController.getHistory
);

/**
 * GET /api/materials/material-movements
 * Listar todos los movimientos con paginación
 * Permiso: materialsRegistry.Ver
 */
router.get(
  '/',
  checkPermissions('materialsRegistry', 'Ver'),
  movementsController.getAll
);

/**
 * GET /api/materials/material-movements/:id
 * Obtener movimiento por ID
 * Permiso: materialsRegistry.Ver
 */
router.get(
  '/:id',
  checkPermissions('materialsRegistry', 'Ver'),
  movementsController.getById
);

/**
 * POST /api/materials/material-movements
 * Registrar nuevo movimiento (Entrada o Salida)
 * Permiso: materialsRegistry.Crear
 */
router.post(
  '/',
  checkPermissions('materialsRegistry', 'Crear'),
  movementsController.create
);

/**
 * PUT /api/materials/material-movements/:id
 * Actualizar movimiento existente
 * Permiso: materialsRegistry.Editar
 */
router.put(
  '/:id',
  checkPermissions('materialsRegistry', 'Editar'),
  movementsController.update
);

/**
 * DELETE /api/materials/material-movements/:id
 * Eliminar movimiento (solo permitido para Entradas)
 * Permiso: materialsRegistry.Eliminar
 */
router.delete(
  '/:id',
  checkPermissions('materialsRegistry', 'Eliminar'),
  movementsController.delete
);

export default router;

import express from 'express';
import reservationsController from '../controllers/reservations.controller.js';
import { authenticateToken } from '../../../middlewares/auth.js';
import { checkPermissions } from '../../../middlewares/checkPermissions.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Material Reservations
 *   description: Gestión de reservas de materiales para eventos
 */

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * PUT /api/materials/reservations/:id/confirm
 * Confirmar reserva y bloquear stock
 * Permiso: materials.Editar
 */
router.put(
  '/:id/confirm',
  checkPermissions('materials', 'Editar'),
  reservationsController.confirm
);

/**
 * PUT /api/materials/reservations/:id/consume
 * Consumir material reservado (evento finalizado)
 * Permiso: materials.Editar
 */
router.put(
  '/:id/consume',
  checkPermissions('materials', 'Editar'),
  reservationsController.consume
);

/**
 * PUT /api/materials/reservations/:id/cancel
 * Cancelar reserva y liberar stock
 * Permiso: materials.Editar
 */
router.put(
  '/:id/cancel',
  checkPermissions('materials', 'Editar'),
  reservationsController.cancel
);

/**
 * GET /api/materials/reservations
 * Listar todas las reservas con paginación
 * Permiso: materials.Ver
 */
router.get(
  '/',
  checkPermissions('materials', 'Ver'),
  reservationsController.getAll
);

/**
 * GET /api/materials/reservations/:id
 * Obtener reserva por ID
 * Permiso: materials.Ver
 */
router.get(
  '/:id',
  checkPermissions('materials', 'Ver'),
  reservationsController.getById
);

/**
 * POST /api/materials/reservations
 * Crear nueva reserva
 * Permiso: materials.Crear
 */
router.post(
  '/',
  checkPermissions('materials', 'Crear'),
  reservationsController.create
);

export default router;

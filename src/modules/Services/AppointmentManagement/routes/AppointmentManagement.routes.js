
import express from 'express';
import { AppointmentController } from '../controllers/AppointmentManagement.controllers.js';
import { appointmentValidators, handleValidationErrors } from '../validators/AppointmentManagement.validators.js';
import { authenticateToken } from '../../../../middlewares/auth.js';
import { checkPermissions } from '../../../../middlewares/checkPermissions.js';

const router = express.Router();
const appointmentController = new AppointmentController();

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Gestión de citas
 */

// =========================
// Rutas de referencia
// =========================
router.get('/athletes',
  authenticateToken,
  checkPermissions('appointmentManagement', 'Ver'),
  appointmentController.getActiveAthletes
);

router.get('/specialists',
  authenticateToken,
  checkPermissions('appointmentManagement', 'Ver'),
  appointmentController.getActiveSpecialists
);

router.get('/specialties',
  authenticateToken,
  checkPermissions('appointmentManagement', 'Ver'),
  appointmentController.getSpecialties
);

// =========================
// CRUD principal
// =========================
router.get('/',
  authenticateToken,
  checkPermissions('appointmentManagement', 'Ver'),
  appointmentValidators.getAll,
  handleValidationErrors,
  appointmentController.getAllAppointments
);

router.post('/',
  authenticateToken,
  checkPermissions('appointmentManagement', 'Crear'),
  appointmentValidators.create,
  handleValidationErrors,
  appointmentController.createAppointment
);

router.get('/:id',
  authenticateToken,
  checkPermissions('appointmentManagement', 'Ver'),
  appointmentValidators.getById,
  handleValidationErrors,
  appointmentController.getAppointmentById
);

router.put('/:id',
  authenticateToken,
  checkPermissions('appointmentManagement', 'Editar'),
  appointmentValidators.update,
  handleValidationErrors,
  appointmentController.updateAppointment
);

router.patch('/:id/cancel',
  authenticateToken,
  checkPermissions('appointmentManagement', 'Cancelar'),
  appointmentValidators.cancel,
  handleValidationErrors,
  appointmentController.cancelAppointment
);

router.patch('/:id/complete',
  authenticateToken,
  checkPermissions('appointmentManagement', 'Editar'),
  appointmentValidators.complete,
  handleValidationErrors,
  appointmentController.completeAppointment
);

router.delete('/:id',
  authenticateToken,
  checkPermissions('appointmentManagement', 'Eliminar'),
  appointmentValidators.delete,
  handleValidationErrors,
  appointmentController.deleteAppointment
);

export default router;



import express from 'express';
import { AppointmentController } from '../controllers/AppointmentManagement.controllers.js';
import { appointmentValidators, handleValidationErrors } from '../validators/AppointmentManagement.validators.js';
import { authenticateToken } from '../../../../middlewares/auth.js';

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
  appointmentController.getActiveAthletes
);

router.get('/specialists',
  authenticateToken,
  appointmentController.getActiveSpecialists
);

router.get('/specialties',
  authenticateToken,
  appointmentController.getSpecialties
);

// =========================
// CRUD principal
// =========================
router.get('/',
  authenticateToken,
  appointmentValidators.getAll,
  handleValidationErrors,
  appointmentController.getAllAppointments
);

router.post('/',
  authenticateToken,
  appointmentValidators.create,
  handleValidationErrors,
  appointmentController.createAppointment
);

router.get('/:id',
  authenticateToken,
  appointmentValidators.getById,
  handleValidationErrors,
  appointmentController.getAppointmentById
);

router.put('/:id',
  authenticateToken,
  appointmentValidators.update,
  handleValidationErrors,
  appointmentController.updateAppointment
);

router.patch('/:id/cancel',
  authenticateToken,
  appointmentValidators.cancel,
  handleValidationErrors,
  appointmentController.cancelAppointment
);

router.patch('/:id/complete',
  authenticateToken,
  appointmentValidators.complete,
  handleValidationErrors,
  appointmentController.completeAppointment
);

router.delete('/:id',
  authenticateToken,
  appointmentValidators.delete,
  handleValidationErrors,
  appointmentController.deleteAppointment
);

export default router;

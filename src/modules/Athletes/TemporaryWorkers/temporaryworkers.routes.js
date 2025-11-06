import express from 'express';
import { TemporaryWorkersController } from './temporaryworkers.controller.js';
import {
  createTemporaryWorkerValidation,
  updateTemporaryWorkerValidation,
  getByIdValidation,
  deleteValidation,
  queryValidation,
  checkAvailabilityValidation,
  checkIdentificationValidation,
  checkEmailValidation,
  handleValidationErrors
} from './validators/temporaryworkers.validators.js';
import {
  validateTemporaryPersonBusinessLogic,
  validateTemporaryPersonDeletion,
  validateCriticalUpdates,
  sanitizeTemporaryPersonData
} from '../../../middlewares/businessValidation.js';

const router = express.Router();
const temporaryWorkersController = new TemporaryWorkersController();

// Rutas de verificación (deben ir antes de las rutas con parámetros)
router.get('/check-identification', 
  checkIdentificationValidation, 
  handleValidationErrors, 
  temporaryWorkersController.checkIdentificationAvailability
);
router.get('/check-email', 
  checkEmailValidation, 
  handleValidationErrors, 
  temporaryWorkersController.checkEmailAvailability
);

// Rutas de estadísticas y datos de referencia
router.get('/stats', temporaryWorkersController.getTemporaryWorkerStats);
router.get('/reference-data', temporaryWorkersController.getReferenceData);

// Rutas CRUD principales
router.get('/', 
  queryValidation, 
  handleValidationErrors, 
  temporaryWorkersController.getAllTemporaryWorkers
);
router.get('/:id', 
  getByIdValidation, 
  handleValidationErrors, 
  temporaryWorkersController.getTemporaryWorkerById
);
router.post('/', 
  sanitizeTemporaryPersonData,
  createTemporaryWorkerValidation, 
  handleValidationErrors,
  validateTemporaryPersonBusinessLogic,
  temporaryWorkersController.createTemporaryWorker
);
router.put('/:id', 
  sanitizeTemporaryPersonData,
  updateTemporaryWorkerValidation, 
  handleValidationErrors,
  validateCriticalUpdates,
  validateTemporaryPersonBusinessLogic,
  temporaryWorkersController.updateTemporaryWorker
);
router.delete('/:id', 
  deleteValidation, 
  handleValidationErrors,
  validateTemporaryPersonDeletion,
  temporaryWorkersController.deleteTemporaryWorker
);

export default router;
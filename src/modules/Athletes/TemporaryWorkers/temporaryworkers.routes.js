import express from 'express';
import { TemporaryWorkersController } from './temporaryworkers.controller.js';
import {
  createTemporaryWorkerValidation,
  updateTemporaryWorkerValidation,
  getByIdValidation,
  deleteValidation,
  queryValidation,
  checkAvailabilityValidation,
  handleValidationErrors
} from './validators/temporaryworkers.validators.js';

const router = express.Router();
const temporaryWorkersController = new TemporaryWorkersController();

// Rutas de verificación (deben ir antes de las rutas con parámetros)
router.get('/check-identification', 
  checkAvailabilityValidation, 
  handleValidationErrors, 
  temporaryWorkersController.checkIdentificationAvailability
);
router.get('/check-email', 
  checkAvailabilityValidation, 
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
  createTemporaryWorkerValidation, 
  handleValidationErrors, 
  temporaryWorkersController.createTemporaryWorker
);
router.put('/:id', 
  updateTemporaryWorkerValidation, 
  handleValidationErrors, 
  temporaryWorkersController.updateTemporaryWorker
);
router.delete('/:id', 
  deleteValidation, 
  handleValidationErrors, 
  temporaryWorkersController.deleteTemporaryWorker
);

export default router;
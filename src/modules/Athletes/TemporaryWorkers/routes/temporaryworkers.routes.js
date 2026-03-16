import express from "express";
import { TemporaryWorkersController } from "../controllers/temporaryworkers.controller.js";
import {
  createTemporaryWorkerValidation,
  updateTemporaryWorkerValidation,
  getByIdValidation,
  deleteValidation,
  queryValidation,
  checkIdentificationValidation,
  checkEmailValidation,
  handleValidationErrors,
} from "../validators/temporaryworkers.validators.js";
import {
  validateTemporaryPersonBusinessLogic,
  validateTemporaryPersonDeletion,
  validateCriticalUpdates,
  sanitizeTemporaryPersonData,
} from "../../../../middlewares/businessValidation.js";
import { authenticateToken } from "../../../../middlewares/auth.js";
import { checkPermissions } from "../../../../middlewares/checkPermissions.js";

const router = express.Router();
const temporaryWorkersController = new TemporaryWorkersController();

router.use(authenticateToken);

// Validation routes (must go before :id routes)
router.get(
  "/check-identification",
  checkPermissions("temporaryWorkers", "Ver"),
  checkIdentificationValidation,
  handleValidationErrors,
  temporaryWorkersController.checkIdentificationAvailability,
);

router.get(
  "/check-email",
  checkPermissions("temporaryWorkers", "Ver"),
  checkEmailValidation,
  handleValidationErrors,
  temporaryWorkersController.checkEmailAvailability,
);

// Stats and reference data
router.get(
  "/stats",
  checkPermissions("temporaryWorkers", "Ver"),
  temporaryWorkersController.getTemporaryWorkerStats,
);

router.get(
  "/reference-data",
  checkPermissions("temporaryWorkers", "Ver"),
  temporaryWorkersController.getReferenceData,
);

// CRUD
router.get(
  "/",
  checkPermissions("temporaryWorkers", "Ver"),
  queryValidation,
  handleValidationErrors,
  temporaryWorkersController.getAllTemporaryWorkers,
);

router.get(
  "/:id",
  checkPermissions("temporaryWorkers", "Ver"),
  getByIdValidation,
  handleValidationErrors,
  temporaryWorkersController.getTemporaryWorkerById,
);

router.post(
  "/",
  checkPermissions("temporaryWorkers", "Crear"),
  sanitizeTemporaryPersonData,
  createTemporaryWorkerValidation,
  handleValidationErrors,
  validateTemporaryPersonBusinessLogic,
  temporaryWorkersController.createTemporaryWorker,
);

router.put(
  "/:id",
  checkPermissions("temporaryWorkers", "Editar"),
  sanitizeTemporaryPersonData,
  updateTemporaryWorkerValidation,
  handleValidationErrors,
  validateCriticalUpdates,
  validateTemporaryPersonBusinessLogic,
  temporaryWorkersController.updateTemporaryWorker,
);

router.delete(
  "/:id",
  checkPermissions("temporaryWorkers", "Eliminar"),
  deleteValidation,
  handleValidationErrors,
  validateTemporaryPersonDeletion,
  temporaryWorkersController.deleteTemporaryWorker,
);

export default router;

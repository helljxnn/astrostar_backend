import express from "express";
import { GuardiansController } from "../controllers/guardians.controller.js";
import {
  guardiansValidators,
  handleValidationErrors,
} from "../validators/guardians.validator.js";
import { authenticateToken } from "../../../../middlewares/auth.js";
import { checkPermissions } from "../../../../middlewares/checkPermissions.js";

const router = express.Router();
const guardiansController = new GuardiansController();

/**
 * @swagger
 * tags:
 *   name: Guardians
 *   description: Gestión de acudientes de deportistas
 */

router.get("/check-email", guardiansController.checkEmailAvailability);
router.get("/check-identification", guardiansController.checkIdentificationAvailability);
router.get("/with-athletes", guardiansController.getGuardiansWithAthletes);
router.get("/stats", guardiansController.getGuardianStats);
router.get("/", guardiansValidators.getAll, handleValidationErrors, guardiansController.getAllGuardians);
router.get("/:id", guardiansValidators.getById, handleValidationErrors, guardiansController.getGuardianById);
router.post("/", guardiansValidators.create, handleValidationErrors, guardiansController.createGuardian);
router.put("/:id", guardiansValidators.update, handleValidationErrors, guardiansController.updateGuardian);
router.delete("/:id", guardiansValidators.delete, handleValidationErrors, guardiansController.deleteGuardian);

export default router;


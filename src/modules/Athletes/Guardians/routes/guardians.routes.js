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

router.use(authenticateToken);

router.get("/check-email", checkPermissions("athletesSection", "Acudiente"), guardiansController.checkEmailAvailability);
router.get("/check-identification", checkPermissions("athletesSection", "Acudiente"), guardiansController.checkIdentificationAvailability);
router.get("/stats", checkPermissions("athletesSection", "Acudiente"), guardiansController.getGuardianStats);
router.get("/", checkPermissions("athletesSection", "Acudiente"), guardiansValidators.getAll, handleValidationErrors, guardiansController.getAllGuardians);
router.get("/:id", checkPermissions("athletesSection", "Acudiente"), guardiansValidators.getById, handleValidationErrors, guardiansController.getGuardianById);
router.post("/", checkPermissions("athletesSection", "Acudiente"), guardiansValidators.create, handleValidationErrors, guardiansController.createGuardian);
router.put("/:id", checkPermissions("athletesSection", "Acudiente"), guardiansValidators.update, handleValidationErrors, guardiansController.updateGuardian);
router.delete("/:id", checkPermissions("athletesSection", "Acudiente"), guardiansValidators.delete, handleValidationErrors, guardiansController.deleteGuardian);

export default router;


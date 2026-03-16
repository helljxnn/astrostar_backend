import express from "express";
import { GroupController } from "../controllers/groups.controller.js";
import {
  groupValidators,
  handleValidationErrors,
} from "../validators/groups.validator.js";
import { authenticateToken } from "../../../../middlewares/auth.js";
import { checkRole } from "../../../../middlewares/checkRole.js";

const router = express.Router();
const groupController = new GroupController();

router.use(authenticateToken, checkRole("Administrador"));

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Gestión de grupos de inglés
 */

// Rutas específicas PRIMERO
router.get("/stats", groupController.getGroupStats);

// CRUD básico
router.get(
  "/",
  groupValidators.getAll,
  handleValidationErrors,
  groupController.getAllGroups,
);

router.post(
  "/",
  groupValidators.create,
  handleValidationErrors,
  groupController.createGroup,
);

// Rutas con parámetros
router.get(
  "/:id",
  groupValidators.getById,
  handleValidationErrors,
  groupController.getGroupById,
);

router.put(
  "/:id",
  groupValidators.update,
  handleValidationErrors,
  groupController.updateGroup,
);

router.patch(
  "/:id/status",
  groupValidators.updateStatus,
  handleValidationErrors,
  groupController.updateGroupStatus,
);

router.delete(
  "/:id",
  groupValidators.delete,
  handleValidationErrors,
  groupController.deleteGroup,
);

export default router;


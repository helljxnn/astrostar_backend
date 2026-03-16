import express from "express";
import { GroupController } from "../controllers/groups.controller.js";
import {
  groupValidators,
  handleValidationErrors,
} from "../validators/groups.validator.js";
import { authenticateToken } from "../../../../middlewares/auth.js";

const router = express.Router();
const groupController = new GroupController();

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Gestión de grupos de inglés
 */

// Rutas específicas PRIMERO
router.get("/stats", authenticateToken, groupController.getGroupStats);

// CRUD básico
router.get(
  "/",
  authenticateToken,
  groupValidators.getAll,
  handleValidationErrors,
  groupController.getAllGroups,
);

router.post(
  "/",
  authenticateToken,
  groupValidators.create,
  handleValidationErrors,
  groupController.createGroup,
);

// Rutas con parámetros
router.get(
  "/:id",
  authenticateToken,
  groupValidators.getById,
  handleValidationErrors,
  groupController.getGroupById,
);

router.put(
  "/:id",
  authenticateToken,
  groupValidators.update,
  handleValidationErrors,
  groupController.updateGroup,
);

router.patch(
  "/:id/status",
  authenticateToken,
  groupValidators.updateStatus,
  handleValidationErrors,
  groupController.updateGroupStatus,
);

router.delete(
  "/:id",
  authenticateToken,
  groupValidators.delete,
  handleValidationErrors,
  groupController.deleteGroup,
);

export default router;


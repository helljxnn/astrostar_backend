import express from "express";
import { RoleController } from "../controllers/roles.controller.js";
import {
  roleValidators,
  handleValidationErrors,
} from "../validators/role.validator.js";
import { authenticateToken } from "../../../middlewares/auth.js";
import { checkPermissions } from "../../../middlewares/checkPermissions.js";

const router = express.Router();
const roleController = new RoleController();

router.get(
  "/",
  authenticateToken,
  checkPermissions("roles", "Ver"),
  roleValidators.getAll,
  handleValidationErrors,
  roleController.getAllRoles,
);

router.post(
  "/",
  authenticateToken,
  checkPermissions("roles", "Crear"),
  roleValidators.create,
  handleValidationErrors,
  roleController.createRole,
);

router.get(
  "/check-name",
  authenticateToken,
  checkPermissions("roles", "Ver"),
  roleController.checkRoleNameAvailability,
);

router.get(
  "/stats",
  authenticateToken,
  checkPermissions("roles", "Ver"),
  roleController.getRoleStats,
);

router.get(
  "/permissions",
  authenticateToken,
  checkPermissions("roles", "Ver"),
  roleController.getAvailablePermissions,
);

router.get(
  "/:id",
  authenticateToken,
  checkPermissions("roles", "Ver"),
  roleValidators.getById,
  handleValidationErrors,
  roleController.getRoleById,
);

router.put(
  "/:id",
  authenticateToken,
  checkPermissions("roles", "Editar"),
  roleValidators.update,
  handleValidationErrors,
  roleController.updateRole,
);

router.delete(
  "/:id",
  authenticateToken,
  checkPermissions("roles", "Eliminar"),
  roleValidators.delete,
  handleValidationErrors,
  roleController.deleteRole,
);

export default router;

import express from "express";
import { MembershipController } from "../controllers/memberships.controller.js";
import {
  membershipValidators,
  handleValidationErrors,
} from "../validators/memberships.validator.js";
import { authenticateToken } from "../../../../middlewares/auth.js";
import { checkRole } from "../../../../middlewares/checkRole.js";

const router = express.Router();
const membershipController = new MembershipController();
const adminGuard = [authenticateToken, checkRole("Administrador")];

/**
 * @swagger
 * tags:
 *   name: Group Memberships
 *   description: Gestión de membresías de grupos
 */

// Agregar miembro a un grupo
router.post(
  "/groups/:id/members",
  ...adminGuard,
  membershipValidators.addMember,
  handleValidationErrors,
  membershipController.addMember,
);

// Obtener miembros de un grupo
router.get(
  "/groups/:id/members",
  ...adminGuard,
  membershipValidators.getGroupMembers,
  handleValidationErrors,
  membershipController.getGroupMembers,
);

// Obtener grupos de una deportista
router.get(
  "/athletes/:athleteId/groups",
  ...adminGuard,
  membershipValidators.getAthleteGroups,
  handleValidationErrors,
  membershipController.getAthleteGroups,
);

// Actualizar membresía
router.patch(
  "/memberships/:id",
  ...adminGuard,
  membershipValidators.updateMembership,
  handleValidationErrors,
  membershipController.updateMembership,
);

// Eliminar membresía
router.delete(
  "/memberships/:id",
  ...adminGuard,
  membershipValidators.deleteMembership,
  handleValidationErrors,
  membershipController.removeMember,
);

export default router;


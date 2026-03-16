import express from "express";
import { MembershipController } from "../controllers/memberships.controller.js";
import {
  membershipValidators,
  handleValidationErrors,
} from "../validators/memberships.validator.js";
import { authenticateToken } from "../../../../middlewares/auth.js";

const router = express.Router();
const membershipController = new MembershipController();

/**
 * @swagger
 * tags:
 *   name: Group Memberships
 *   description: Gestión de membresías de grupos
 */

// Agregar miembro a un grupo
router.post(
  "/groups/:id/members",
  authenticateToken,
  membershipValidators.addMember,
  handleValidationErrors,
  membershipController.addMember,
);

// Obtener miembros de un grupo
router.get(
  "/groups/:id/members",
  authenticateToken,
  membershipValidators.getGroupMembers,
  handleValidationErrors,
  membershipController.getGroupMembers,
);

// Obtener grupos de una deportista
router.get(
  "/athletes/:athleteId/groups",
  authenticateToken,
  membershipValidators.getAthleteGroups,
  handleValidationErrors,
  membershipController.getAthleteGroups,
);

// Actualizar membresía
router.patch(
  "/memberships/:id",
  authenticateToken,
  membershipValidators.updateMembership,
  handleValidationErrors,
  membershipController.updateMembership,
);

// Eliminar membresía
router.delete(
  "/memberships/:id",
  authenticateToken,
  membershipValidators.deleteMembership,
  handleValidationErrors,
  membershipController.removeMember,
);

export default router;


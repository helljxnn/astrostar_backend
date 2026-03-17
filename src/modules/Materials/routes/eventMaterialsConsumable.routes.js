import { Router } from "express";
import eventMaterialsConsumableController from "../controllers/eventMaterialsConsumable.controller.js";
import { authenticateToken } from "../../../middlewares/auth.js";
import { checkPermissions } from "../../../middlewares/checkPermissions.js";

const router = Router();

/**
 * @swagger
 * /api/materials/events/{eventoId}/consumables:
 *   get:
 *     summary: Get consumable materials assigned to event
 *     tags: [Materials - Events - Consumables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of consumable materials
 */
router.get(
  "/:eventoId/consumables",
  authenticateToken,
  checkPermissions("eventsManagement", "Materiales"),
  eventMaterialsConsumableController.getByEvent,
);

/**
 * @swagger
 * /api/materials/events/{eventoId}/consumables/load-donations:
 *   post:
 *     summary: Load donation materials as consumables
 *     tags: [Materials - Events - Consumables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Donation materials loaded successfully
 */
router.post(
  "/:eventoId/consumables/load-donations",
  authenticateToken,
  checkPermissions("eventsManagement", "Materiales"),
  eventMaterialsConsumableController.loadDonationMaterials,
);

/**
 * @swagger
 * /api/materials/events/{eventoId}/consumables:
 *   post:
 *     summary: Assign consumable material to event
 *     tags: [Materials - Events - Consumables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - material_id
 *               - cantidad
 *             properties:
 *               material_id:
 *                 type: integer
 *               cantidad:
 *                 type: integer
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Material assigned successfully
 */
router.post(
  "/:eventoId/consumables",
  authenticateToken,
  checkPermissions("eventsManagement", "Materiales"),
  eventMaterialsConsumableController.assignMaterial,
);

/**
 * @swagger
 * /api/materials/events/consumables/{assignmentId}:
 *   delete:
 *     summary: Remove consumable material assignment
 *     tags: [Materials - Events - Consumables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Assignment removed successfully
 */
router.delete(
  "/consumables/:assignmentId",
  authenticateToken,
  checkPermissions("eventsManagement", "Materiales"),
  eventMaterialsConsumableController.removeAssignment,
);

/**
 * @swagger
 * /api/materials/events/{eventoId}/finalize-consumables:
 *   post:
 *     summary: Finalize event - deduct consumable materials from stock
 *     tags: [Materials - Events - Consumables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event finalized successfully
 */
router.post(
  "/:eventoId/finalize-consumables",
  authenticateToken,
  checkPermissions("eventsManagement", "Materiales"),
  eventMaterialsConsumableController.finalizeEvent,
);

export default router;

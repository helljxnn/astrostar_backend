import { Router } from "express";
import eventMaterialsReusableController from "../controllers/eventMaterialsReusable.controller.js";
import { authenticateToken } from "../../../middlewares/auth.js";

const router = Router();

/**
 * @swagger
 * /api/materials/events/{eventoId}/reusables:
 *   get:
 *     summary: Get reusable materials assigned to event
 *     tags: [Materials - Events - Reusables]
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
 *         description: List of reusable materials
 */
router.get(
  "/:eventoId/reusables",
  authenticateToken,
  eventMaterialsReusableController.getByEvent,
);

/**
 * @swagger
 * /api/materials/events/{eventoId}/reusables:
 *   post:
 *     summary: Assign reusable material to event (planning only)
 *     tags: [Materials - Events - Reusables]
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
  "/:eventoId/reusables",
  authenticateToken,
  eventMaterialsReusableController.assignMaterial,
);

/**
 * @swagger
 * /api/materials/events/reusables/{assignmentId}:
 *   delete:
 *     summary: Remove reusable material assignment
 *     tags: [Materials - Events - Reusables]
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
  "/reusables/:assignmentId",
  authenticateToken,
  eventMaterialsReusableController.removeAssignment,
);

/**
 * @swagger
 * /api/materials/reusables/bulk-availability:
 *   post:
 *     summary: Check availability for multiple materials at once (optimized)
 *     tags: [Materials - Events - Reusables]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - materialIds
 *               - startDate
 *               - endDate
 *             properties:
 *               materialIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               excludeEventoId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Availability map for all materials
 */
router.post(
  "/reusables/bulk-availability",
  authenticateToken,
  eventMaterialsReusableController.checkBulkAvailability,
);

/**
 * @swagger
 * /api/materials/reusables/{materialId}/availability:
 *   get:
 *     summary: Check reusable material availability for date range
 *     tags: [Materials - Events - Reusables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: excludeEventoId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Availability information
 */
router.get(
  "/reusables/:materialId/availability",
  authenticateToken,
  eventMaterialsReusableController.checkAvailability,
);

/**
 * @swagger
 * /api/materials/reusables/{materialId}/assignments:
 *   get:
 *     summary: Get all event assignments for a specific reusable material
 *     tags: [Materials - Events - Reusables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: includeCompleted
 *         schema:
 *           type: boolean
 *           default: false
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: List of assignments with summary
 */
router.get(
  "/reusables/:materialId/assignments",
  authenticateToken,
  eventMaterialsReusableController.getReusableMaterialAssignments,
);

/**
 * @swagger
 * /api/materials/consumables/{materialId}/assignments:
 *   get:
 *     summary: Get all event assignments for a specific consumable material
 *     tags: [Materials - Events - Consumables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: includeCompleted
 *         schema:
 *           type: boolean
 *           default: false
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: List of assignments with summary
 */
router.get(
  "/consumables/:materialId/assignments",
  authenticateToken,
  eventMaterialsReusableController.getMaterialAssignments,
);

export default router;

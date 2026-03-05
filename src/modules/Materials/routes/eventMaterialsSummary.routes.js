import { Router } from "express";
import eventMaterialsSummaryController from "../controllers/eventMaterialsSummary.controller.js";
import { authenticateToken } from "../../../middlewares/auth.js";

const router = Router();

/**
 * @swagger
 * /api/materials/events/{eventoId}/materials-summary:
 *   get:
 *     summary: Get aggregated materials summary for event (optimized)
 *     tags: [Materials - Events - Summary]
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
 *         description: Aggregated materials summary
 */
router.get(
  "/:eventoId/materials-summary",
  authenticateToken,
  eventMaterialsSummaryController.getSummary,
);

export default router;

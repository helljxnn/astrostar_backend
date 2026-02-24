import { Router } from 'express';
import eventMaterialsController from '../controllers/eventMaterials.controller.js';
import { authenticateToken } from '../../../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /api/materials/events/{eventoId}/materials:
 *   get:
 *     summary: Get materials assigned to an event
 *     tags: [Materials - Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: List of materials assigned to event
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Event not found
 */
router.get('/:eventoId/materials', authenticateToken, eventMaterialsController.getByEvent);

/**
 * @swagger
 * /api/materials/events/{eventoId}/materials:
 *   post:
 *     summary: Assign material to event (immediate deduction from stock_eventos)
 *     tags: [Materials - Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
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
 *                 description: Material ID
 *                 example: 1
 *               cantidad:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantity to assign
 *                 example: 50
 *               observaciones:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Assignment observations
 *                 example: Material for tournament
 *     responses:
 *       201:
 *         description: Material assigned successfully
 *       400:
 *         description: Validation error or insufficient stock
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Material or event not found
 */
router.post('/:eventoId/materials', authenticateToken, eventMaterialsController.assignMaterial);

/**
 * @swagger
 * /api/materials/events/{eventoId}/materials/{assignmentId}:
 *   delete:
 *     summary: Remove material assignment (returns stock to stock_eventos)
 *     tags: [Materials - Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assignment ID
 *     responses:
 *       200:
 *         description: Assignment removed successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Assignment not found
 */
router.delete('/:eventoId/materials/:assignmentId', authenticateToken, eventMaterialsController.removeAssignment);

export default router;

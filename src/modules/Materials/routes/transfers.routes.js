import { Router } from 'express';
import transfersController from '../controllers/transfers.controller.js';
import { authenticateToken } from '../../../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /api/materials/materials/{id}/transfer:
 *   post:
 *     summary: Transfer stock between inventories
 *     tags: [Materials - Transfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Material ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - from
 *               - to
 *               - cantidad
 *             properties:
 *               from:
 *                 type: string
 *                 enum: [FUNDACION, EVENTOS]
 *                 description: Source inventory
 *                 example: EVENTOS
 *               to:
 *                 type: string
 *                 enum: [FUNDACION, EVENTOS]
 *                 description: Destination inventory
 *                 example: FUNDACION
 *               cantidad:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantity to transfer
 *                 example: 10
 *               observaciones:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Transfer observations
 *                 example: Transfer for internal use
 *     responses:
 *       200:
 *         description: Stock transferred successfully
 *       400:
 *         description: Validation error or insufficient stock
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Material not found
 */
router.post('/:id/transfer', authenticateToken, transfersController.transferStock);

export default router;

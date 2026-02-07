import express from "express";
import { PurchaseNotesController } from "../controllers/purchaseNotes.controller.js";
import {
  purchaseNotesValidators,
  handleValidationErrors,
} from "../validators/purchaseNotes.validator.js";
import { authenticateToken } from "../../../../middlewares/auth.js";

const router = express.Router();
const purchaseNotesController = new PurchaseNotesController();

/**
 * @swagger
 * tags:
 *   name: Purchase Notes
 *   description: Gestión de notas de compras
 */

/**
 * @swagger
 * /api/purchases/{purchaseId}/notes:
 *   get:
 *     summary: Get all notes for a purchase
 *     tags: [Purchase Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Purchase ID
 *     responses:
 *       200:
 *         description: Notes retrieved successfully
 *       404:
 *         description: Purchase not found
 */
router.get(
  "/:purchaseId/notes",
  authenticateToken,
  purchaseNotesValidators.getNotes,
  handleValidationErrors,
  purchaseNotesController.getNotesByPurchase
);

/**
 * @swagger
 * /api/purchases/{purchaseId}/notes:
 *   post:
 *     summary: Create a new note for a purchase
 *     tags: [Purchase Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Purchase ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - note
 *             properties:
 *               note:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 2000
 *                 description: Note text
 *                 example: "El método de pago correcto es Transferencia, no Efectivo. Error al momento del registro."
 *     responses:
 *       201:
 *         description: Note created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Purchase not found
 */
router.post(
  "/:purchaseId/notes",
  authenticateToken,
  purchaseNotesValidators.createNote,
  handleValidationErrors,
  purchaseNotesController.createNote
);

export default router;

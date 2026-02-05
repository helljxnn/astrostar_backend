import express from "express";
import { PurchasesController } from "../controllers/purchases.controller.js";
import {
  purchasesValidators,
  handleValidationErrors,
} from "../validators/purchases.validator.js";

const router = express.Router();
const purchasesController = new PurchasesController();

/**
 * @swagger
 * tags:
 *   name: Purchases
 *   description: Gestión de compras
 */

/**
 * @swagger
 * /api/purchases/stats:
 *   get:
 *     summary: Get purchase statistics
 *     description: Retrieves statistical information about purchases
 *     tags: [Purchases]
 *     responses:
 *       200:
 *         description: Purchase statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalPurchases:
 *                       type: integer
 *                     byStatus:
 *                       type: object
 *                     totalAmount:
 *                       type: number
 *       500:
 *         description: Internal server error
 */
router.get("/stats", purchasesController.getPurchaseStats);

/**
 * @swagger
 * /api/purchases:
 *   get:
 *     summary: Get list of purchases with pagination and filters
 *     tags: [Purchases]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search term
 *       - in: query
 *         name: providerId
 *         schema:
 *           type: integer
 *         description: Filter by provider ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Received, Partial, Cancelled]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of purchases retrieved successfully
 *       400:
 *         description: Invalid parameters
 */
router.get(
  "/",
  purchasesValidators.getAll,
  handleValidationErrors,
  purchasesController.getAllPurchases
);

/**
 * @swagger
 * /api/purchases/{id}:
 *   get:
 *     summary: Get purchase by ID
 *     tags: [Purchases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Purchase ID
 *     responses:
 *       200:
 *         description: Purchase found successfully
 *       404:
 *         description: Purchase not found
 */
router.get(
  "/:id",
  purchasesValidators.getById,
  handleValidationErrors,
  purchasesController.getPurchaseById
);

/**
 * @swagger
 * /api/purchases:
 *   post:
 *     summary: Create new purchase
 *     tags: [Purchases]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - providerId
 *               - purchaseDate
 *               - items
 *             properties:
 *               providerId:
 *                 type: integer
 *                 description: Provider ID
 *               employeeId:
 *                 type: integer
 *                 description: Employee ID (optional)
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *                 description: Purchase date
 *               deliveryDate:
 *                 type: string
 *                 format: date
 *                 description: Delivery date (optional)
 *               status:
 *                 type: string
 *                 enum: [Pending, Received, Partial, Cancelled]
 *                 default: Pending
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Additional notes (optional)
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - productName
 *                     - quantity
 *                     - unitPrice
 *                     - subtotal
 *                   properties:
 *                     productName:
 *                       type: string
 *                       minLength: 2
 *                       maxLength: 200
 *                     description:
 *                       type: string
 *                       maxLength: 500
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                     unitPrice:
 *                       type: number
 *                       minimum: 0
 *                     subtotal:
 *                       type: number
 *                       minimum: 0
 *     responses:
 *       201:
 *         description: Purchase created successfully
 *       400:
 *         description: Validation error
 */
router.post(
  "/",
  purchasesValidators.create,
  handleValidationErrors,
  purchasesController.createPurchase
);

/**
 * @swagger
 * /api/purchases/{id}:
 *   put:
 *     summary: Update purchase
 *     tags: [Purchases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Purchase ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               providerId:
 *                 type: integer
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *               deliveryDate:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [Pending, Received, Partial, Cancelled]
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   properties:
 *                     productName:
 *                       type: string
 *                       minLength: 2
 *                       maxLength: 200
 *                     description:
 *                       type: string
 *                       maxLength: 500
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                     unitPrice:
 *                       type: number
 *                       minimum: 0
 *                     subtotal:
 *                       type: number
 *                       minimum: 0
 *     responses:
 *       200:
 *         description: Purchase updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Purchase not found
 */
router.put(
  "/:id",
  purchasesValidators.update,
  handleValidationErrors,
  purchasesController.updatePurchase
);

/**
 * @swagger
 * /api/purchases/{id}/status:
 *   patch:
 *     summary: Change purchase status
 *     tags: [Purchases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Purchase ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Pending, Received, Partial, Cancelled]
 *     responses:
 *       200:
 *         description: Status changed successfully
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Purchase not found
 */
router.patch(
  "/:id/status",
  purchasesValidators.changeStatus,
  handleValidationErrors,
  purchasesController.changePurchaseStatus
);

export default router;

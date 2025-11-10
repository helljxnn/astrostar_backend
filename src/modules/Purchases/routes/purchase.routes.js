import express from "express";
import { PurchaseController } from "../controllers/purchase.controller.js";

const router = express.Router();
const controller = new PurchaseController();

/**
 * @swagger
 * tags:
 *   name: Purchases
 *   description: Purchase management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PurchaseItemInput:
 *       type: object
 *       required: [sportsEquipmentId, quantity, unitPrice, productName]
 *       properties:
 *         sportsEquipmentId:
 *           type: integer
 *         quantity:
 *           type: integer
 *         unitPrice:
 *           type: number
 *         productName:
 *           type: string
 *
 *     PurchaseInput:
 *       type: object
 *       required: [providerId, purchaseDate, items]
 *       properties:
 *         providerId:
 *           type: integer
 *         purchaseDate:
 *           type: string
 *           format: date
 *         deliveryDate:
 *           type: string
 *           format: date
 *         notes:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PurchaseItemInput'
 */

/**
 * @swagger
 * /api/purchases:
 *   get:
 *     summary: Get all purchases with pagination
 *     tags: [Purchases]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by purchase number or provider name.
 *     responses:
 *       200:
 *         description: A list of purchases.
 *       500:
 *         description: Internal server error.
 */
router.get("/", controller.GetAll);

/**
 * @swagger
 * /api/purchases/{id}:
 *   get:
 *     summary: Get a single purchase by ID
 *     tags: [Purchases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Details of the purchase.
 *       404:
 *         description: Purchase not found.
 */
router.get("/:id", controller.GetById);

/**
 * @swagger
 * /api/purchases:
 *   post:
 *     summary: Create a new purchase
 *     tags: [Purchases]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PurchaseInput'
 *     responses:
 *       201:
 *         description: Purchase created successfully.
 *       400:
 *         description: Invalid input data.
 */
router.post("/", controller.Create);

export default router;

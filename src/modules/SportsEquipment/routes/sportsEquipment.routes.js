import express from "express";
import { SportsEquipment } from "../controllers/sportEquipment.controller.js";

const router = express.Router();
const controller = new SportsEquipment();

/**
 * @swagger
 * tags:
 *   name: SportsEquipment
 *   description: Management of sports equipment
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SportsEquipment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The unique ID of the equipment.
 *           example: 1
 *         name:
 *           type: string
 *           description: The name of the equipment.
 *           example: "Soccer Ball"
 *         quantityInitial:
 *           type: integer
 *           description: The initial quantity when the equipment was first registered.
 *           example: 100
 *         quantityTotal:
 *           type: integer
 *           description: The current total available quantity.
 *           example: 85
 *         status:
 *           type: string
 *           enum: [Activated, Disabled, SoldOut]
 *           description: The current status of the equipment item.
 *           example: "Activated"
 *
 *     DisposalRequest:
 *       type: object
 *       required:
 *         - quantity
 *         - reason
 *       properties:
 *         quantity:
 *           type: integer
 *           description: The number of items to dispose of.
 *           example: 5
 *         reason:
 *           type: string
 *           enum: [damaged, lost, stolen, obsolete, other]
 *           description: The reason for the disposal.
 *           example: "damaged"
 *         observation:
 *           type: string
 *           description: Optional notes about the disposal.
 *           example: "Worn out from excessive use."
 */

/**
 * @swagger
 * /api/sports-equipment:
 *   get:
 *     summary: Get all sports equipment with pagination and search
 *     tags: [SportsEquipment]
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
 *         description: Search by name or status.
 *     responses:
 *       200:
 *         description: A list of sports equipment.
 *       500:
 *         description: Internal server error.
 */
router.get("/", controller.GetAll);

/**
 * @swagger
 * /api/sports-equipment/{id}:
 *   get:
 *     summary: Get a single piece of sports equipment by ID
 *     tags: [SportsEquipment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Details of the sports equipment.
 *       404:
 *         description: Equipment not found.
 */
router.get("/:id", controller.GetById);

/**
 * @swagger
 * /api/sports-equipment:
 *   post:
 *     summary: Create a new piece of sports equipment
 *     tags: [SportsEquipment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Training Cones"
 *               quantityInitial:
 *                 type: integer
 *                 example: 50
 *     responses:
 *       201:
 *         description: Sports equipment created successfully.
 *       400:
 *         description: Invalid data (e.g., duplicate or empty name).
 */
router.post("/", controller.Create);

/**
 * @swagger
 * /api/sports-equipment/{id}:
 *   put:
 *     summary: Update sports equipment
 *     tags: [SportsEquipment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Basketball"
 *               status:
 *                 type: string
 *                 enum: [Activated, Disabled, SoldOut]
 *                 example: "Disabled"
 *     responses:
 *       200:
 *         description: Sports equipment updated.
 *       404:
 *         description: Equipment not found.
 */
router.put("/:id", controller.Update);

/**
 * @swagger
 * /api/sports-equipment/{id}:
 *   delete:
 *     summary: Delete a piece of sports equipment
 *     tags: [SportsEquipment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Sports equipment deleted.
 *       400:
 *         description: Cannot delete because it has associated records.
 *       404:
 *         description: Equipment not found.
 */
router.delete("/:id", controller.Delete);

/**
 * @swagger
 * /api/sports-equipment/{id}/disposals:
 *   post:
 *     summary: Create a disposal record for a piece of equipment
 *     tags: [SportsEquipment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the equipment to dispose of.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DisposalRequest'
 *     responses:
 *       201:
 *         description: Disposal created successfully.
 *       400:
 *         description: Invalid data (e.g., quantity exceeds available total).
 *       404:
 *         description: Equipment not found.
 */
router.post("/:id/disposals", controller.CreateDisposal);

export default router;


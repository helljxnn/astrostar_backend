import express from "express";
import { DonorSponsorController } from "../controllers/donorsSponsors.controller.js";

const router = express.Router();
const controller = new DonorSponsorController();

/**
 * @swagger
 * tags:
 *   name: DonorsSponsors
 *   description: Donor and Sponsor Management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DonorSponsor:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated ID of the donor/sponsor.
 *           example: 1
 *         identification:
 *           type: string
 *           description: The unique identification number (NIT or ID card).
 *           example: "900123456-7"
 *         name:
 *           type: string
 *           description: The name or business name.
 *           example: "Tech for Good Inc."
 *         contactPerson:
 *           type: string
 *           description: The name of the contact person (optional).
 *           example: "Jane Doe"
 *         type:
 *           type: string
 *           enum: [Donor, Sponsor]
 *           description: The type of entity.
 *           example: "Sponsor"
 *         personType:
 *           type: string
 *           enum: [Natural, Legal]
 *           description: The legal type of the person/entity.
 *           example: "Legal"
 *         phone:
 *           type: string
 *           description: The contact phone number.
 *           example: "3101234567"
 *         email:
 *           type: string
 *           format: email
 *           description: The contact email address.
 *           example: "contact@techforgood.com"
 *         address:
 *           type: string
 *           description: The physical address (optional).
 *           example: "123 Innovation Ave, Tech City"
 *         status:
 *           type: string
 *           enum: [Active, Inactive]
 *           description: The current status of the record.
 *           example: "Active"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the record was created.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the record was last updated.
 *
 *     Pagination:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Total number of records.
 *         page:
 *           type: integer
 *           description: Current page number.
 *         limit:
 *           type: integer
 *           description: Number of records per page.
 *         pages:
 *           type: integer
 *           description: Total number of pages.
 *
 *     DonorSponsorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DonorSponsor'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 */

/**
 * @swagger
 * /api/donors-sponsors:
 *   get:
 *     summary: Get all donors and sponsors with pagination and search
 *     tags: [DonorsSponsors]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name, identification, email, or phone.
 *     responses:
 *       200:
 *         description: A list of donors and sponsors.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DonorSponsorResponse'
 *       500:
 *         description: Internal server error.
 */
router.get("/", controller.GetAll);

/**
 * @swagger
 * /api/donors-sponsors/{id}:
 *   get:
 *     summary: Get a single donor/sponsor by ID
 *     tags: [DonorsSponsors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the donor/sponsor.
 *     responses:
 *       200:
 *         description: Details of the donor/sponsor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/DonorSponsor'
 *       404:
 *         description: Record not found.
 *       500:
 *         description: Internal server error.
 */
router.get("/:id", controller.GetById);

/**
 * @swagger
 * /api/donors-sponsors:
 *   post:
 *     summary: Create a new donor or sponsor
 *     tags: [DonorsSponsors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identification:
 *                 type: string
 *               name:
 *                 type: string
 *               contactPerson:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [Donor, Sponsor]
 *               personType:
 *                 type: string
 *                 enum: [Natural, Legal]
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *             required:
 *               - identification
 *               - name
 *               - type
 *               - personType
 *               - phone
 *               - email
 *     responses:
 *       201:
 *         description: Donor/Sponsor created successfully.
 *       400:
 *         description: Invalid data (e.g., missing fields, duplicate identification/email).
 *       500:
 *         description: Internal server error.
 */
router.post("/", controller.Create);

/**
 * @swagger
 * /api/donors-sponsors/{id}:
 *   put:
 *     summary: Update an existing donor or sponsor
 *     tags: [DonorsSponsors]
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
 *               identification:
 *                 type: string
 *               name:
 *                 type: string
 *               contactPerson:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [Donor, Sponsor]
 *               personType:
 *                 type: string
 *                 enum: [Natural, Legal]
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *     responses:
 *       200:
 *         description: Record updated successfully.
 *       404:
 *         description: Record not found.
 *       500:
 *         description: Internal server error.
 */
router.put("/:id", controller.Update);

/**
 * @swagger
 * /api/donors-sponsors/{id}:
 *   delete:
 *     summary: Delete a donor or sponsor
 *     tags: [DonorsSponsors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Record deleted successfully.
 *       400:
 *         description: Cannot delete because it has associated records (e.g., donations).
 *       404:
 *         description: Record not found.
 *       500:
 *         description: Internal server error.
 */
router.delete("/:id", controller.Delete);

export default router;

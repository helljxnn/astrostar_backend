import express from "express";
import { AppointmentController } from "../controllers/appointments.controller.js";

const router = express.Router();
const controller = new AppointmentController();

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: API for managing appointments
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       required:
 *         - title
 *         - date
 *         - time
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the appointment.
 *           example: 1
 *         title:
 *           type: string
 *           description: The title of the appointment.
 *           example: "Medical Check-up"
 *         date:
 *           type: string
 *           format: date
 *           description: The date of the appointment.
 *           example: "2025-11-10"
 *         time:
 *           type: string
 *           description: The time of the appointment.
 *           example: "09:30"
 *         description:
 *           type: string
 *           description: A brief description of the appointment.
 *           example: "General health check."
 *         status:
 *           type: string
 *           enum: [SCHEDULED, COMPLETED, CANCELLED]
 *           description: The current status of the appointment.
 *           example: "SCHEDULED"
 *         cancellationReason:
 *           type: string
 *           description: The reason for cancelling the appointment.
 *           example: "Patient rescheduled."
 *
 *     CancelAppointment:
 *       type: object
 *       required:
 *         - cancellationReason
 *       properties:
 *         cancellationReason:
 *           type: string
 *           description: The reason for cancelling the appointment.
 *           example: "Unable to attend due to a conflict."
 */

/**
 * @swagger
 * /appointments:
 *   get:
 *     summary: Retrieve a list of all appointments
 *     tags: [Appointments]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search for appointments by title.
 *     responses:
 *       200:
 *         description: A list of appointments.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Appointment'
 */
router.get("/", controller.getAll);

/**
 * @swagger
 * /appointments/{id}:
 *   get:
 *     summary: Get a single appointment by ID
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the appointment to retrieve.
 *     responses:
 *       200:
 *         description: The requested appointment.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *       404:
 *         description: Appointment not found.
 */
router.get("/:id", controller.getById);

/**
 * @swagger
 * /appointments:
 *   post:
 *     summary: Create a new appointment
 *     tags: [Appointments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appointment'
 *     responses:
 *       201:
 *         description: Appointment created successfully.
 *       400:
 *         description: Bad request, check input data.
 */
router.post("/", controller.create);

/**
 * @swagger
 * /appointments/{id}:
 *   put:
 *     summary: Update an existing appointment
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the appointment to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appointment'
 *     responses:
 *       200:
 *         description: Appointment updated successfully.
 *       404:
 *         description: Appointment not found.
 */
router.put("/:id", controller.update);

/**
 * @swagger
 * /appointments/{id}/cancel:
 *   patch:
 *     summary: Cancel an appointment
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the appointment to cancel.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CancelAppointment'
 *     responses:
 *       200:
 *         description: Appointment cancelled successfully.
 *       400:
 *         description: Cancellation reason is required.
 *       404:
 *         description: Appointment not found.
 */
router.patch("/:id/cancel", controller.cancel);

export default router;


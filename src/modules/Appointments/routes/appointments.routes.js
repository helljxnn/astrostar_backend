import express from "express";
import { AppointmentController } from "../controllers/appointment.controller.js";

const router = express.Router();
const controller = new AppointmentController();

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Gestión de citas médicas y de especialistas
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: "Cita de Fisioterapia"
 *         description:
 *           type: string
 *           example: "Revisión de rodilla post-partido."
 *         start:
 *           type: string
 *           format: date-time
 *           example: "2024-11-20T14:00:00.000Z"
 *         end:
 *           type: string
 *           format: date-time
 *           example: "2024-11-20T14:45:00.000Z"
 *         status:
 *           type: string
 *           enum: [PENDING, COMPLETED, CANCELLED]
 *           example: "PENDING"
 *         reasonForCancellation:
 *           type: string
 *           nullable: true
 *           example: "El atleta no puede asistir."
 *         athleteId:
 *           type: integer
 *           example: 1
 *         specialistId:
 *           type: integer
 *           example: 2
 *         specialtyId:
 *           type: integer
 *           example: 3
 *
 *     CreateAppointmentRequest:
 *       type: object
 *       required:
 *         - title
 *         - start
 *         - end
 *         - athleteId
 *         - specialistId
 *         - specialtyId
 *       properties:
 *         title:
 *           type: string
 *           example: "Consulta Nutricional"
 *         description:
 *           type: string
 *           example: "Plan de alimentación para competencia."
 *         start:
 *           type: string
 *           format: date-time
 *           description: "Fecha y hora de inicio de la cita en formato ISO 8601."
 *           example: "2024-12-01T10:00:00.000Z"
 *         end:
 *           type: string
 *           format: date-time
 *           description: "Fecha y hora de fin de la cita en formato ISO 8601."
 *           example: "2024-12-01T10:30:00.000Z"
 *         athleteId:
 *           type: integer
 *           description: "ID del atleta."
 *           example: 15
 *         specialistId:
 *           type: integer
 *           description: "ID del especialista (empleado)."
 *           example: 4
 *         specialtyId:
 *           type: integer
 *           description: "ID de la especialidad."
 *           example: 2
 *
 *     CancelAppointmentRequest:
 *       type: object
 *       required:
 *         - reason
 *       properties:
 *         reason:
 *           type: string
 *           description: "Motivo por el cual se cancela la cita."
 *           example: "El especialista tuvo una emergencia."
 */

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Obtener todas las citas
 *     tags: [Appointments]
 *     responses:
 *       200:
 *         description: Lista de citas obtenida exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appointment'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/", controller.GetAll);

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Crear una nueva cita
 *     tags: [Appointments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAppointmentRequest'
 *     responses:
 *       201:
 *         description: Cita creada exitosamente.
 *       400:
 *         description: Datos inválidos o fuera del horario del especialista.
 *       409:
 *         description: Conflicto, el especialista ya tiene una cita en ese horario.
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post("/", controller.Create);

/**
 * @swagger
 * /api/appointments/{id}/cancel:
 *   patch:
 *     summary: Cancelar una cita existente
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la cita a cancelar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CancelAppointmentRequest'
 *     responses:
 *       200:
 *         description: Cita cancelada exitosamente.
 *       400:
 *         description: La cita ya estaba cancelada o falta el motivo.
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch("/:id/cancel", controller.Cancel);

export default router;

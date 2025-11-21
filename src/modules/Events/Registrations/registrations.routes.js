import express from 'express';
import { RegistrationsController } from './registrations.controller.js';
import {
  registrationsValidators,
  handleValidationErrors,
} from './registrations.validator.js';

const router = express.Router();
const registrationsController = new RegistrationsController();

/**
 * @swagger
 * /api/registrations/stats:
 *   get:
 *     summary: Obtener estadísticas de inscripciones
 *     tags: [Registrations]
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 */
router.get('/stats', registrationsController.getRegistrationStats);

/**
 * @swagger
 * /api/registrations/event/{serviceId}:
 *   get:
 *     summary: Obtener inscripciones de un evento
 *     tags: [Registrations]
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Registered, Confirmed, Cancelled, Attended]
 *     responses:
 *       200:
 *         description: Lista de inscripciones del evento
 */
router.get(
  '/event/:serviceId',
  registrationsValidators.getByEvent,
  handleValidationErrors,
  registrationsController.getEventRegistrations
);

/**
 * @swagger
 * /api/registrations/team/{teamId}:
 *   get:
 *     summary: Obtener inscripciones de un equipo
 *     tags: [Registrations]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Registered, Confirmed, Cancelled, Attended]
 *     responses:
 *       200:
 *         description: Lista de inscripciones del equipo
 */
router.get(
  '/team/:teamId',
  registrationsValidators.getByTeam,
  handleValidationErrors,
  registrationsController.getTeamRegistrations
);

/**
 * @swagger
 * /api/registrations/{id}:
 *   get:
 *     summary: Obtener inscripción por ID
 *     tags: [Registrations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Inscripción encontrada
 */
router.get(
  '/:id',
  registrationsValidators.getById,
  handleValidationErrors,
  registrationsController.getRegistrationById
);

/**
 * @swagger
 * /api/registrations:
 *   post:
 *     summary: Inscribir equipo a un evento
 *     tags: [Registrations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - teamId
 *             properties:
 *               serviceId:
 *                 type: integer
 *                 description: ID del evento
 *               teamId:
 *                 type: integer
 *                 description: ID del equipo
 *               sportsCategoryId:
 *                 type: integer
 *                 description: ID de la categoría deportiva (opcional)
 *               notes:
 *                 type: string
 *                 description: Notas adicionales (opcional)
 *     responses:
 *       201:
 *         description: Equipo inscrito exitosamente
 */
router.post(
  '/',
  registrationsValidators.registerTeam,
  handleValidationErrors,
  registrationsController.registerTeamToEvent
);

/**
 * @swagger
 * /api/registrations/{id}/status:
 *   patch:
 *     summary: Actualizar estado de inscripción
 *     tags: [Registrations]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Registered, Confirmed, Cancelled, Attended]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 */
router.patch(
  '/:id/status',
  registrationsValidators.updateStatus,
  handleValidationErrors,
  registrationsController.updateRegistrationStatus
);

/**
 * @swagger
 * /api/registrations/{id}:
 *   delete:
 *     summary: Cancelar inscripción
 *     tags: [Registrations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Inscripción cancelada exitosamente
 */
router.delete(
  '/:id',
  registrationsValidators.cancel,
  handleValidationErrors,
  registrationsController.cancelRegistration
);

export default router;

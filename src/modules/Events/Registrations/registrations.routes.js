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
 * /api/registrations/teams/available:
 *   get:
 *     summary: Obtener equipos disponibles para inscripción (separados por tipo)
 *     tags: [Registrations]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categoría deportiva
 *     responses:
 *       200:
 *         description: Lista de equipos disponibles separados por tipo (fundación y temporales)
 */
router.get('/teams/available', registrationsController.getAvailableTeams);

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
 * /api/registrations/bulk:
 *   post:
 *     summary: Inscribir múltiples equipos a un evento
 *     tags: [Registrations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - teamIds
 *             properties:
 *               serviceId:
 *                 type: integer
 *                 description: ID del evento
 *               teamIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: IDs de los equipos a inscribir
 *               notes:
 *                 type: string
 *                 description: Notas adicionales (opcional)
 *     responses:
 *       201:
 *         description: Equipos inscritos exitosamente
 */
router.post(
  '/bulk',
  registrationsController.registerMultipleTeams
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

// ============================================
// RUTAS PARA INSCRIPCIÓN DE DEPORTISTAS
// ============================================

/**
 * @swagger
 * /api/registrations/athletes/available:
 *   get:
 *     summary: Obtener deportistas disponibles para inscripción
 *     tags: [Registrations]
 *     parameters:
 *       - in: query
 *         name: sportsCategoryId
 *         schema:
 *           type: integer
 *         description: Filtrar por categoría deportiva
 *     responses:
 *       200:
 *         description: Lista de deportistas disponibles
 */
router.get('/athletes/available', registrationsController.getAvailableAthletes);

/**
 * @swagger
 * /api/registrations/event/{serviceId}/athletes:
 *   get:
 *     summary: Obtener inscripciones individuales de un evento
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
 *         description: Lista de inscripciones individuales del evento
 */
router.get(
  '/event/:serviceId/athletes',
  registrationsValidators.getByEvent,
  handleValidationErrors,
  registrationsController.getEventAthleteRegistrations
);

/**
 * @swagger
 * /api/registrations/athlete/{athleteId}:
 *   get:
 *     summary: Obtener inscripciones de un deportista
 *     tags: [Registrations]
 *     parameters:
 *       - in: path
 *         name: athleteId
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
 *         description: Lista de inscripciones del deportista
 */
router.get(
  '/athlete/:athleteId',
  registrationsValidators.getByAthlete,
  handleValidationErrors,
  registrationsController.getAthleteRegistrations
);

/**
 * @swagger
 * /api/registrations/athlete:
 *   post:
 *     summary: Inscribir deportista individual a un evento
 *     tags: [Registrations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - athleteId
 *             properties:
 *               serviceId:
 *                 type: integer
 *                 description: ID del evento
 *               athleteId:
 *                 type: integer
 *                 description: ID del deportista
 *               sportsCategoryId:
 *                 type: integer
 *                 description: ID de la categoría deportiva (opcional)
 *               notes:
 *                 type: string
 *                 description: Notas adicionales (opcional)
 *     responses:
 *       201:
 *         description: Deportista inscrito exitosamente
 */
router.post(
  '/athlete',
  registrationsValidators.registerAthlete,
  handleValidationErrors,
  registrationsController.registerAthleteToEvent
);

/**
 * @swagger
 * /api/registrations/athletes/bulk:
 *   post:
 *     summary: Inscribir múltiples deportistas a un evento
 *     tags: [Registrations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - athleteIds
 *             properties:
 *               serviceId:
 *                 type: integer
 *                 description: ID del evento
 *               athleteIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: IDs de los deportistas a inscribir
 *               notes:
 *                 type: string
 *                 description: Notas adicionales (opcional)
 *     responses:
 *       201:
 *         description: Deportistas inscritos exitosamente
 */
router.post(
  '/athletes/bulk',
  registrationsController.registerMultipleAthletes
);

export default router;

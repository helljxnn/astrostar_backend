import express from "express";
import { TeamsController } from "../controllers/teams.controller.js";
import {
  teamsValidators,
  handleValidationErrors,
} from "../validators/teams.validator.js";

const router = express.Router();
const teamsController = new TeamsController();

/**
 * @swagger
 * tags:
 *   name: Teams
 *   description: Gestión de equipos deportivos (fundación y temporales)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Team:
 *       type: object
 *       required:
 *         - nombre
 *         - teamType
 *         - deportistasIds
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del equipo
 *         nombre:
 *           type: string
 *           description: Nombre del equipo
 *         entrenador:
 *           type: string
 *           description: Nombre del entrenador
 *         estado:
 *           type: string
 *           enum: [Activo, Inactivo]
 *           description: Estado del equipo
 *         descripcion:
 *           type: string
 *           description: Descripción del equipo
 *         categoria:
 *           type: string
 *           description: Categoría deportiva (obligatorio para equipos temporales)
 *         teamType:
 *           type: string
 *           enum: [Fundacion, Temporal]
 *           description: Tipo de equipo
 *         cantidadDeportistas:
 *           type: integer
 *           description: Cantidad de deportistas en el equipo
 *         deportistasIds:
 *           type: array
 *           items:
 *             type: integer
 *           description: IDs de los deportistas
 *         entrenadorData:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             type:
 *               type: string
 *               enum: [fundacion, temporal]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/teams/check-name:
 *   get:
 *     summary: Verificar disponibilidad de nombre de equipo
 *     description: Valida si un nombre de equipo está disponible para uso
 *     tags: [Teams]
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del equipo a verificar
 *       - in: query
 *         name: excludeId
 *         schema:
 *           type: integer
 *         description: ID del equipo a excluir (para actualizaciones)
 *     responses:
 *       200:
 *         description: Resultado de disponibilidad
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 available:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  "/check-name",
  teamsValidators.checkName,
  handleValidationErrors,
  teamsController.checkNameAvailability
);

/**
 * @swagger
 * /api/teams/stats:
 *   get:
 *     summary: Obtener estadísticas de equipos
 *     description: Retorna estadísticas generales de equipos (total, activos, inactivos, por tipo)
 *     tags: [Teams]
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     active:
 *                       type: integer
 *                     inactive:
 *                       type: integer
 *                     fundacion:
 *                       type: integer
 *                     temporal:
 *                       type: integer
 *                 message:
 *                   type: string
 *       500:
 *         description: Error interno del servidor
 */
router.get("/stats", teamsController.getTeamStats);

/**
 * @swagger
 * /api/teams/sports-categories:
 *   get:
 *     summary: Obtener categorías deportivas activas
 *     description: Retorna lista de categorías deportivas activas para selección en formularios
 *     tags: [Teams]
 *     responses:
 *       200:
 *         description: Categorías deportivas obtenidas exitosamente
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nombre:
 *                         type: string
 *                       edadMinima:
 *                         type: integer
 *                       edadMaxima:
 *                         type: integer
 *                 message:
 *                   type: string
 *       500:
 *         description: Error interno del servidor
 */
router.get("/sports-categories", teamsController.getSportsCategories);

/**
 * @swagger
 * /api/teams/check-duplicate-temporal:
 *   get:
 *     summary: Verificar equipos temporales duplicados
 *     description: Valida si ya existe un equipo temporal con los mismos deportistas y entrenador
 *     tags: [Teams]
 *     parameters:
 *       - in: query
 *         name: athleteIds
 *         required: true
 *         schema:
 *           type: string
 *         description: IDs de deportistas separados por comas
 *         example: "1,2,3"
 *       - in: query
 *         name: trainerId
 *         schema:
 *           type: integer
 *         description: ID del entrenador
 *         example: 5
 *       - in: query
 *         name: excludeId
 *         schema:
 *           type: integer
 *         description: ID del equipo a excluir (para edición)
 *     responses:
 *       200:
 *         description: Resultado de verificación de duplicados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     isDuplicate:
 *                       type: boolean
 *                     existingTeamId:
 *                       type: integer
 *                     existingTeamName:
 *                       type: string
 *                 message:
 *                   type: string
 *       500:
 *         description: Error interno del servidor
 */
router.get("/check-duplicate-temporal", teamsController.checkDuplicateTemporalTeam);

/**
 * @swagger
 * /api/teams/check-temporal-person-availability:
 *   get:
 *     summary: Verificar disponibilidad de persona temporal
 *     description: Valida si una persona temporal está disponible (no está en otro equipo activo)
 *     tags: [Teams]
 *     parameters:
 *       - in: query
 *         name: personId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la persona temporal
 *         example: 10
 *       - in: query
 *         name: excludeTeamId
 *         schema:
 *           type: integer
 *         description: ID del equipo a excluir (para edición)
 *     responses:
 *       200:
 *         description: Resultado de disponibilidad
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 available:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 teamName:
 *                   type: string
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.get("/check-temporal-person-availability", teamsController.checkTemporalPersonAvailability);

/**
 * @swagger
 * /api/teams/{id}/check-event-assignments:
 *   get:
 *     summary: Check if team is assigned to events
 *     description: Verifies if a team is assigned to any events/services. Used to determine if team can be deleted.
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Event assignment check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 isAssigned:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 events:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       status:
 *                         type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid team ID
 *       500:
 *         description: Internal server error
 */
router.get("/:id/check-event-assignments", teamsController.checkTeamAssignedToEvents);

/**
 * @swagger
 * /api/teams:
 *   get:
 *     summary: Obtener lista de equipos
 *     description: Retorna lista paginada de equipos con filtros opcionales
 *     tags: [Teams]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de registros por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre, entrenador o categoría
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Activo, Inactivo]
 *         description: Filtrar por estado
 *       - in: query
 *         name: teamType
 *         schema:
 *           type: string
 *           enum: [Fundacion, Temporal]
 *         description: Filtrar por tipo de equipo
 *     responses:
 *       200:
 *         description: Lista de equipos obtenida exitosamente
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
 *                     $ref: '#/components/schemas/Team'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                 message:
 *                   type: string
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  "/",
  teamsValidators.getAll,
  handleValidationErrors,
  teamsController.getAllTeams
);

/**
 * @swagger
 * /api/teams/{id}:
 *   get:
 *     summary: Obtener equipo por ID
 *     description: Retorna información detallada de un equipo específico
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del equipo
 *     responses:
 *       200:
 *         description: Equipo encontrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Team'
 *                 message:
 *                   type: string
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Equipo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  "/:id",
  teamsValidators.getById,
  handleValidationErrors,
  teamsController.getTeamById
);

/**
 * @swagger
 * /api/teams:
 *   post:
 *     summary: Crear nuevo equipo
 *     description: Crea un nuevo equipo deportivo (fundación o temporal)
 *     tags: [Teams]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - teamType
 *               - deportistasIds
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del equipo
 *                 example: "Equipo Juvenil A"
 *               entrenador:
 *                 type: string
 *                 description: Nombre del entrenador
 *                 example: "Juan Pérez"
 *               descripcion:
 *                 type: string
 *                 description: Descripción del equipo
 *               categoria:
 *                 type: string
 *                 description: Categoría deportiva (obligatorio para temporales)
 *                 example: "Sub-17"
 *               teamType:
 *                 type: string
 *                 enum: [Fundacion, Temporal]
 *                 description: Tipo de equipo
 *               deportistasIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: IDs de los deportistas
 *                 example: [1, 2, 3]
 *               entrenadorData:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   type:
 *                     type: string
 *                     enum: [fundacion, temporal]
 *     responses:
 *       201:
 *         description: Equipo creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Team'
 *                 message:
 *                   type: string
 *       400:
 *         description: Datos inválidos o equipo duplicado
 *       409:
 *         description: Conflicto - Miembro ya asignado a otro equipo
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  "/",
  teamsValidators.create,
  handleValidationErrors,
  teamsController.createTeam
);

/**
 * /api/teams/{id}:
 *   put:
 *     summary: Actualizar equipo
 *     description: Actualiza información de un equipo existente
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del equipo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               entrenador:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               categoria:
 *                 type: string
 *               deportistasIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               entrenadorData:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   type:
 *                     type: string
 *     responses:
 *       200:
 *         description: Equipo actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Team'
 *                 message:
 *                   type: string
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Equipo no encontrado
 *       409:
 *         description: Conflicto - Miembro ya asignado a otro equipo
 *       500:
 *         description: Error interno del servidor
 */
router.put(
  "/:id",
  teamsValidators.update,
  handleValidationErrors,
  teamsController.updateTeam
);

/**
 * @swagger
 * /api/teams/{id}/status:
 *   patch:
 *     summary: Cambiar estado del equipo
 *     description: Cambia el estado de un equipo entre Activo e Inactivo
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del equipo
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
 *                 enum: [Activo, Inactivo]
 *                 description: Nuevo estado del equipo
 *     responses:
 *       200:
 *         description: Estado cambiado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Team'
 *                 message:
 *                   type: string
 *       400:
 *         description: Datos inválidos o conflicto con miembros temporales
 *       404:
 *         description: Equipo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch(
  "/:id/status",
  teamsValidators.changeStatus,
  handleValidationErrors,
  teamsController.changeTeamStatus
);

/**
 * @swagger
 * /api/teams/{id}:
 *   delete:
 *     summary: Eliminar equipo
 *     description: Elimina un equipo. No se puede eliminar si está asignado a eventos activos (Programado o En_pausa)
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del equipo
 *     responses:
 *       200:
 *         description: Equipo eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: No se puede eliminar - Equipo asignado a eventos activos
 *       404:
 *         description: Equipo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete(
  "/:id",
  teamsValidators.delete,
  handleValidationErrors,
  teamsController.deleteTeam
);

export default router;
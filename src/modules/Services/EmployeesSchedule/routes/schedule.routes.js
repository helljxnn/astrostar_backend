// 📁 Services/Employees/EmployeesSchedule/routes/schedule.routes.js
import express from 'express';
import { ScheduleController } from '../controllers/schedule.controller.js';
import { scheduleValidators, handleValidationErrors } from '../validators/schedule.validator.js';
import { authenticateToken } from '../../../../middlewares/auth.js';
import { checkPermissions } from '../../../../middlewares/checkPermissions.js';

const router = express.Router();
const scheduleController = new ScheduleController();

/**
 * @swagger
 * tags:
 *   name: Employee Schedules
 *   description: Gestión de horarios de empleados
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     EmployeeSchedule:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del horario
 *           example: 1
 *         employeeId:
 *           type: integer
 *           description: ID del empleado
 *           example: 1
 *         scheduleDate:
 *           type: string
 *           format: date
 *           description: Fecha del horario
 *           example: "2025-12-01"
 *         dayOfWeek:
 *           type: string
 *           description: Día de la semana
 *           example: "Monday"
 *         startTime:
 *           type: string
 *           description: Hora de inicio (formato HH:MM)
 *           example: "08:00"
 *         endTime:
 *           type: string
 *           description: Hora de fin (formato HH:MM)
 *           example: "17:00"
 *         recurrence:
 *           type: string
 *           description: Tipo de repetición
 *           example: "no"
 *         customRecurrence:
 *           type: string
 *           nullable: true
 *           description: Configuración personalizada de repetición (JSON)
 *           example: null
 *         description:
 *           type: string
 *           nullable: true
 *           description: Descripción del horario
 *           example: "Turno regular de oficina"
 *         cancellationReason:
 *           type: string
 *           nullable: true
 *           description: Motivo de cancelación
 *           example: null
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         employee:
 *           type: object
 *           description: Información del empleado
 */

// ============================================
// 🔹 RUTAS ESPECÍFICAS
// ============================================

/**
 * @swagger
 * /api/schedules/employees:
 *   get:
 *     summary: Obtener lista de empleados activos (para dropdown)
 *     tags: [Employee Schedules]
 *     responses:
 *       200:
 *         description: Lista de empleados activos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 message:
 *                   type: string
 */
router.get('/employees',
  authenticateToken,
  checkPermissions('employeesSchedule', 'Ver'),
  scheduleController.getActiveEmployees
);

/**
 * @swagger
 * /api/schedules/employee/{employeeId}:
 *   get:
 *     summary: Obtener todos los horarios de un empleado específico
 *     tags: [Employee Schedules]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del empleado
 *     responses:
 *       200:
 *         description: Horarios del empleado
 */
router.get('/employee/:employeeId',
  authenticateToken,
  checkPermissions('employeesSchedule', 'Ver'),
  scheduleValidators.getByEmployeeId,
  handleValidationErrors,
  scheduleController.getSchedulesByEmployee
);

// ============================================
// 🔹 CRUD BÁSICO
// ============================================

/**
 * @swagger
 * /api/schedules:
 *   get:
 *     summary: Obtener todos los horarios con filtros y paginación
 *     tags: [Employee Schedules]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: dayOfWeek
 *         schema:
 *           type: string
 *           enum: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
 *     responses:
 *       200:
 *         description: Lista de horarios con paginación
 */
router.get('/',
  authenticateToken,
  checkPermissions('employeesSchedule', 'Ver'),
  scheduleValidators.getAll,
  handleValidationErrors,
  scheduleController.getAllSchedules
);

/**
 * @swagger
 * /api/schedules:
 *   post:
 *     summary: Crear nuevo horario
 *     tags: [Employee Schedules]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - empleadoId
 *               - fecha
 *               - horaInicio
 *               - horaFin
 *             properties:
 *               empleadoId:
 *                 type: integer
 *                 example: 1
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2025-12-01"
 *               horaInicio:
 *                 type: string
 *                 example: "08:00"
 *               horaFin:
 *                 type: string
 *                 example: "17:00"
 *               repeticion:
 *                 type: string
 *                 example: "no"
 *               customRecurrence:
 *                 type: object
 *                 nullable: true
 *               descripcion:
 *                 type: string
 *                 example: "Turno regular de oficina"
 *     responses:
 *       201:
 *         description: Horario creado exitosamente
 */
router.post('/',
  authenticateToken,
  checkPermissions('employeesSchedule', 'Crear'),
  scheduleValidators.create,
  handleValidationErrors,
  scheduleController.createSchedule
);

/**
 * @swagger
 * /api/schedules/{id}:
 *   get:
 *     summary: Obtener horario por ID
 *     tags: [Employee Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Horario encontrado
 *       404:
 *         description: Horario no encontrado
 */
router.get('/:id',
  authenticateToken,
  checkPermissions('employeesSchedule', 'Ver'),
  scheduleValidators.getById,
  handleValidationErrors,
  scheduleController.getScheduleById
);

/**
 * @swagger
 * /api/schedules/{id}:
 *   put:
 *     summary: Actualizar horario
 *     tags: [Employee Schedules]
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
 *     responses:
 *       200:
 *         description: Horario actualizado
 */
router.put('/:id',
  authenticateToken,
  checkPermissions('employeesSchedule', 'Editar'),
  scheduleValidators.update,
  handleValidationErrors,
  scheduleController.updateSchedule
);

/**
 * @swagger
 * /api/schedules/{id}/novedad:
 *   patch:
 *     summary: Registrar una novedad para un horario
 *     tags: [Employee Schedules]
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
 *               - motivoCancelacion
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2026-02-16"
 *               tipoCancelacion:
 *                 type: string
 *                 enum: [full, time]
 *                 example: "time"
 *               tiempoCancelacion:
 *                 type: string
 *                 example: "08:00 - 10:00"
 *               explicacionTiempo:
 *                 type: string
 *                 example: "Se reagendó la sesión en ese tramo"
 *               motivoCancelacion:
 *                 type: string
 *                 minLength: 10
 *                 example: "Novedad parcial (08:00 - 10:00): se reagendó la sesión"
 *     responses:
 *       200:
 *         description: Novedad registrada exitosamente
 */
router.patch('/:id/novedad',
  authenticateToken,
  checkPermissions('employeesSchedule', 'Editar'),
  scheduleValidators.novelty,
  handleValidationErrors,
  scheduleController.registerNovelty
);

/**
 * @swagger
 * /api/schedules/{id}:
 *   delete:
 *     summary: Eliminar horario
 *     tags: [Employee Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Horario eliminado
 *       400:
 *         description: No se puede eliminar (horario completado)
 */
router.delete('/:id',
  authenticateToken,
  checkPermissions('employeesSchedule', 'Eliminar'),
  scheduleValidators.delete,
  handleValidationErrors,
  scheduleController.deleteSchedule
);

export default router;


import express from 'express';
import eventAssignmentsController from '../controllers/eventAssignments.controller.js';
import { authenticateToken } from '../../../middlewares/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * @swagger
 * /api/materials/events/{eventoId}/assignments:
 *   get:
 *     summary: Obtener asignaciones de materiales de un evento
 *     tags: [Materials - Event Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del evento
 *     responses:
 *       200:
 *         description: Lista de asignaciones del evento
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Evento no encontrado
 */
router.get('/events/:eventoId/assignments', eventAssignmentsController.getByEvento);

/**
 * @swagger
 * /api/materials/events/{eventoId}/finalize:
 *   post:
 *     summary: Finalizar evento y descontar materiales usados del stock
 *     tags: [Materials - Event Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del evento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               materiales:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     material_id:
 *                       type: integer
 *                     cantidad_usada:
 *                       type: integer
 *                     cantidad_devuelta:
 *                       type: integer
 *                     observaciones:
 *                       type: string
 *     responses:
 *       200:
 *         description: Evento finalizado exitosamente
 *       400:
 *         description: Datos inválidos o stock insuficiente
 *       401:
 *         description: No autenticado
 */
router.post('/events/:eventoId/finalize', eventAssignmentsController.finalizeEvent);

/**
 * @swagger
 * /api/materials/assignments/{id}/cancel:
 *   patch:
 *     summary: Cancelar asignación de material a evento
 *     tags: [Materials - Event Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la asignación
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Asignación cancelada exitosamente
 *       400:
 *         description: No se puede cancelar la asignación
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Asignación no encontrada
 */
router.patch('/assignments/:id/cancel', eventAssignmentsController.cancelAssignment);

export default router;

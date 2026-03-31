import { Router } from "express";
import { RSVPController } from "./rsvp.controller.js";
import { authenticateToken } from "../../../middlewares/auth.js";
import { checkPermissions } from "../../../middlewares/checkPermissions.js";
import { publicLimiter } from "../../../middlewares/rateLimiter.js";

const router = Router();
const rsvpController = new RSVPController();

/**
 * @swagger
 * tags:
 *   name: RSVP
 *   description: Gestión de confirmaciones de asistencia a eventos
 */

/**
 * @swagger
 * /api/rsvp:
 *   get:
 *     summary: Procesar respuesta RSVP (confirmar/declinar)
 *     description: Endpoint público para que los usuarios confirmen o declinen su asistencia a un evento
 *     tags: [RSVP]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token único de la invitación
 *       - in: query
 *         name: action
 *         required: true
 *         schema:
 *           type: string
 *           enum: [confirm, decline]
 *         description: Acción a realizar
 *     responses:
 *       200:
 *         description: Respuesta procesada exitosamente (retorna HTML)
 *       400:
 *         description: Token inválido o expirado
 *       404:
 *         description: Invitación no encontrada
 */
router.get("/rsvp", publicLimiter, rsvpController.handleRSVPResponse);

/**
 * @swagger
 * /api/rsvp/status/{token}:
 *   get:
 *     summary: Consultar estado de invitación
 *     description: Obtiene el estado actual de una invitación RSVP
 *     tags: [RSVP]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de la invitación
 *     responses:
 *       200:
 *         description: Estado de la invitación
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
 *                     status:
 *                       type: string
 *                       enum: [PENDING, CONFIRMED, DECLINED]
 *                     eventName:
 *                       type: string
 *                     eventDate:
 *                       type: string
 *                     respondedAt:
 *                       type: string
 *       404:
 *         description: Invitación no encontrada
 */
router.get(
  "/rsvp/status/:token",
  publicLimiter,
  rsvpController.getInvitationStatus,
);

/**
 * @swagger
 * /api/rsvp/resend:
 *   post:
 *     summary: Reenviar invitación RSVP
 *     description: Reenvía el email de invitación a un participante
 *     tags: [RSVP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invitationId
 *             properties:
 *               invitationId:
 *                 type: integer
 *                 description: ID de la invitación
 *     responses:
 *       200:
 *         description: Invitación reenviada exitosamente
 *       404:
 *         description: Invitación no encontrada
 *       500:
 *         description: Error al enviar email
 */
router.post(
  "/rsvp/resend",
  authenticateToken,
  checkPermissions("eventsManagement", "Inscribir"),
  rsvpController.resendInvitation,
);

export default router;


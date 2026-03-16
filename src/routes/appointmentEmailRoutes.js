/**
 * Rutas para correos de citas con calendario
 */

import express from 'express';
import appointmentEmailController from '../controllers/appointmentEmailController.js';

const router = express.Router();

/**
 * @route POST /api/appointments/send-calendar-email
 * @desc Enviar correo de cita con calendario integrado
 * @body {
 *   athleteEmail: string,
 *   athleteName: string,
 *   date: string (YYYY-MM-DD),
 *   startTime: string (HH:MM),
 *   endTime: string (HH:MM),
 *   specialistName: string,
 *   description?: string
 * }
 */
router.post('/send-calendar-email', appointmentEmailController.sendAppointmentEmail);

/**
 * @route POST /api/appointments/send-notification
 * @desc Enviar notificación simple de cita (método original)
 * @body {
 *   athleteEmail: string,
 *   athleteName: string,
 *   date: string,
 *   time: string,
 *   specialistName: string
 * }
 */
router.post('/send-notification', appointmentEmailController.sendAppointmentNotification);

export default router;

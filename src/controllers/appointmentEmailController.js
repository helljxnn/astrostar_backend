/**
 * Controlador para envío de correos de citas con calendario
 */

import emailService from '../services/emailService.js';

class AppointmentEmailController {
  /**
   * Enviar correo de cita con calendario
   * POST /api/appointments/send-email
   */
  async sendAppointmentEmail(req, res) {
    try {
      const { 
        athleteEmail, 
        athleteName, 
        date, 
        startTime, 
        endTime, 
        specialistName, 
        description 
      } = req.body;

      // Validar datos requeridos
      if (!athleteEmail || !athleteName || !date || !startTime || !endTime || !specialistName) {
        return res.status(400).json({
          success: false,
          message: 'Faltan datos requeridos: athleteEmail, athleteName, date, startTime, endTime, specialistName'
        });
      }

      // Preparar datos de la cita
      const appointmentData = {
        date,
        startTime,
        endTime,
        specialistName,
        description: description || 'Cita programada en AstroStar'
      };

      // Enviar correo
      const result = await emailService.sendAppointmentCalendarEmail({
        to: athleteEmail,
        athleteName,
        appointmentData
      });

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: 'Correo de cita enviado exitosamente',
          messageId: result.messageId,
          simulated: result.simulated || false
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Error enviando correo de cita',
          error: result.error
        });
      }

    } catch (error) {
      console.error('Error en sendAppointmentEmail:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * Enviar correo de cita usando el formato original (para compatibilidad)
   * POST /api/appointments/send-notification
   */
  async sendAppointmentNotification(req, res) {
    try {
      const { athleteEmail, athleteName, date, time, specialistName } = req.body;

      if (!athleteEmail || !athleteName || !date || !time || !specialistName) {
        return res.status(400).json({
          success: false,
          message: 'Faltan datos requeridos'
        });
      }

      // Usar el método original para compatibilidad
      const result = await emailService.sendAppointmentNotification({
        to: athleteEmail,
        athleteName,
        date,
        time,
        specialistName
      });

      return res.status(result.success ? 200 : 500).json(result);

    } catch (error) {
      console.error('Error en sendAppointmentNotification:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
}

export default new AppointmentEmailController();
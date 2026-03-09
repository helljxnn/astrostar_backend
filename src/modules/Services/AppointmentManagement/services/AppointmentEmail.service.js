import nodemailer from 'nodemailer';

class AppointmentEmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendAppointmentCreated(appointmentData, athleteEmail, athleteName, specialistEmail, specialistName) {
    const { appointmentDate, startTime, endTime, specialty, description } = appointmentData;

    const formattedDate = new Date(appointmentDate).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailTemplate = (recipientName, isAthlete) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #B595FF 0%, #7B5FFF 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22C55E; }
          .info-row { padding: 10px 0; border-bottom: 1px solid #eee; }
          .info-label { font-weight: bold; color: #666; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Nueva Cita Programada</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${recipientName}</strong>,</p>
            
            <p>Se ha programado una nueva cita con los siguientes detalles:</p>
            
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Deportista:</span>
                <span class="info-value">${athleteName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Especialista:</span>
                <span class="info-value">${specialistName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Especialidad:</span>
                <span class="info-value">${specialty}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Fecha:</span>
                <span class="info-value">${formattedDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Horario:</span>
                <span class="info-value">${startTime} - ${endTime}</span>
              </div>
              ${description ? `
              <div class="info-row" style="border-bottom: none;">
                <span class="info-label">Descripción:</span>
                <span class="info-value">${description}</span>
              </div>
              ` : ''}
            </div>

            <p style="color: #666;">Por favor, asegúrate de estar disponible en la fecha y hora indicadas.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} AstroStar. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      // Enviar a deportista
      await this.transporter.sendMail({
        from: `"AstroStar" <${process.env.EMAIL_USER}>`,
        to: athleteEmail,
        subject: 'Nueva Cita Programada - AstroStar',
        html: emailTemplate(athleteName, true),
      });

      // Enviar a especialista
      await this.transporter.sendMail({
        from: `"AstroStar" <${process.env.EMAIL_USER}>`,
        to: specialistEmail,
        subject: 'Nueva Cita Asignada - AstroStar',
        html: emailTemplate(specialistName, false),
      });

      return { success: true };
    } catch (error) {
      console.error('Error enviando emails de creación:', error);
      throw error;
    }
  }

  async sendAppointmentCancelled(appointmentData, athleteEmail, athleteName, specialistEmail, specialistName, cancelReason) {
    const { appointmentDate, startTime, endTime, specialty } = appointmentData;

    const formattedDate = new Date(appointmentDate).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailTemplate = (recipientName) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444; }
          .info-row { padding: 10px 0; border-bottom: 1px solid #eee; }
          .info-label { font-weight: bold; color: #666; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Cita Cancelada</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${recipientName}</strong>,</p>
            
            <p>Te informamos que la siguiente cita ha sido cancelada:</p>
            
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Deportista:</span>
                <span class="info-value">${athleteName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Especialista:</span>
                <span class="info-value">${specialistName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Especialidad:</span>
                <span class="info-value">${specialty}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Fecha:</span>
                <span class="info-value">${formattedDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Horario:</span>
                <span class="info-value">${startTime} - ${endTime}</span>
              </div>
              <div class="info-row" style="border-bottom: none;">
                <span class="info-label">Motivo:</span>
                <span class="info-value">${cancelReason}</span>
              </div>
            </div>

            <p style="color: #666;">Si necesitas reprogramar, por favor contacta con nosotros.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} AstroStar. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      // Enviar a deportista
      await this.transporter.sendMail({
        from: `"AstroStar" <${process.env.EMAIL_USER}>`,
        to: athleteEmail,
        subject: 'Cita Cancelada - AstroStar',
        html: emailTemplate(athleteName),
      });

      // Enviar a especialista
      await this.transporter.sendMail({
        from: `"AstroStar" <${process.env.EMAIL_USER}>`,
        to: specialistEmail,
        subject: 'Cita Cancelada - AstroStar',
        html: emailTemplate(specialistName),
      });

      return { success: true };
    } catch (error) {
      console.error('Error enviando emails de cancelación:', error);
      throw error;
    }
  }

  async sendAppointmentReminder(appointmentData, athleteEmail, athleteName, specialistEmail, specialistName) {
    const { appointmentDate, startTime, endTime, specialty, description } = appointmentData;

    const formattedDate = new Date(appointmentDate).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailTemplate = (recipientName) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6; }
          .info-row { padding: 10px 0; border-bottom: 1px solid #eee; }
          .info-label { font-weight: bold; color: #666; }
          .reminder-badge { background: #FEF3C7; color: #92400E; padding: 10px 20px; border-radius: 8px; text-align: center; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Recordatorio de Cita</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${recipientName}</strong>,</p>
            
            <div class="reminder-badge">
              ⏰ Tu cita es mañana
            </div>
            
            <p>Te recordamos tu cita programada:</p>
            
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Deportista:</span>
                <span class="info-value">${athleteName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Especialista:</span>
                <span class="info-value">${specialistName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Especialidad:</span>
                <span class="info-value">${specialty}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Fecha:</span>
                <span class="info-value">${formattedDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Horario:</span>
                <span class="info-value">${startTime} - ${endTime}</span>
              </div>
              ${description ? `
              <div class="info-row" style="border-bottom: none;">
                <span class="info-label">Descripción:</span>
                <span class="info-value">${description}</span>
              </div>
              ` : ''}
            </div>

            <p style="color: #666;">Por favor, confirma tu asistencia o cancela con anticipación si no puedes asistir.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} AstroStar. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      // Enviar a deportista
      await this.transporter.sendMail({
        from: `"AstroStar" <${process.env.EMAIL_USER}>`,
        to: athleteEmail,
        subject: 'Recordatorio: Cita Mañana - AstroStar',
        html: emailTemplate(athleteName),
      });

      // Enviar a especialista
      await this.transporter.sendMail({
        from: `"AstroStar" <${process.env.EMAIL_USER}>`,
        to: specialistEmail,
        subject: 'Recordatorio: Cita Mañana - AstroStar',
        html: emailTemplate(specialistName),
      });

      return { success: true };
    } catch (error) {
      console.error('Error enviando recordatorios:', error);
      throw error;
    }
  }
}

export default new AppointmentEmailService();

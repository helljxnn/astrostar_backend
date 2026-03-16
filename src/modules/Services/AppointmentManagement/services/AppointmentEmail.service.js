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
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nueva Cita Programada - AstroStar</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #B595FF 0%, #7B5FFF 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .info-box { background: white; border: 2px solid #7B5FFF; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .info-row { padding: 12px 0; border-bottom: 1px solid #f0f0f0; display: flex; }
          .info-row:last-child { border-bottom: none; }
          .info-label { font-weight: bold; color: #666; min-width: 140px; }
          .info-value { color: #333; flex: 1; }
          .success-box { background: #E8F5E9; border-left: 4px solid #4CAF50; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; padding: 20px; background: #f9f9f9; color: #666; font-size: 12px; border-top: 1px solid #ddd; }
          h1 { margin: 0; font-size: 28px; }
          h3 { color: #7B5FFF; margin-top: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Nueva Cita Programada</h1>
            <p style="margin: 0; font-size: 16px;">Fundación Manuela Vanegas</p>
          </div>
          
          <div class="content">
            <div class="success-box">
              <p style="margin: 0; font-weight: bold; font-size: 16px;">Hola ${recipientName},</p>
              <p style="margin: 10px 0 0 0;">Se ha programado una nueva cita con los siguientes detalles:</p>
            </div>
            
            <div class="info-box">
              <h3>📋 Detalles de la Cita</h3>
              <div class="info-row">
                <span class="info-label">🏃 Deportista:</span>
                <span class="info-value">${athleteName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">👨‍⚕️ Especialista:</span>
                <span class="info-value">${specialistName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">🏥 Especialidad:</span>
                <span class="info-value">${specialty}</span>
              </div>
              <div class="info-row">
                <span class="info-label">📅 Fecha:</span>
                <span class="info-value">${formattedDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">🕐 Horario:</span>
                <span class="info-value">${startTime} - ${endTime}</span>
              </div>
              ${description ? `
              <div class="info-row">
                <span class="info-label">📝 Descripción:</span>
                <span class="info-value">${description}</span>
              </div>
              ` : ''}
            </div>

            <p style="color: #666; background: #FFF3CD; padding: 15px; border-radius: 8px; border-left: 4px solid #FFC107;">
              <strong>⏰ Recordatorio:</strong> Por favor, asegúrate de estar disponible en la fecha y hora indicadas. Llega 10 minutos antes de tu cita.
            </p>
            
            <p style="margin-top: 30px;">
              Saludos cordiales,<br>
              <strong>Equipo AstroStar</strong><br>
              <span style="color: #666; font-size: 14px;">Fundación Manuela Vanegas</span>
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 5px 0;">Este es un correo automático del sistema AstroStar. Por favor no respondas a este mensaje.</p>
            <p style="margin: 5px 0;">© ${new Date().getFullYear()} Fundación Manuela Vanegas - Todos los derechos reservados</p>
            <p style="margin: 5px 0;">Unidad Deportiva Cristo Rey, Copacabana, Antioquia</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      // Enviar a deportista
      await this.transporter.sendMail({
        from: `"Fundación Manuela Vanegas" <${process.env.EMAIL_USER}>`,
        to: athleteEmail,
        subject: `✅ Cita Programada con ${specialistName}`,
        html: emailTemplate(athleteName, true),
      });

      // Enviar a especialista
      await this.transporter.sendMail({
        from: `"Fundación Manuela Vanegas" <${process.env.EMAIL_USER}>`,
        to: specialistEmail,
        subject: `✅ Nueva Cita Asignada con ${athleteName}`,
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
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cita Cancelada - AstroStar</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .alert-box { background: #FEE2E2; border-left: 4px solid #EF4444; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .info-box { background: white; border: 2px solid #EF4444; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .info-row { padding: 12px 0; border-bottom: 1px solid #f0f0f0; display: flex; }
          .info-row:last-child { border-bottom: none; }
          .info-label { font-weight: bold; color: #666; min-width: 140px; }
          .info-value { color: #333; flex: 1; }
          .reason-box { background: #FFF3CD; border: 2px solid #FFC107; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; background: #f9f9f9; color: #666; font-size: 12px; border-top: 1px solid #ddd; }
          h1 { margin: 0; font-size: 28px; }
          h3 { color: #DC2626; margin-top: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Cita Cancelada</h1>
            <p style="margin: 0; font-size: 16px;">Fundación Manuela Vanegas</p>
          </div>
          
          <div class="content">
            <div class="alert-box">
              <p style="margin: 0; font-weight: bold; font-size: 16px;">Hola ${recipientName || 'Usuario'},</p>
              <p style="margin: 10px 0 0 0;">Te informamos que la siguiente cita ha sido cancelada.</p>
            </div>
            
            <div class="info-box">
              <h3>📋 Detalles de la Cita Cancelada</h3>
              <div class="info-row">
                <span class="info-label">📅 Fecha:</span>
                <span class="info-value">${formattedDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">🕐 Horario:</span>
                <span class="info-value">${startTime} - ${endTime}</span>
              </div>
              <div class="info-row">
                <span class="info-label">🏃 Deportista:</span>
                <span class="info-value">${athleteName || 'No especificado'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">👨‍⚕️ Especialista:</span>
                <span class="info-value">${specialistName || 'No especificado'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">🏥 Especialidad:</span>
                <span class="info-value">${specialty || 'No especificada'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">📍 Ubicación:</span>
                <span class="info-value">Unidad Deportiva Cristo Rey, Copacabana, Antioquia</span>
              </div>
            </div>

            <div class="reason-box">
              <h3 style="color: #92400E; margin-top: 0;">📝 Motivo de Cancelación</h3>
              <p style="margin: 0; color: #92400E; font-size: 15px;">${cancelReason || 'No se especificó un motivo'}</p>
            </div>

            <p style="color: #666; text-align: center; margin-top: 30px;">
              Lamentamos cualquier inconveniente que esto pueda causar.
            </p>
            
            <p style="margin-top: 30px;">
              Saludos cordiales,<br>
              <strong>Equipo AstroStar</strong><br>
              <span style="color: #666; font-size: 14px;">Fundación Manuela Vanegas</span>
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 5px 0;">Este es un correo automático del sistema AstroStar. Por favor no respondas a este mensaje.</p>
            <p style="margin: 5px 0;">© ${new Date().getFullYear()} Fundación Manuela Vanegas - Todos los derechos reservados</p>
            <p style="margin: 5px 0;">Unidad Deportiva Cristo Rey, Copacabana, Antioquia</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      // Enviar a deportista
      await this.transporter.sendMail({
        from: `"Fundación Manuela Vanegas" <${process.env.EMAIL_USER}>`,
        to: athleteEmail,
        subject: `❌ Cita Cancelada - ${formattedDate}`,
        html: emailTemplate(athleteName),
      });

      // Enviar a especialista
      await this.transporter.sendMail({
        from: `"Fundación Manuela Vanegas" <${process.env.EMAIL_USER}>`,
        to: specialistEmail,
        subject: `❌ Cita Cancelada - ${formattedDate}`,
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
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recordatorio de Cita - AstroStar</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .info-box { background: white; border: 2px solid #3B82F6; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .info-row { padding: 12px 0; border-bottom: 1px solid #f0f0f0; display: flex; }
          .info-row:last-child { border-bottom: none; }
          .info-label { font-weight: bold; color: #666; min-width: 140px; }
          .info-value { color: #333; flex: 1; }
          .reminder-badge { background: #FEF3C7; color: #92400E; padding: 20px; border-radius: 8px; text-align: center; font-weight: bold; margin: 20px 0; border: 2px solid #FFC107; }
          .footer { text-align: center; padding: 20px; background: #f9f9f9; color: #666; font-size: 12px; border-top: 1px solid #ddd; }
          h1 { margin: 0; font-size: 28px; }
          h3 { color: #2563EB; margin-top: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Recordatorio de Cita</h1>
            <p style="margin: 0; font-size: 16px;">Fundación Manuela Vanegas</p>
          </div>
          
          <div class="content">
            <p style="font-weight: bold; font-size: 16px;">Hola ${recipientName},</p>
            
            <div class="reminder-badge">
              <p style="margin: 0; font-size: 18px;">⏰ Tu cita es mañana</p>
            </div>
            
            <p>Te recordamos tu cita programada:</p>
            
            <div class="info-box">
              <h3>📋 Detalles de la Cita</h3>
              <div class="info-row">
                <span class="info-label">🏃 Deportista:</span>
                <span class="info-value">${athleteName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">👨‍⚕️ Especialista:</span>
                <span class="info-value">${specialistName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">🏥 Especialidad:</span>
                <span class="info-value">${specialty}</span>
              </div>
              <div class="info-row">
                <span class="info-label">📅 Fecha:</span>
                <span class="info-value">${formattedDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">🕐 Horario:</span>
                <span class="info-value">${startTime} - ${endTime}</span>
              </div>
              ${description ? `
              <div class="info-row">
                <span class="info-label">📝 Descripción:</span>
                <span class="info-value">${description}</span>
              </div>
              ` : ''}
            </div>

            <div style="background: #E3F2FD; padding: 20px; border-radius: 8px; border-left: 4px solid #2196F3; margin: 20px 0;">
              <h3 style="color: #1565C0; margin-top: 0;">📌 Recomendaciones</h3>
              <ul style="margin: 10px 0; padding-left: 20px; color: #1565C0;">
                <li>Llega 10 minutos antes de tu cita</li>
                <li>Trae tu documento de identidad</li>
                <li>Usa ropa cómoda y deportiva</li>
                <li>Si no puedes asistir, cancela con anticipación</li>
              </ul>
            </div>

            <p style="color: #666; text-align: center;">
              Por favor, confirma tu asistencia o cancela con anticipación si no puedes asistir.
            </p>
            
            <p style="margin-top: 30px;">
              Saludos cordiales,<br>
              <strong>Equipo AstroStar</strong><br>
              <span style="color: #666; font-size: 14px;">Fundación Manuela Vanegas</span>
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 5px 0;">Este es un correo automático del sistema AstroStar. Por favor no respondas a este mensaje.</p>
            <p style="margin: 5px 0;">© ${new Date().getFullYear()} Fundación Manuela Vanegas - Todos los derechos reservados</p>
            <p style="margin: 5px 0;">Unidad Deportiva Cristo Rey, Copacabana, Antioquia</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      // Enviar a deportista
      await this.transporter.sendMail({
        from: `"Fundación Manuela Vanegas" <${process.env.EMAIL_USER}>`,
        to: athleteEmail,
        subject: `🔔 Recordatorio: Cita Mañana con ${specialistName}`,
        html: emailTemplate(athleteName),
      });

      // Enviar a especialista
      await this.transporter.sendMail({
        from: `"Fundación Manuela Vanegas" <${process.env.EMAIL_USER}>`,
        to: specialistEmail,
        subject: `🔔 Recordatorio: Cita Mañana con ${athleteName}`,
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



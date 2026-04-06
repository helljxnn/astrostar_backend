import { randomBytes } from "crypto";

import { BaseEmailService } from "../../../../services/email/BaseEmailService.js";

const SPECIALTY_LABELS = {
  psicologia: "Psicología",
  fisioterapia: "Fisioterapia",
  nutricion: "Nutrición",
  medicina: "Medicina Deportiva",
};

export class AppointmentEmailService extends BaseEmailService {
  normalizeSpecialty(value) {
    const text = this.getSafeText(value);
    if (!text) return "No especificada";

    const key = text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");

    return SPECIALTY_LABELS[key] || text;
  }

  buildAppointmentDisplayData(
    appointmentData = {},
    athleteName,
    specialistName,
    recipientName,
  ) {
    const athlete = this.getSafeText(athleteName, "Deportista");
    const specialist = this.getSafeText(specialistName, "Especialista");
    const recipient = this.getSafeText(recipientName, "Usuario");
    const description = this.getSafeText(appointmentData.description);

    return {
      athlete,
      athleteHtml: this.escapeHtml(athlete),
      specialist,
      specialistHtml: this.escapeHtml(specialist),
      recipient,
      recipientHtml: this.escapeHtml(recipient),
      specialty: this.normalizeSpecialty(appointmentData.specialty),
      specialtyHtml: this.escapeHtml(
        this.normalizeSpecialty(appointmentData.specialty),
      ),
      formattedDate:
        this.formatDate(appointmentData.appointmentDate) ||
        this.getSafeText(appointmentData.appointmentDate, "Fecha por confirmar"),
      startTime: this.getSafeText(appointmentData.startTime, "Por confirmar"),
      endTime: this.getSafeText(appointmentData.endTime, "Por confirmar"),
      description,
      descriptionHtml: this.escapeHtml(description),
    };
  }

  normalizeReminderRecipients(
    athleteEmail,
    athleteName,
    specialistEmailOrName,
    specialistNameArg,
  ) {
    if (specialistNameArg !== undefined) {
      return {
        athleteTo: this.getSafeText(athleteEmail),
        athleteDisplay: this.getSafeText(athleteName, "Deportista"),
        specialistTo: this.getSafeText(specialistEmailOrName),
        specialistDisplay: this.getSafeText(specialistNameArg, "Especialista"),
      };
    }

    return {
      athleteTo: this.getSafeText(athleteEmail),
      athleteDisplay: this.getSafeText(athleteName, "Deportista"),
      specialistTo: "",
      specialistDisplay: this.getSafeText(
        specialistEmailOrName,
        "Especialista",
      ),
    };
  }

  generateRescheduleToken() {
    return randomBytes(32).toString("hex");
  }

  async sendAppointmentCreated(
    appointmentData,
    athleteEmail,
    athleteName,
    specialistEmail,
    specialistName,
  ) {
    const athleteTo = this.getSafeText(athleteEmail);
    const specialistTo = this.getSafeText(specialistEmail);
    const appointment = this.buildAppointmentDisplayData(
      appointmentData,
      athleteName,
      specialistName,
      athleteName,
    );

    const emailTemplate = (recipientNameHtml) => `
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
              <p style="margin: 0; font-weight: bold; font-size: 16px;">Hola ${recipientNameHtml},</p>
              <p style="margin: 10px 0 0 0;">Se ha programado una nueva cita con los siguientes detalles:</p>
            </div>
            <div class="info-box">
              <h3>Detalles de la Cita</h3>
              <div class="info-row">
                <span class="info-label">Deportista:</span>
                <span class="info-value">${appointment.athleteHtml}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Especialista:</span>
                <span class="info-value">${appointment.specialistHtml}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Especialidad:</span>
                <span class="info-value">${appointment.specialtyHtml}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Fecha:</span>
                <span class="info-value">${this.escapeHtml(appointment.formattedDate)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Horario:</span>
                <span class="info-value">${this.escapeHtml(appointment.startTime)} - ${this.escapeHtml(appointment.endTime)}</span>
              </div>
              ${
                appointment.description
                  ? `
              <div class="info-row">
                <span class="info-label">Descripción:</span>
                <span class="info-value">${appointment.descriptionHtml}</span>
              </div>
              `
                  : ""
              }
            </div>
            <p style="color: #666; background: #FFF3CD; padding: 15px; border-radius: 8px; border-left: 4px solid #FFC107;">
              <strong>Recordatorio:</strong> Llega 10 minutos antes de tu cita.
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
      const results = [];

      if (athleteTo) {
        results.push(
          this.sendMailWithFallback({
            from: `"Fundación Manuela Vanegas" <${process.env.EMAIL_USER}>`,
            to: athleteTo,
            subject: `Cita Programada con ${appointment.specialist}`,
            html: emailTemplate(appointment.athleteHtml),
            encoding: "utf8",
          }),
        );
      }

      if (specialistTo) {
        results.push(
          this.sendMailWithFallback({
            from: `"Fundación Manuela Vanegas" <${process.env.EMAIL_USER}>`,
            to: specialistTo,
            subject: `Nueva Cita Asignada con ${appointment.athlete}`,
            html: emailTemplate(appointment.specialistHtml),
            encoding: "utf8",
          }),
        );
      }

      const settled = await Promise.all(results);
      const failed = settled.find((item) => !item.success);

      if (failed) {
        return { success: false, error: failed.error || "No se pudo enviar el correo" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error enviando emails de creacion:", error);
      throw error;
    }
  }

  async sendAppointmentCancelled(
    appointmentData,
    athleteEmail,
    athleteName,
    specialistEmail,
    specialistName,
    cancelReason,
  ) {
    const athleteTo = this.getSafeText(athleteEmail);
    const specialistTo = this.getSafeText(specialistEmail);
    const appointment = this.buildAppointmentDisplayData(
      appointmentData,
      athleteName,
      specialistName,
      athleteName,
    );
    const reason = this.getSafeHtmlText(cancelReason, "No se especificó un motivo");

    const emailTemplate = (recipientNameHtml) => `
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
            <h1>Cita Cancelada</h1>
            <p style="margin: 0; font-size: 16px;">Fundación Manuela Vanegas</p>
          </div>
          <div class="content">
            <div class="alert-box">
              <p style="margin: 0; font-weight: bold; font-size: 16px;">Hola ${recipientNameHtml},</p>
              <p style="margin: 10px 0 0 0;">Te informamos que la siguiente cita ha sido cancelada.</p>
            </div>
            <div class="info-box">
              <h3>Detalles de la Cita Cancelada</h3>
              <div class="info-row">
                <span class="info-label">Fecha:</span>
                <span class="info-value">${this.escapeHtml(appointment.formattedDate)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Horario:</span>
                <span class="info-value">${this.escapeHtml(appointment.startTime)} - ${this.escapeHtml(appointment.endTime)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Deportista:</span>
                <span class="info-value">${appointment.athleteHtml}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Especialista:</span>
                <span class="info-value">${appointment.specialistHtml}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Especialidad:</span>
                <span class="info-value">${appointment.specialtyHtml}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Ubicación:</span>
                <span class="info-value">Unidad Deportiva Cristo Rey, Copacabana, Antioquia</span>
              </div>
            </div>
            <div class="reason-box">
              <h3 style="color: #92400E; margin-top: 0;">Motivo de Cancelación</h3>
              <p style="margin: 0; color: #92400E; font-size: 15px;">${reason}</p>
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
      const results = [];

      if (athleteTo) {
        results.push(
          this.sendMailWithFallback({
            from: `"Fundación Manuela Vanegas" <${process.env.EMAIL_USER}>`,
            to: athleteTo,
            subject: `Cita Cancelada - ${appointment.formattedDate}`,
            html: emailTemplate(appointment.athleteHtml),
            encoding: "utf8",
          }),
        );
      }

      if (specialistTo) {
        results.push(
          this.sendMailWithFallback({
            from: `"Fundación Manuela Vanegas" <${process.env.EMAIL_USER}>`,
            to: specialistTo,
            subject: `Cita Cancelada - ${appointment.formattedDate}`,
            html: emailTemplate(appointment.specialistHtml),
            encoding: "utf8",
          }),
        );
      }

      const settled = await Promise.all(results);
      const failed = settled.find((item) => !item.success);

      if (failed) {
        return { success: false, error: failed.error || "No se pudo enviar el correo" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error enviando emails de cancelacion:", error);
      throw error;
    }
  }

  async sendAppointmentReminder(
    appointmentData,
    athleteEmail,
    athleteName,
    specialistEmailOrName,
    specialistNameArg,
  ) {
    const {
      athleteTo,
      athleteDisplay,
      specialistTo,
      specialistDisplay,
    } = this.normalizeReminderRecipients(
      athleteEmail,
      athleteName,
      specialistEmailOrName,
      specialistNameArg,
    );
    const appointment = this.buildAppointmentDisplayData(
      appointmentData,
      athleteDisplay,
      specialistDisplay,
      athleteDisplay,
    );

    const emailTemplate = (recipientNameHtml) => `
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
            <h1>Recordatorio de Cita</h1>
            <p style="margin: 0; font-size: 16px;">Fundación Manuela Vanegas</p>
          </div>
          <div class="content">
            <p style="font-weight: bold; font-size: 16px;">Hola ${recipientNameHtml},</p>
            <div class="reminder-badge">
              <p style="margin: 0; font-size: 18px;">Tu cita es mañana</p>
            </div>
            <p>Te recordamos tu cita programada:</p>
            <div class="info-box">
              <h3>Detalles de la Cita</h3>
              <div class="info-row">
                <span class="info-label">Deportista:</span>
                <span class="info-value">${appointment.athleteHtml}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Especialista:</span>
                <span class="info-value">${appointment.specialistHtml}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Especialidad:</span>
                <span class="info-value">${appointment.specialtyHtml}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Fecha:</span>
                <span class="info-value">${this.escapeHtml(appointment.formattedDate)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Horario:</span>
                <span class="info-value">${this.escapeHtml(appointment.startTime)} - ${this.escapeHtml(appointment.endTime)}</span>
              </div>
              ${
                appointment.description
                  ? `
              <div class="info-row">
                <span class="info-label">Descripción:</span>
                <span class="info-value">${appointment.descriptionHtml}</span>
              </div>
              `
                  : ""
              }
            </div>
            <div style="background: #E3F2FD; padding: 20px; border-radius: 8px; border-left: 4px solid #2196F3; margin: 20px 0;">
              <h3 style="color: #1565C0; margin-top: 0;">Recomendaciones</h3>
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
      const results = [];

      if (athleteTo) {
        results.push(
          this.sendMailWithFallback({
            from: `"Fundación Manuela Vanegas" <${process.env.EMAIL_USER}>`,
            to: athleteTo,
            subject: `Recordatorio: Cita mañana con ${appointment.specialist}`,
            html: emailTemplate(appointment.athleteHtml),
            encoding: "utf8",
          }),
        );
      }

      if (specialistTo) {
        results.push(
          this.sendMailWithFallback({
            from: `"Fundación Manuela Vanegas" <${process.env.EMAIL_USER}>`,
            to: specialistTo,
            subject: `Recordatorio: Cita mañana con ${appointment.athlete}`,
            html: emailTemplate(appointment.specialistHtml),
            encoding: "utf8",
          }),
        );
      }

      const settled = await Promise.all(results);
      const failed = settled.find((item) => !item.success);

      if (failed) {
        return { success: false, error: failed.error || "No se pudo enviar el correo" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error enviando recordatorios:", error);
      throw error;
    }
  }

  generateRescheduleProposalTemplate(
    athleteName,
    currentDate,
    currentTime,
    proposedDate,
    proposedStartTime,
    proposedEndTime,
    specialistName,
    reason,
    acceptUrl,
    declineUrl,
  ) {
    const athlete = this.getSafeHtmlText(athleteName, "Deportista");
    const specialist = this.getSafeHtmlText(specialistName, "Especialista");
    const currentDateText = this.getSafeHtmlText(
      currentDate,
      "Fecha por confirmar",
    );
    const currentTimeText = this.getSafeHtmlText(
      currentTime,
      "Horario por confirmar",
    );
    const proposedDateText = this.getSafeHtmlText(
      proposedDate,
      "Fecha por confirmar",
    );
    const proposedStartText = this.getSafeHtmlText(
      proposedStartTime,
      "Por confirmar",
    );
    const proposedEndText = this.getSafeHtmlText(proposedEndTime, "Por confirmar");
    const reasonText = this.getSafeHtmlText(reason);

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Propuesta de Reagendamiento</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .date-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .old-date { text-decoration: line-through; color: #999; }
        .new-date { color: #667eea; font-weight: bold; }
        .buttons { text-align: center; margin: 30px 0; }
        .button { display: inline-block; padding: 12px 30px; margin: 0 10px; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .accept { background-color: #10b981; color: white; }
        .decline { background-color: #ef4444; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📅 Propuesta de Reagendamiento</h1>
        </div>
        
        <div class="content">
            <h2>Hola ${athlete},</h2>
            
            <p>Necesitamos reagendar tu cita con ${specialist}.</p>
            
            ${reasonText ? `<p><strong>Motivo:</strong> ${reasonText}</p>` : ""}
            
            <div class="date-box">
                <h3>Cambio de Fecha</h3>
                <p class="old-date">
                    <strong>Fecha actual:</strong> ${currentDateText} a las ${currentTimeText}
                </p>
                <p class="new-date">
                    <strong>Nueva fecha propuesta:</strong> ${proposedDateText}<br>
                    <strong>Horario:</strong> ${proposedStartText} - ${proposedEndText}
                </p>
            </div>
            
            <p>Por favor, confirma si puedes asistir en la nueva fecha:</p>
            
            <div class="buttons">
                <a href="${acceptUrl}" class="button accept">Aceptar</a>
                <a href="${declineUrl}" class="button decline">Rechazar</a>
            </div>
            
            <p>Si rechazas, nos pondremos en contacto contigo para buscar otra fecha.</p>
            
            <p>Saludos,<br><strong>Equipo AstroStar</strong></p>
        </div>
    </div>
</body>
</html>`;
  }

  generateRescheduleConfirmationTemplate(
    athleteName,
    newDate,
    startTime,
    endTime,
    specialistName,
  ) {
    const athlete = this.getSafeHtmlText(athleteName, "Deportista");
    const specialist = this.getSafeHtmlText(specialistName, "Especialista");
    const dateText = this.getSafeHtmlText(newDate, "Fecha por confirmar");
    const startText = this.getSafeHtmlText(startTime, "Por confirmar");
    const endText = this.getSafeHtmlText(endTime, "Por confirmar");

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cita Reagendada</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .appointment-box { background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .detail-item { margin: 10px 0; padding: 10px; background: #f0fdf4; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Cita Reagendada</h1>
        </div>
        
        <div class="content">
            <h2>Hola ${athlete},</h2>
            
            <p>Tu cita ha sido reagendada exitosamente.</p>
            
            <div class="appointment-box">
                <h3>📅 Nueva Fecha de la Cita</h3>
                <div class="detail-item">
                    <strong>📅 Fecha:</strong> ${dateText}
                </div>
                <div class="detail-item">
                    <strong>🕐 Horario:</strong> ${startText} - ${endText}
                </div>
                <div class="detail-item">
                    <strong>👨‍⚕️ Especialista:</strong> ${specialist}
                </div>
            </div>
            
            <p>¡Te esperamos en la nueva fecha!</p>
            
            <p>Saludos,<br><strong>Equipo AstroStar</strong></p>
        </div>
    </div>
</body>
</html>`;
  }

  async sendRescheduleProposal(
    appointmentData,
    athleteEmail,
    athleteName,
    specialistName,
    rescheduleToken,
  ) {
    try {
      const currentDate =
        this.formatDate(appointmentData.date || appointmentData.appointmentDate) ||
        this.getSafeText(
          appointmentData.date || appointmentData.appointmentDate,
          "Fecha por confirmar",
        );
      const proposedDate =
        this.formatDate(appointmentData.proposedDate) ||
        this.getSafeText(appointmentData.proposedDate, "Fecha por confirmar");

      const athleteTo = this.getSafeText(athleteEmail);
      const specialist = this.getSafeText(specialistName, "Especialista");
      const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const acceptUrl = `${baseUrl}/appointments/reschedule/${rescheduleToken}/accept`;
      const declineUrl = `${baseUrl}/appointments/reschedule/${rescheduleToken}/decline`;

      return await this.sendMailWithFallback({
        from: this.getDefaultFrom(),
        to: athleteTo,
        subject: `Propuesta de Reagendamiento - Cita con ${specialist}`,
        html: this.generateRescheduleProposalTemplate(
          athleteName,
          currentDate,
          appointmentData.startTime,
          proposedDate,
          appointmentData.proposedStartTime,
          appointmentData.proposedEndTime,
          specialist,
          appointmentData.rescheduleReason,
          acceptUrl,
          declineUrl,
        ),
      });
    } catch (error) {
      console.error("Error enviando propuesta de reagendamiento:", error);
      return { success: false, error: error.message };
    }
  }

  async sendRescheduleConfirmation(
    appointmentData,
    athleteEmail,
    athleteName,
    specialistName,
  ) {
    try {
      const athleteTo = this.getSafeText(athleteEmail);
      const newDate =
        this.formatDate(appointmentData.date || appointmentData.appointmentDate) ||
        this.getSafeText(
          appointmentData.date || appointmentData.appointmentDate,
          "Fecha por confirmar",
        );
      const specialist = this.getSafeText(specialistName, "Especialista");

      return await this.sendMailWithFallback({
        from: this.getDefaultFrom(),
        to: athleteTo,
        subject: `Cita Reagendada - ${newDate}`,
        html: this.generateRescheduleConfirmationTemplate(
          athleteName,
          newDate,
          appointmentData.startTime,
          appointmentData.endTime,
          specialist,
        ),
      });
    } catch (error) {
      console.error("Error enviando confirmacion de reagendamiento:", error);
      return { success: false, error: error.message };
    }
  }
}

export default new AppointmentEmailService();

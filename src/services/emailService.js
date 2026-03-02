﻿/**
 * Servicio de Email Principal - AstroStar
 * Punto de entrada unificado que delega a servicios especializados
 * Mantiene compatibilidad con código existente
 */

import { BaseEmailService } from "./email/BaseEmailService.js";
import eventEmailService from "../modules/Events/services/EventEmailService.js";
import employeeEmailService from "../modules/Services/Employees/services/EmployeeEmailService.js";
import athleteEmailService from "../modules/Athletes/services/AthleteEmailService.js";
import preRegistrationEmailService from "../modules/PreRegistrations/services/PreRegistrationEmailService.js";
import appointmentEmailService from "../modules/Services/AppointmentManagement/services/AppointmentEmailService.js";
import authEmailService from "../modules/Auth/services/AuthEmailService.js";

class EmailService extends BaseEmailService {
  // ============================================
  // MÉTODOS DE EVENTOS (Delegados)
  // ============================================

  async sendRSVPInvitation(invitation, event, participant, icsContent) {
    return eventEmailService.sendRSVPInvitation(
      invitation,
      event,
      participant,
      icsContent,
    );
  }

  async sendRSVPReminder(invitation, event, participant) {
    return eventEmailService.sendRSVPReminder(invitation, event, participant);
  }

  async sendConfirmedEventReminder(invitation, event, participant) {
    return eventEmailService.sendConfirmedEventReminder(
      invitation,
      event,
      participant,
    );
  }

  // ============================================
  // MÉTODOS DE EMPLEADOS (Delegados)
  // ============================================

  async sendWelcomeEmail(employeeData, credentials) {
    return employeeEmailService.sendWelcomeEmail(employeeData, credentials);
  }

  async sendScheduleNotification(data) {
    return employeeEmailService.sendScheduleNotification(data);
  }

  // ============================================
  // MÉTODOS DE DEPORTISTAS (Delegados)
  // ============================================

  async sendAthleteWelcomeEmail(athleteData, credentials) {
    return athleteEmailService.sendAthleteWelcomeEmail(
      athleteData,
      credentials,
    );
  }

  async sendAppointmentNotification(data) {
    return athleteEmailService.sendAppointmentNotification(data);
  }

  async sendAppointmentCalendarEmail(data) {
    return athleteEmailService.sendAppointmentCalendarEmail(data);
  }

  // ============================================
  // MÉTODOS DE PRE-INSCRIPCIONES (Delegados)
  // ============================================

  async sendPreRegistrationEmail(preRegistrationData) {
    return preRegistrationEmailService.sendPreRegistrationEmail(
      preRegistrationData,
    );
  }

  // ============================================
  // MÉTODOS DE CITAS (Delegados)
  // ============================================

  async sendAppointmentReminder(
    appointment,
    athleteEmail,
    athleteName,
    specialistName,
  ) {
    return appointmentEmailService.sendAppointmentReminder(
      appointment,
      athleteEmail,
      athleteName,
      specialistName,
    );
  }

  async sendRescheduleProposal(
    appointment,
    athleteEmail,
    athleteName,
    specialistName,
    rescheduleToken,
  ) {
    return appointmentEmailService.sendRescheduleProposal(
      appointment,
      athleteEmail,
      athleteName,
      specialistName,
      rescheduleToken,
    );
  }

  async sendRescheduleConfirmation(
    appointment,
    athleteEmail,
    athleteName,
    specialistName,
  ) {
    return appointmentEmailService.sendRescheduleConfirmation(
      appointment,
      athleteEmail,
      athleteName,
      specialistName,
    );
  }

  // ============================================
  // MÉTODOS DE AUTENTICACIÓN (Delegados)
  // ============================================

  async sendPasswordResetEmail(email, resetToken) {
    return authEmailService.sendPasswordResetEmail(email, resetToken);
  }

  async sendEmailVerificationCode(email, verificationToken, firstName) {
    return authEmailService.sendEmailVerificationCode(
      email,
      verificationToken,
      firstName,
    );
  }
}

export default new EmailService();

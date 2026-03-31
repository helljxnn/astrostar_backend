import prisma from "../../../config/database.js";

export class RSVPRepository {
  /**
   * Crear una invitación RSVP
   */
  async createInvitation(data) {
    return await prisma.eventInvitation.create({
      data,
      include: {
        participant: {
          include: {
            service: true,
            athlete: { include: { user: true } },
            team: true,
          },
        },
      },
    });
  }

  /**
   * Buscar invitación por token
   */
  async findByToken(token) {
    return await prisma.eventInvitation.findUnique({
      where: { token },
      include: {
        participant: {
          include: {
            service: true,
            athlete: { include: { user: true } },
            team: true,
          },
        },
      },
    });
  }

  /**
   * Buscar invitacion por id
   */
  async findById(id) {
    return await prisma.eventInvitation.findUnique({
      where: { id },
      include: {
        participant: {
          include: {
            service: true,
            athlete: { include: { user: true } },
            team: true,
          },
        },
      },
    });
  }

  /**
   * Actualizar estado de invitación
   */
  async updateStatus(id, status) {
    return await prisma.eventInvitation.update({
      where: { id },
      data: {
        status,
        respondedAt: new Date(),
      },
      include: {
        participant: {
          include: {
            service: true,
          },
        },
      },
    });
  }

  /**
   * Buscar invitaciones pendientes de recordatorio
   */
  async findPendingReminders(startTime, endTime) {
    return await prisma.eventInvitation.findMany({
      where: {
        reminderSentAt: null,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
        expiresAt: {
          gte: startTime,
          lte: endTime,
        },
      },
      include: {
        participant: {
          include: {
            service: true,
            athlete: { include: { user: true } },
            team: true,
          },
        },
      },
    });
  }

  /**
   * Marcar recordatorio como enviado
   */
  async markReminderSent(id) {
    return await prisma.eventInvitation.update({
      where: { id },
      data: { reminderSentAt: new Date() },
    });
  }

  /**
   * Buscar invitación por participantId
   */
  async findByParticipantId(participantId) {
    return await prisma.eventInvitation.findFirst({
      where: { participantId },
      include: {
        participant: {
          include: {
            service: true,
            athlete: { include: { user: true } },
            team: true,
          },
        },
      },
    });
  }
}


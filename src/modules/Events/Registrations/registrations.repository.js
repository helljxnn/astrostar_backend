import prisma from '../../../config/database.js';

export class RegistrationsRepository {
  /**
   * Inscribir equipo a un evento
   */
  async registerTeamToEvent(data) {
    return await prisma.participant.create({
      data: {
        type: 'Team',
        serviceId: data.serviceId,
        teamId: data.teamId,
        sportsCategoryId: data.sportsCategoryId || null,
        notes: data.notes || null,
        status: 'Registered',
      },
      include: {
        team: {
          include: {
            members: {
              include: {
                athlete: {
                  include: {
                    user: true,
                  },
                },
                temporaryPerson: true,
                employee: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
        service: {
          include: {
            category: true,
            type: true,
          },
        },
        sportsCategory: true,
      },
    });
  }

  /**
   * Verificar si un equipo ya está inscrito en un evento
   */
  async checkTeamRegistration(serviceId, teamId) {
    return await prisma.participant.findFirst({
      where: {
        serviceId: parseInt(serviceId),
        teamId: parseInt(teamId),
        type: 'Team',
      },
    });
  }

  /**
   * Obtener inscripciones de un evento
   */
  async getEventRegistrations(serviceId, filters = {}) {
    const where = {
      serviceId: parseInt(serviceId),
      type: 'Team',
    };

    if (filters.status) {
      where.status = filters.status;
    }

    return await prisma.participant.findMany({
      where,
      include: {
        team: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
        sportsCategory: true,
      },
      orderBy: {
        registrationDate: 'desc',
      },
    });
  }

  /**
   * Obtener inscripciones de un equipo
   */
  async getTeamRegistrations(teamId, filters = {}) {
    const where = {
      teamId: parseInt(teamId),
      type: 'Team',
    };

    if (filters.status) {
      where.status = filters.status;
    }

    return await prisma.participant.findMany({
      where,
      include: {
        service: {
          include: {
            category: true,
            type: true,
          },
        },
        sportsCategory: true,
      },
      orderBy: {
        registrationDate: 'desc',
      },
    });
  }

  /**
   * Obtener inscripción por ID
   */
  async getRegistrationById(id) {
    return await prisma.participant.findUnique({
      where: { id: parseInt(id) },
      include: {
        team: {
          include: {
            members: {
              include: {
                athlete: {
                  include: {
                    user: true,
                  },
                },
                temporaryPerson: true,
                employee: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
        service: {
          include: {
            category: true,
            type: true,
          },
        },
        sportsCategory: true,
      },
    });
  }

  /**
   * Actualizar estado de inscripción
   */
  async updateRegistrationStatus(id, status, notes = null) {
    return await prisma.participant.update({
      where: { id: parseInt(id) },
      data: {
        status,
        notes,
        updatedAt: new Date(),
      },
      include: {
        team: true,
        service: true,
      },
    });
  }

  /**
   * Cancelar inscripción
   */
  async cancelRegistration(id) {
    return await prisma.participant.delete({
      where: { id: parseInt(id) },
    });
  }

  /**
   * Verificar si el evento existe
   */
  async checkEventExists(serviceId) {
    return await prisma.service.findUnique({
      where: { id: parseInt(serviceId) },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
      },
    });
  }

  /**
   * Verificar si el equipo existe
   */
  async checkTeamExists(teamId) {
    return await prisma.team.findUnique({
      where: { id: parseInt(teamId) },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });
  }

  /**
   * Obtener estadísticas de inscripciones
   */
  async getRegistrationStats() {
    const [total, byStatus, byEvent] = await Promise.all([
      prisma.participant.count({
        where: { type: 'Team' },
      }),
      prisma.participant.groupBy({
        by: ['status'],
        where: { type: 'Team' },
        _count: true,
      }),
      prisma.participant.groupBy({
        by: ['serviceId'],
        where: { type: 'Team' },
        _count: true,
        orderBy: {
          _count: {
            serviceId: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    return { total, byStatus, byEvent };
  }
}

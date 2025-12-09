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
   * Crear inscripción simple (para inscripciones múltiples)
   */
  async createRegistration(data) {
    return await prisma.participant.create({
      data: {
        type: 'Team',
        serviceId: parseInt(data.serviceId),
        teamId: parseInt(data.teamId),
        sportsCategoryId: data.sportsCategoryId ? parseInt(data.sportsCategoryId) : null,
        notes: data.notes || null,
        status: data.status || 'Registered',
      },
      include: {
        team: true,
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

    const registrations = await prisma.participant.findMany({
      where,
      include: {
        team: {
          select: {
            id: true,
            name: true,
            coach: true,
            category: true,
            phone: true, // Contiene el marcador TIPO:Fundacion o TIPO:Temporal
            status: true,
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

    // Transformar para incluir campos compatibles con el frontend
    return registrations.map(reg => {
      // Determinar teamType desde el campo phone
      let teamType = 'Temporal';
      if (reg.team?.phone && reg.team.phone.startsWith('TIPO:')) {
        teamType = reg.team.phone.replace('TIPO:', '');
      }

      return {
        ...reg,
        team: reg.team ? {
          ...reg.team,
          name: reg.team.name,
          coach: reg.team.coach,
          category: reg.team.category,
          teamType: teamType, // Agregar teamType transformado
          _count: reg.team._count,
        } : null,
      };
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
            ServiceType: true,
            ServiceCategory: {
              include: {
                SportsCategory: true,
              },
            },
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
        phone: true, // Contiene el marcador TIPO:Fundacion o TIPO:Temporal
      },
    });
  }

  /**
   * Obtener equipos disponibles para inscripción (separados por tipo)
   */
  async getAvailableTeams(filters = {}) {
    const where = {
      status: 'Active',
    };

    if (filters.teamType) {
      where.teamType = filters.teamType;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    return await prisma.team.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        coach: true,
        category: true,
        teamType: true,
        _count: {
          select: { members: true },
        },
      },
      orderBy: [
        { teamType: 'asc' }, // Fundacion primero, luego Temporal
        { name: 'asc' },
      ],
    });
  }

  /**
   * Obtener equipos de la fundación
   */
  async getFoundationTeams(filters = {}) {
    return await this.getAvailableTeams({ ...filters, teamType: 'Fundacion' });
  }

  /**
   * Obtener equipos temporales
   */
  async getTemporaryTeams(filters = {}) {
    return await this.getAvailableTeams({ ...filters, teamType: 'Temporal' });
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

  // ============================================
  // MÉTODOS PARA INSCRIPCIÓN DE DEPORTISTAS
  // ============================================

  /**
   * Inscribir deportista individual a un evento
   */
  async registerAthleteToEvent(data) {
    return await prisma.participant.create({
      data: {
        type: 'Individual',
        serviceId: data.serviceId,
        athleteId: data.athleteId,
        sportsCategoryId: data.sportsCategoryId || null,
        notes: data.notes || null,
        status: 'Registered',
      },
      include: {
        athlete: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                middleName: true,
                lastName: true,
                secondLastName: true,
                email: true,
                phoneNumber: true,
                birthDate: true,
                age: true,
                identification: true,
              },
            },
          },
        },
        service: {
          include: {
            ServiceType: true,
          },
        },
        sportsCategory: true,
      },
    });
  }

  /**
   * Verificar si un deportista ya está inscrito en un evento
   */
  async checkAthleteRegistration(serviceId, athleteId) {
    return await prisma.participant.findFirst({
      where: {
        serviceId: parseInt(serviceId),
        athleteId: parseInt(athleteId),
        type: 'Individual',
      },
    });
  }

  /**
   * Obtener inscripciones individuales de un evento
   */
  async getEventAthleteRegistrations(serviceId, filters = {}) {
    const where = {
      serviceId: parseInt(serviceId),
      type: 'Individual',
    };

    if (filters.status) {
      where.status = filters.status;
    }

    return await prisma.participant.findMany({
      where,
      include: {
        athlete: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                middleName: true,
                lastName: true,
                secondLastName: true,
                email: true,
                phoneNumber: true,
                birthDate: true,
                age: true,
                identification: true,
              },
            },
            inscriptions: {
              where: {
                status: 'Active',
              },
              include: {
                sportsCategory: true,
              },
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
   * Obtener inscripciones de un deportista
   */
  async getAthleteRegistrations(athleteId, filters = {}) {
    const where = {
      athleteId: parseInt(athleteId),
      type: 'Individual',
    };

    if (filters.status) {
      where.status = filters.status;
    }

    return await prisma.participant.findMany({
      where,
      include: {
        service: {
          include: {
            ServiceType: true,
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
   * Verificar si el deportista existe
   */
  async checkAthleteExists(athleteId) {
    return await prisma.athlete.findUnique({
      where: { id: parseInt(athleteId) },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            secondLastName: true,
            email: true,
            phoneNumber: true,
            birthDate: true,
            age: true,
            identification: true,
          },
        },
      },
    });
  }

  /**
   * Obtener deportistas disponibles para inscripción
   */
  async getAvailableAthletes(filters = {}) {
    const where = {
      status: 'Active',
    };

    if (filters.sportsCategoryId) {
      where.inscriptions = {
        some: {
          sportsCategoryId: parseInt(filters.sportsCategoryId),
          status: 'Active',
        },
      };
    }

    return await prisma.athlete.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            secondLastName: true,
            email: true,
            phoneNumber: true,
            birthDate: true,
            age: true,
            identification: true,
          },
        },
        inscriptions: {
          where: {
            status: 'Active',
          },
          include: {
            sportsCategory: true,
          },
        },
      },
      orderBy: {
        user: {
          firstName: 'asc',
        },
      },
    });
  }

  /**
   * Inscribir múltiples deportistas a un evento
   */
  async createAthleteRegistration(data) {
    return await prisma.participant.create({
      data: {
        type: 'Individual',
        serviceId: parseInt(data.serviceId),
        athleteId: parseInt(data.athleteId),
        sportsCategoryId: data.sportsCategoryId ? parseInt(data.sportsCategoryId) : null,
        notes: data.notes || null,
        status: data.status || 'Registered',
      },
      include: {
        athlete: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  /**
   * Cancelar inscripción (eliminar)
   */
  async cancelRegistration(id) {
    return await prisma.participant.delete({
      where: {
        id: parseInt(id),
      },
    });
  }
}

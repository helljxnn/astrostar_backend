
import { PrismaClient } from '../../../../../generated/prisma/index.js';

const prisma = new PrismaClient();

export class AppointmentRepository {
  /**
   * Obtener todas las citas con filtros y paginación
   */
  async findAll({
    page = 1,
    limit = 10,
    search = '',
    status = '',
    athleteId = null,
    specialistId = null,
    specialty = '',
    startDate = '',
    endDate = ''
  }) {
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(specialty && { specialty }),
      ...(athleteId && { athleteId: parseInt(athleteId) }),
      ...(specialistId && { specialistId: parseInt(specialistId) })
    };

    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.gte = new Date(`${startDate}T00:00:00`);
      if (endDate) dateFilter.lte = new Date(`${endDate}T23:59:59`);
      where.appointmentDate = dateFilter;
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { description: { contains: term, mode: 'insensitive' } },
        { specialty: { contains: term, mode: 'insensitive' } },
        {
          athlete: {
            user: {
              OR: [
                { firstName: { contains: term, mode: 'insensitive' } },
                { lastName: { contains: term, mode: 'insensitive' } },
                { identification: { contains: term, mode: 'insensitive' } },
                { email: { contains: term, mode: 'insensitive' } }
              ]
            }
          }
        },
        {
          specialist: {
            user: {
              OR: [
                { firstName: { contains: term, mode: 'insensitive' } },
                { lastName: { contains: term, mode: 'insensitive' } },
                { identification: { contains: term, mode: 'insensitive' } },
                { email: { contains: term, mode: 'insensitive' } }
              ]
            }
          }
        }
      ];
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
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
                  identification: true,
                  phoneNumber: true
                }
              }
            }
          },
          specialist: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  secondLastName: true,
                  email: true,
                  identification: true,
                  phoneNumber: true,
                  role: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: [
          { appointmentDate: 'desc' },
          { startTime: 'asc' }
        ]
      }),
      prisma.appointment.count({ where })
    ]);

    return {
      appointments,
      total,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Buscar cita por ID
   */
  async findById(id) {
    return await prisma.appointment.findUnique({
      where: { id: parseInt(id) },
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
                identification: true,
                phoneNumber: true
              }
            }
          }
        },
        specialist: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                middleName: true,
                lastName: true,
                secondLastName: true,
                email: true,
                identification: true,
                phoneNumber: true,
                role: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  /**
   * Crear cita
   */
  async create(appointmentData) {
    return await prisma.appointment.create({
      data: appointmentData,
      include: {
        athlete: {
          include: {
            user: true
          }
        },
        specialist: {
          include: {
            user: {
              include: {
                role: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Actualizar cita
   */
  async update(id, appointmentData) {
    return await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: appointmentData,
      include: {
        athlete: {
          include: {
            user: true
          }
        },
        specialist: {
          include: {
            user: {
              include: {
                role: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Eliminar cita (hard delete)
   */
  async delete(id) {
    try {
      await prisma.appointment.delete({
        where: { id: parseInt(id) }
      });
      return true;
    } catch (error) {
      if (error.code === 'P2025') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Buscar deportista activo por ID
   */
  async findAthleteById(id) {
    return await prisma.athlete.findFirst({
      where: {
        id: parseInt(id),
        status: 'Active',
        user: { status: 'Active' }
      },
      include: {
        user: {
          include: {
            role: true
          }
        }
      }
    });
  }

  /**
   * Buscar especialista activo por ID
   */
  async findSpecialistById(id) {
    return await prisma.employee.findFirst({
      where: {
        id: parseInt(id),
        status: 'Activo',
        user: { status: 'Active' }
      },
      include: {
        user: {
          include: {
            role: true
          }
        }
      }
    });
  }

  /**
   * Buscar cita por token de reagendamiento
   */
  async findByRescheduleToken(token) {
    return await prisma.appointment.findUnique({
      where: { rescheduleToken: token },
      include: {
        athlete: {
          include: {
            user: true
          }
        },
        specialist: {
          include: {
            user: true
          }
        }
      }
    });
  }


  /**
   * Obtener deportistas activos
   */
  async getActiveAthletes() {
    return await prisma.athlete.findMany({
      where: {
        status: 'Active',
        user: { status: 'Active' }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            secondLastName: true,
            email: true,
            identification: true
          }
        }
      },
      orderBy: {
        user: {
          firstName: 'asc'
        }
      }
    });
  }

  /**
   * Obtener especialistas activos
   */
  async getActiveSpecialists() {
    return await prisma.employee.findMany({
      where: {
        status: 'Activo',
        user: { status: 'Active' }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            secondLastName: true,
            email: true,
            identification: true,
            role: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        user: {
          firstName: 'asc'
        }
      }
    });
  }

  /**
   * Obtener horarios activos de un especialista
   */
  async getSchedulesBySpecialistId(specialistId) {
    return await prisma.employeeSchedule.findMany({
      where: {
        employeeId: parseInt(specialistId),
        status: { not: 'Cancelado' }
      },
      select: {
        id: true,
        employeeId: true,
        scheduleDate: true,
        startTime: true,
        endTime: true,
        recurrence: true,
        customRecurrence: true,
        status: true,
        novelties: {
          select: {
            date: true,
            type: true,
            startTime: true,
            endTime: true,
            reason: true
          }
        }
      }
    });
  }

  /**
   * Verificar conflictos de citas (por especialista y/o deportista)
   */
  async checkAppointmentConflicts({
    appointmentDate,
    startTime,
    endTime,
    athleteId,
    specialistId,
    excludeAppointmentId = null
  }) {
    const baseWhere = {
      appointmentDate: new Date(appointmentDate),
      status: { not: 'Cancelado' },
      OR: [
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } }
          ]
        },
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gte: endTime } }
          ]
        },
        {
          AND: [
            { startTime: { gte: startTime } },
            { endTime: { lte: endTime } }
          ]
        }
      ],
      ...(excludeAppointmentId && { id: { not: parseInt(excludeAppointmentId) } })
    };

    const [athleteConflict, specialistConflict] = await Promise.all([
      athleteId
        ? prisma.appointment.findFirst({
            where: {
              ...baseWhere,
              athleteId: parseInt(athleteId)
            }
          })
        : null,
      specialistId
        ? prisma.appointment.findFirst({
            where: {
              ...baseWhere,
              specialistId: parseInt(specialistId)
            }
          })
        : null
    ]);

    return {
      athleteConflict,
      specialistConflict
    };
  }
}

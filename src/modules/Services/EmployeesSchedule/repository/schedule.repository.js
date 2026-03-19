// 📁 Services/Employees/EmployeesSchedule/repository/schedule.repository.js
import prisma from "../../../../../config/database.js";

export class ScheduleRepository {
  async findEmployeeByUserId(userId) {
    if (!userId) return null;
    return prisma.employee.findUnique({
      where: { userId: parseInt(userId) },
      select: {
        id: true,
        status: true,
      },
    });
  }

  /**
   * Obtener todos los horarios con filtros y paginación
   */
  async findAll({ page, limit, employeeId, dayOfWeek }) {
    const skip = (page - 1) * limit;
    const where = {
      ...(employeeId && { employeeId: parseInt(employeeId) }),
      ...(dayOfWeek && { dayOfWeek }),
    };

    const [schedules, total] = await Promise.all([
      prisma.employeeSchedule.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: {
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
                  role: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          novelties: {
            orderBy: {
              date: "desc",
            },
          },
        },
        orderBy: [{ scheduleDate: "desc" }, { startTime: "asc" }],
      }),
      prisma.employeeSchedule.count({ where }),
    ]);

    return {
      schedules,
      total,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Buscar horario por ID
   */
  async findById(id) {
    return await prisma.employeeSchedule.findUnique({
      where: { id: parseInt(id) },
      include: {
        employee: {
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
                role: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        novelties: {
          orderBy: {
            date: "desc",
          },
        },
      },
    });
  }

  /**
   * Buscar horarios por empleado
   */
  async findByEmployeeId(employeeId) {
    return await prisma.employeeSchedule.findMany({
      where: { employeeId: parseInt(employeeId) },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        novelties: {
          orderBy: {
            date: "desc",
          },
        },
      },
      orderBy: [{ scheduleDate: "desc" }, { startTime: "asc" }],
    });
  }

  /**
   * Verificar conflicto de horarios
   */
  async checkScheduleConflict(
    employeeId,
    scheduleDate,
    startTime,
    endTime,
    excludeScheduleId = null,
  ) {
    const where = {
      employeeId: parseInt(employeeId),
      scheduleDate: new Date(scheduleDate),
      OR: [
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } },
          ],
        },
        {
          AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }],
        },
        {
          AND: [
            { startTime: { gte: startTime } },
            { endTime: { lte: endTime } },
          ],
        },
      ],
      ...(excludeScheduleId && { id: { not: parseInt(excludeScheduleId) } }),
    };

    return await prisma.employeeSchedule.findFirst({ where });
  }

  /**
   * Crear horario
   */
  async create(scheduleData) {
    return await prisma.employeeSchedule.create({
      data: scheduleData,
      include: {
        employee: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  /**
   * Actualizar horario
   */
  async update(id, scheduleData) {
    return await prisma.employeeSchedule.update({
      where: { id: parseInt(id) },
      data: scheduleData,
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        novelties: {
          orderBy: {
            date: "desc",
          },
        },
      },
    });
  }

  /**
   * Registrar novedad
   */
  async createNovelty(noveltyData) {
    return await prisma.employeeScheduleNovelty.create({
      data: noveltyData,
    });
  }

  /**
   * Eliminar horario (hard delete)
   */
  async delete(id) {
    try {
      await prisma.employeeSchedule.delete({
        where: { id: parseInt(id) },
      });
      return true;
    } catch (error) {
      if (error.code === "P2025") {
        return false;
      }
      throw error;
    }
  }

  /**
   * Obtener empleados activos para el dropdown
   */
  async getActiveEmployees() {
    return await prisma.employee.findMany({
      where: {
        status: "Activo",
        user: { status: "Active" },
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
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        user: {
          firstName: "asc",
        },
      },
    });
  }
}

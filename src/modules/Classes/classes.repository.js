import { PrismaClient } from "../../../generated/prisma/index.js";

const prisma = new PrismaClient();

export class ClassesRepository {
  /**
   * Obtener todas las clases con paginación y filtros
   */
  async findAll({
    page = 1,
    limit = 10,
    search = "",
    status = "",
    employeeId = "",
    startDate = "",
    endDate = "",
  }) {
    try {
      const skip = (page - 1) * limit;

      // Construir filtros
      const where = {};

      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      if (status) {
        where.status = status;
      }

      if (employeeId) {
        where.employeeId = parseInt(employeeId);
      }

      // Filtro por rango de fechas
      if (startDate && endDate) {
        where.classDate = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      } else if (startDate) {
        where.classDate = {
          gte: new Date(startDate),
        };
      } else if (endDate) {
        where.classDate = {
          lte: new Date(endDate),
        };
      }

      // Obtener datos con paginación
      const [classes, total] = await Promise.all([
        prisma.class.findMany({
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
                    lastName: true,
                    email: true,
                    phoneNumber: true,
                  },
                },
              },
            },
            athletes: {
              include: {
                athlete: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phoneNumber: true,
                      },
                    },
                  },
                },
              },
            },
            _count: {
              select: {
                athletes: true,
              },
            },
          },
          orderBy: [{ classDate: "desc" }, { startTime: "desc" }],
        }),
        prisma.class.count({ where }),
      ]);

      return {
        classes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener clase por ID
   */
  async findById(id) {
    return await prisma.class.findUnique({
      where: { id: parseInt(id) },
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
        athletes: {
          include: {
            athlete: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phoneNumber: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Crear nueva clase
   */
  async create(data) {
    try {
      const { athleteIds, ...classData } = data;

      const createData = {
        ...classData,
        classDate: new Date(classData.classDate),
      };

      // Si hay deportistas, agregarlas
      if (athleteIds && athleteIds.length > 0) {
        createData.athletes = {
          create: athleteIds.map((athleteId) => ({
            athleteId: parseInt(athleteId),
            attendanceStatus: "Pendiente",
          })),
        };
      }

      return await prisma.class.create({
        data: createData,
        include: {
          employee: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          athletes: {
            include: {
              athlete: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } catch (error) {
      if (error.code === "P2003") {
        if (error.meta?.field_name?.includes("employeeId")) {
          throw new Error("El profesor seleccionado no existe");
        }
        throw new Error(
          "Error de relación: uno de los IDs proporcionados no existe"
        );
      }
      throw error;
    }
  }

  /**
   * Actualizar clase
   */
  async update(id, data) {
    try {
      const classId = parseInt(id);
      const { athleteIds, ...classData } = data;

      // Preparar datos para actualizar
      const updateData = { ...classData };
      if (classData.classDate) {
        updateData.classDate = new Date(classData.classDate);
      }

      // Actualizar datos básicos de la clase
      const updatedClass = await prisma.class.update({
        where: { id: classId },
        data: updateData,
      });

      // Actualizar deportistas si se proporcionaron
      if (athleteIds !== undefined) {
        // Eliminar las deportistas existentes
        await prisma.classAthlete.deleteMany({
          where: { classId },
        });

        // Crear las nuevas asignaciones
        if (athleteIds.length > 0) {
          await prisma.classAthlete.createMany({
            data: athleteIds.map((athleteId) => ({
              classId,
              athleteId: parseInt(athleteId),
              attendanceStatus: "Pendiente",
            })),
          });
        }
      }

      // Retornar la clase actualizada con todas las relaciones
      return await this.findById(classId);
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error("La clase no fue encontrada");
      }
      if (error.code === "P2003") {
        throw new Error(
          "Error de relación: uno de los IDs proporcionados no existe"
        );
      }
      throw error;
    }
  }

  /**
   * Eliminar clase
   */
  async delete(id) {
    try {
      return await prisma.class.delete({
        where: { id: parseInt(id) },
      });
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error("La clase no existe o ya fue eliminada");
      }
      throw error;
    }
  }

  /**
   * Asignar deportista a una clase
   */
  async assignAthlete(classId, athleteId) {
    try {
      return await prisma.classAthlete.create({
        data: {
          classId: parseInt(classId),
          athleteId: parseInt(athleteId),
          attendanceStatus: "Pendiente",
        },
        include: {
          athlete: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      if (error.code === "P2002") {
        throw new Error("La deportista ya está asignada a esta clase");
      }
      if (error.code === "P2003") {
        throw new Error("La clase o deportista no existe");
      }
      throw error;
    }
  }

  /**
   * Remover deportista de una clase
   */
  async removeAthlete(classId, athleteId) {
    try {
      return await prisma.classAthlete.delete({
        where: {
          classId_athleteId: {
            classId: parseInt(classId),
            athleteId: parseInt(athleteId),
          },
        },
      });
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error("La asignación no existe");
      }
      throw error;
    }
  }

  /**
   * Confirmar asistencia de deportista
   */
  async confirmAttendance(classId, athleteId, notes = null) {
    try {
      return await prisma.classAthlete.update({
        where: {
          classId_athleteId: {
            classId: parseInt(classId),
            athleteId: parseInt(athleteId),
          },
        },
        data: {
          attendanceStatus: "Confirmada",
          confirmedAt: new Date(),
          notes,
        },
        include: {
          athlete: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error("La asignación no existe");
      }
      throw error;
    }
  }

  /**
   * Actualizar estado de asistencia
   */
  async updateAttendanceStatus(classId, athleteId, status, notes = null) {
    try {
      return await prisma.classAthlete.update({
        where: {
          classId_athleteId: {
            classId: parseInt(classId),
            athleteId: parseInt(athleteId),
          },
        },
        data: {
          attendanceStatus: status,
          notes,
        },
      });
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error("La asignación no existe");
      }
      throw error;
    }
  }

  /**
   * Obtener clases de una deportista
   */
  async findByAthleteId(athleteId, { page = 1, limit = 10, status = "" }) {
    try {
      const skip = (page - 1) * limit;
      const where = { athleteId: parseInt(athleteId) };

      if (status) {
        where.attendanceStatus = status;
      }

      const [classAthletes, total] = await Promise.all([
        prisma.classAthlete.findMany({
          where,
          skip,
          take: limit,
          include: {
            class: {
              include: {
                employee: {
                  include: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            class: {
              classDate: "desc",
            },
          },
        }),
        prisma.classAthlete.count({ where }),
      ]);

      return {
        classes: classAthletes.map((ca) => ({
          ...ca.class,
          attendanceStatus: ca.attendanceStatus,
          confirmedAt: ca.confirmedAt,
          notes: ca.notes,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener clases por rango de fechas (para calendario)
   */
  async findByDateRange(startDate, endDate, employeeId = null) {
    try {
      const where = {
        classDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };

      if (employeeId) {
        where.employeeId = parseInt(employeeId);
      }

      return await prisma.class.findMany({
        where,
        include: {
          employee: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          _count: {
            select: {
              athletes: true,
            },
          },
        },
        orderBy: [{ classDate: "asc" }, { startTime: "asc" }],
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener estadísticas de clases
   */
  async getStats(employeeId = null) {
    try {
      const where = employeeId ? { employeeId: parseInt(employeeId) } : {};

      const [total, programadas, enCurso, finalizadas, canceladas] =
        await Promise.all([
          prisma.class.count({ where }),
          prisma.class.count({ where: { ...where, status: "Programada" } }),
          prisma.class.count({ where: { ...where, status: "En_curso" } }),
          prisma.class.count({ where: { ...where, status: "Finalizada" } }),
          prisma.class.count({ where: { ...where, status: "Cancelada" } }),
        ]);

      return {
        total,
        programadas,
        enCurso,
        finalizadas,
        canceladas,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener estadísticas de asistencia de una clase
   */
  async getClassAttendanceStats(classId) {
    try {
      const [
        total,
        pendientes,
        confirmadas,
        asistieron,
        noAsistieron,
        canceladas,
      ] = await Promise.all([
        prisma.classAthlete.count({ where: { classId: parseInt(classId) } }),
        prisma.classAthlete.count({
          where: { classId: parseInt(classId), attendanceStatus: "Pendiente" },
        }),
        prisma.classAthlete.count({
          where: { classId: parseInt(classId), attendanceStatus: "Confirmada" },
        }),
        prisma.classAthlete.count({
          where: { classId: parseInt(classId), attendanceStatus: "Asistio" },
        }),
        prisma.classAthlete.count({
          where: { classId: parseInt(classId), attendanceStatus: "No_asistio" },
        }),
        prisma.classAthlete.count({
          where: { classId: parseInt(classId), attendanceStatus: "Cancelada" },
        }),
      ]);

      return {
        total,
        pendientes,
        confirmadas,
        asistieron,
        noAsistieron,
        canceladas,
      };
    } catch (error) {
      throw error;
    }
  }
}

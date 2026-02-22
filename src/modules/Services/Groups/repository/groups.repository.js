import prisma from "../../../../config/database.js";

export class GroupRepository {
  /**
   * Buscar todos los grupos con filtros y paginación
   */
  async findAll({
    page = 1,
    limit = 10,
    search = "",
    status = "",
    level = "",
  }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        {
          teacher: {
            user: { firstName: { contains: search, mode: "insensitive" } },
          },
        },
        {
          teacher: {
            user: { lastName: { contains: search, mode: "insensitive" } },
          },
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (level) {
      where.level = level;
    }

    const [groups, total] = await Promise.all([
      prisma.group.findMany({
        where,
        skip,
        take: limit,
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  secondLastName: true,
                  email: true,
                },
              },
            },
          },
          memberships: {
            where: { status: "ACTIVE" },
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
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              memberships: {
                where: { status: "ACTIVE" },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.group.count({ where }),
    ]);

    return {
      groups,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Buscar grupo por ID
   */
  async findById(id) {
    return await prisma.group.findUnique({
      where: { id: parseInt(id) },
      include: {
        teacher: {
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
              },
            },
          },
        },
        memberships: {
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
                    birthDate: true,
                    age: true,
                  },
                },
              },
            },
          },
          orderBy: { startDate: "desc" },
        },
        _count: {
          select: {
            memberships: {
              where: { status: "ACTIVE" },
            },
          },
        },
      },
    });
  }

  /**
   * Crear grupo
   */
  async create(groupData) {
    return await prisma.group.create({
      data: groupData,
      include: {
        teacher: {
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
  }

  /**
   * Actualizar grupo
   */
  async update(id, groupData) {
    return await prisma.group.update({
      where: { id: parseInt(id) },
      data: groupData,
      include: {
        teacher: {
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
        _count: {
          select: {
            memberships: {
              where: { status: "ACTIVE" },
            },
          },
        },
      },
    });
  }

  /**
   * Actualizar estado del grupo
   */
  async updateStatus(id, status) {
    return await prisma.group.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Eliminar grupo (soft delete - cambiar a ARCHIVED)
   */
  async delete(id) {
    return await prisma.group.update({
      where: { id: parseInt(id) },
      data: { status: "ARCHIVED" },
    });
  }

  /**
   * Verificar si existe un profesor
   */
  async teacherExists(teacherId) {
    const teacher = await prisma.employee.findUnique({
      where: { id: parseInt(teacherId) },
    });
    return !!teacher;
  }

  /**
   * Contar miembros activos de un grupo
   */
  async countActiveMembers(groupId) {
    return await prisma.groupMembership.count({
      where: {
        groupId: parseInt(groupId),
        status: "ACTIVE",
      },
    });
  }

  /**
   * Verificar si una deportista ya está en un grupo activo
   */
  async athleteHasActiveGroup(athleteId) {
    const activeMembership = await prisma.groupMembership.findFirst({
      where: {
        athleteId: parseInt(athleteId),
        status: "ACTIVE",
        group: {
          status: "ACTIVE",
        },
      },
      include: {
        group: true,
      },
    });
    return activeMembership;
  }

  /**
   * Obtener estadísticas de grupos
   */
  async getStats() {
    const [total, active, archived, byLevel] = await Promise.all([
      prisma.group.count(),
      prisma.group.count({ where: { status: "ACTIVE" } }),
      prisma.group.count({ where: { status: "ARCHIVED" } }),
      prisma.group.groupBy({
        by: ["level"],
        _count: true,
        where: { status: "ACTIVE" },
      }),
    ]);

    return {
      total,
      active,
      archived,
      byLevel: byLevel.reduce((acc, item) => {
        acc[item.level] = item._count;
        return acc;
      }, {}),
    };
  }
}

import prisma from "../../../config/database.js";

export class UsersRepository {
  /**
   * Obtener todos los usuarios con paginación y filtros (SOLO LECTURA)
   */
  async findAll({
    page = 1,
    limit = 10,
    search = "",
    status,
    roleId,
    userType,
  }) {
    const skip = (page - 1) * limit;

    const where = {
      AND: [
        search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { identification: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        status ? { status } : {},
        roleId ? { roleId } : {},
        userType ? this.getUserTypeFilter(userType) : {},
      ].filter((condition) => Object.keys(condition).length > 0),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          role: {
            select: {
              id: true,
              name: true,
              description: true,
              status: true,
            },
          },
          documentType: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          athlete: {
            select: {
              id: true,
              status: true,
              currentInscriptionStatus: true,
              guardian: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          employee: {
            select: {
              id: true,
              status: true,
              employeePermissions: {
                include: {
                  permission: {
                    select: {
                      id: true,
                      name: true,
                      description: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener usuario por ID (SOLO LECTURA)
   */
  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            permissions: true,
          },
        },
        documentType: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        athlete: {
          include: {
            guardian: {
              include: {
                documentType: true,
              },
            },
            inscriptions: {
              include: {
                sportsCategory: true,
              },
              orderBy: { inscriptionDate: "desc" },
              take: 5,
            },
          },
        },
        employee: {
          include: {
            employeePermissions: {
              include: {
                permission: {
                  include: {
                    privileges: true,
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
   * Filtro por tipo de usuario
   */
  getUserTypeFilter(userType) {
    const filters = {
      athletes: { athlete: { isNot: null } },
      employees: { employee: { isNot: null } },
      system: {
        OR: [
          { employee: { isNot: null } },
          {
            role: { name: { in: ["Administrador", "Manager", "Coordinator"] } },
          },
        ],
      },
      "with-login": {
        AND: [{ email: { not: null } }, { email: { not: "" } }],
      },
      active: { status: "Active" },
      inactive: { status: "Inactive" },
    };

    return filters[userType] || {};
  }

  /**
   * Obtener estadísticas de usuarios
   */
  async getStats() {
    const [totalUsers, activeUsers, usersByRole, usersByType, recentUsers] =
      await Promise.all([
        // Total usuarios
        prisma.user.count(),

        // Usuarios activos
        prisma.user.count({
          where: { status: "Active" },
        }),

        // Usuarios por rol
        prisma.user.groupBy({
          by: ["roleId"],
          _count: true,
          where: { status: "Active" },
        }),

        // Usuarios por tipo
        await prisma.$queryRaw`
        SELECT 
          COUNT(*) as total,
          CASE 
            WHEN a.id IS NOT NULL THEN 'athlete'
            WHEN e.id IS NOT NULL THEN 'employee'
            ELSE 'other'
          END as user_type
        FROM users u
        LEFT JOIN athletes a ON u.id = a.user_id
        LEFT JOIN employees e ON u.id = e.user_id
        WHERE u.status = 'Active'
        GROUP BY user_type
      `,

        // Usuarios recientes (últimos 30 días)
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      usersByRole: await this.enrichRoleStats(usersByRole),
      usersByType,
      recentUsers,
    };
  }

  /**
   * Enriquecer estadísticas con nombres de roles
   */
  async enrichRoleStats(usersByRole) {
    const roleIds = usersByRole.map((item) => item.roleId);
    const roles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { id: true, name: true },
    });

    return usersByRole.map((item) => {
      const role = roles.find((r) => r.id === item.roleId);
      return {
        roleId: item.roleId,
        roleName: role?.name || "Unknown",
        count: item._count,
      };
    });
  }
}

export default new UsersRepository();

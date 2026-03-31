import prisma from "../../../config/database.js";

export class UsersRepository {
  normalizePositiveInt(value, defaultValue, { min = 1, max = 100 } = {}) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < min) {
      return defaultValue;
    }

    if (parsed > max) {
      return max;
    }

    return parsed;
  }

  buildSearchFilter(search = "") {
    const normalizedSearch = search.trim();

    if (!normalizedSearch) {
      return {};
    }

    const buildFieldConditions = (term) => [
      { firstName: { contains: term, mode: "insensitive" } },
      { lastName: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { identification: { contains: term, mode: "insensitive" } },
      { phoneNumber: { contains: term, mode: "insensitive" } },
      { role: { name: { contains: term, mode: "insensitive" } } },
    ];

    const searchTerms = normalizedSearch.split(/\s+/).filter(Boolean);
    const searchStrategies = [
      { OR: buildFieldConditions(normalizedSearch) },
    ];

    if (searchTerms.length > 1) {
      searchStrategies.push({
        AND: searchTerms.map((term) => ({
          OR: buildFieldConditions(term),
        })),
      });
    }

    return searchStrategies.length === 1
      ? searchStrategies[0]
      : { OR: searchStrategies };
  }

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
    const safePage = this.normalizePositiveInt(page, 1, {
      min: 1,
      max: 1000000,
    });
    const safeLimit = this.normalizePositiveInt(limit, 10, {
      min: 1,
      max: 100,
    });
    const skip = (safePage - 1) * safeLimit;

    const where = {
      AND: [
        this.buildSearchFilter(search),
        status ? { status } : {},
        roleId ? { roleId } : {},
        userType ? this.getUserTypeFilter(userType) : {},
      ].filter((condition) => Object.keys(condition).length > 0),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: safeLimit,
        include: {
          role: {
            select: {
              id: true,
              name: true,
              description: true,
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
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit),
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
    const [
      totalUsers,
      activeUsers,
      usersByRole,
      recentUsers,
      athleteUsersCount,
      employeeUsersCount,
    ] =
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

        // Usuarios recientes (últimos 30 días)
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),

        // Usuarios activos por tipo
        prisma.user.count({
          where: {
            status: "Active",
            athlete: { isNot: null },
          },
        }),
        prisma.user.count({
          where: {
            status: "Active",
            employee: { isNot: null },
          },
        }),
      ]);

    const otherUsersCount = Math.max(
      activeUsers - athleteUsersCount - employeeUsersCount,
      0,
    );
    const usersByType = [
      { total: athleteUsersCount, user_type: "athlete" },
      { total: employeeUsersCount, user_type: "employee" },
      { total: otherUsersCount, user_type: "other" },
    ].filter((item) => item.total > 0);

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

  /**
   * Normalizar email (para Gmail, remover puntos antes del @)
   */
  normalizeEmail(email) {
    if (!email) return email;
    
    const [localPart, domain] = email.toLowerCase().split('@');
    
    // Para Gmail, remover puntos del local part
    if (domain === 'gmail.com' || domain === 'googlemail.com') {
      return localPart.replace(/\./g, '') + '@' + domain;
    }
    
    return email.toLowerCase();
  }

  /**
   * Buscar usuario por email (con normalización para Gmail)
   */
  async findByEmail(email, excludeUserId = null) {
    const normalizedEmail = this.normalizeEmail(email);

    // Buscar por email normalizado
    const where = { email: normalizedEmail };
    if (excludeUserId) {
      where.id = { not: parseInt(excludeUserId) };
    }

    let user = await prisma.user.findFirst({ where });

    // Si no se encuentra con email normalizado, buscar con email original
    if (!user && normalizedEmail !== email.toLowerCase()) {
      const whereOriginal = { email: email.toLowerCase() };
      if (excludeUserId) {
        whereOriginal.id = { not: parseInt(excludeUserId) };
      }
      user = await prisma.user.findFirst({ where: whereOriginal });
    }

    return user;
  }

  /**
   * Buscar usuario por identificación
   */
  async findByIdentification(identification, excludeUserId = null) {
    const where = { identification: identification };
    if (excludeUserId) {
      where.id = { not: parseInt(excludeUserId) };
    }
    return await prisma.user.findFirst({ where });
  }

  /**
   * Obtener todos los usuarios para reporte (SIN PAGINACIÓN)
   */
  async findAllForReport({
    search = "",
    status,
    roleId,
    userType,
  }) {
    const where = {
      AND: [
        this.buildSearchFilter(search),
        status ? { status } : {},
        roleId ? { roleId } : {},
        userType ? this.getUserTypeFilter(userType) : {},
      ].filter((condition) => Object.keys(condition).length > 0),
    };

    const users = await prisma.user.findMany({
      where,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
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
    });

    return {
      users,
    };
  }
}

export default new UsersRepository();

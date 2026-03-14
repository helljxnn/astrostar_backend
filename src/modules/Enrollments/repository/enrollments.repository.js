import prisma from "../../../config/database.js";

export const enrollmentsRepository = {
  async create(data) {
    return await prisma.enrollment.create({
      data,
      include: {
        athlete: {
          include: {
            documentType: true,
            guardian: true,
          },
        },
      },
    });
  },

  async findAll({ estado, athleteId, search, page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (estado) {
      where.estado = estado;
    }

    if (athleteId) {
      where.athleteId = parseInt(athleteId);
    }

    // ✅ MEJORADO: Búsqueda por nombre completo o documento
    if (search) {
      const searchTerm = search.trim();
      where.OR = [
        // Búsqueda por documento exacto
        {
          athlete: {
            user: {
              identification: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            }
          }
        },
        // Búsqueda por nombre
        {
          athlete: {
            user: {
              firstName: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            }
          }
        },
        // Búsqueda por apellido
        {
          athlete: {
            user: {
              lastName: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            }
          }
        },
        // Búsqueda por segundo nombre
        {
          athlete: {
            user: {
              middleName: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            }
          }
        },
        // Búsqueda por segundo apellido
        {
          athlete: {
            user: {
              secondLastName: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            }
          }
        }
      ];
    }

    const [data, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          athleteId: true,
          fechaInicio: true,
          fechaVencimiento: true,
          createdAt: true,
          estado: true,
          observaciones: true,
          updatedAt: true,
          athlete: {
            select: {
              id: true,
              status: true,
              inactivityReason: true,
              guardianId: true,
              relationship: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  secondLastName: true,
                  identification: true,
                  email: true,
                  phoneNumber: true,
                  birthDate: true,
                  age: true,
                  address: true,
                  documentTypeId: true,
                },
              },
              guardian: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  identification: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.enrollment.count({ where }),
    ]);

    // ✅ MEJORADO: Transformar datos para incluir nombre completo y fechaMatricula (alias de createdAt)
    const transformedData = data.map(enrollment => ({
      ...enrollment,
      fechaMatricula: enrollment.createdAt, // API: compatibilidad - createdAt = cuando se creó
      athlete: {
        ...enrollment.athlete,
        nombreCompleto: [
          enrollment.athlete.user?.firstName,
          enrollment.athlete.user?.middleName,
          enrollment.athlete.user?.lastName,
          enrollment.athlete.user?.secondLastName
        ].filter(Boolean).join(' ')
      }
    }));

    return {
      data: transformedData,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id) {
    return await prisma.enrollment.findUnique({
      where: { id: parseInt(id) },
      include: {
        athlete: {
          include: {
            documentType: true,
            guardian: true,
          },
        },
      },
    });
  },

  async findByAthleteId(athleteId) {
    return await prisma.enrollment.findMany({
      where: { athleteId: parseInt(athleteId) },
      orderBy: { createdAt: "desc" },
    });
  },

  async findActiveByAthleteId(athleteId) {
    return await prisma.enrollment.findFirst({
      where: {
        athleteId: parseInt(athleteId),
        estado: "Vigente",
      },
    });
  },

  async update(id, data) {
    return await prisma.enrollment.update({
      where: { id: parseInt(id) },
      data,
    });
  },

  async delete(id) {
    // ❌ PROTECCIÓN: Las matrículas no pueden eliminarse para mantener historial
    throw new Error(
      'Operación no permitida: Las matrículas no pueden eliminarse. ' +
      'Solo pueden cambiar de estado: Vigente, Vencida, Pending_Payment.'
    );
  },
};

import prisma from "../../../config/database.js";

export const enrollmentsRepository = {
  async create(data) {
    return await prisma.enrollment.create({
      data,
      include: {
        athlete: {
          include: {
            user: {
              include: {
                documentType: true,
              },
            },
            guardian: true,
          },
        },
      },
    });
  },

  async findAll({ estado, athleteId, search, page = 1, limit = 10, showAll = false, sortBy = 'createdAt', sortOrder = 'desc' }) {
    const skip = (page - 1) * limit;
    
    console.log('🔍 [ENROLLMENTS REPO] Parámetros recibidos:', {
      estado, athleteId, search, page, limit, showAll, sortBy, sortOrder
    });
    
    // Si se especifica un athleteId, mostrar TODAS sus matrículas (historial completo)
    // Si NO se especifica athleteId y showAll=false, mostrar solo la más reciente por deportista
    const shouldShowOnlyLatest = !athleteId && !showAll;

    if (shouldShowOnlyLatest) {
      // CASO 1: Mostrar solo la matrícula más reciente por deportista
      // Usar query raw para DISTINCT ON (no soportado nativamente por Prisma)
      let whereConditions = [];
      let params = [];
      let paramIndex = 1;

      if (estado) {
        whereConditions.push(`e.estado::text = $${paramIndex}`);
        params.push(estado);
        paramIndex++;
      }

      if (search) {
        const searchTerm = `%${search.trim()}%`;
        whereConditions.push(`(
          u.identification ILIKE $${paramIndex} OR
          u."firstName" ILIKE $${paramIndex} OR
          u."lastName" ILIKE $${paramIndex} OR
          u."middleName" ILIKE $${paramIndex} OR
          u."secondLastName" ILIKE $${paramIndex}
        )`);
        params.push(searchTerm);
        paramIndex++;
      }

      // Validar parámetros de ordenamiento
      const validSortFields = ['createdAt', 'fechaInicio', 'fechaVencimiento'];
      const validSortOrders = ['asc', 'desc'];
      
      const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const safeSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';
      
      console.log('📊 [ENROLLMENTS REPO] Ordenamiento:', { safeSortBy, safeSortOrder });

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // 🎯 QUERY CORREGIDA: DISTINCT ON + ORDER BY dinámico
      const query = `
        WITH latest_enrollments AS (
          SELECT DISTINCT ON (e."athleteId")
            e.id, e."athleteId", e."fechaInicio", e."fechaVencimiento",
            e."createdAt", e.estado, e.observaciones, e."updatedAt"
          FROM enrollments e
          INNER JOIN athletes a ON e."athleteId" = a.id
          INNER JOIN users u ON a."userId" = u.id
          ${whereClause}
          ORDER BY e."athleteId", e."createdAt" DESC
        )
        SELECT * FROM latest_enrollments
        ORDER BY "${safeSortBy}" ${safeSortOrder}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(parseInt(limit), skip);

      const enrollmentIds = await prisma.$queryRawUnsafe(query, ...params);

      if (enrollmentIds.length === 0) {
        return {
          data: [],
          pagination: {
            total: 0,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: 0,
          },
        };
      }

      // Obtener los datos completos con relaciones
      const data = await prisma.enrollment.findMany({
        where: {
          id: {
            in: enrollmentIds.map(e => e.id)
          }
        },
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
      });

      // Contar total de deportistas únicos (no matrículas)
      const countQuery = `
        WITH latest_enrollments AS (
          SELECT DISTINCT ON (e."athleteId")
            e.id, e."athleteId"
          FROM enrollments e
          INNER JOIN athletes a ON e."athleteId" = a.id
          INNER JOIN users u ON a."userId" = u.id
          ${whereClause}
          ORDER BY e."athleteId", e."createdAt" DESC
        )
        SELECT COUNT(*) as count FROM latest_enrollments
      `;

      const countParams = params.slice(0, -2); // Remover limit y offset
      const countResult = await prisma.$queryRawUnsafe(countQuery, ...countParams);
      const total = parseInt(countResult[0].count);

      const transformedData = data.map(enrollment => ({
        ...enrollment,
        fechaMatricula: enrollment.createdAt,
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

    } else {
      // CASO 2: Mostrar TODAS las matrículas (cuando se especifica athleteId o showAll=true)
      const where = {};

      if (estado) {
        where.estado = estado;
      }

      if (athleteId) {
        where.athleteId = parseInt(athleteId);
      }

      if (search) {
        const searchTerm = search.trim();
        where.OR = [
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

      const transformedData = data.map(enrollment => ({
        ...enrollment,
        fechaMatricula: enrollment.createdAt,
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
    }
  },

  async findById(id) {
    return await prisma.enrollment.findUnique({
      where: { id: parseInt(id) },
      include: {
        athlete: {
          include: {
            user: {
              include: {
                documentType: true,
              },
            },
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

  /**
   * Obtener todas las matrículas para reporte (SIN PAGINACIÓN)
   */
  async findAllForReport({ estado, athleteId, search }) {
    const where = {};

    if (estado) {
      where.estado = estado;
    }

    if (athleteId) {
      where.athleteId = parseInt(athleteId);
    }

    // Búsqueda por nombre completo o documento
    if (search) {
      const searchTerm = search.trim();
      where.OR = [
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

    const data = await prisma.enrollment.findMany({
      where,
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
    });

    // Transformar datos para incluir nombre completo y fechaMatricula
    const transformedData = data.map(enrollment => ({
      ...enrollment,
      fechaMatricula: enrollment.createdAt,
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

    return transformedData;
  },
};

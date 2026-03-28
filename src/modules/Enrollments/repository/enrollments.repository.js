import prisma from "../../../config/database.js";

const normalizeSearchValue = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const splitSearchTokens = (value) =>
  String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const buildLatestEnrollmentBaseQuery = () => `
  WITH latest_enrollments AS (
    SELECT DISTINCT ON (e."athleteId")
      e.id,
      e."athleteId",
      e."fechaInicio",
      e."fechaVencimiento",
      e."createdAt",
      e.estado,
      e.observaciones,
      e."updatedAt",
      u.identification,
      u.email,
      u."firstName",
      u."middleName",
      u."lastName",
      u."secondLastName"
    FROM enrollments e
    INNER JOIN athletes a ON e."athleteId" = a.id
    INNER JOIN users u ON a."userId" = u.id
    ORDER BY e."athleteId", e."createdAt" DESC, e.id DESC
  )
`;

export const enrollmentsRepository = {
  buildDateRangeClause(field, fromParam, toParam) {
    if (fromParam && toParam) {
      return `(${field} >= ${fromParam} AND ${field} <= ${toParam})`;
    }
    if (fromParam) {
      return `${field} >= ${fromParam}`;
    }
    if (toParam) {
      return `${field} <= ${toParam}`;
    }
    return null;
  },

  async normalizeStatuses() {
    const now = new Date();

    await prisma.enrollment.updateMany({
      where: {
        fechaVencimiento: { lt: now },
        estado: { notIn: ["Vencida", "Pending_Payment"] }
      },
      data: { estado: "Vencida" }
    });

    await prisma.enrollment.updateMany({
      where: {
        estado: "Vencida",
        fechaVencimiento: { gt: now },
        fechaInicio: { not: null }
      },
      data: { estado: "Vigente" }
    });
  },
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

  async findAll({ estado, athleteId, search, searchText, searchEstado, searchNoActivation, searchDateRange, page = 1, limit = 10, showAll = false, sortBy = 'createdAt', sortOrder = 'desc', dateFrom, dateTo, vencimientoRange }) {
    const skip = (page - 1) * limit;
// Si se especifica un athleteId, mostrar TODAS sus matrículas (historial completo)
    // Si NO se especifica athleteId y showAll=false, mostrar solo la más reciente por deportista
    const shouldShowOnlyLatest = !athleteId && !showAll;

    if (shouldShowOnlyLatest) {
      // CASO 1: Mostrar solo la matrícula más reciente por deportista.
      // Los filtros se aplican sobre ese snapshot actual, no sobre histórico.
      let whereConditions = [];
      let params = [];
      let paramIndex = 1;
      const trimmedSearchText = String(searchText || "").trim();
      const searchTokens = splitSearchTokens(trimmedSearchText);

      if (estado) {
        whereConditions.push(`le.estado::text = $${paramIndex}`);
        params.push(estado);
        paramIndex++;
      }

      if (searchText || searchEstado || searchNoActivation || searchDateRange) {
        const orConditions = [];

        if (searchTokens.length > 0) {
          const tokenConditions = searchTokens.map((token) => {
            const tokenParam = `$${paramIndex}`;
            params.push(`%${token}%`);
            paramIndex++;

            return `(
              le.identification ILIKE ${tokenParam}
              OR le.email ILIKE ${tokenParam}
              OR le."firstName" ILIKE ${tokenParam}
              OR le."middleName" ILIKE ${tokenParam}
              OR le."lastName" ILIKE ${tokenParam}
              OR le."secondLastName" ILIKE ${tokenParam}
              OR CONCAT_WS(' ', le."firstName", le."middleName", le."lastName", le."secondLastName") ILIKE ${tokenParam}
              OR CONCAT_WS(' ', le."firstName", le."lastName") ILIKE ${tokenParam}
              OR CONCAT_WS(' ', le."firstName", le."secondLastName") ILIKE ${tokenParam}
            )`;
          });

          orConditions.push(`(${tokenConditions.join(" AND ")})`);
        }

        if (trimmedSearchText) {
          const searchTerm = `%${trimmedSearchText}%`;
          orConditions.push(`le.identification ILIKE $${paramIndex}`);
          orConditions.push(`le."firstName" ILIKE $${paramIndex}`);
          orConditions.push(`le."lastName" ILIKE $${paramIndex}`);
          orConditions.push(`le."middleName" ILIKE $${paramIndex}`);
          orConditions.push(`le."secondLastName" ILIKE $${paramIndex}`);
          orConditions.push(`CONCAT_WS(' ', le."firstName", le."middleName", le."lastName", le."secondLastName") ILIKE $${paramIndex}`);
          orConditions.push(`TO_CHAR(le."createdAt", 'DD/MM/YYYY') ILIKE $${paramIndex}`);
          orConditions.push(`TO_CHAR(le."fechaInicio", 'DD/MM/YYYY') ILIKE $${paramIndex}`);
          orConditions.push(`TO_CHAR(le."fechaVencimiento", 'DD/MM/YYYY') ILIKE $${paramIndex}`);
          orConditions.push(`(
            CASE
              WHEN le.estado::text = 'Pending_Payment' THEN 'Pendiente de Pago'
              WHEN le.estado::text = 'Vigente' THEN 'Vigente'
              WHEN le.estado::text = 'Vencida' THEN 'Vencida'
              ELSE le.estado::text
            END
          ) ILIKE $${paramIndex}`);
          orConditions.push(`(
            CASE
              WHEN le.estado::text = 'Pending_Payment' THEN 'Pendiente de activacion'
              WHEN le."fechaInicio" IS NULL THEN 'No activada'
              ELSE TO_CHAR(le."fechaInicio", 'DD/MM/YYYY')
            END
          ) ILIKE $${paramIndex}`);
          orConditions.push(`(
            CASE
              WHEN le.estado::text = 'Pending_Payment' THEN 'Pendiente de activacion'
              WHEN le."fechaVencimiento" IS NULL THEN 'Sin fecha'
              ELSE TO_CHAR(le."fechaVencimiento", 'DD/MM/YYYY')
            END
          ) ILIKE $${paramIndex}`);
          params.push(searchTerm);
          paramIndex++;
        }

        if (searchEstado) {
          orConditions.push(`le.estado::text = $${paramIndex}`);
          params.push(searchEstado);
          paramIndex++;
        }

        if (searchNoActivation) {
          orConditions.push(`(le.estado::text = 'Pending_Payment' OR le."fechaInicio" IS NULL)`);
        }

        if (searchDateRange?.from && searchDateRange?.to) {
          orConditions.push(`(le."createdAt" >= $${paramIndex} AND le."createdAt" <= $${paramIndex + 1})`);
          orConditions.push(`(le."fechaInicio" >= $${paramIndex} AND le."fechaInicio" <= $${paramIndex + 1})`);
          orConditions.push(`(le."fechaVencimiento" >= $${paramIndex} AND le."fechaVencimiento" <= $${paramIndex + 1})`);
          params.push(searchDateRange.from, searchDateRange.to);
          paramIndex += 2;
        }

        if (orConditions.length > 0) {
          whereConditions.push(`(${orConditions.join(' OR ')})`);
        }
      }

      if (dateFrom || dateTo) {
        const dateFromParam = dateFrom ? `$${paramIndex}` : null;
        if (dateFrom) {
          params.push(dateFrom);
          paramIndex++;
        }

        const dateToParam = dateTo ? `$${paramIndex}` : null;
        if (dateTo) {
          params.push(dateTo);
          paramIndex++;
        }

        const createdAtClause = this.buildDateRangeClause(`le."createdAt"`, dateFromParam, dateToParam);
        const fechaInicioClause = this.buildDateRangeClause(`le."fechaInicio"`, dateFromParam, dateToParam);
        const fechaVencimientoClause = this.buildDateRangeClause(`le."fechaVencimiento"`, dateFromParam, dateToParam);

        whereConditions.push(`(${[createdAtClause, fechaInicioClause, fechaVencimientoClause].filter(Boolean).join(' OR ')})`);
      }

      if (vencimientoRange?.from && vencimientoRange?.to) {
        whereConditions.push(`le.estado::text <> 'Pending_Payment'`);
        whereConditions.push(`le."fechaVencimiento" IS NOT NULL`);
        whereConditions.push(`le."fechaVencimiento" >= $${paramIndex}`);
        params.push(vencimientoRange.from);
        paramIndex++;
        whereConditions.push(`le."fechaVencimiento" <= $${paramIndex}`);
        params.push(vencimientoRange.to);
        paramIndex++;
      }

      // Validar parámetros de ordenamiento
      const validSortFields = ['createdAt', 'fechaInicio', 'fechaVencimiento'];
      const validSortOrders = ['asc', 'desc'];
      
      const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const safeSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';
      

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Query base del snapshot actual por deportista
      const baseQuery = buildLatestEnrollmentBaseQuery();
      const countQuery = `
        ${baseQuery}
        SELECT COUNT(*) as count
        FROM latest_enrollments le
        ${whereClause}
      `;
      const countParams = [...params];

      const query = `
        ${baseQuery}
        SELECT le.id
        FROM latest_enrollments le
        ${whereClause}
        ORDER BY le."${safeSortBy}" ${safeSortOrder}, le.id DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(parseInt(limit, 10), skip);

      const [enrollmentIds, countResult] = await Promise.all([
        prisma.$queryRawUnsafe(query, ...params),
        prisma.$queryRawUnsafe(countQuery, ...countParams),
      ]);
      const total = parseInt(countResult?.[0]?.count ?? 0, 10);

      if (enrollmentIds.length === 0) {
        return {
          data: [],
          pagination: {
            total,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            totalPages: Math.ceil(total / limit),
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
      });

      // Reordenar por los ids devueltos por la consulta paginada
      const enrollmentsById = new Map(data.map((enrollment) => [enrollment.id, enrollment]));
      const orderedData = enrollmentIds
        .map((enrollment) => enrollmentsById.get(enrollment.id))
        .filter(Boolean);

      const transformedData = orderedData.map(enrollment => ({
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
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
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

      if (searchText || searchEstado || searchNoActivation || searchDateRange) {
        const or = [];
        if (searchText) {
          const searchTerm = searchText.trim();
          or.push(
            {
              athlete: {
                user: {
                  identification: { contains: searchTerm, mode: 'insensitive' }
                }
              }
            },
            {
              athlete: {
                user: {
                  firstName: { contains: searchTerm, mode: 'insensitive' }
                }
              }
            },
            {
              athlete: {
                user: {
                  lastName: { contains: searchTerm, mode: 'insensitive' }
                }
              }
            },
            {
              athlete: {
                user: {
                  middleName: { contains: searchTerm, mode: 'insensitive' }
                }
              }
            },
            {
              athlete: {
                user: {
                  secondLastName: { contains: searchTerm, mode: 'insensitive' }
                }
              }
            },
            {
              athlete: {
                user: {
                  email: { contains: searchTerm, mode: 'insensitive' }
                }
              }
            }
          );

          const normalizedSearch = normalizeSearchValue(searchTerm);
          if (normalizedSearch.includes('pendiente de activacion')) {
            or.push({ estado: 'Pending_Payment' });
          }
          if (normalizedSearch.includes('no activada') || normalizedSearch.includes('no activado')) {
            or.push({ fechaInicio: null });
            or.push({ estado: 'Pending_Payment' });
          }
        }

        if (searchEstado) {
          or.push({ estado: searchEstado });
        }

        if (searchNoActivation) {
          or.push({ estado: 'Pending_Payment' });
          or.push({ fechaInicio: null }); // compatibilidad con registros antiguos
        }

        if (searchDateRange?.from && searchDateRange?.to) {
          or.push(
            { createdAt: { gte: searchDateRange.from, lte: searchDateRange.to } },
            { fechaInicio: { gte: searchDateRange.from, lte: searchDateRange.to } },
            { fechaVencimiento: { gte: searchDateRange.from, lte: searchDateRange.to } }
          );
        }

        if (or.length > 0) {
          where.OR = or;
        }
      }

      if (dateFrom || dateTo) {
        const range = {};
        if (dateFrom) {
          range.gte = dateFrom;
        }
        if (dateTo) {
          range.lte = dateTo;
        }

        where.AND = where.AND || [];
        where.AND.push({
          OR: [
            { createdAt: range },
            { fechaInicio: range },
            { fechaVencimiento: range },
          ],
        });
      }

      if (vencimientoRange?.from && vencimientoRange?.to) {
        where.AND = where.AND || [];
        where.AND.push({
          estado: { not: 'Pending_Payment' },
        });
        where.fechaVencimiento = {
          gte: vencimientoRange.from,
          lte: vencimientoRange.to
        };
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


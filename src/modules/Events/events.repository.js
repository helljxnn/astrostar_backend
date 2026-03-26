import { PrismaClient } from "../../../generated/prisma/index.js";

const prisma = new PrismaClient();
const MOJIBAKE_HINT = /(?:Ã.|Â.|â.|ð|Ð|Ñ)/;

const sanitizeText = (value) => {
  if (typeof value !== "string" || value.length === 0) {
    return value;
  }

  if (!MOJIBAKE_HINT.test(value)) {
    return value;
  }

  try {
    return Buffer.from(value, "latin1").toString("utf8");
  } catch {
    return value;
  }
};

export class EventsRepository {
  /**
   * Transformar evento del backend al formato esperado por el frontend mÃƒÂ³vil
   */
  transformEventForMobile(service) {
    try {
      return {
        id: service.id,
        name: sanitizeText(service.name),
        description: sanitizeText(service.description),
        startDate: service.startDate,
        endDate: service.endDate,
        startTime: service.startTime,
        endTime: service.endTime,
        location: sanitizeText(service.location),
        phone: service.phone,
        status: sanitizeText(service.status),
        imageUrl: service.imageUrl,
        scheduleFile: service.scheduleFile,
        publish: service.publish,
        typeId: service.typeId,
        // Mapear categorÃƒÂ­as deportivas con validaciÃƒÂ³n
        categories: service.serviceSportsCategories
          ? service.serviceSportsCategories
              .filter((ssc) => ssc && ssc.sportsCategory) // Filtrar nulls
              .map((ssc) => ({
                id: ssc.sportsCategory.id,
                name: sanitizeText(ssc.sportsCategory.nombre || "Sin nombre"),
                description:
                  sanitizeText(ssc.sportsCategory.descripcion) ||
                  sanitizeText(
                    `Categoría ${ssc.sportsCategory.nombre || "Sin nombre"} (${ssc.sportsCategory.edadMinima || 0}-${ssc.sportsCategory.edadMaxima || 0} años)`,
                  ),
                ageRange: sanitizeText(
                  `${ssc.sportsCategory.edadMinima || 0}-${ssc.sportsCategory.edadMaxima || 0} años`,
                ),
              }))
          : [],
        // Para compatibilidad - primera categorÃƒÂ­a como categoryId
        categoryId:
          service.serviceSportsCategories &&
          service.serviceSportsCategories.length > 0 &&
          service.serviceSportsCategories[0].sportsCategory
            ? service.serviceSportsCategories[0].sportsCategory.id
            : service.categoryId || null, // fallback al categoryId directo
        // CategorÃƒÂ­a del evento (EventCategory)
        eventCategory: service.event_categories
          ? {
              id: service.event_categories.id,
              name: sanitizeText(service.event_categories.name),
              description: sanitizeText(service.event_categories.description) || null,
            }
          : null,
        type: service.ServiceType
          ? {
              id: service.ServiceType.id,
              name: sanitizeText(service.ServiceType.name),
              description: sanitizeText(service.ServiceType.description) || null,
            }
          : null,
        // Para compatibilidad mÃƒÂ³vil con validaciÃƒÂ³n
        sponsors: service.ServiceSponsor
          ? service.ServiceSponsor.filter((ss) => ss && ss.Sponsor) // Filtrar nulls
              .map((ss) => ({
                id: ss.id,
                sponsor: {
                  id: ss.Sponsor.id,
                  name: sanitizeText(ss.Sponsor.name),
                  logoUrl: null,
                },
              }))
          : [],
        // Para el frontend web - incluir datos completos
        serviceSportsCategories: service.serviceSportsCategories || [],
        event_categories: service.event_categories || null,
        ServiceType: service.ServiceType || null,
        ServiceSponsor: service.ServiceSponsor || [],
        _count: service._count || { participants: 0 },
        donationMaterialsCount: service.eventMaterials?.length ?? 0,
      };
    } catch (error) {
      console.error("Error transforming event:", service.id, error.message);
      // Retornar un objeto mÃƒÂ­nimo en caso de error
      return {
        id: service.id,
        name: sanitizeText(service.name) || "Evento sin nombre",
        description: sanitizeText(service.description) || "",
        startDate: service.startDate,
        endDate: service.endDate,
        startTime: service.startTime,
        endTime: service.endTime,
        location: sanitizeText(service.location) || "",
        phone: service.phone || "",
        status: sanitizeText(service.status) || "Programado",
        imageUrl: service.imageUrl || null,
        scheduleFile: service.scheduleFile || null,
        publish: service.publish || false,
        typeId: service.typeId || null,
        categories: [],
        categoryId: null,
        eventCategory: null,
        type: null,
        sponsors: [],
        serviceSportsCategories: [],
        event_categories: null,
        ServiceType: null,
        ServiceSponsor: [],
        _count: { participants: 0 },
        donationMaterialsCount: 0,
      };
    }
  }

  /**
   * Obtener todos los eventos con paginaciÃƒÂ³n y filtros
   */
  async findAll({
    page = 1,
    limit = 10,
    search = "",
    status = "",
    categoryId = "",
    typeId = "",
    publish = "",
  }) {
    try {
      const skip = (page - 1) * limit;

      // Construir filtros
      const where = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      if (status) {
        where.status = status;
      }

      if (categoryId) {
        // Filtrar por categorÃƒÂ­a deportiva a travÃƒÂ©s de la relaciÃƒÂ³n muchos a muchos
        where.serviceSportsCategories = {
          some: {
            sportsCategoryId: parseInt(categoryId),
          },
        };
      }

      if (typeId) {
        where.typeId = parseInt(typeId);
      }

      if (publish !== "") {
        where.publish = publish === "true";
      }

      // Obtener datos con paginaciÃƒÂ³n
      const [services, total] = await Promise.all([
        prisma.service.findMany({
          where,
          skip,
          take: limit,
          include: {
            serviceSportsCategories: {
              include: {
                sportsCategory: {
                  select: {
                    id: true,
                    nombre: true,
                    descripcion: true,
                    edadMinima: true,
                    edadMaxima: true,
                  },
                },
              },
            },
            event_categories: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            ServiceType: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            ServiceSponsor: {
              include: {
                Sponsor: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            _count: {
              select: {
                participants: true,
              },
            },
            eventMaterials: {
              where: {
                tipo: "CONSUMIBLE",
                donacionId: { not: null },
              },
              select: { id: true },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        prisma.service.count({ where }),
      ]);

      // Transformar eventos para el formato mÃƒÂ³vil con manejo de errores
      const transformedEvents = services.map((service, index) => {
        try {
          return this.transformEventForMobile(service);
        } catch (error) {
          // Solo loguear errores en desarrollo
          if (process.env.NODE_ENV === "development") {
            console.error(
              `[ERROR] Error transforming event ${index + 1}/${services.length}:`,
              {
                id: service.id,
                name: sanitizeText(service.name),
                error: error.message,
              },
            );
          }
          throw error; // Re-lanzar para que se capture arriba
        }
      });

      return {
        events: transformedEvents,
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
   * Obtener evento por ID
   */
  async findById(id) {
    const service = await prisma.service.findUnique({
      where: { id: parseInt(id) },
      include: {
        serviceSportsCategories: {
          include: {
            sportsCategory: {
              select: {
                id: true,
                nombre: true,
                descripcion: true,
                edadMinima: true,
                edadMaxima: true,
              },
            },
          },
        },
        event_categories: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        ServiceType: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        ServiceSponsor: {
          include: {
            Sponsor: {
              select: {
                id: true,
                name: true,
                contactEmail: true,
                phone: true,
              },
            },
          },
        },
        participants: {
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
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    if (!service) {
      return null;
    }

    // Transformar para el formato mÃƒÂ³vil
    return this.transformEventForMobile(service);
  }

  /**
   * Buscar evento por nombre (case insensitive)
   */
  async findByName(name) {
    return await prisma.service.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  /**
   * Crear nuevo evento
   */
  async create(data) {
    try {
      // Extraer sponsorNames y categoryIds si existen
      const { sponsorNames, categoryIds, ...eventData } = data;

      // Preparar datos para crear el evento
      const createData = {
        ...eventData,
      };

      // Si hay categorÃƒÂ­as deportivas, agregarlas
      if (categoryIds && categoryIds.length > 0) {
        createData.serviceSportsCategories = {
          create: categoryIds.map((categoryId) => ({
            sportsCategoryId: parseInt(categoryId),
          })),
        };
      }

      // Si hay patrocinadores, buscar sus IDs y agregarlos
      if (sponsorNames && sponsorNames.length > 0) {
        const sponsors = await prisma.sponsor.findMany({
          where: {
            name: {
              in: sponsorNames,
            },
            type: "Sponsor", // Solo patrocinadores, no donantes
            status: "Active", // Solo patrocinadores activos
          },
          select: {
            id: true,
          },
        });

        if (sponsors.length > 0) {
          createData.ServiceSponsor = {
            create: sponsors.map((sponsor) => ({
              sponsorId: sponsor.id,
            })),
          };
        }
      }

      return await prisma.service.create({
        data: createData,
        include: {
          serviceSportsCategories: {
            include: {
              sportsCategory: {
                select: {
                  id: true,
                  nombre: true,
                  descripcion: true,
                  edadMinima: true,
                  edadMaxima: true,
                },
              },
            },
          },
          event_categories: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          ServiceType: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          ServiceSponsor: {
            include: {
              Sponsor: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      // Manejar errores especÃƒÂ­ficos de Prisma
      if (error.code === "P2003") {
        // Foreign key constraint failed
        if (error.meta?.field_name?.includes("sportsCategoryId")) {
          throw new Error("Una de las categorÃƒÂ­as seleccionadas no existe");
        }
        if (error.meta?.field_name?.includes("categoryId")) {
          throw new Error("La categorÃƒÂ­a del evento seleccionada no existe");
        }
        if (error.meta?.field_name?.includes("typeId")) {
          throw new Error("El tipo de evento seleccionado no existe");
        }
        throw new Error(
          "Error de relaciÃƒÂ³n: uno de los IDs proporcionados no existe",
        );
      }

      if (error.code === "P2002") {
        // Unique constraint failed
        throw new Error("Ya existe un evento con estos datos");
      }

      throw error;
    }
  }

  /**
   * Actualizar evento
   */
  async update(id, data) {
    try {
      const eventId = parseInt(id);

      // Extraer sponsorNames y categoryIds si existen
      const { sponsorNames, categoryIds, ...eventData } = data;

      // Primero actualizar los datos bÃƒÂ¡sicos del evento
      const updatedEvent = await prisma.service.update({
        where: { id: eventId },
        data: eventData,
      });

      // Actualizar categorÃƒÂ­as deportivas si se proporcionaron
      if (categoryIds !== undefined) {
        // Obtener categorÃƒÂ­as actuales
        const currentCategories = await prisma.serviceSportsCategory.findMany({
          where: { serviceId: eventId },
          select: { sportsCategoryId: true },
        });

        const currentCategoryIds = currentCategories.map(
          (c) => c.sportsCategoryId,
        );
        const newCategoryIds = categoryIds.map((id) => parseInt(id));

        // Identificar categorÃƒÂ­as que se estÃƒÂ¡n eliminando
        const removedCategoryIds = currentCategoryIds.filter(
          (id) => !newCategoryIds.includes(id),
        );

        // Identificar categorÃƒÂ­as que se estÃƒÂ¡n agregando
        const addedCategoryIds = newCategoryIds.filter(
          (id) => !currentCategoryIds.includes(id),
        );

        // Si hay categorÃƒÂ­as que se estÃƒÂ¡n eliminando, eliminar inscripciones asociadas PRIMERO
        if (removedCategoryIds.length > 0) {
          // Obtener nombres de las categorÃƒÂ­as para el log
          const removedCategories = await prisma.sportsCategory.findMany({
            where: { id: { in: removedCategoryIds } },
            select: { id: true, nombre: true },
          });

          // Eliminar TODOS los participantes (equipos e individuales) cuya categorÃƒÂ­a deportiva
          // estÃƒÂ© en la lista de categorÃƒÂ­as removidas
          const deletedParticipants = await prisma.participant.deleteMany({
            where: {
              serviceId: eventId,
              sportsCategoryId: {
                in: removedCategoryIds,
              },
            },
          });

          // Ahora sÃƒÂ­ eliminar las relaciones de categorÃƒÂ­as removidas
          await prisma.serviceSportsCategory.deleteMany({
            where: {
              serviceId: eventId,
              sportsCategoryId: {
                in: removedCategoryIds,
              },
            },
          });
        }

        // Agregar solo las categorÃƒÂ­as nuevas (no las que ya existen)
        if (addedCategoryIds.length > 0) {
          await prisma.serviceSportsCategory.createMany({
            data: addedCategoryIds.map((categoryId) => ({
              serviceId: eventId,
              sportsCategoryId: categoryId,
            })),
          });
        }
      }

      // Actualizar patrocinadores si se proporcionaron
      if (sponsorNames !== undefined) {
        // Eliminar los patrocinadores existentes
        await prisma.serviceSponsor.deleteMany({
          where: { serviceId: eventId },
        });

        // Crear los nuevos patrocinadores
        if (sponsorNames.length > 0) {
          const sponsors = await prisma.sponsor.findMany({
            where: {
              name: {
                in: sponsorNames,
              },
              type: "Sponsor", // Solo patrocinadores, no donantes
              status: "Active", // Solo patrocinadores activos
            },
            select: {
              id: true,
              name: true,
            },
          });

          if (sponsors.length > 0) {
            await prisma.serviceSponsor.createMany({
              data: sponsors.map((sponsor) => ({
                serviceId: eventId,
                sponsorId: sponsor.id,
              })),
            });
          }
        }
      }

      // Retornar el evento actualizado con todas las relaciones
      return await prisma.service.findUnique({
        where: { id: eventId },
        include: {
          serviceSportsCategories: {
            include: {
              sportsCategory: {
                select: {
                  id: true,
                  nombre: true,
                  descripcion: true,
                  edadMinima: true,
                  edadMaxima: true,
                },
              },
            },
          },
          event_categories: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          ServiceType: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          ServiceSponsor: {
            include: {
              Sponsor: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error("El evento no fue encontrado");
      }

      if (error.code === "P2003") {
        // Foreign key constraint failed
        if (error.meta?.field_name?.includes("sportsCategoryId")) {
          throw new Error("Una de las categorÃƒÂ­as seleccionadas no existe");
        }
        if (error.meta?.field_name?.includes("categoryId")) {
          throw new Error("La categorÃƒÂ­a del evento seleccionada no existe");
        }
        if (error.meta?.field_name?.includes("typeId")) {
          throw new Error("El tipo de evento seleccionado no existe");
        }
        throw new Error(
          "Error de relaciÃƒÂ³n: uno de los IDs proporcionados no existe",
        );
      }

      throw error;
    }
  }

  /**
   * Eliminar evento fÃƒÂ­sicamente
   */
  async delete(id) {
    try {
      const eventId = parseInt(id);
      const deleted = await prisma.$transaction(async (tx) => {
        // ServiceSponsor no tiene cascada en el esquema actual,
        // por eso se limpia manualmente antes de eliminar el evento.
        await tx.serviceSponsor.deleteMany({
          where: { serviceId: eventId },
        });

        // Donation.serviceId es opcional; se desacopla para preservar historial.
        await tx.donation.updateMany({
          where: { serviceId: eventId },
          data: { serviceId: null },
        });

        // Participant, ServiceSportsCategory, EventMaterial y EventMaterialReusable
        // sí se eliminan por cascada desde Service.
        return tx.service.delete({
          where: { id: eventId },
        });
      });

      return deleted;
    } catch (error) {
      // Proporcionar mensajes de error más específicos
      if (error.code === "P2003") {
        throw new Error(
          "No se puede eliminar el evento debido a restricciones de clave foránea. Verifica que no tenga relaciones activas.",
        );
      }

      if (error.code === "P2025") {
        throw new Error("El evento no existe o ya fue eliminado.");
      }

      throw error;
    }
  }

  /**
   * Obtener estadÃƒÂ­sticas de eventos
   */
  async findPublicEvents({ limit = 1000 } = {}) {
    const parsedLimit = Number.parseInt(limit, 10);
    const safeLimit = Number.isNaN(parsedLimit)
      ? 1000
      : Math.min(Math.max(parsedLimit, 1), 2000);

    const services = await prisma.service.findMany({
      where: {
        publish: true,
        status: {
          not: "Cancelado",
        },
      },
      take: safeLimit,
      include: {
        serviceSportsCategories: {
          include: {
            sportsCategory: {
              select: {
                id: true,
                nombre: true,
                descripcion: true,
                edadMinima: true,
                edadMaxima: true,
              },
            },
          },
        },
        event_categories: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        ServiceType: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        ServiceSponsor: {
          include: {
            Sponsor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
      orderBy: [{ startDate: "asc" }, { startTime: "asc" }, { createdAt: "desc" }],
    });

    return services.map((service) => this.transformEventForMobile(service));
  }

  async getStats() {
    // Calcular fechas para comparaciÃƒÂ³n (ÃƒÂºltimos 30 dÃƒÂ­as vs 30 dÃƒÂ­as anteriores)
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(now.getDate() - 60);

    const [
      total,
      programado,
      enCurso,
      finalizado,
      cancelado,
      byCategory,
      byType,
      enrolledAthletes,
      enrolledTeams,
      // Datos del perÃƒÂ­odo anterior para calcular tendencias
      totalPrevious,
      enrolledAthletesPrevious,
      enrolledTeamsPrevious,
    ] = await Promise.all([
      prisma.service.count(),
      prisma.service.count({ where: { status: "Programado" } }),
      prisma.service.count({ where: { status: "En_curso" } }),
      prisma.service.count({ where: { status: "Finalizado" } }),
      prisma.service.count({ where: { status: "Cancelado" } }),
      prisma.service.groupBy({
        by: ["categoryId"],
        _count: {
          id: true,
        },
      }),
      // Agrupar por tipo de evento
      prisma.service.groupBy({
        by: ["typeId"],
        _count: {
          id: true,
        },
      }),
      // Contar deportistas inscritas (participantes con athleteId)
      prisma.participant.count({
        where: {
          athleteId: { not: null },
        },
      }),
      // Contar equipos inscritos (participantes con teamId)
      prisma.participant.count({
        where: {
          teamId: { not: null },
        },
      }),
      // Eventos creados hace 30-60 dÃƒÂ­as
      prisma.service.count({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo,
          },
        },
      }),
      // Deportistas inscritas hace 30-60 dÃƒÂ­as
      prisma.participant.count({
        where: {
          athleteId: { not: null },
          registrationDate: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo,
          },
        },
      }),
      // Equipos inscritos hace 30-60 dÃƒÂ­as
      prisma.participant.count({
        where: {
          teamId: { not: null },
          registrationDate: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo,
          },
        },
      }),
    ]);

    // Obtener TODOS los tipos de eventos de la tabla ServiceType
    const allTypes = await prisma.serviceType.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    // Crear un mapa con todos los tipos y sus conteos
    const typeCountMap = new Map();

    // Inicializar todos los tipos con count 0
    allTypes.forEach((type) => {
      typeCountMap.set(type.id, {
        name: type.name,
        count: 0,
      });
    });

    // Actualizar con los conteos reales
    byType.forEach((t) => {
      if (typeCountMap.has(t.typeId)) {
        typeCountMap.get(t.typeId).count = t._count.id;
      }
    });

    // Convertir a array y ordenar por count (mayor a menor)
    const byTypeWithNames = Array.from(typeCountMap.values()).sort(
      (a, b) => b.count - a.count,
    );

    // Calcular eventos prÃƒÂ³ximos (programados + en curso)
    const upcoming = programado + enCurso;

    // Calcular porcentajes de crecimiento
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // Eventos creados en los ÃƒÂºltimos 30 dÃƒÂ­as
    const totalRecent = await prisma.service.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    return {
      total,
      enrolledAthletes,
      enrolledTeams,
      upcoming,
      byStatus: {
        completed: finalizado,
        inProgress: enCurso,
        scheduled: programado,
        cancelled: cancelado,
      },
      byCategory,
      byType: byTypeWithNames.sort((a, b) => b.count - a.count),
      trends: {
        total: calculateGrowth(totalRecent, totalPrevious),
        enrolledAthletes: calculateGrowth(
          enrolledAthletes,
          enrolledAthletesPrevious,
        ),
        enrolledTeams: calculateGrowth(enrolledTeams, enrolledTeamsPrevious),
      },
    };
  }

  /**
   * Obtener eventos agrupados por trimestre y aÃƒÂ±o
   */
  async getEventsByQuarter() {
    try {
      // Obtener todos los eventos finalizados
      const events = await prisma.service.findMany({
        where: {
          status: "Finalizado",
        },
        select: {
          id: true,
          startDate: true,
        },
      });

      // Agrupar eventos por aÃƒÂ±o y trimestre
      const groupedData = {};

      events.forEach((event) => {
        const date = new Date(event.startDate);
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // getMonth() devuelve 0-11

        // Determinar el trimestre (1-4)
        const quarter = Math.ceil(month / 3);

        // Inicializar el aÃƒÂ±o si no existe
        if (!groupedData[year]) {
          groupedData[year] = { 1: 0, 2: 0, 3: 0, 4: 0 };
        }

        // Incrementar el contador del trimestre
        groupedData[year][quarter]++;
      });

      // Convertir a formato de array para el frontend
      const result = [];

      // Obtener los ÃƒÂºltimos 3 aÃƒÂ±os con datos
      const years = Object.keys(groupedData)
        .map(Number)
        .sort((a, b) => b - a)
        .slice(0, 3);

      // Crear estructura para cada trimestre
      for (let quarter = 1; quarter <= 4; quarter++) {
        const quarterData = {
          trimestre: `Trim ${quarter}`,
        };

        years.forEach((year) => {
          quarterData[`aÃƒÂ±o${year}`] = groupedData[year]?.[quarter] || 0;
        });

        result.push(quarterData);
      }

      return result;
    } catch (error) {
      console.error("Error en getEventsByQuarter:", error);
      throw error;
    }
  }

  /**
   * Obtener datos de referencia
   */
  async getReferenceData() {
    const [sportsCategories, eventCategories, types, sponsors] =
      await Promise.all([
        // Obtener categorÃƒÂ­as deportivas especÃƒÂ­ficas del mÃƒÂ³dulo de eventos
        prisma.sportsCategory.findMany({
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            edadMinima: true,
            edadMaxima: true,
            estado: true,
          },
          
          orderBy: {
            nombre: "asc",
          },
        }),
        // Obtener categorÃƒÂ­as de eventos
        prisma.eventCategory.findMany({
          select: {
            id: true,
            name: true,
            description: true,
          },
          orderBy: {
            name: "asc",
          },
        }),
        prisma.serviceType.findMany({
          select: {
            id: true,
            name: true,
            description: true,
          },
          orderBy: {
            name: "asc",
          },
        }),
        // Obtener patrocinadores activos
        prisma.sponsor.findMany({
          select: {
            id: true,
            name: true,
            type: true,
            personType: true,
            city: true,
            status: true,
          },
          
          orderBy: {
            name: "asc",
          },
        }),
      ]);

    // Mapear las categorÃƒÂ­as deportivas al formato esperado por el frontend
    const mappedSportsCategories = sportsCategories.map((category) => ({
      id: category.id,
      name: sanitizeText(category.nombre),
      description:
        sanitizeText(category.descripcion) ||
        sanitizeText(
          `Categoría ${category.nombre} (${category.edadMinima}-${category.edadMaxima} años)`,
        ),
      ageRange: sanitizeText(
        `${category.edadMinima}-${category.edadMaxima} años`,
      ),
    }));

    // Mapear patrocinadores al formato esperado por el frontend
    const mappedSponsors = sponsors.map((sponsor) => ({
      id: sponsor.id,
      nombre: sanitizeText(sponsor.name),
      tipo: sponsor.type === "Donor" ? "Donante" : "Patrocinador",
      tipoPersona: sponsor.personType === "Juridica" ? "Juridica" : "Natural",
      ciudad: sanitizeText(sponsor.city) || "",
      estado: sponsor.status === "Active" ? "Activo" : "Inactivo",
    }));

    return {
      sportsCategories: mappedSportsCategories,
      categories: mappedSportsCategories, // Para compatibilidad
      eventCategories: eventCategories,
      types,
      sponsors: mappedSponsors,
    };
  }

  /**
   * Encontrar eventos que deberÃƒÂ­an estar finalizados
   */
  async findEventsToFinalize(currentDate, currentTime) {
    try {
      // Obtener todos los eventos que no estÃƒÂ¡n finalizados ni cancelados
      const events = await prisma.service.findMany({
        where: {
          status: {
            notIn: ["Finalizado", "Cancelado"],
          },
        },
        select: {
          id: true,
          name: true,
          endDate: true,
          endTime: true,
          status: true,
        },
      });

      // Filtrar manualmente los eventos que deben finalizarse
      // currentDate ya viene en formato YYYY-MM-DD desde BogotÃƒÂ¡
      const eventsToFinalize = events.filter((event) => {
        // Validar que el evento tenga fecha y hora de fin
        if (!event.endDate || !event.endTime) {
          return false;
        }

        const eventEndDate = new Date(event.endDate);
        const eventEndDateStr =
          eventEndDate.getFullYear() +
          "-" +
          String(eventEndDate.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(eventEndDate.getDate()).padStart(2, "0");

        // Si la fecha de fin es anterior a hoy (BogotÃƒÂ¡), finalizar
        if (eventEndDateStr < currentDate) {
          return true;
        }

        // Si la fecha de fin es hoy (BogotÃƒÂ¡), verificar la hora
        if (eventEndDateStr === currentDate) {
          // Comparar horas (formato HH:MM)
          const [eventHour, eventMin] = event.endTime.split(":").map(Number);
          const [currentHour, currentMin] = currentTime.split(":").map(Number);

          const eventMinutes = eventHour * 60 + eventMin;
          const currentMinutes = currentHour * 60 + currentMin;

          // Si la hora de fin ya pasÃƒÂ³, finalizar
          if (eventMinutes <= currentMinutes) {
            return true;
          }
        }

        return false;
      });

      return eventsToFinalize;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Encontrar eventos que deberÃƒÂ­an estar en curso
   */
  async findEventsToStartInProgress(currentDate, currentTime) {
    try {
      // Obtener todos los eventos programados
      const events = await prisma.service.findMany({
        where: {
          status: "Programado",
        },
        select: {
          id: true,
          name: true,
          startDate: true,
          startTime: true,
          endDate: true,
          endTime: true,
          status: true,
        },
      });

      // Filtrar manualmente los eventos que deben estar en curso
      // currentDate ya viene en formato YYYY-MM-DD desde BogotÃƒÂ¡
      const eventsToStartInProgress = events.filter((event) => {
        // Validar que el evento tenga fechas y horas completas
        if (
          !event.startDate ||
          !event.startTime ||
          !event.endDate ||
          !event.endTime
        ) {
          return false;
        }

        const eventStartDate = new Date(event.startDate);
        const eventStartDateStr =
          eventStartDate.getFullYear() +
          "-" +
          String(eventStartDate.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(eventStartDate.getDate()).padStart(2, "0");

        const eventEndDate = new Date(event.endDate);
        const eventEndDateStr =
          eventEndDate.getFullYear() +
          "-" +
          String(eventEndDate.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(eventEndDate.getDate()).padStart(2, "0");

        // Si la fecha de inicio es anterior a hoy, el evento deberÃƒÂ­a estar en curso
        if (eventStartDateStr < currentDate && eventEndDateStr >= currentDate) {
          return true;
        }

        // Si la fecha de inicio es hoy, verificar la hora
        if (eventStartDateStr === currentDate) {
          const [eventHour, eventMin] = event.startTime.split(":").map(Number);
          const [currentHour, currentMin] = currentTime.split(":").map(Number);

          const eventMinutes = eventHour * 60 + eventMin;
          const currentMinutes = currentHour * 60 + currentMin;

          // Si la hora de inicio ya pasÃƒÂ³ y no ha terminado, poner en curso
          if (eventMinutes <= currentMinutes) {
            // Verificar que no haya terminado
            if (eventEndDateStr > currentDate) {
              return true;
            }
            // Si termina hoy, verificar la hora de fin
            if (eventEndDateStr === currentDate) {
              const [endHour, endMin] = event.endTime.split(":").map(Number);
              const endMinutes = endHour * 60 + endMin;
              if (currentMinutes < endMinutes) {
                return true;
              }
            }
          }
        }

        return false;
      });

      return eventsToStartInProgress;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar el estado de mÃƒÂºltiples eventos
   */
  async updateMultipleStatuses(eventIds, newStatus) {
    try {
      return await prisma.service.updateMany({
        where: {
          id: {
            in: eventIds,
          },
        },
        data: {
          status: newStatus,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener deportistas disponibles para inscribir en un evento
   */
  async getAvailableAthletes(
    eventId,
    { page = 1, limit = 10, search = "", categoryId = "" },
  ) {
    try {
      const skip = (page - 1) * limit;

      // Construir filtros
      const where = {
        status: "Active", // Solo deportistas activos
        currentInscriptionStatus: "Active", // Solo con inscripciÃƒÂ³n vigente
      };

      // Filtro de bÃƒÂºsqueda
      if (search) {
        where.user = {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { identification: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        };
      }

      // Obtener deportistas que NO estÃƒÂ¡n ya inscritas en este evento
      const [athletes, total] = await Promise.all([
        prisma.athlete.findMany({
          where: {
            ...where,
            // Excluir deportistas ya inscritas en este evento
            participants: {
              none: {
                serviceId: parseInt(eventId),
              },
            },
          },
          skip,
          take: limit,
          include: {
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
                documentType: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            inscriptions: {
              where: {
                status: "Active",
              },
              include: {
                sportsCategory: {
                  select: {
                    id: true,
                    nombre: true,
                    edadMinima: true,
                    edadMaxima: true,
                  },
                },
              },
              orderBy: {
                inscriptionDate: "desc",
              },
              take: 1, // Solo la inscripciÃƒÂ³n mÃƒÂ¡s reciente
            },
            guardian: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
              },
            },
          },
          orderBy: [
            { user: { firstName: "asc" } },
            { user: { lastName: "asc" } },
          ],
        }),
        prisma.athlete.count({
          where: {
            ...where,
            participants: {
              none: {
                serviceId: parseInt(eventId),
              },
            },
          },
        }),
      ]);

      // Transformar deportistas al formato esperado
      const transformedAthletes = athletes
        .filter((athlete) => {
          // Si se especifica una categorÃƒÂ­a, filtrar por ella
          if (categoryId) {
            const currentInscription = athlete.inscriptions[0];
            return (
              currentInscription?.sportsCategory?.id === parseInt(categoryId)
            );
          }
          return true;
        })
        .map((athlete) => {
          const currentInscription = athlete.inscriptions[0];

          return {
            id: athlete.id,
            userId: athlete.user.id,
            fullName: `${athlete.user.firstName} ${
              athlete.user.middleName || ""
            } ${athlete.user.lastName} ${athlete.user.secondLastName || ""}`
              .replace(/\s+/g, " ")
              .trim(),
            firstName: athlete.user.firstName,
            middleName: athlete.user.middleName,
            lastName: athlete.user.lastName,
            secondLastName: athlete.user.secondLastName,
            identification: athlete.user.identification,
            email: athlete.user.email,
            phoneNumber: athlete.user.phoneNumber,
            birthDate: athlete.user.birthDate,
            age: athlete.user.age,
            documentType: athlete.user.documentType,
            category: currentInscription?.sportsCategory
              ? {
                  id: currentInscription.sportsCategory.id,
                  name: currentInscription.sportsCategory.nombre,
                  ageRange: sanitizeText(`${currentInscription.sportsCategory.edadMinima}-${currentInscription.sportsCategory.edadMaxima} años`),
                }
              : null,
            guardian: athlete.guardian
              ? {
                  id: athlete.guardian.id,
                  fullName: `${athlete.guardian.firstName} ${athlete.guardian.lastName}`,
                  phone: athlete.guardian.phone,
                  email: athlete.guardian.email,
                }
              : null,
            status: athlete.status,
            inscriptionStatus: athlete.currentInscriptionStatus,
          };
        });

      return {
        athletes: transformedAthletes,
        pagination: {
          page,
          limit,
          total: categoryId ? transformedAthletes.length : total,
          totalPages: Math.ceil(
            (categoryId ? transformedAthletes.length : total) / limit,
          ),
          hasNext:
            page <
            Math.ceil(
              (categoryId ? transformedAthletes.length : total) / limit,
            ),
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Inscribir deportista en un evento
   */
  async enrollAthlete(eventId, athleteId, data = {}) {
    try {
      const { sportsCategoryId, notes = "" } = data;

      // Verificar que el evento existe
      const event = await prisma.service.findUnique({
        where: { id: parseInt(eventId) },
        select: { id: true, name: true, status: true },
      });

      if (!event) {
        throw new Error("El evento no existe");
      }

      if (event.status === "Cancelado" || event.status === "Finalizado") {
        throw new Error(
          "No se puede inscribir en un evento cancelado o finalizado",
        );
      }

      // Verificar que la deportista existe y estÃƒÂ¡ activa
      const athlete = await prisma.athlete.findUnique({
        where: { id: parseInt(athleteId) },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          inscriptions: {
            where: { status: "Active" },
            include: {
              sportsCategory: true,
            },
            orderBy: { inscriptionDate: "desc" },
            take: 1,
          },
        },
      });

      if (!athlete) {
        throw new Error("La deportista no existe");
      }

      if (athlete.status !== "Active") {
        throw new Error("La deportista debe estar activa para inscribirse");
      }

      if (athlete.currentInscriptionStatus !== "Active") {
        throw new Error("La deportista debe tener una inscripciÃƒÂ³n vigente");
      }

      // Verificar que no estÃƒÂ© ya inscrita en este evento
      const existingParticipant = await prisma.participant.findFirst({
        where: {
          serviceId: parseInt(eventId),
          athleteId: parseInt(athleteId),
        },
      });

      if (existingParticipant) {
        throw new Error("La deportista ya estÃƒÂ¡ inscrita en este evento");
      }

      // Usar la categorÃƒÂ­a de la inscripciÃƒÂ³n activa si no se especifica una
      const currentInscription = athlete.inscriptions[0];
      const finalSportsCategoryId =
        sportsCategoryId || currentInscription?.sportsCategoryId;

      // Crear la participaciÃƒÂ³n
      const participant = await prisma.participant.create({
        data: {
          type: "Individual",
          serviceId: parseInt(eventId),
          athleteId: parseInt(athleteId),
          sportsCategoryId: finalSportsCategoryId
            ? parseInt(finalSportsCategoryId)
            : null,
          status: "Registered",
          notes:
            sanitizeText(notes) ||
            sanitizeText(
              `Inscripción de ${athlete.user.firstName} ${athlete.user.lastName}`,
            ),
          registrationDate: new Date(),
        },
        include: {
          athlete: {
            include: {
              user: {
                select: {
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  secondLastName: true,
                  identification: true,
                  email: true,
                  phoneNumber: true,
                },
              },
            },
          },
          sportsCategory: {
            select: {
              id: true,
              nombre: true,
              edadMinima: true,
              edadMaxima: true,
            },
          },
        },
      });

      return {
        id: participant.id,
        athlete: {
          id: participant.athlete.id,
          fullName: `${participant.athlete.user.firstName} ${
            participant.athlete.user.middleName || ""
          } ${participant.athlete.user.lastName} ${
            participant.athlete.user.secondLastName || ""
          }`
            .replace(/\s+/g, " ")
            .trim(),
          identification: participant.athlete.user.identification,
          email: participant.athlete.user.email,
          phoneNumber: participant.athlete.user.phoneNumber,
        },
        category: participant.sportsCategory
          ? {
              id: participant.sportsCategory.id,
              name: participant.sportsCategory.nombre,
              ageRange: sanitizeText(`${participant.sportsCategory.edadMinima}-${participant.sportsCategory.edadMaxima} años`),
            }
          : null,
        registrationDate: participant.registrationDate,
        status: participant.status,
        notes: participant.notes,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Desinscribir deportista de un evento
   */
  async unenrollAthlete(eventId, athleteId) {
    try {
      // Verificar que la participaciÃƒÂ³n existe
      const participant = await prisma.participant.findFirst({
        where: {
          serviceId: parseInt(eventId),
          athleteId: parseInt(athleteId),
        },
        include: {
          athlete: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      if (!participant) {
        throw new Error("La deportista no estÃƒÂ¡ inscrita en este evento");
      }

      // Eliminar la participaciÃƒÂ³n
      await prisma.participant.delete({
        where: { id: participant.id },
      });

      return {
        athleteName: `${participant.athlete.user.firstName} ${participant.athlete.user.lastName}`,
        message: "Deportista desinscrita exitosamente",
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Limpiar todas las inscripciones de un evento
   */
  async clearEventRegistrations(eventId) {
    try {
      const parsedEventId = parseInt(eventId);

      // Eliminar todas las inscripciones (participantes) del evento
      const deletedCount = await prisma.participant.deleteMany({
        where: {
          serviceId: parsedEventId,
        },
      });

      return {
        success: true,
        deletedCount: deletedCount.count,
        message: `Se eliminaron ${deletedCount.count} inscripciones del evento`,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verificar inscripciones afectadas por cambio de categorÃƒÂ­as
   * Retorna informaciÃƒÂ³n sobre equipos y deportistas que serÃƒÂ­an eliminados
   */
  async checkAffectedRegistrations(eventId, newCategoryIds) {
    try {
      const parsedEventId = parseInt(eventId);
      const parsedNewCategoryIds = newCategoryIds.map((id) => parseInt(id));

      // Obtener categorÃƒÂ­as actuales del evento
      const currentCategories = await prisma.serviceSportsCategory.findMany({
        where: { serviceId: parsedEventId },
        include: {
          sportsCategory: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      });

      const currentCategoryIds = currentCategories.map(
        (c) => c.sportsCategoryId,
      );

      // Identificar categorÃƒÂ­as que se estÃƒÂ¡n eliminando
      const removedCategoryIds = currentCategoryIds.filter(
        (id) => !parsedNewCategoryIds.includes(id),
      );

      if (removedCategoryIds.length === 0) {
        return {
          hasAffectedRegistrations: false,
          removedCategories: [],
          affectedTeams: [],
          affectedAthletes: [],
          totalAffected: 0,
        };
      }

      // Obtener informaciÃƒÂ³n de las categorÃƒÂ­as removidas
      const removedCategories = currentCategories
        .filter((c) => removedCategoryIds.includes(c.sportsCategoryId))
        .map((c) => ({
          id: c.sportsCategory.id,
          nombre: c.sportsCategory.nombre,
        }));

      // Buscar equipos afectados
      const affectedTeams = await prisma.participant.findMany({
        where: {
          serviceId: parsedEventId,
          type: "Team",
          sportsCategoryId: {
            in: removedCategoryIds,
          },
        },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              category: true,
              teamType: true,
            },
          },
          sportsCategory: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      });

      // Buscar deportistas afectados
      const affectedAthletes = await prisma.participant.findMany({
        where: {
          serviceId: parsedEventId,
          type: "Individual",
          sportsCategoryId: {
            in: removedCategoryIds,
          },
        },
        include: {
          athlete: {
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
          sportsCategory: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      });

      return {
        hasAffectedRegistrations:
          affectedTeams.length > 0 || affectedAthletes.length > 0,
        removedCategories,
        affectedTeams: affectedTeams.map((p) => ({
          id: p.team.id,
          name: p.team.name,
          category: p.sportsCategory?.nombre || p.team.category,
          teamType: p.team.teamType,
        })),
        affectedAthletes: affectedAthletes.map((p) => ({
          id: p.athlete.id,
          name: `${p.athlete.user.firstName} ${p.athlete.user.lastName}`,
          category: p.sportsCategory.nombre,
        })),
        totalAffected: affectedTeams.length + affectedAthletes.length,
      };
    } catch (error) {
      throw error;
    }
  }
}

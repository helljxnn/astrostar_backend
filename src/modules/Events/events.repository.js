import { PrismaClient } from "../../../generated/prisma/index.js";

const prisma = new PrismaClient();

export class EventsRepository {
  /**
   * Transformar evento del backend al formato esperado por el frontend móvil
   */
  transformEventForMobile(service) {
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      startDate: service.startDate,
      endDate: service.endDate,
      startTime: service.startTime,
      endTime: service.endTime,
      location: service.location,
      phone: service.phone,
      status: service.status,
      imageUrl: service.imageUrl,
      scheduleFile: service.scheduleFile,
      publish: service.publish,
      typeId: service.typeId,
      // Mapear categorías deportivas
      categories: service.serviceSportsCategories
        ? service.serviceSportsCategories.map((ssc) => ({
            id: ssc.sportsCategory.id,
            name: ssc.sportsCategory.nombre,
            description:
              ssc.sportsCategory.descripcion ||
              `Categoría ${ssc.sportsCategory.nombre} (${ssc.sportsCategory.edadMinima}-${ssc.sportsCategory.edadMaxima} años)`,
            ageRange: `${ssc.sportsCategory.edadMinima}-${ssc.sportsCategory.edadMaxima} años`,
          }))
        : [],
      // Para compatibilidad - primera categoría como categoryId
      categoryId:
        service.serviceSportsCategories &&
        service.serviceSportsCategories.length > 0
          ? service.serviceSportsCategories[0].sportsCategory.id
          : service.categoryId, // fallback al categoryId directo
      // Categoría del evento (EventCategory)
      eventCategory: service.event_categories
        ? {
            id: service.event_categories.id,
            name: service.event_categories.name,
            description: service.event_categories.description || null,
          }
        : null,
      type: service.ServiceType
        ? {
            id: service.ServiceType.id,
            name: service.ServiceType.name,
            description: service.ServiceType.description || null,
          }
        : null,
      // Para compatibilidad móvil
      sponsors: service.ServiceSponsor
        ? service.ServiceSponsor.map((ss) => ({
            id: ss.id,
            sponsor: {
              id: ss.Sponsor.id,
              name: ss.Sponsor.name,
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
    };
  }

  /**
   * Obtener todos los eventos con paginación y filtros
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
        // Filtrar por categoría deportiva a través de la relación muchos a muchos
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

      // Obtener datos con paginación
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
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        prisma.service.count({ where }),
      ]);

      // Transformar eventos para el formato móvil
      const transformedEvents = services.map((service) =>
        this.transformEventForMobile(service)
      );

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
      },
    });

    if (!service) {
      return null;
    }

    // Transformar para el formato móvil
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

      // Si hay categorías deportivas, agregarlas
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
      // Manejar errores específicos de Prisma
      if (error.code === "P2003") {
        // Foreign key constraint failed
        if (error.meta?.field_name?.includes("sportsCategoryId")) {
          throw new Error("Una de las categorías seleccionadas no existe");
        }
        if (error.meta?.field_name?.includes("categoryId")) {
          throw new Error("La categoría del evento seleccionada no existe");
        }
        if (error.meta?.field_name?.includes("typeId")) {
          throw new Error("El tipo de evento seleccionado no existe");
        }
        throw new Error(
          "Error de relación: uno de los IDs proporcionados no existe"
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

      // Primero actualizar los datos básicos del evento
      const updatedEvent = await prisma.service.update({
        where: { id: eventId },
        data: eventData,
      });

      // Actualizar categorías deportivas si se proporcionaron
      if (categoryIds !== undefined) {
        // Eliminar las categorías existentes
        await prisma.serviceSportsCategory.deleteMany({
          where: { serviceId: eventId },
        });

        // Crear las nuevas categorías
        if (categoryIds.length > 0) {
          await prisma.serviceSportsCategory.createMany({
            data: categoryIds.map((categoryId) => ({
              serviceId: eventId,
              sportsCategoryId: parseInt(categoryId),
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
          throw new Error("Una de las categorías seleccionadas no existe");
        }
        if (error.meta?.field_name?.includes("categoryId")) {
          throw new Error("La categoría del evento seleccionada no existe");
        }
        if (error.meta?.field_name?.includes("typeId")) {
          throw new Error("El tipo de evento seleccionado no existe");
        }
        throw new Error(
          "Error de relación: uno de los IDs proporcionados no existe"
        );
      }

      throw error;
    }
  }

  /**
   * Eliminar evento físicamente
   */
  async delete(id) {
    try {
      const eventId = parseInt(id);

      // Prisma eliminará automáticamente en cascada:
      // - ServiceSponsor (onDelete: Cascade)
      // - Participant (onDelete: Cascade)
      const deleted = await prisma.service.delete({
        where: { id: eventId },
      });

      return deleted;
    } catch (error) {
      // Proporcionar mensajes de error más específicos
      if (error.code === "P2003") {
        throw new Error(
          "No se puede eliminar el evento debido a restricciones de clave foránea. Verifica que no tenga relaciones activas."
        );
      }

      if (error.code === "P2025") {
        throw new Error("El evento no existe o ya fue eliminado.");
      }

      throw error;
    }
  }

  /**
   * Obtener estadísticas de eventos
   */
  async getStats() {
    const [total, programado, finalizado, cancelado, pausado, byCategory] =
      await Promise.all([
        prisma.service.count(),
        prisma.service.count({ where: { status: "Programado" } }),
        prisma.service.count({ where: { status: "Finalizado" } }),
        prisma.service.count({ where: { status: "Cancelado" } }),
        prisma.service.count({ where: { status: "Pausado" } }),
        prisma.service.groupBy({
          by: ["categoryId"],
          _count: {
            id: true,
          },
        }),
      ]);

    return {
      total,
      programado,
      finalizado,
      cancelado,
      pausado,
      byCategory,
    };
  }

  /**
   * Obtener datos de referencia
   */
  async getReferenceData() {
    const [sportsCategories, eventCategories, types, sponsors] =
      await Promise.all([
        // Obtener categorías deportivas específicas del módulo de eventos
        prisma.sportsCategory.findMany({
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            edadMinima: true,
            edadMaxima: true,
            estado: true,
          },
          where: {
            estado: "Activo",
            publicar: true,
          },
          orderBy: {
            nombre: "asc",
          },
        }),
        // Obtener categorías de eventos
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
          where: {
            type: "Sponsor", // Solo patrocinadores, no donantes
            status: "Active", // Solo patrocinadores activos
          },
          orderBy: {
            name: "asc",
          },
        }),
      ]);

    // Mapear las categorías deportivas al formato esperado por el frontend
    const mappedSportsCategories = sportsCategories.map((category) => ({
      id: category.id,
      name: category.nombre,
      description:
        category.descripcion ||
        `Categoría ${category.nombre} (${category.edadMinima}-${category.edadMaxima} años)`,
      ageRange: `${category.edadMinima}-${category.edadMaxima} años`,
    }));

    // Mapear patrocinadores al formato esperado por el frontend
    const mappedSponsors = sponsors.map((sponsor) => ({
      id: sponsor.id,
      nombre: sponsor.name,
      tipo: "Patrocinador",
      tipoPersona: sponsor.personType === "Juridica" ? "Jurídica" : "Natural",
      ciudad: sponsor.city || "",
      estado: "Activo",
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
   * Encontrar eventos que deberían estar finalizados
   */
  async findEventsToFinalize(currentDate, currentTime) {
    try {
      // Obtener todos los eventos que no están finalizados ni cancelados
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
      // currentDate ya viene en formato YYYY-MM-DD desde Bogotá
      const eventsToFinalize = events.filter((event) => {
        const eventEndDate = new Date(event.endDate);
        const eventEndDateStr =
          eventEndDate.getFullYear() +
          "-" +
          String(eventEndDate.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(eventEndDate.getDate()).padStart(2, "0");

        // Si la fecha de fin es anterior a hoy (Bogotá), finalizar
        if (eventEndDateStr < currentDate) {
          return true;
        }

        // Si la fecha de fin es hoy (Bogotá), verificar la hora
        if (eventEndDateStr === currentDate) {
          // Comparar horas (formato HH:MM)
          const [eventHour, eventMin] = event.endTime.split(":").map(Number);
          const [currentHour, currentMin] = currentTime.split(":").map(Number);

          const eventMinutes = eventHour * 60 + eventMin;
          const currentMinutes = currentHour * 60 + currentMin;

          // Si la hora de fin ya pasó, finalizar
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
   * Actualizar el estado de múltiples eventos
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
    { page = 1, limit = 10, search = "", categoryId = "" }
  ) {
    try {
      const skip = (page - 1) * limit;

      // Construir filtros
      const where = {
        status: "Active", // Solo deportistas activos
        currentInscriptionStatus: "Active", // Solo con inscripción vigente
      };

      // Filtro de búsqueda
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

      // Obtener deportistas que NO están ya inscritas en este evento
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
              take: 1, // Solo la inscripción más reciente
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
          // Si se especifica una categoría, filtrar por ella
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
                  ageRange: `${currentInscription.sportsCategory.edadMinima}-${currentInscription.sportsCategory.edadMaxima} años`,
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
            (categoryId ? transformedAthletes.length : total) / limit
          ),
          hasNext:
            page <
            Math.ceil(
              (categoryId ? transformedAthletes.length : total) / limit
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
          "No se puede inscribir en un evento cancelado o finalizado"
        );
      }

      // Verificar que la deportista existe y está activa
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
        throw new Error("La deportista debe tener una inscripción vigente");
      }

      // Verificar que no esté ya inscrita en este evento
      const existingParticipant = await prisma.participant.findFirst({
        where: {
          serviceId: parseInt(eventId),
          athleteId: parseInt(athleteId),
        },
      });

      if (existingParticipant) {
        throw new Error("La deportista ya está inscrita en este evento");
      }

      // Usar la categoría de la inscripción activa si no se especifica una
      const currentInscription = athlete.inscriptions[0];
      const finalSportsCategoryId =
        sportsCategoryId || currentInscription?.sportsCategoryId;

      // Crear la participación
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
            notes ||
            `Inscripción de ${athlete.user.firstName} ${athlete.user.lastName}`,
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
              ageRange: `${participant.sportsCategory.edadMinima}-${participant.sportsCategory.edadMaxima} años`,
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
      // Verificar que la participación existe
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
        throw new Error("La deportista no está inscrita en este evento");
      }

      // Eliminar la participación
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
}

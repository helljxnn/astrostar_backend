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
      categoryId: service.categoryId,
      typeId: service.typeId,
      category: service.event_categories
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
        where.categoryId = parseInt(categoryId);
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
      // Extraer sponsorNames si existen
      const { sponsorNames, ...eventData } = data;

      // Preparar datos para crear el evento
      const createData = {
        ...eventData,
      };

      // Si hay patrocinadores, buscar sus IDs y agregarlos
      if (sponsorNames && sponsorNames.length > 0) {
        const sponsors = await prisma.sponsor.findMany({
          where: {
            name: {
              in: sponsorNames,
            },
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
        if (error.meta?.field_name?.includes("categoryId")) {
          throw new Error("La categoría seleccionada no existe");
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

      // Extraer sponsorNames si existen
      const { sponsorNames, ...eventData } = data;

      // Primero actualizar los datos básicos del evento
      const updatedEvent = await prisma.service.update({
        where: { id: eventId },
        data: eventData,
      });

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
        if (error.meta?.field_name?.includes("categoryId")) {
          throw new Error("La categoría seleccionada no existe");
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
    const [categories, types] = await Promise.all([
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
    ]);

    return { categories, types };
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
      const now = new Date();
      const currentDateObj = new Date(currentDate);
      currentDateObj.setHours(0, 0, 0, 0);

      const eventsToFinalize = events.filter((event) => {
        const eventEndDate = new Date(event.endDate);
        eventEndDate.setHours(0, 0, 0, 0);

        // Si la fecha de fin es anterior a hoy, finalizar
        if (eventEndDate < currentDateObj) {
          return true;
        }

        // Si la fecha de fin es hoy, verificar la hora
        if (eventEndDate.getTime() === currentDateObj.getTime()) {
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
}

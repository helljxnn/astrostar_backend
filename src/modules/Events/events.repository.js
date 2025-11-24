import { PrismaClient } from '../../../generated/prisma/index.js';

const prisma = new PrismaClient();

export class EventsRepository {
  /**
   * Obtener todos los eventos con paginación y filtros
   */
  async findAll({ page = 1, limit = 10, search = '', status = '', categoryId = '', typeId = '' }) {
    try {
      const skip = (page - 1) * limit;
    
      // Construir filtros
      const where = {};
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
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

      // Obtener datos con paginación
      const [services, total] = await Promise.all([
        prisma.service.findMany({
          where,
          skip,
          take: limit,
          include: {
            category: {
              select: {
                id: true,
                name: true
              }
            },
            type: {
              select: {
                id: true,
                name: true
              }
            },
            sponsors: {
              include: {
                sponsor: {
                  select: {
                    id: true,
                    name: true,
                    logoUrl: true
                  }
                }
              }
            },
            _count: {
              select: {
                participants: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.service.count({ where })
      ]);

      return {
        events: services,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error in findAll repository:', error);
      throw error;
    }
  }

  /**
   * Obtener evento por ID
   */
  async findById(id) {
    return await prisma.service.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        type: {
          select: {
            id: true,
            name: true
          }
        },
        sponsors: {
          include: {
            sponsor: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
                contactEmail: true,
                phone: true
              }
            }
          }
        },
        participants: {
          include: {
            athlete: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            },
            team: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Buscar evento por nombre (case insensitive)
   */
  async findByName(name) {
    return await prisma.service.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true
      }
    });
  }

  /**
   * Crear nuevo evento
   */
  async create(data) {
    try {
      return await prisma.service.create({
        data,
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          },
          type: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating event:', error);
      
      // Manejar errores específicos de Prisma
      if (error.code === 'P2003') {
        // Foreign key constraint failed
        if (error.meta?.field_name?.includes('categoryId')) {
          throw new Error('La categoría seleccionada no existe');
        }
        if (error.meta?.field_name?.includes('typeId')) {
          throw new Error('El tipo de evento seleccionado no existe');
        }
        throw new Error('Error de relación: uno de los IDs proporcionados no existe');
      }
      
      if (error.code === 'P2002') {
        // Unique constraint failed
        throw new Error('Ya existe un evento con estos datos');
      }
      
      throw error;
    }
  }

  /**
   * Actualizar evento
   */
  async update(id, data) {
    try {
      return await prisma.service.update({
        where: { id: parseInt(id) },
        data,
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          },
          type: {
            select: {
              id: true,
              name: true
            }
          },
          sponsors: {
            include: {
              sponsor: {
                select: {
                  id: true,
                  name: true,
                  logoUrl: true
                }
              }
            }
          }
        }
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('El evento no fue encontrado');
      }
      
      if (error.code === 'P2003') {
        // Foreign key constraint failed
        if (error.meta?.field_name?.includes('categoryId')) {
          throw new Error('La categoría seleccionada no existe');
        }
        if (error.meta?.field_name?.includes('typeId')) {
          throw new Error('El tipo de evento seleccionado no existe');
        }
        throw new Error('Error de relación: uno de los IDs proporcionados no existe');
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
      const deleted = await prisma.service.delete({
        where: { id: eventId }
      });
      return deleted;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener estadísticas de eventos
   */
  async getStats() {
    const [total, programado, finalizado, cancelado, pausado, byCategory] = await Promise.all([
      prisma.service.count(),
      prisma.service.count({ where: { status: 'Programado' } }),
      prisma.service.count({ where: { status: 'Finalizado' } }),
      prisma.service.count({ where: { status: 'Cancelado' } }),
      prisma.service.count({ where: { status: 'Pausado' } }),
      prisma.service.groupBy({
        by: ['categoryId'],
        _count: {
          id: true
        }
      })
    ]);

    return {
      total,
      programado,
      finalizado,
      cancelado,
      pausado,
      byCategory
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
          description: true
        },
        orderBy: {
          name: 'asc'
        }
      }),
      prisma.serviceType.findMany({
        select: {
          id: true,
          name: true,
          description: true
        },
        orderBy: {
          name: 'asc'
        }
      })
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
            notIn: ['Finalizado', 'Cancelado']
          }
        },
        select: {
          id: true,
          name: true,
          endDate: true,
          endTime: true,
          status: true
        }
      });

      // Filtrar manualmente los eventos que deben finalizarse
      const now = new Date();
      const currentDateObj = new Date(currentDate);
      currentDateObj.setHours(0, 0, 0, 0);

      const eventsToFinalize = events.filter(event => {
        const eventEndDate = new Date(event.endDate);
        eventEndDate.setHours(0, 0, 0, 0);

        // Si la fecha de fin es anterior a hoy, finalizar
        if (eventEndDate < currentDateObj) {
          return true;
        }

        // Si la fecha de fin es hoy, verificar la hora
        if (eventEndDate.getTime() === currentDateObj.getTime()) {
          // Comparar horas (formato HH:MM)
          const [eventHour, eventMin] = event.endTime.split(':').map(Number);
          const [currentHour, currentMin] = currentTime.split(':').map(Number);
          
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
      console.error('Error finding events to finalize:', error);
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
            in: eventIds
          }
        },
        data: {
          status: newStatus
        }
      });
    } catch (error) {
      console.error('Error updating multiple statuses:', error);
      throw error;
    }
  }
}

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
        throw new Error('El evento no fue encontrado.');
      }
      throw error;
    }
  }

  /**
   * Eliminar evento físicamente
   */
  async delete(id) {
    return await prisma.service.delete({
      where: { id: parseInt(id) }
    });
  }

  /**
   * Obtener estadísticas de eventos
   */
  async getStats() {
    const [total, programado, finalizado, cancelado, enPausa, byCategory] = await Promise.all([
      prisma.service.count(),
      prisma.service.count({ where: { status: 'Programado' } }),
      prisma.service.count({ where: { status: 'Finalizado' } }),
      prisma.service.count({ where: { status: 'Cancelado' } }),
      prisma.service.count({ where: { status: 'En_pausa' } }),
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
      enPausa,
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
}

import { PrismaClient } from '../../../../generated/prisma/index.js';

const prisma = new PrismaClient();

export class TemporaryWorkersRepository {
  /**
   * Obtener todas las personas temporales con paginación y filtros
   */
  async findAll({ page = 1, limit = 10, search = '', status = '', personType = '' }) {
    try {
      const skip = (page - 1) * limit;
    
    // Construir filtros
    const where = {};
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { identification: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (personType) {
      where.personType = personType;
    }

    // Obtener datos con paginación
    const [temporaryPersons, total] = await Promise.all([
      prisma.temporaryPerson.findMany({
        where,
        skip,
        take: limit,
        include: {
          documentType: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.temporaryPerson.count({ where })
    ]);

      return {
        temporaryPersons,
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
   * Obtener persona temporal por ID
   */
  async findById(id) {
    return await prisma.temporaryPerson.findUnique({
      where: { id: parseInt(id) },
      include: {
        documentType: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }

  /**
   * Crear nueva persona temporal
   */
  async create(data) {
    try {
      return await prisma.temporaryPerson.create({
        data,
        include: {
          documentType: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    } catch (error) {
      if (error.code === 'P2002') {
        // Error de constraint único
        const field = error.meta?.target?.[0];
        if (field === 'identification') {
          throw new Error('La identificación ya está en uso por otra persona temporal.');
        } else if (field === 'email') {
          throw new Error('El email ya está en uso por otra persona temporal.');
        }
        throw new Error('Ya existe una persona temporal con estos datos.');
      }
      throw error;
    }
  }

  /**
   * Actualizar persona temporal
   */
  async update(id, data) {
    try {
      return await prisma.temporaryPerson.update({
        where: { id: parseInt(id) },
        data,
        include: {
          documentType: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    } catch (error) {
      if (error.code === 'P2002') {
        // Error de constraint único
        const field = error.meta?.target?.[0];
        if (field === 'identification') {
          throw new Error('La identificación ya está en uso por otra persona temporal.');
        } else if (field === 'email') {
          throw new Error('El email ya está en uso por otra persona temporal.');
        }
        throw new Error('Ya existe una persona temporal con estos datos.');
      } else if (error.code === 'P2025') {
        throw new Error('La persona temporal no fue encontrada.');
      }
      throw error;
    }
  }

  /**
   * Eliminar persona temporal (soft delete)
   */
  async delete(id) {
    return await prisma.temporaryPerson.update({
      where: { id: parseInt(id) },
      data: { status: 'Inactive' }
    });
  }

  /**
   * Eliminar persona temporal físicamente (hard delete)
   */
  async hardDelete(id) {
    return await prisma.temporaryPerson.delete({
      where: { id: parseInt(id) }
    });
  }

  /**
   * Verificar si existe identificación duplicada
   */
  async findByIdentification(identification, excludeId = null) {
    const where = { identification };
    if (excludeId) {
      where.id = { not: parseInt(excludeId) };
    }
    
    return await prisma.temporaryPerson.findFirst({ where });
  }

  /**
   * Verificar si existe email duplicado
   */
  async findByEmail(email, excludeId = null) {
    const where = { email };
    if (excludeId) {
      where.id = { not: parseInt(excludeId) };
    }
    
    return await prisma.temporaryPerson.findFirst({ where });
  }

  /**
   * Obtener estadísticas de personas temporales
   */
  async getStats() {
    const [total, active, inactive, byType] = await Promise.all([
      prisma.temporaryPerson.count(),
      prisma.temporaryPerson.count({ where: { status: 'Active' } }),
      prisma.temporaryPerson.count({ where: { status: 'Inactive' } }),
      prisma.temporaryPerson.groupBy({
        by: ['personType'],
        _count: {
          id: true
        }
      })
    ]);

    const typeStats = byType.reduce((acc, item) => {
      acc[item.personType.toLowerCase()] = item._count.id;
      return acc;
    }, {});

    return {
      total,
      active,
      inactive,
      deportista: typeStats.deportista || 0,
      entrenador: typeStats.entrenador || 0,
      participante: typeStats.participante || 0
    };
  }

  /**
   * Obtener datos de referencia
   */
  async getReferenceData() {
    const documentTypes = await prisma.documentType.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return { documentTypes };
  }
}
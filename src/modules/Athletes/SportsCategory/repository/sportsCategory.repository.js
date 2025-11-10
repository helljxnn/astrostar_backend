import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SportsCategoryService {
  
  // Obtener todas las categorías deportivas con paginación y búsqueda
  async getAllSportsCategories({ page = 1, limit = 10, search = '' }) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { nombre: { contains: search, mode: 'insensitive' } },
            { descripcion: { contains: search, mode: 'insensitive' } },
            { estado: { equals: search, mode: 'insensitive' } }
          ]
        }
      : {};

    const [categories, total] = await Promise.all([
      prisma.sportsCategory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              inscriptions: true,
              participants: true
            }
          }
        }
      }),
      prisma.sportsCategory.count({ where })
    ]);

    return {
      categories,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    };
  }

  // Crear nueva categoría deportiva
  async createSportsCategory(data) {
    // Verificar si el nombre ya existe
    const existingCategory = await prisma.sportsCategory.findFirst({
      where: {
        nombre: {
          equals: data.nombre,
          mode: 'insensitive'
        }
      }
    });

    if (existingCategory) {
      throw new Error(`La categoría deportiva "${data.nombre}" ya existe en el sistema.`);
    }

    // Validar rango de edades
    if (data.edadMinima >= data.edadMaxima) {
      throw new Error('La edad máxima debe ser mayor que la edad mínima.');
    }

    return await prisma.sportsCategory.create({
      data: {
        nombre: data.nombre,
        edadMinima: data.edadMinima,
        edadMaxima: data.edadMaxima,
        descripcion: data.descripcion,
        archivo: data.archivo,
        estado: data.estado,
        publicar: data.publicar
      }
    });
  }

  // Obtener categoría deportiva por ID
  async getSportsCategoryById(id) {
    return await prisma.sportsCategory.findUnique({
      where: { id },
      include: {
        inscriptions: {
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
            }
          }
        },
        participants: {
          include: {
            service: {
              select: {
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            inscriptions: true,
            participants: true
          }
        }
      }
    });
  }

  // Actualizar categoría deportiva
  async updateSportsCategory(id, data) {
    // Verificar que la categoría existe
    const category = await prisma.sportsCategory.findUnique({
      where: { id }
    });

    if (!category) {
      return null;
    }

    // Si se está actualizando el nombre, verificar que no exista
    if (data.nombre && data.nombre !== category.nombre) {
      const existingCategory = await prisma.sportsCategory.findFirst({
        where: {
          nombre: {
            equals: data.nombre,
            mode: 'insensitive'
          },
          NOT: { id }
        }
      });

      if (existingCategory) {
        throw new Error(`El nombre "${data.nombre}" ya está en uso por otra categoría deportiva.`);
      }
    }

    // Validar rango de edades si se están actualizando
    const newEdadMinima = data.edadMinima ?? category.edadMinima;
    const newEdadMaxima = data.edadMaxima ?? category.edadMaxima;

    if (newEdadMinima >= newEdadMaxima) {
      throw new Error('La edad máxima debe ser mayor que la edad mínima.');
    }

    // Filtrar campos undefined para actualización parcial
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );

    return await prisma.sportsCategory.update({
      where: { id },
      data: updateData
    });
  }

  // Eliminar categoría deportiva
  async deleteSportsCategory(id) {
    const category = await prisma.sportsCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            inscriptions: true,
            participants: true
          }
        }
      }
    });

    if (!category) {
      return {
        success: false,
        message: `No se encontró la categoría deportiva con ID ${id}.`,
        statusCode: 404
      };
    }

    // No permitir eliminar si está en estado Activo
    if (category.estado === 'Activo') {
      return {
        success: false,
        message: 'No se pueden eliminar categorías con estado "Activo". Primero cambie el estado a "Inactivo".',
        statusCode: 400
      };
    }

    // Verificar si tiene inscripciones o participantes
    if (category._count.inscriptions > 0 || category._count.participants > 0) {
      return {
        success: false,
        message: `No se puede eliminar la categoría "${category.nombre}" porque tiene ${category._count.inscriptions} inscripción(es) y ${category._count.participants} participante(s) asociados.`,
        statusCode: 400
      };
    }

    await prisma.sportsCategory.delete({
      where: { id }
    });

    return {
      success: true,
      message: `La categoría deportiva "${category.nombre}" ha sido eliminada exitosamente.`
    };
  }

  // Obtener estadísticas de categorías deportivas
  async getSportsCategoryStats() {
    const [total, activas, inactivas] = await Promise.all([
      prisma.sportsCategory.count(),
      prisma.sportsCategory.count({ where: { estado: 'Activo' } }),
      prisma.sportsCategory.count({ where: { estado: 'Inactivo' } })
    ]);

    return {
      total,
      activas,
      inactivas
    };
  }

  // Verificar si existe una categoría con el mismo nombre
  async checkCategoryNameExists(nombre, excludeId = null) {
    const where = {
      nombre: {
        equals: nombre,
        mode: 'insensitive'
      }
    };

    if (excludeId) {
      where.NOT = { id: excludeId };
    }

    return await prisma.sportsCategory.findFirst({ where });
  }

  // Obtener atletas inscritos en una categoría
  async getAthletesByCategory(categoryId) {
    const inscriptions = await prisma.inscription.findMany({
      where: {
        sportsCategoryId: categoryId,
        status: 'Active'
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
                email: true,
                phoneNumber: true,
                birthDate: true
              }
            }
          }
        }
      },
      orderBy: {
        inscriptionDate: 'desc'
      }
    });

    return inscriptions.map(inscription => ({
      id: inscription.athlete.id,
      nombre: `${inscription.athlete.user.firstName} ${inscription.athlete.user.middleName || ''} ${inscription.athlete.user.lastName} ${inscription.athlete.user.secondLastName || ''}`.trim(),
      email: inscription.athlete.user.email,
      telefono: inscription.athlete.user.phoneNumber,
      fechaNacimiento: inscription.athlete.user.birthDate,
      fechaInscripcion: inscription.inscriptionDate,
      fechaVencimiento: inscription.expirationDate,
      estado: inscription.status
    }));
  }
}
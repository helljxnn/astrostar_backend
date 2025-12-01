import prisma from "../../../../config/database.js";

export class GuardiansRepository {
  
  transformToFrontend(guardian) {
    if (!guardian) return null;

    return {
      id: guardian.id,
      nombreCompleto: `${guardian.firstName} ${guardian.lastName}`,
      tipoDocumento: guardian.documentType?.name || '',
      identificacion: guardian.identification,
      correo: guardian.email,
      telefono: guardian.phone,
      fechaNacimiento: null, // Guardian no tiene fecha de nacimiento en el modelo actual
      estado: 'Activo', // Guardian no tiene estado en el modelo actual
      createdAt: guardian.createdAt,
      updatedAt: guardian.updatedAt,
    };
  }

  transformToBackend(guardianData) {
    const [firstName, ...lastNameParts] = guardianData.nombreCompleto?.trim().split(' ') || [];
    const lastName = lastNameParts.join(' ') || firstName;

    return {
      firstName: firstName || '',
      lastName: lastName,
      identification: guardianData.identification?.trim(),
      email: guardianData.email?.trim(),
      phone: guardianData.phoneNumber?.trim(),
      address: guardianData.address || 'N/A',
      occupation: guardianData.occupation || null,
    };
  }

  async create(guardianData) {
    try {
      const transformed = this.transformToBackend(guardianData);

      // Validar que el tipo de documento existe
      const documentType = await prisma.documentType.findUnique({
        where: { id: parseInt(guardianData.documentTypeId) }
      });

      if (!documentType) {
        throw new Error(`Tipo de documento con ID "${guardianData.documentTypeId}" no encontrado`);
      }

      const newGuardian = await prisma.guardian.create({
        data: {
          ...transformed,
          documentTypeId: parseInt(guardianData.documentTypeId),
        },
        include: {
          documentType: true
        }
      });

      return this.transformToFrontend(newGuardian);
    } catch (error) {
      console.error('❌ Error en create():', error.message);
      throw error;
    }
  }

  async update(id, guardianData) {
    try {
      const transformed = this.transformToBackend(guardianData);

      // Si se actualiza el tipo de documento, buscar el ID
      let documentTypeId;
      if (guardianData.tipoDocumento) {
        const documentType = await prisma.documentType.findFirst({
          where: { name: guardianData.tipoDocumento }
        });
        if (documentType) {
          documentTypeId = documentType.id;
        }
      }

      const updateData = { ...transformed };
      if (documentTypeId) {
        updateData.documentTypeId = documentTypeId;
      }

      const updatedGuardian = await prisma.guardian.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          documentType: true
        }
      });

      return this.transformToFrontend(updatedGuardian);
    } catch (error) {
      console.error('Error en update():', error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const deletedGuardian = await prisma.guardian.delete({
        where: { id: parseInt(id) },
      });

      return {
        nombreCompleto: `${deletedGuardian.firstName} ${deletedGuardian.lastName}`,
      };
    } catch (error) {
      console.error('Error en delete():', error);
      throw error;
    }
  }

  async findAll({ page = 1, limit = 10, search = '', status = '' }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { identification: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Guardian no tiene campo de estado en el modelo actual

    const [guardians, total] = await Promise.all([
      prisma.guardian.findMany({
        where,
        skip,
        take: limit,
        include: {
          documentType: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.guardian.count({ where })
    ]);

    const transformedGuardians = guardians.map(guardian => this.transformToFrontend(guardian));

    return {
      guardians: transformedGuardians,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  async findById(id) {
    const guardian = await prisma.guardian.findUnique({
      where: { id: parseInt(id) },
      include: {
        documentType: true
      }
    });

    return guardian ? this.transformToFrontend(guardian) : null;
  }

  async findByDocument(identificacion, excludeId = null) {
    const where = { identification: identificacion };
    if (excludeId) where.id = { not: parseInt(excludeId) };
    return await prisma.guardian.findFirst({ where });
  }

  async hasAssociatedAthletes(id) {
    const count = await prisma.athlete.count({
      where: { guardianId: parseInt(id) }
    });
    return count > 0;
  }

  async getStats() {
    const total = await prisma.guardian.count();

    // Guardian no tiene estado, así que todos se consideran activos
    return {
      total,
      activos: total,
      inactivos: 0,
    };
  }
}

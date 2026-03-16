import prisma from "../../../../config/database.js";

export class GuardiansRepository {
  
  transformToFrontend(guardian) {
    if (!guardian) return null;

    return {
      id: guardian.id,
      nombreCompleto: `${guardian.firstName} ${guardian.lastName}`,
      tipoDocumento: guardian.documentType?.name || '',
      documentTypeId: guardian.documentTypeId,
      identificacion: guardian.identification,
      correo: guardian.email,
      telefono: guardian.phone,
      fechaNacimiento: guardian.birthDate ? guardian.birthDate.toISOString().split('T')[0] : null,
      estado: 'Activo',
      createdAt: guardian.createdAt,
      updatedAt: guardian.updatedAt,
      firstName: guardian.firstName,
      lastName: guardian.lastName,
      email: guardian.email,
      phoneNumber: guardian.phone,
      identification: guardian.identification,
      birthDate: guardian.birthDate,
      address: guardian.address || '',
      statusAssignedAt: guardian.statusAssignedAt,
    };
  }

  transformToBackend(guardianData) {
    const [firstName, ...lastNameParts] = guardianData.nombreCompleto?.trim().split(' ') || [];
    const lastName = lastNameParts.join(' ') || firstName;

    return {
      firstName: firstName || guardianData.firstName || '',
      lastName: lastName || guardianData.lastName || '',
      identification: guardianData.identification?.trim() || guardianData.identificacion?.trim(),
      email: guardianData.email?.trim() || guardianData.correo?.trim(),
      phone: guardianData.phone?.trim() || guardianData.phoneNumber?.trim() || guardianData.telefono?.trim(),
      address: guardianData.address || guardianData.direccion || 'N/A',
      occupation: guardianData.occupation || null,
      birthDate: guardianData.birthDate ? (() => {
        const date = new Date(guardianData.birthDate);
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
      })() : null,
    };
  }

  async create(guardianData) {
    try {
      
      const transformed = this.transformToBackend(guardianData);

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
          statusAssignedAt: new Date(),
        },
        include: {
          documentType: true
        }
      });

      const result = this.transformToFrontend(newGuardian);
      
      return result;
    } catch (error) {
      console.error('❌ Error en create():', error.message);
      throw error;
    }
  }

  async update(id, guardianData) {
    try {
      
      const transformed = this.transformToBackend(guardianData);

      let documentTypeId;
      if (guardianData.documentTypeId) {
        documentTypeId = parseInt(guardianData.documentTypeId);
        
        const documentType = await prisma.documentType.findUnique({
          where: { id: documentTypeId }
        });
        
        if (!documentType) {
          throw new Error(`Tipo de documento con ID "${documentTypeId}" no encontrado`);
        }
      } else if (guardianData.tipoDocumento) {
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

      const result = this.transformToFrontend(updatedGuardian);

      return result;
    } catch (error) {
      console.error('❌ Error en update():', error.message);
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
      console.error('❌ Error en delete():', error);
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

  async getMinorAthletes(guardianId) {
    // Obtener deportistas asociados a este acudiente
    const athletes = await prisma.athlete.findMany({
      where: { guardianId: parseInt(guardianId) },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            birthDate: true,
          }
        }
      }
    });

    // Filtrar solo los menores de 18 años
    const today = new Date();
    const minorAthletes = athletes.filter(athlete => {
      if (!athlete.user?.birthDate) return false;
      
      const birthDate = new Date(athlete.user.birthDate);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age < 18;
    });

    return minorAthletes;
  }

  async getStats() {
    const total = await prisma.guardian.count();

    return {
      total,
      activos: total,
      inactivos: 0,
    };
  }

  async findByEmail(email, excludeId = null) {
    const where = { email: email };
    if (excludeId) where.id = { not: parseInt(excludeId) };
    return await prisma.guardian.findFirst({ where });
  }

  async findByIdentification(identification, excludeId = null) {
    const where = { identification: identification };
    if (excludeId) where.id = { not: parseInt(excludeId) };
    return await prisma.guardian.findFirst({ where });
  }
}


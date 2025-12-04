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
      birthDate: guardianData.birthDate ? new Date(guardianData.birthDate) : null,
    };
  }

  async create(guardianData) {
    try {
      console.log('📥 Repository create - datos recibidos:', guardianData);
      
      const transformed = this.transformToBackend(guardianData);
      console.log('🔄 Datos transformados:', transformed);

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

      console.log('✅ Guardian creado:', newGuardian);
      const result = this.transformToFrontend(newGuardian);
      console.log('📤 Datos para frontend:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error en create():', error.message);
      throw error;
    }
  }

  async update(id, guardianData) {
    try {
      console.log('📥 Repository update - ID:', id, 'Datos:', guardianData);
      
      const transformed = this.transformToBackend(guardianData);
      console.log('🔄 Datos transformados:', transformed);

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

      console.log('💾 Actualizando en BD:', updateData);

      const updatedGuardian = await prisma.guardian.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          documentType: true
        }
      });

      console.log('✅ Guardian actualizado:', updatedGuardian);
      const result = this.transformToFrontend(updatedGuardian);
      console.log('📤 Datos para frontend:', result);

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

  async getStats() {
    const total = await prisma.guardian.count();

    return {
      total,
      activos: total,
      inactivos: 0,
    };
  }
}
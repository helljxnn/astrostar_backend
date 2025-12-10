import prisma from "../../../config/database.js";

export class AthletesRepository {
  
  transformToFrontend(athlete) {
    if (!athlete) return null;

    // Obtener la inscripción más reciente
    const currentInscription = athlete.inscriptions && athlete.inscriptions.length > 0
      ? athlete.inscriptions.sort((a, b) => new Date(b.inscriptionDate) - new Date(a.inscriptionDate))[0]
      : null;

    // Mapear el estado de inscripción
    const mapInscriptionStatus = (status) => {
      const statusMap = {
        'Active': 'Vigente',
        'Suspended': 'Suspendida',
        'Expired': 'Vencida'
      };
      return statusMap[status] || status;
    };

    // Calcular edad
    const calculateAge = (birthDate) => {
      if (!birthDate) return null;
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };

    // Formatear fecha para input type="date"
    const formatDateForInput = (date) => {
      if (!date) return null;
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      id: athlete.id,
      firstName: athlete.user?.firstName || '',
      middleName: athlete.user?.middleName || '',
      lastName: athlete.user?.lastName || '',
      secondLastName: athlete.user?.secondLastName || '',
      documentTypeId: athlete.user?.documentTypeId,
      documentTypeName: athlete.user?.documentType?.name || '',
      identification: athlete.user?.identification || '',
      email: athlete.user?.email || '',
      phoneNumber: athlete.user?.phoneNumber || '',
      birthDate: formatDateForInput(athlete.user?.birthDate),
      age: athlete.user?.age || calculateAge(athlete.user?.birthDate),
      address: athlete.user?.address || '',
      categoria: currentInscription?.sportsCategory?.nombre || '',
      estado: athlete.status === 'Active' ? 'Activo' : 'Inactivo',
      acudiente: athlete.guardianId,
      parentesco: athlete.relationship || athlete.otherRelationship,
      estadoInscripcion: currentInscription ? mapInscriptionStatus(currentInscription.status) : "Sin inscripción",
      inscripciones: (athlete.inscriptions || []).map(ins => ({
        id: ins.id,
        fechaInscripcion: ins.inscriptionDate,
        estado: mapInscriptionStatus(ins.status),
        estadoAnterior: ins.previousStatus ? mapInscriptionStatus(ins.previousStatus) : null,
        categoria: ins.sportsCategory?.nombre || '',
        concepto: ins.concept,
        fechaConcepto: ins.conceptDate,
        tipo: ins.type,
        comprobantePago: ins.paymentProofUrl ? {
          url: ins.paymentProofUrl,
          nombreArchivo: ins.paymentProofName,
          fechaSubida: ins.paymentProofUploadedAt,
          tipo: ins.paymentProofType,
          tamaño: 0
        } : null
      })),
      createdAt: athlete.createdAt,
      updatedAt: athlete.updatedAt,
      statusAssignedAt: athlete.statusAssignedAt,
    };
  }

  transformToBackend(athleteData) {
    // Mapear el parentesco
    const mapRelationship = (parentesco) => {
      const relationshipMap = {
        'Madre': 'Mother',
        'Padre': 'Father',
        'Abuelo/a': 'Grandparent',
        'Tío/a': 'Uncle_Aunt',
        'Hermano/a': 'Sibling',
        'Primo/a': 'Cousin',
        'Tutor/a Legal': 'Legal_Guardian',
        'Vecino/a': 'Neighbor',
        'Amigo/a de la familia': 'Family_Friend',
        'Otro': 'Other'
      };
      return relationshipMap[parentesco] || null;
    };

    // Calcular edad automáticamente
    const calculateAge = (birthDate) => {
      if (!birthDate) return null;
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };

    const userData = {
      firstName: athleteData.firstName?.trim(),
      middleName: athleteData.middleName?.trim() || null,
      lastName: athleteData.lastName?.trim(),
      secondLastName: athleteData.secondLastName?.trim() || null,
      email: athleteData.email?.trim(),
      phoneNumber: athleteData.phoneNumber?.trim(),
      identification: athleteData.identification?.trim(),
      documentTypeId: athleteData.documentTypeId ? parseInt(athleteData.documentTypeId) : null,
      birthDate: athleteData.birthDate ? new Date(athleteData.birthDate) : null,
      age: athleteData.birthDate ? calculateAge(athleteData.birthDate) : null,
      address: athleteData.address || 'N/A',
      passwordHash: 'temp_password_hash', // Se debe generar un hash real
    };

    const athleteSpecificData = {
      status: athleteData.estado === 'Activo' ? 'Active' : 'Inactive',
      guardianId: athleteData.acudiente ? parseInt(athleteData.acudiente) : null,
      relationship: mapRelationship(athleteData.parentesco),
      otherRelationship: athleteData.parentesco && !mapRelationship(athleteData.parentesco) ? athleteData.parentesco : null,
    };

    return { userData, athleteSpecificData };
  }

  async create(athleteData) {
    try {
      console.log('📥 Datos recibidos en repository:', JSON.stringify(athleteData, null, 2));

      const { userData, athleteSpecificData } = this.transformToBackend(athleteData);
      
      // Si hay contraseña temporal, hashearla
      if (athleteData.temporaryPassword) {
        const bcrypt = await import('bcrypt');
        userData.passwordHash = await bcrypt.default.hash(athleteData.temporaryPassword, 10);
      }
      
      console.log('🔄 userData transformado:', JSON.stringify(userData, null, 2));
      console.log('🔄 athleteSpecificData transformado:', JSON.stringify(athleteSpecificData, null, 2));

      // Validar que el tipo de documento existe
      console.log('🔍 Validando documentTypeId:', athleteData.documentTypeId);
      const documentType = await prisma.documentType.findUnique({
        where: { id: parseInt(athleteData.documentTypeId) }
      });

      if (!documentType) {
        throw new Error(`Tipo de documento con ID "${athleteData.documentTypeId}" no encontrado`);
      }
      console.log('✅ Tipo de documento encontrado:', documentType.name);

      // Buscar la categoría deportiva
      const sportsCategory = await prisma.sportsCategory.findFirst({
        where: { nombre: athleteData.categoria }
      });

      if (!sportsCategory) {
        throw new Error(`Categoría deportiva "${athleteData.categoria}" no encontrada`);
      }

      // Buscar o crear rol de atleta
      let athleteRole = await prisma.role.findFirst({
        where: { name: 'Athlete' }
      });

      if (!athleteRole) {
        athleteRole = await prisma.role.create({
          data: {
            name: 'Athlete',
            description: 'Rol de deportista',
            status: 'Active'
          }
        });
      }

      return await prisma.$transaction(async (tx) => {
        // Crear usuario
        const newUser = await tx.user.create({
          data: {
            ...userData,
            roleId: athleteRole.id,
          },
        });

        console.log('✅ Usuario creado con ID:', newUser.id);

        // Crear atleta
        const newAthlete = await tx.athlete.create({
          data: {
            userId: newUser.id,
            ...athleteSpecificData,
            currentInscriptionStatus: athleteData.estado === "Inactivo" ? "Suspended" : "Active",
            statusAssignedAt: new Date(),
          },
        });

        console.log('✅ Atleta creado con ID:', newAthlete.id);

        // Crear inscripción inicial
        const inscriptionStatus = athleteData.estado === "Inactivo" ? "Suspended" : "Active";
        const inscriptionConcept = athleteData.estado === "Inactivo"
          ? "Inscripción inicial suspendida - Deportista inactivo"
          : "Inscripción inicial";

        const expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);

        await tx.inscription.create({
          data: {
            athleteId: newAthlete.id,
            sportsCategoryId: sportsCategory.id,
            type: "initial_inscription",
            status: inscriptionStatus,
            inscriptionDate: new Date(),
            conceptDate: new Date(),
            expirationDate: expirationDate,
            concept: inscriptionConcept,
          },
        });

        // Obtener atleta completo con relaciones
        const createdAthlete = await tx.athlete.findUnique({
          where: { id: newAthlete.id },
          include: {
            user: {
              include: {
                documentType: true
              }
            },
            guardian: true,
            inscriptions: {
              include: {
                sportsCategory: true
              },
              orderBy: { inscriptionDate: 'desc' }
            },
          },
        });

        return this.transformToFrontend(createdAthlete);
      });
    } catch (error) {
      console.error('❌ Error en create():', error.message);
      throw error;
    }
  }

  async update(id, athleteData) {
    try {
      const { userData, athleteSpecificData } = this.transformToBackend(athleteData);

      return await prisma.$transaction(async (tx) => {
        // Obtener el atleta actual
        const currentAthlete = await tx.athlete.findUnique({
          where: { id: parseInt(id) },
          include: { user: true, inscriptions: { orderBy: { inscriptionDate: 'desc' } } }
        });

        if (!currentAthlete) {
          throw new Error('Atleta no encontrado');
        }

        // Actualizar usuario
        await tx.user.update({
          where: { id: currentAthlete.userId },
          data: userData,
        });

        // Verificar si cambió el estado
        const statusChanged = athleteSpecificData.status && athleteSpecificData.status !== currentAthlete.status;

        // Actualizar atleta
        const updatedAthlete = await tx.athlete.update({
          where: { id: parseInt(id) },
          data: {
            ...athleteSpecificData,
            currentInscriptionStatus: athleteData.estado === "Inactivo" ? "Suspended" : athleteSpecificData.status === 'Active' ? 'Active' : currentAthlete.currentInscriptionStatus,
            ...(statusChanged && { statusAssignedAt: new Date() }),
          },
        });

        // Si se cambió el estado a Inactivo, actualizar inscripción
        if (athleteData.shouldUpdateInscription && athleteData.estado === "Inactivo") {
          const currentInscription = currentAthlete.inscriptions[0];

          if (currentInscription && currentInscription.status === "Active") {
            // Crear registro de cambio de estado
            await tx.inscription.create({
              data: {
                athleteId: parseInt(id),
                sportsCategoryId: currentInscription.sportsCategoryId,
                type: "status_change",
                status: "Suspended",
                previousStatus: "Active",
                inscriptionDate: currentInscription.inscriptionDate,
                conceptDate: new Date(),
                expirationDate: currentInscription.expirationDate,
                concept: "Suspensión automática - Deportista marcado como Inactivo",
              },
            });

            // Actualizar estado actual de inscripción
            await tx.athlete.update({
              where: { id: parseInt(id) },
              data: { currentInscriptionStatus: "Suspended" }
            });
          }
        }

        // Obtener atleta actualizado completo
        const finalAthlete = await tx.athlete.findUnique({
          where: { id: updatedAthlete.id },
          include: {
            user: {
              include: {
                documentType: true
              }
            },
            guardian: true,
            inscriptions: {
              include: {
                sportsCategory: true
              },
              orderBy: { inscriptionDate: 'desc' }
            },
          },
        });

        return this.transformToFrontend(finalAthlete);
      });
    } catch (error) {
      console.error('Error en update():', error);
      throw error;
    }
  }

  async delete(id) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Obtener atleta con usuario
        const athlete = await tx.athlete.findUnique({
          where: { id: parseInt(id) },
          include: { user: true }
        });

        if (!athlete) {
          throw new Error('Atleta no encontrado');
        }

        // Las inscripciones se eliminan automáticamente por onDelete: Cascade
        // Eliminar atleta (esto también elimina el usuario por onDelete: Cascade)
        await tx.athlete.delete({
          where: { id: parseInt(id) },
        });

        return {
          nombres: athlete.user.firstName,
          apellidos: athlete.user.lastName,
        };
      });
    } catch (error) {
      console.error('Error en delete():', error);
      throw error;
    }
  }

  async findAll({ page = 1, limit = 10, search = '', status = '', categoria = '', estadoInscripcion = '' }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { identification: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ]
      };
    }

    if (status) {
      where.status = status === 'Activo' ? 'Active' : 'Inactive';
    }

    if (estadoInscripcion) {
      const statusMap = {
        'Vigente': 'Active',
        'Suspendida': 'Suspended',
        'Vencida': 'Expired'
      };
      where.currentInscriptionStatus = statusMap[estadoInscripcion];
    }

    const [athletes, total] = await Promise.all([
      prisma.athlete.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            include: {
              documentType: true
            }
          },
          guardian: true,
          inscriptions: {
            include: {
              sportsCategory: true
            },
            orderBy: { inscriptionDate: 'desc' }
          },
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.athlete.count({ where })
    ]);

    // Filtrar por categoría si se proporciona
    let filteredAthletes = athletes;
    if (categoria) {
      filteredAthletes = athletes.filter(athlete => {
        const currentInscription = athlete.inscriptions[0];
        return currentInscription?.sportsCategory?.nombre === categoria;
      });
    }

    const transformedAthletes = filteredAthletes.map(athlete => this.transformToFrontend(athlete));

    return {
      athletes: transformedAthletes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: categoria ? filteredAthletes.length : total,
        totalPages: Math.ceil((categoria ? filteredAthletes.length : total) / limit),
        hasNext: page < Math.ceil((categoria ? filteredAthletes.length : total) / limit),
        hasPrev: page > 1
      }
    };
  }

  async findById(id) {
    const athlete = await prisma.athlete.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          include: {
            documentType: true
          }
        },
        guardian: true,
        inscriptions: {
          include: {
            sportsCategory: true
          },
          orderBy: { inscriptionDate: 'desc' }
        },
      }
    });

    return athlete ? this.transformToFrontend(athlete) : null;
  }

  async findByDocument(identification, excludeId = null) {
    const where = {
      user: {
        identification: identification
      }
    };
    if (excludeId) where.id = { not: parseInt(excludeId) };
    return await prisma.athlete.findFirst({ 
      where,
      include: { user: true }
    });
  }

  async findByEmail(email, excludeUserId = null) {
    const where = {
      email: email
    };
    if (excludeUserId) where.id = { not: parseInt(excludeUserId) };
    return await prisma.user.findFirst({ 
      where,
      include: { athlete: true }
    });
  }

  async findByIdentification(identification, excludeUserId = null) {
    const where = {
      identification: identification
    };
    if (excludeUserId) where.id = { not: parseInt(excludeUserId) };
    return await prisma.user.findFirst({ 
      where,
      include: { athlete: true }
    });
  }

  async changeStatus(id, status) {
    try {
      const updatedAthlete = await prisma.athlete.update({
        where: { id: parseInt(id) },
        data: { 
          status: status === 'Activo' ? 'Active' : 'Inactive'
        },
        include: {
          user: {
            include: {
              documentType: true
            }
          },
          guardian: true,
          inscriptions: {
            include: {
              sportsCategory: true
            },
            orderBy: { inscriptionDate: 'desc' }
          },
        }
      });

      return this.transformToFrontend(updatedAthlete);
    } catch (error) {
      console.error('Error en changeStatus():', error);
      throw error;
    }
  }

  async getStats() {
    const [total, activos, inactivos] = await Promise.all([
      prisma.athlete.count(),
      prisma.athlete.count({ where: { status: 'Active' } }),
      prisma.athlete.count({ where: { status: 'Inactive' } }),
    ]);

    // Estadísticas por categoría
    const inscriptionsWithCategory = await prisma.inscription.findMany({
      distinct: ['athleteId'],
      include: {
        sportsCategory: true
      },
      orderBy: { inscriptionDate: 'desc' }
    });

    const categoriaStats = inscriptionsWithCategory.reduce((acc, ins) => {
      const categoria = ins.sportsCategory?.nombre || 'Sin categoría';
      acc[categoria] = (acc[categoria] || 0) + 1;
      return acc;
    }, {});

    // Estadísticas por estado de inscripción
    const byInscripcion = await prisma.athlete.groupBy({
      by: ['currentInscriptionStatus'],
      _count: { id: true }
    });

    const inscripcionStats = byInscripcion.reduce((acc, item) => {
      const statusMap = {
        'Active': 'vigente',
        'Suspended': 'suspendida',
        'Expired': 'vencida'
      };
      const key = statusMap[item.currentInscriptionStatus] || 'sin_estado';
      acc[key] = item._count.id;
      return acc;
    }, {});

    return {
      total,
      activos,
      inactivos,
      porCategoria: categoriaStats,
      porInscripcion: inscripcionStats,
    };
  }

  async validateGuardian(guardianId) {
    const guardian = await prisma.guardian.findUnique({
      where: { id: parseInt(guardianId) }
    });
    return !!guardian;
  }

  async getReferenceData() {
    try {
      const documentTypes = await prisma.documentType.findMany({
        select: {
          id: true,
          name: true,
          description: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      const sportsCategories = await prisma.sportsCategory.findMany({
        where: {
          estado: 'Activo'
        },
        select: {
          id: true,
          nombre: true,
          edadMinima: true,
          edadMaxima: true,
          descripcion: true
        },
        orderBy: {
          edadMinima: 'asc'
        }
      });

      // Transformar al formato esperado por el frontend
      const formattedCategories = sportsCategories.map(cat => ({
        id: cat.id,
        name: cat.nombre,
        minAge: cat.edadMinima,
        maxAge: cat.edadMaxima,
        description: cat.descripcion
      }));

      return {
        documentTypes,
        sportsCategories: formattedCategories
      };
    } catch (error) {
      console.error('Error en getReferenceData():', error);
      throw error;
    }
  }

  async getDocumentTypes() {
    try {
      // Tipos de documento permitidos para deportistas
      const allowedDocumentTypes = [
        'Registro Civil',
        'Tarjeta de Identidad',
        'Cédula de Ciudadanía',
        'Cédula de Extranjería',
        'Permiso de Permanencia'
      ];

      // Obtener tipos de documento filtrados
      const documentTypes = await prisma.documentType.findMany({
        where: {
          name: {
            in: allowedDocumentTypes
          }
        },
        select: {
          id: true,
          name: true,
          description: true
        }
      });

      // Ordenar en el orden lógico de uso (por edad)
      const orderedDocumentTypes = documentTypes.sort((a, b) => {
        const order = {
          'Registro Civil': 1,           // 0-6 años
          'Tarjeta de Identidad': 2,     // 7-17 años
          'Cédula de Ciudadanía': 3,     // 18+ años
          'Cédula de Extranjería': 4,    // Extranjeros
          'Permiso de Permanencia': 5    // Casos especiales
        };
        return (order[a.name] || 999) - (order[b.name] || 999);
      });

      return orderedDocumentTypes;
    } catch (error) {
      console.error('Error en getDocumentTypes():', error);
      throw error;
    }
  }
}

// Exportar instancia para compatibilidad
export const athletesRepository = new AthletesRepository();

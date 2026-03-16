import prisma from "../../../config/database.js";

const calculateAgeFromBirthDate = (birthDate) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const normalizeAthleteStatusInput = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") return value ? "Active" : "Inactive";

  const normalized = String(value).trim().toLowerCase();
  if (["activo", "active", "true", "1"].includes(normalized)) return "Active";
  if (["inactivo", "inactive", "false", "0"].includes(normalized)) return "Inactive";
  return null;
};

export class AthletesRepository {
  transformToFrontend(athlete) {
    if (!athlete) return null;

    // Obtener la inscripción más reciente
    const currentInscription =
      athlete.inscriptions && athlete.inscriptions.length > 0
        ? athlete.inscriptions.sort(
            (a, b) => new Date(b.inscriptionDate) - new Date(a.inscriptionDate)
          )[0]
        : null;

    // Mapear el estado de inscripción
    const mapInscriptionStatus = (status) => {
      const statusMap = {
        Active: "Vigente",
        Expired: "Vencida",
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
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birth.getDate())
      ) {
        age--;
      }
      return age;
    };

    // Formatear fecha para input type="date" usando UTC para evitar problemas de zona horaria
    const formatDateForInput = (date) => {
      if (!date) return null;
      const d = new Date(date);
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Mapear relationship de inglés a español
    const mapRelationshipToSpanish = (relationship) => {
      const relationshipMap = {
        Mother: "Madre",
        Father: "Padre",
        Grandparent: "Abuelo/a",
        Uncle_Aunt: "Tío/a",
        Sibling: "Hermano/a",
        Cousin: "Primo/a",
        Legal_Guardian: "Tutor/a Legal",
        Neighbor: "Vecino/a",
        Family_Friend: "Amigo/a de la familia",
        Other: "Otro",
      };
      return relationshipMap[relationship] || null;
    };

    // Construir nombre completo
    const nombreCompleto = [
      athlete.user?.firstName,
      athlete.user?.middleName,
      athlete.user?.lastName,
      athlete.user?.secondLastName
    ].filter(Boolean).join(' ');

    return {
      id: athlete.id,
      firstName: athlete.user?.firstName || "",
      middleName: athlete.user?.middleName || "",
      lastName: athlete.user?.lastName || "",
      secondLastName: athlete.user?.secondLastName || "",
      nombreCompleto: nombreCompleto, // ✅ AGREGADO
      documentTypeId: athlete.user?.documentTypeId,
      documentTypeName: athlete.user?.documentType?.name || "",
      identification: athlete.user?.identification || "",
      email: athlete.user?.email || "",
      phoneNumber: athlete.user?.phoneNumber || "",
      birthDate: formatDateForInput(athlete.user?.birthDate),
      age: athlete.user?.age || calculateAge(athlete.user?.birthDate),
      address: athlete.user?.address || "",
      categoria: currentInscription?.sportsCategory?.nombre || "",
      estado: athlete.status === "Active" ? "Activo" : "Inactivo",
      acudiente: athlete.guardianId,
      guardian: athlete.guardian ? {
        id: athlete.guardian.id,
        nombreCompleto: `${athlete.guardian.firstName} ${athlete.guardian.lastName}`,
        firstName: athlete.guardian.firstName,
        lastName: athlete.guardian.lastName,
        identification: athlete.guardian.identification,
        email: athlete.guardian.email,
        phone: athlete.guardian.phone,
        address: athlete.guardian.address,
        birthDate: formatDateForInput(athlete.guardian.birthDate),
        documentTypeId: athlete.guardian.documentTypeId,
        tipoDocumento: athlete.guardian.documentType?.name || '',
      } : null,
      parentesco: mapRelationshipToSpanish(athlete.relationship),
      estadoInscripcion: currentInscription
        ? mapInscriptionStatus(currentInscription.status)
        : "Sin inscripción",
      inscripciones: (athlete.inscriptions || []).map((ins) => ({
        id: ins.id,
        fechaInscripcion: ins.inscriptionDate,
        estado: mapInscriptionStatus(ins.status),
        estadoAnterior: ins.previousStatus
          ? mapInscriptionStatus(ins.previousStatus)
          : null,
        categoria: ins.sportsCategory?.nombre || "",
        concepto: ins.concept,
        fechaConcepto: ins.conceptDate,
        tipo: ins.type,
        comprobantePago: ins.paymentProofUrl
          ? {
              url: ins.paymentProofUrl,
              nombreArchivo: ins.paymentProofName,
              fechaSubida: ins.paymentProofUploadedAt,
              tipo: ins.paymentProofType,
              tamaño: 0,
            }
          : null,
      })),
      matriculas: (athlete.enrollments || []).map((mat) => ({
        id: mat.id,
        fechaMatricula: mat.createdAt, // createdAt = cuando se creó la matrícula
        fechaInicio: mat.fechaInicio,
        fechaVencimiento: mat.fechaVencimiento,
        estado: mat.estado,
        observaciones: mat.observaciones,
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
        Madre: "Mother",
        Padre: "Father",
        "Abuelo/a": "Grandparent",
        "Tío/a": "Uncle_Aunt",
        "Hermano/a": "Sibling",
        "Primo/a": "Cousin",
        "Tutor/a Legal": "Legal_Guardian",
        "Vecino/a": "Neighbor",
        "Amigo/a de la familia": "Family_Friend",
        Otro: "Other",
      };
      
      // Si el parentesco existe en el mapa, usarlo
      if (relationshipMap[parentesco]) {
        return relationshipMap[parentesco];
      }
      
      // Si no existe pero hay un valor, usar "Other" como fallback
      if (parentesco && parentesco.trim() !== '') {
        return "Other";
      }
      
      // Solo devolver null si realmente no hay parentesco
      return null;
    };

    // Calcular edad automáticamente
    const calculateAge = (birthDate) => {
      if (!birthDate) return null;
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birth.getDate())
      ) {
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
      documentTypeId: athleteData.documentTypeId
        ? parseInt(athleteData.documentTypeId)
        : null,
      birthDate: athleteData.birthDate ? (() => {
        const date = new Date(athleteData.birthDate);
        // Normalizar a UTC medianoche para evitar problemas de zona horaria
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
      })() : null,
      age: athleteData.birthDate ? calculateAge(athleteData.birthDate) : null,
      address: athleteData.address || "N/A",
      passwordHash: "temp_password_hash", // Se debe generar un hash real
    };

    const normalizedStatus = normalizeAthleteStatusInput(
      athleteData.estado ?? athleteData.status ?? athleteData.isActive ?? athleteData.active
    );

    const athleteSpecificData = {
      ...(normalizedStatus ? { status: normalizedStatus } : {}),
      relationship: mapRelationship(athleteData.parentesco),
    };

    // Manejar guardianId por separado
    if (athleteData.acudiente !== undefined) {
      athleteSpecificData.guardianId = athleteData.acudiente
        ? parseInt(athleteData.acudiente)
        : null;
        
      // Si hay acudiente pero no hay parentesco, usar "Other" como fallback
      if (athleteSpecificData.guardianId && !athleteSpecificData.relationship) {
        athleteSpecificData.relationship = "Other";
      }
    }

    return { userData, athleteSpecificData };
  }

  async create(athleteData) {
    try {

      const { userData, athleteSpecificData } =
        this.transformToBackend(athleteData);

      // Si hay contraseña temporal, hashearla
      if (athleteData.temporaryPassword) {
        const bcrypt = await import("bcrypt");
        userData.passwordHash = await bcrypt.default.hash(
          athleteData.temporaryPassword,
          10
        );
      }


      // Validar que el tipo de documento existe
      const documentType = await prisma.documentType.findUnique({
        where: { id: parseInt(athleteData.documentTypeId) },
      });

      if (!documentType) {
        throw new Error(
          `Tipo de documento con ID "${athleteData.documentTypeId}" no encontrado`
        );
      }

      // Buscar la categoría deportiva
      const sportsCategory = await prisma.sportsCategory.findFirst({
        where: {
          nombre: {
            equals: athleteData.categoria,
            mode: "insensitive",
          },
        },
      });

      if (!sportsCategory) {
        throw new Error(
          `Categoría deportiva "${athleteData.categoria}" no encontrada`
        );
      }

      const athleteAge =
        userData.age ?? calculateAgeFromBirthDate(userData.birthDate);
      
      // ✅ VALIDACIÓN DE EDAD VS CATEGORÍA ELIMINADA
      // El cliente tiene control total sobre qué deportistas asignar a qué categorías
      // Sin restricciones de edad

      // Buscar o crear rol de atleta
      let athleteRole = await prisma.role.findFirst({
        where: { name: "Deportista" },
      });

      if (!athleteRole) {
        athleteRole = await prisma.role.create({
          data: {
            name: "Deportista",
            description: "Rol de deportista",
            status: "Active",
          },
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


        // Crear atleta
        const newAthlete = await tx.athlete.create({
          data: {
            userId: newUser.id,
            ...athleteSpecificData,
            currentInscriptionStatus:
              athleteData.estado === "Inactivo" ? "Suspended" : "Active",
            statusAssignedAt: new Date(),
          },
        });


        // Crear inscripción inicial
        const inscriptionStatus =
          athleteData.estado === "Inactivo" ? "Suspended" : "Active";
        const inscriptionConcept =
          athleteData.estado === "Inactivo"
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
                documentType: true,
              },
            },
            guardian: true,
            inscriptions: {
              include: {
                sportsCategory: true,
              },
              orderBy: { inscriptionDate: "desc" },
            },
          },
        });

        return this.transformToFrontend(createdAthlete);
      });
    } catch (error) {
      console.error("❌ Error en create():", error.message);
      throw error;
    }
  }

  async update(id, athleteData) {
    try {
      const { userData, athleteSpecificData } =
        this.transformToBackend(athleteData);

      return await prisma.$transaction(async (tx) => {
        // Obtener el atleta actual
        const currentAthlete = await tx.athlete.findUnique({
          where: { id: parseInt(id) },
          include: {
            user: true,
            inscriptions: {
              include: { sportsCategory: true },
              orderBy: { inscriptionDate: "desc" },
            },
          },
        });

        if (!currentAthlete) {
          throw new Error("Atleta no encontrado");
        }

        // ✅ VALIDACIÓN DE EDAD VS CATEGORÍA ELIMINADA
        // El cliente tiene control total sobre qué deportistas asignar a qué categorías
        // Sin restricciones de edad

        // ✅ CORRECCIÓN CRÍTICA: NO actualizar passwordHash a menos que haya nueva contraseña
        // Eliminar passwordHash de userData para evitar sobrescribir la contraseña existente
        const { passwordHash, ...userDataWithoutPassword } = userData;

        // Actualizar usuario SIN tocar el passwordHash
        await tx.user.update({
          where: { id: currentAthlete.userId },
          data: userDataWithoutPassword,
        });

        // Verificar si cambió el estado
        const statusChanged =
          athleteSpecificData.status &&
          athleteSpecificData.status !== currentAthlete.status;

        // Preparar datos de actualización del atleta
        const updateData = {
          ...(athleteSpecificData.status ? { status: athleteSpecificData.status } : {}),
          relationship: athleteSpecificData.relationship,
          ...(athleteData.estado
            ? {
                currentInscriptionStatus:
                  athleteData.estado === "Inactivo"
                    ? "Suspended"
                    : athleteSpecificData.status === "Active"
                    ? "Active"
                    : currentAthlete.currentInscriptionStatus,
              }
            : {}),
          ...(statusChanged && { statusAssignedAt: new Date() }),
        };

        // Solo incluir guardianId si está definido en athleteSpecificData
        if ("guardianId" in athleteSpecificData) {
          updateData.guardianId = athleteSpecificData.guardianId;
        }

        // Actualizar atleta
        const updatedAthlete = await tx.athlete.update({
          where: { id: parseInt(id) },
          data: updateData,
        });

        // Sincronizar estado en users si se actualizó el estado del atleta
        if (athleteSpecificData.status) {
          await tx.user.update({
            where: { id: currentAthlete.userId },
            data: { status: athleteSpecificData.status },
          });
        }

        // Si se cambió el estado a Inactivo, actualizar inscripción
        if (
          athleteData.shouldUpdateInscription &&
          athleteData.estado === "Inactivo"
        ) {
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
                concept:
                  "Suspensión automática - Deportista marcado como Inactivo",
              },
            });

            // Actualizar estado actual de inscripción
            await tx.athlete.update({
              where: { id: parseInt(id) },
              data: { currentInscriptionStatus: "Suspended" },
            });
          }
        }

        // Obtener atleta actualizado completo
        const finalAthlete = await tx.athlete.findUnique({
          where: { id: updatedAthlete.id },
          include: {
            user: {
              include: {
                documentType: true,
              },
            },
            guardian: true,
            inscriptions: {
              include: {
                sportsCategory: true,
              },
              orderBy: { inscriptionDate: "desc" },
            },
          },
        });

        return this.transformToFrontend(finalAthlete);
      });
    } catch (error) {
      console.error("Error en update():", error);
      throw error;
    }
  }

  async delete(id) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Obtener atleta con usuario
        const athlete = await tx.athlete.findUnique({
          where: { id: parseInt(id) },
          include: { user: true },
        });

        if (!athlete) {
          throw new Error("Atleta no encontrado");
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
      console.error("Error en delete():", error);
      throw error;
    }
  }

  async findAll({
      page = 1,
      limit = 10,
      search = "",
      status = "",
      categoria = "",
      estadoInscripcion = "",
    }) {
      const skip = (page - 1) * limit;

      // ✅ OPTIMIZACIÓN: Construir filtros de base de datos en lugar de filtrar en memoria
      const where = {
        AND: []
      };

      // Filtro por estado del atleta
      if (status) {
        const normalizedStatus = normalizeAthleteStatusInput(status);
        where.AND.push({
          status: normalizedStatus ?? status
        });
      }

      // Filtro por estado de inscripción
      if (estadoInscripcion) {
        const statusMap = {
          Vigente: "Active",
          Vencida: "Expired",
        };
        where.AND.push({
          currentInscriptionStatus: statusMap[estadoInscripcion]
        });
      }

      // ✅ OPTIMIZACIÓN: Filtro por categoría usando JOIN en lugar de memoria
      if (categoria) {
        where.AND.push({
          inscriptions: {
            some: {
              sportsCategory: {
                nombre: categoria
              }
            }
          }
        });
      }

      // ✅ OPTIMIZACIÓN: Búsqueda usando base de datos con índices
      if (search) {
        const searchLower = search.toLowerCase().trim().replace(/\s+/g, ' ');
        const searchWords = searchLower.split(' ');

        // Búsqueda exacta por estado
        const isStatusSearch = searchLower === "activo" || searchLower === "inactivo";
        const inscriptionStatusMap = {
          vigente: "Active",
          vencida: "Expired",
          suspendida: "Suspended",
          suspendido: "Suspended",
          pendiente: "Pending"
        };
        const inscriptionStatusSearch = inscriptionStatusMap[searchLower] || null;

        if (isStatusSearch) {
          where.AND.push({
            status: searchLower === "activo" ? "Active" : "Inactive"
          });
        } else if (inscriptionStatusSearch) {
          where.AND.push({
            currentInscriptionStatus: inscriptionStatusSearch
          });
        } else {
          // Búsqueda por múltiples campos usando OR
          const searchConditions = {
            OR: [
              // Búsqueda exacta por documento
              {
                user: {
                  identification: {
                    equals: searchLower,
                    mode: "insensitive"
                  }
                }
              },
              // Búsqueda parcial por documento
              {
                user: {
                  identification: {
                    contains: searchLower,
                    mode: "insensitive"
                  }
                }
              },
              // Búsqueda por email
              {
                user: {
                  email: {
                    contains: searchLower,
                    mode: "insensitive"
                  }
                }
              },
              // Búsqueda por teléfono
              {
                user: {
                  phoneNumber: {
                    contains: searchLower,
                    mode: "insensitive"
                  }
                }
              },
              // Búsqueda por dirección
              {
                user: {
                  address: {
                    contains: searchLower,
                    mode: "insensitive"
                  }
                }
              },
              // Búsqueda por categoría deportiva
              {
                inscriptions: {
                  some: {
                    sportsCategory: {
                      nombre: {
                        contains: searchLower,
                        mode: "insensitive"
                      }
                    }
                  }
                }
              },
              // Búsqueda por documento del acudiente
              {
                guardian: {
                  identification: {
                    contains: searchLower,
                    mode: "insensitive"
                  }
                }
              }
            ]
          };

          // ✅ OPTIMIZACIÓN: Búsqueda por nombres usando múltiples palabras
          searchWords.forEach(word => {
            searchConditions.OR.push(
              // Nombres del atleta
              {
                user: {
                  firstName: {
                    contains: word,
                    mode: "insensitive"
                  }
                }
              },
              {
                user: {
                  middleName: {
                    contains: word,
                    mode: "insensitive"
                  }
                }
              },
              {
                user: {
                  lastName: {
                    contains: word,
                    mode: "insensitive"
                  }
                }
              },
              {
                user: {
                  secondLastName: {
                    contains: word,
                    mode: "insensitive"
                  }
                }
              },
              // Nombres del acudiente
              {
                guardian: {
                  firstName: {
                    contains: word,
                    mode: "insensitive"
                  }
                }
              },
              {
                guardian: {
                  lastName: {
                    contains: word,
                    mode: "insensitive"
                  }
                }
              }
            );
          });

          where.AND.push(searchConditions);
        }
      }

      // Si no hay filtros, limpiar el array AND
      if (where.AND.length === 0) {
        delete where.AND;
      }

      // ✅ OPTIMIZACIÓN: Consulta única con paginación en base de datos
      const [athletes, total] = await Promise.all([
        prisma.athlete.findMany({
          where,
          skip,
          take: limit,
          include: {
            user: {
              include: {
                documentType: true,
              },
            },
            guardian: {
              include: {
                documentType: true,
              },
            },
            inscriptions: {
              include: {
                sportsCategory: true,
              },
              orderBy: { inscriptionDate: "desc" },
              take: 1, // ✅ OPTIMIZACIÓN: Solo traer la inscripción más reciente
            },
            enrollments: {
              orderBy: { createdAt: "desc" },
              take: 3, // ✅ OPTIMIZACIÓN: Limitar matrículas para reducir payload
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.athlete.count({ where })
      ]);

      const transformedAthletes = athletes.map((athlete) =>
        this.transformToFrontend(athlete)
      );

      return {
        athletes: transformedAthletes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      };
    }


  async findById(id) {
    const athlete = await prisma.athlete.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          include: {
            documentType: true,
          },
        },
        guardian: {
          include: {
            documentType: true,
          },
        },
        inscriptions: {
          include: {
            sportsCategory: true,
          },
          orderBy: { inscriptionDate: "desc" },
        },
        enrollments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return athlete ? this.transformToFrontend(athlete) : null;
  }

  async findByDocument(identification, excludeId = null) {
    const where = {
      user: {
        identification: identification,
      },
    };
    if (excludeId) where.id = { not: parseInt(excludeId) };
    return await prisma.athlete.findFirst({
      where,
      include: { user: true },
    });
  }

  async findByEmail(email, excludeUserId = null) {
    const where = {
      email: email,
    };
    if (excludeUserId) where.id = { not: parseInt(excludeUserId) };
    return await prisma.user.findFirst({
      where,
      include: { athlete: true },
    });
  }

  async findByIdentification(identification, excludeUserId = null) {
    const where = {
      identification: identification,
    };
    if (excludeUserId) where.id = { not: parseInt(excludeUserId) };
    return await prisma.user.findFirst({
      where,
      include: { athlete: true },
    });
  }

  async changeStatus(id, status) {
    try {
      const normalizedStatus = normalizeAthleteStatusInput(status);
      if (!normalizedStatus) {
        throw new Error('Estado inválido. Use "Activo" o "Inactivo".');
      }

      // ✅ SOLUCIÓN: Actualizar AMBAS tablas en una transacción
      const result = await prisma.$transaction(async (tx) => {
        // 1. Obtener el atleta para conseguir el userId
        const athlete = await tx.athlete.findUnique({
          where: { id: parseInt(id) },
          select: { userId: true }
        });

        if (!athlete) {
          throw new Error(`Atleta con ID ${id} no encontrado`);
        }

        // 2. Actualizar tabla athletes
        const updatedAthlete = await tx.athlete.update({
          where: { id: parseInt(id) },
          data: {
            status: normalizedStatus,
            statusAssignedAt: new Date() // ✅ Actualizar fecha de cambio de estado
          },
          include: {
            user: {
              include: {
                documentType: true,
              },
            },
            guardian: true,
            inscriptions: {
              include: {
                sportsCategory: true,
              },
              orderBy: { inscriptionDate: "desc" },
            },
          },
        });

        // 3. ✅ CRÍTICO: Actualizar tabla users para sincronizar el estado
        await tx.user.update({
          where: { id: athlete.userId },
          data: {
            status: normalizedStatus
          }
        });

        return updatedAthlete;
      });

      return this.transformToFrontend(result);
    } catch (error) {
      console.error("Error en changeStatus():", error);
      throw error;
    }
  }

  async getStats() {
    const [total, activos, inactivos] = await Promise.all([
      prisma.athlete.count(),
      prisma.athlete.count({ where: { status: "Active" } }),
      prisma.athlete.count({ where: { status: "Inactive" } }),
    ]);

    // Estadísticas por categoría
    const inscriptionsWithCategory = await prisma.inscription.findMany({
      distinct: ["athleteId"],
      include: {
        sportsCategory: true,
      },
      orderBy: { inscriptionDate: "desc" },
    });

    const categoriaStats = inscriptionsWithCategory.reduce((acc, ins) => {
      const categoria = ins.sportsCategory?.nombre || "Sin categoría";
      acc[categoria] = (acc[categoria] || 0) + 1;
      return acc;
    }, {});

    // Estadísticas por estado de inscripción
    const byInscripcion = await prisma.athlete.groupBy({
      by: ["currentInscriptionStatus"],
      _count: { id: true },
    });

    const inscripcionStats = byInscripcion.reduce((acc, item) => {
      const statusMap = {
        Active: "vigente",
        Expired: "vencida",
      };
      const key = statusMap[item.currentInscriptionStatus] || "sin_estado";
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
      where: { id: parseInt(guardianId) },
    });
    return !!guardian;
  }

  async getReferenceData() {
    try {
      const documentTypes = await prisma.documentType.findMany({
        select: {
          id: true,
          name: true,
          description: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      const sportsCategories = await prisma.sportsCategory.findMany({
        where: {
          estado: "Activo",
        },
        select: {
          id: true,
          nombre: true,
          edadMinima: true,
          edadMaxima: true,
          descripcion: true,
        },
        orderBy: {
          edadMinima: "asc",
        },
      });

      // Transformar al formato esperado por el frontend
      const formattedCategories = sportsCategories.map((cat) => ({
        id: cat.id,
        name: cat.nombre,
        minAge: cat.edadMinima,
        maxAge: cat.edadMaxima,
        description: cat.descripcion,
      }));

      return {
        documentTypes,
        sportsCategories: formattedCategories,
      };
    } catch (error) {
      console.error("Error en getReferenceData():", error);
      throw error;
    }
  }

  async getDocumentTypes() {
    try {
      // Tipos de documento permitidos para deportistas
      const allowedDocumentTypes = [
        "Registro Civil",
        "Tarjeta de Identidad",
        "Cédula de Ciudadanía",
        "Cédula de Extranjería",
        "Permiso de Permanencia",
      ];

      // Obtener tipos de documento filtrados
      const documentTypes = await prisma.documentType.findMany({
        where: {
          name: {
            in: allowedDocumentTypes,
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
        },
      });

      // Ordenar en el orden lógico de uso (por edad)
      const orderedDocumentTypes = documentTypes.sort((a, b) => {
        const order = {
          "Registro Civil": 1, // 0-6 años
          "Tarjeta de Identidad": 2, // 7-17 años
          "Cédula de Ciudadanía": 3, // 18+ años
          "Cédula de Extranjería": 4, // Extranjeros
          "Permiso de Permanencia": 5, // Casos especiales
        };
        return (order[a.name] || 999) - (order[b.name] || 999);
      });

      return orderedDocumentTypes;
    } catch (error) {
      console.error("Error en getDocumentTypes():", error);
      throw error;
    }
  }

  /**
   * Remover acudiente de un atleta (solo actualiza el atleta, no el usuario)
   */
  async removeGuardianFromAthlete(athleteId) {
    try {
      // Actualizar solo el atleta, sin tocar el usuario
      await prisma.athlete.update({
        where: { id: parseInt(athleteId) },
        data: {
          guardianId: null,
          relationship: null,
        },
      });

      // Retornar el atleta actualizado con todas las relaciones
      return await this.findById(athleteId);
    } catch (error) {
      console.error("Error en removeGuardianFromAthlete():", error);
      throw error;
    }
  }

  /**
   * Obtener todos los deportistas para reporte (SIN PAGINACIÓN)
   */
  async findAllForReport({
    search = "",
    status,
    minAge,
    maxAge,
    category,
  }) {
    const where = {};

    // Filtro de búsqueda
    if (search && search.trim()) {
      where.OR = [
        { user: { firstName: { contains: search, mode: "insensitive" } } },
        { user: { lastName: { contains: search, mode: "insensitive" } } },
        { user: { identification: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Filtro de estado
    if (status) {
      where.status = status;
    }

    // Filtro de edad mínima
    if (minAge !== undefined && minAge !== null) {
      where.user = { ...where.user, age: { ...where.user?.age, gte: parseInt(minAge) } };
    }

    // Filtro de edad máxima
    if (maxAge !== undefined && maxAge !== null) {
      where.user = { ...where.user, age: { ...where.user?.age, lte: parseInt(maxAge) } };
    }

    // Filtro de categoría
    if (category) {
      where.category = category;
    }

    const athletes = await prisma.athlete.findMany({
      where,
      include: {
        user: {
          include: {
            documentType: true,
          },
        },
        guardian: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return athletes.map((athlete) => this.transformToFrontend(athlete));
  }
}

// Exportar instancia para compatibilidad
export const athletesRepository = new AthletesRepository();

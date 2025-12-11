import prisma from "../../../config/database.js";

export class TeamsRepository {
  
  async validateTemporalPersonNotInOtherTeams(personId, excludeTeamId, errors) {
    const existingMembership = await prisma.teamMember.findFirst({
      where: {
        temporaryPersonId: personId,
        isActive: true,
        team: {
          status: 'Active',
          ...(excludeTeamId ? { id: { not: parseInt(excludeTeamId) } } : {})
        }
      },
      include: {
        team: true,
        temporaryPerson: true
      }
    });

    if (existingMembership) {
      const person = existingMembership.temporaryPerson;
      const team = existingMembership.team;
      errors.push(
        `${person.firstName} ${person.lastName} (Temporal) ya está asignado/a al equipo "${team.name}". Las personas temporales no pueden estar en múltiples equipos.`
      );
    }
  }

  async validateMembersAvailability(memberIds, teamType, excludeTeamId = null) {
    if (!memberIds || memberIds.length === 0) return;

    const errors = [];

    for (const memberId of memberIds) {
      const id = parseInt(memberId);
      if (isNaN(id)) continue;

      if (teamType === 'Temporal') {
        await this.validateTemporalPersonNotInOtherTeams(id, excludeTeamId, errors);
      } else {
        console.log(`✅ Persona de fundación ${id} puede estar en múltiples equipos`);
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join('. '));
    }
  }

  async validateTrainerAvailability(trainerId, teamType, excludeTeamId = null) {
    if (!trainerId) return;

    const id = parseInt(trainerId);
    if (isNaN(id)) return;

    if (teamType === 'Temporal') {
      const errors = [];
      await this.validateTemporalPersonNotInOtherTeams(id, excludeTeamId, errors);
      if (errors.length > 0) {
        throw new Error(errors[0]);
      }
    }
  }

  async validateTrainer(trainerId, teamType) {
    if (!trainerId) return;

    const id = parseInt(trainerId);
    if (isNaN(id)) {
      throw new Error(`ID de entrenador inválido: ${trainerId}`);
    }

    if (teamType === 'Temporal') {
      const tempPerson = await prisma.temporaryPerson.findUnique({ where: { id } });
      if (!tempPerson) {
        throw new Error(`El entrenador temporal con ID ${id} no existe`);
      }
      if (tempPerson.status !== 'Active') {
        throw new Error(`El entrenador temporal ${tempPerson.firstName} ${tempPerson.lastName} no está activo`);
      }
      if (tempPerson.personType !== 'Entrenador') {
        throw new Error(`La persona temporal con ID ${id} no es un entrenador`);
      }
    } else if (teamType === 'Fundacion') {
      const employee = await prisma.employee.findUnique({
        where: { id },
        include: { user: true }
      });
      if (!employee) {
        throw new Error(`El entrenador con ID ${id} no existe`);
      }
      if (employee.status !== 'Activo') {
        throw new Error(`El entrenador ${employee.user.firstName} ${employee.user.lastName} no está activo`);
      }
    }
  }

  async validateMembers(memberIds, teamType) {
    if (!memberIds || memberIds.length === 0) {
      return;
    }

    const errors = [];

    for (const memberId of memberIds) {
      const id = parseInt(memberId);
      if (isNaN(id)) {
        errors.push(`ID inválido: ${memberId}`);
        continue;
      }

      if (teamType === 'Temporal') {
        const tempPerson = await prisma.temporaryPerson.findUnique({ where: { id } });
        if (!tempPerson) {
          errors.push(`La persona temporal con ID ${id} no existe`);
        } else if (tempPerson.status !== 'Active') {
          errors.push(`La persona temporal ${tempPerson.firstName} ${tempPerson.lastName} no está activa`);
        }
      } else if (teamType === 'Fundacion') {
        const athlete = await prisma.athlete.findUnique({
          where: { id },
          include: { user: true }
        });
        if (!athlete) {
          errors.push(`El deportista con ID ${id} no existe`);
        } else if (athlete.status !== 'Active') {
          errors.push(`El deportista ${athlete.user.firstName} ${athlete.user.lastName} no está activo`);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join('. '));
    }
  }

  async updateTemporaryPersonsCategory(temporaryPersonIds, category, teamName) {
    if (!temporaryPersonIds || temporaryPersonIds.length === 0) {
      console.log('❌ No hay personas temporales para actualizar');
      return;
    }

    try {
      console.log('🔄 Actualizando personas temporales:', {
        ids: temporaryPersonIds,
        category: category,
        teamName: teamName
      });

      const updates = temporaryPersonIds.map(id =>
        prisma.temporaryPerson.update({
          where: { id: parseInt(id) },
          data: { 
            category: category || null, 
            team: teamName || null 
          }
        })
      );
      
      const results = await Promise.all(updates);
      console.log('✅ Actualización completada para:', results.length, 'personas');
      
    } catch (error) {
      console.error('❌ Error actualizando personas temporales:', error);
      throw new Error(`Error actualizando personas temporales: ${error.message}`);
    }
  }

  async clearTemporaryPersonsCategory(temporaryPersonIds) {
    if (!temporaryPersonIds || temporaryPersonIds.length === 0) {
      console.log('No hay personas para limpiar');
      return;
    }

    try {
      const updates = temporaryPersonIds.map(id =>
        prisma.temporaryPerson.update({
          where: { id: parseInt(id) },
          data: { 
            category: null, 
            team: null 
          }
        })
      );
      await Promise.all(updates);
      console.log(`✅ Limpiado categoría y equipo de ${temporaryPersonIds.length} personas temporales`);
    } catch (error) {
      console.error('❌ Error limpiando personas temporales:', error);
    }
  }

  transformToFrontend(team) {
    if (!team) return null;

    try {
      const deportistasCount = Array.isArray(team.members) ? 
        team.members.filter(member => {
          const isEntrenador = member.position === 'Entrenador' || 
                              member.memberType === 'Employee' || 
                              member.employeeId;
          return !isEntrenador;
        }).length : 0;

      const deportistas = team.members
        ?.filter(member => {
          const isEntrenador = member.position === 'Entrenador' || 
                              member.memberType === 'Employee' || 
                              member.employeeId;
          return !isEntrenador;
        })
        .map(member => {
          try {
            if (member.temporaryPerson) {
              return {
                id: member.temporaryPerson.id,
                name: `${member.temporaryPerson.firstName || ''} ${member.temporaryPerson.lastName || ''}`.trim(),
                identification: member.temporaryPerson.identification || '',
                phoneNumber: member.temporaryPerson.phone || '',
                categoria: member.temporaryPerson.category || '',
                type: 'temporal'
              };
            }
            if (member.athlete?.user) {
              return {
                id: member.athlete.id,
                name: `${member.athlete.user.firstName || ''} ${member.athlete.user.lastName || ''}`.trim(),
                identification: member.athlete.user.identification || '',
                phoneNumber: member.athlete.user.phoneNumber || '',
                categoria: member.athlete.inscriptions?.[0]?.sportsCategory?.nombre || 'Sin categoría',
                type: 'fundacion'
              };
            }
            return null;
          } catch (memberError) {
            console.error('Error transformando miembro:', memberError);
            return null;
          }
        })
        .filter(Boolean) || [];

      const entrenadorMembers = team.members?.filter(member => 
        member.position === 'Entrenador' || member.memberType === 'Employee' || member.employeeId
      ) || [];

      let entrenadorData = null;
      let segundoEntrenadorData = null;

      if (entrenadorMembers.length > 0) {
        const firstTrainer = entrenadorMembers[0];
        try {
          if (firstTrainer.temporaryPerson) {
            entrenadorData = {
              id: firstTrainer.temporaryPerson.id,
              name: `${firstTrainer.temporaryPerson.firstName || ''} ${firstTrainer.temporaryPerson.lastName || ''}`.trim(),
              identification: firstTrainer.temporaryPerson.identification || '',
              phoneNumber: firstTrainer.temporaryPerson.phone || '',
              type: 'temporal'
            };
          } else if (firstTrainer.employee?.user) {
            entrenadorData = {
              id: firstTrainer.employee.id,
              name: `${firstTrainer.employee.user.firstName || ''} ${firstTrainer.employee.user.lastName || ''}`.trim(),
              identification: firstTrainer.employee.user.identification || '',
              phoneNumber: firstTrainer.employee.user.phoneNumber || '',
              type: 'fundacion'
            };
          }
        } catch (trainerError) {
          console.error('Error transformando entrenador principal:', trainerError);
        }

        // Segundo entrenador (solo para equipos de fundación)
        if (entrenadorMembers.length > 1 && team.teamType === 'Fundacion') {
          const secondTrainer = entrenadorMembers[1];
          try {
            if (secondTrainer.employee?.user) {
              segundoEntrenadorData = {
                id: secondTrainer.employee.id,
                name: `${secondTrainer.employee.user.firstName || ''} ${secondTrainer.employee.user.lastName || ''}`.trim(),
                identification: secondTrainer.employee.user.identification || '',
                phoneNumber: secondTrainer.employee.user.phoneNumber || '',
                type: 'fundacion'
              };
            }
          } catch (secondTrainerError) {
            console.error('Error transformando segundo entrenador:', secondTrainerError);
          }
        }
      }

      // Determinar teamType desde el campo teamType
      let teamType = team.teamType || 'Temporal';
      if (team.members && team.members.length > 0 && !team.teamType) {
        // Fallback: determinar por miembros si no está en phone
        const hasAthletes = team.members.some(m => m.athleteId);
        const hasTemporary = team.members.some(m => m.temporaryPersonId);
        
        if (hasAthletes && !hasTemporary) {
          teamType = 'Fundacion';
        } else if (hasTemporary) {
          teamType = 'Temporal';
        }
      }

      return {
        id: team.id,
        nombre: team.name || '',
        name: team.name || '', // Para compatibilidad con el frontend
        entrenador: team.coach || '',
        coach: team.coach || '', // Para compatibilidad con el frontend
        estado: team.status === 'Active' ? 'Activo' : 'Inactivo',
        descripcion: team.description || '',
        categoria: team.category || '',
        category: team.category || '', // Para compatibilidad con el frontend
        teamType: teamType,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
        members: team.members || [],
        _count: {
          members: deportistasCount
        },
        cantidadDeportistas: deportistasCount,
        deportistas: deportistas,
        deportistasIds: deportistas.map(d => d.id),
        entrenadorData: entrenadorData,
        segundoEntrenadorData: segundoEntrenadorData
      };
    } catch (error) {
      console.error('Error en transformToFrontend:', error);
      console.error('Team data:', JSON.stringify(team, null, 2));
      throw error;
    }
  }

  async create(teamData) {
    try {
      console.log('📥 Datos recibidos en repository:', JSON.stringify(teamData, null, 2));

      const transformed = this.transformToBackend(teamData);
      const { deportistasIds = [], entrenadorId, segundoEntrenadorId } = transformed;
      
      const teamInfo = {
        name: transformed.name,
        description: transformed.description,
        coach: transformed.coach,
        category: transformed.category,
        teamType: transformed.teamType,
        status: 'Active'
      };

      console.log('🔧 Team Info transformado:', teamInfo);

      // Validar solo los deportistas
      await this.validateMembers(deportistasIds, teamInfo.teamType);
      
      // Validar entrenadores por separado
      if (entrenadorId) {
        await this.validateTrainer(entrenadorId, teamInfo.teamType);
      }
      if (segundoEntrenadorId) {
        await this.validateTrainer(segundoEntrenadorId, teamInfo.teamType);
      }

      await this.validateMembersAvailability(deportistasIds, teamInfo.teamType);
      await this.validateTrainerAvailability(entrenadorId, teamInfo.teamType);

      let entrenadorTemporalId = null;
      if (entrenadorId && teamInfo.teamType === 'Temporal') {
        const entrenador = await prisma.temporaryPerson.findUnique({
          where: { id: parseInt(entrenadorId) }
        });
        
        if (entrenador && entrenador.personType === 'Entrenador') {
          entrenadorTemporalId = parseInt(entrenadorId);
          console.log('✅ Entrenador temporal identificado:', entrenadorTemporalId);
        }
      }

      if (teamInfo.teamType === 'Temporal') {
        const allTemporaryPersonIds = [...deportistasIds];
        if (entrenadorTemporalId) {
          allTemporaryPersonIds.push(entrenadorTemporalId);
        }
        
        if (allTemporaryPersonIds.length > 0) {
          await this.updateTemporaryPersonsCategory(
            allTemporaryPersonIds, 
            teamInfo.category, 
            teamInfo.name
          );
        }
      }

      return await prisma.$transaction(async (tx) => {
        const newTeam = await tx.team.create({ data: teamInfo });
        console.log('✅ Equipo creado con ID:', newTeam.id);

        const memberPromises = [];

        for (const memberId of deportistasIds) {
          const data = {
            teamId: newTeam.id,
            isActive: true,
            joinedAt: new Date(),
            memberType: teamInfo.teamType === 'Temporal' ? 'TemporaryPerson' : 'Athlete'
          };
          if (teamInfo.teamType === 'Temporal') {
            data.temporaryPersonId = parseInt(memberId);
          } else {
            data.athleteId = parseInt(memberId);
          }
          memberPromises.push(tx.teamMember.create({ data }));
        }

        if (entrenadorId) {
          const data = {
            teamId: newTeam.id,
            position: 'Entrenador',
            isActive: true,
            joinedAt: new Date(),
            memberType: teamInfo.teamType === 'Temporal' ? 'TemporaryPerson' : 'Employee'
          };
          if (teamInfo.teamType === 'Temporal') {
            data.temporaryPersonId = parseInt(entrenadorId);
          } else {
            data.employeeId = parseInt(entrenadorId);
          }
          memberPromises.push(tx.teamMember.create({ data }));
        }

        // Segundo entrenador (solo para equipos de fundación)
        if (segundoEntrenadorId && teamInfo.teamType === 'Fundacion') {
          const data = {
            teamId: newTeam.id,
            position: 'Entrenador',
            isActive: true,
            joinedAt: new Date(),
            memberType: 'Employee',
            employeeId: parseInt(segundoEntrenadorId)
          };
          memberPromises.push(tx.teamMember.create({ data }));
        }

        await Promise.all(memberPromises);

        const createdTeam = await tx.team.findUnique({
          where: { id: newTeam.id },
          include: {
            members: {
              include: {
                athlete: { 
                  include: { 
                    user: true,
                    inscriptions: {
                      where: { status: "Active" },
                      include: { sportsCategory: true }
                    }
                  } 
                },
                employee: { include: { user: true } },
                temporaryPerson: true
              }
            }
          }
        });

        return this.transformToFrontend(createdTeam);
      });
    } catch (error) {
      console.error('❌ Error en create():', error.message);
      throw error;
    }
  }

  async update(id, teamData) {
    try {
      const transformed = this.transformToBackend(teamData);
      const { deportistasIds = [], entrenadorId, segundoEntrenadorId } = transformed;
      
      const teamInfo = {
        name: transformed.name,
        description: transformed.description,
        coach: transformed.coach,
        category: transformed.category,
        teamType: transformed.teamType || 'Temporal',
        status: transformed.status
      };

      const currentTeam = await this.findById(id);
      if (!currentTeam) throw new Error('Equipo no encontrado');

      // Validar solo los deportistas
      await this.validateMembers(deportistasIds, currentTeam.teamType);
      
      // Validar entrenadores por separado
      if (entrenadorId) {
        await this.validateTrainer(entrenadorId, currentTeam.teamType);
      }
      if (segundoEntrenadorId) {
        await this.validateTrainer(segundoEntrenadorId, currentTeam.teamType);
      }

      await this.validateMembersAvailability(deportistasIds, currentTeam.teamType, id);
      await this.validateTrainerAvailability(entrenadorId, currentTeam.teamType, id);

      return await prisma.$transaction(async (tx) => {
        if (currentTeam.teamType === 'Temporal') {
          const currentIds = currentTeam.members
            .filter(m => m.temporaryPersonId)
            .map(m => m.temporaryPersonId);

          const removedIds = currentIds.filter(
            id => !deportistasIds.includes(id) && id !== entrenadorId
          );

          if (removedIds.length > 0) {
            await this.clearTemporaryPersonsCategory(removedIds);
          }

          const allCurrentIds = [...deportistasIds];
          if (entrenadorId) {
            const entrenador = await prisma.temporaryPerson.findUnique({
              where: { id: parseInt(entrenadorId) }
            });
            if (entrenador && entrenador.personType === 'Entrenador') {
              allCurrentIds.push(entrenadorId);
            }
          }
          
          if (allCurrentIds.length > 0) {
            await this.updateTemporaryPersonsCategory(
              allCurrentIds, 
              teamInfo.category, 
              teamInfo.name
            );
          }
        }

        const updatedTeam = await tx.team.update({
          where: { id: parseInt(id) },
          data: teamInfo
        });

        await tx.teamMember.deleteMany({ where: { teamId: parseInt(id) } });

        const memberPromises = [];

        for (const memberId of deportistasIds) {
          const data = {
            teamId: updatedTeam.id,
            isActive: true,
            joinedAt: new Date(),
            memberType: currentTeam.teamType === 'Temporal' ? 'TemporaryPerson' : 'Athlete'
          };
          if (currentTeam.teamType === 'Temporal') {
            data.temporaryPersonId = parseInt(memberId);
          } else {
            data.athleteId = parseInt(memberId);
          }
          memberPromises.push(tx.teamMember.create({ data }));
        }

        if (entrenadorId) {
          const data = {
            teamId: updatedTeam.id,
            position: 'Entrenador',
            isActive: true,
            joinedAt: new Date(),
            memberType: currentTeam.teamType === 'Temporal' ? 'TemporaryPerson' : 'Employee'
          };
          if (currentTeam.teamType === 'Temporal') {
            data.temporaryPersonId = parseInt(entrenadorId);
          } else {
            data.employeeId = parseInt(entrenadorId);
          }
          memberPromises.push(tx.teamMember.create({ data }));
        }

        // Segundo entrenador (solo para equipos de fundación)
        if (segundoEntrenadorId && currentTeam.teamType === 'Fundacion') {
          const data = {
            teamId: updatedTeam.id,
            position: 'Entrenador',
            isActive: true,
            joinedAt: new Date(),
            memberType: 'Employee',
            employeeId: parseInt(segundoEntrenadorId)
          };
          memberPromises.push(tx.teamMember.create({ data }));
        }

        await Promise.all(memberPromises);

        const finalTeam = await tx.team.findUnique({
          where: { id: updatedTeam.id },
          include: {
            members: {
              include: {
                athlete: { 
                  include: { 
                    user: true,
                    inscriptions: {
                      where: { status: "Active" },
                      include: { sportsCategory: true }
                    }
                  } 
                },
                employee: { include: { user: true } },
                temporaryPerson: true
              }
            }
          }
        });

        return this.transformToFrontend(finalTeam);
      });
    } catch (error) {
      console.error('Error en update():', error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const team = await this.findById(id);
      if (!team) throw new Error('Equipo no encontrado');

      return await prisma.$transaction(async (tx) => {
        if (team.teamType === 'Temporal') {
          const tempIds = team.members
            .filter(m => m.temporaryPersonId)
            .map(m => m.temporaryPersonId);
          
          if (tempIds.length > 0) {
            await this.clearTemporaryPersonsCategory(tempIds);
          }
        }

        await tx.teamMember.deleteMany({ where: { teamId: parseInt(id) } });
        const deletedTeam = await tx.team.delete({
          where: { id: parseInt(id) }
        });

        return { nombre: team.nombre };
      });
    } catch (error) {
      console.error('Error en delete():', error);
      throw error;
    }
  }

  async findAll({ page = 1, limit = 10, search = '', status = '', teamType = '' }) {
    // Asegurar que page y limit sean números
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Si hay búsqueda, usar SQL raw para ignorar tildes
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      
      // Construir condiciones adicionales
      let statusCondition = '';
      if (status) {
        const normalizedStatus = status === 'Activo' ? 'Active' : 
                                 status === 'Inactivo' ? 'Inactive' : status;
        statusCondition = `AND status = '${normalizedStatus}'`;
      }

      let teamTypeCondition = '';
      if (teamType === 'Temporal') {
        teamTypeCondition = `AND category IS NOT NULL`;
      }

      // Usar translate() de PostgreSQL para normalizar caracteres acentuados
      // á->a, é->e, í->i, ó->o, ú->u, ñ->n
      const query = `
        SELECT * FROM teams 
        WHERE (
          translate(lower(name), 'áéíóúñ', 'aeioun') LIKE translate(lower($1), 'áéíóúñ', 'aeioun')
          OR translate(lower(COALESCE(coach, '')), 'áéíóúñ', 'aeioun') LIKE translate(lower($1), 'áéíóúñ', 'aeioun')
          OR translate(lower(COALESCE(category, '')), 'áéíóúñ', 'aeioun') LIKE translate(lower($1), 'áéíóúñ', 'aeioun')
        )
        ${statusCondition}
        ${teamTypeCondition}
        ORDER BY "createdAt" DESC
        LIMIT $2 OFFSET $3
      `;

      const countQuery = `
        SELECT COUNT(*) as total FROM teams 
        WHERE (
          translate(lower(name), 'áéíóúñ', 'aeioun') LIKE translate(lower($1), 'áéíóúñ', 'aeioun')
          OR translate(lower(COALESCE(coach, '')), 'áéíóúñ', 'aeioun') LIKE translate(lower($1), 'áéíóúñ', 'aeioun')
          OR translate(lower(COALESCE(category, '')), 'áéíóúñ', 'aeioun') LIKE translate(lower($1), 'áéíóúñ', 'aeioun')
        )
        ${statusCondition}
        ${teamTypeCondition}
      `;

      const [teams, countResult] = await Promise.all([
        prisma.$queryRawUnsafe(query, searchTerm, limitNum, skip),
        prisma.$queryRawUnsafe(countQuery, searchTerm)
      ]);

      const total = parseInt(countResult[0]?.total || 0);

      // Cargar relaciones para cada equipo
      const teamsWithRelations = await Promise.all(
        teams.map(team => 
          prisma.team.findUnique({
            where: { id: team.id },
            include: {
              members: {
                include: {
                  athlete: {
                    include: {
                      user: true,
                      inscriptions: {
                        where: { status: "Active" },
                        include: { sportsCategory: true }
                      }
                    }
                  },
                  employee: {
                    include: {
                      user: true
                    }
                  },
                  temporaryPerson: true
                }
              }
            }
          })
        )
      );

      const transformedTeams = teamsWithRelations.map(team => this.transformToFrontend(team));

      return {
        teams: transformedTeams,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1
        }
      };
    }

    // Búsqueda normal sin término de búsqueda
    const where = {};
    if (status) {
      const normalizedStatus = status === 'Activo' ? 'Active' : 
                             status === 'Inactivo' ? 'Inactive' : status;
      where.status = normalizedStatus;
    }
    // teamType se filtra por categoría en lugar de un campo separado
    // Los equipos temporales tienen categoría, los de fundación pueden no tenerla
    if (teamType) {
      if (teamType === 'Temporal') {
        // Equipos temporales tienen categoría definida
        where.category = { not: null };
      } else if (teamType === 'Fundacion') {
        // Equipos de fundación pueden tener o no categoría, pero se distinguen por sus miembros
        // Por ahora no filtramos, ya que no hay campo teamType en la BD
      }
    }

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          members: {
            include: {
              athlete: { 
                include: { 
                  user: true,
                  inscriptions: {
                    where: { status: "Active" },
                    include: { sportsCategory: true }
                  }
                } 
              },
              employee: { 
                include: { 
                  user: true 
                } 
              },
              temporaryPerson: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.team.count({ where })
    ]);

    const transformedTeams = teams.map(team => this.transformToFrontend(team));

    return {
      teams: transformedTeams,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    };
  }

  async findById(id) {
    const team = await prisma.team.findUnique({
      where: { id: parseInt(id) },
      include: {
        members: {
          include: {
            athlete: { 
              include: { 
                user: true,
                inscriptions: {
                  where: { status: "Active" },
                  include: { sportsCategory: true }
                }
              } 
            },
            employee: { include: { user: true } },
            temporaryPerson: true
          }
        }
      }
    });

    return team ? this.transformToFrontend(team) : null;
  }

  async findByName(name, excludeId = null) {
    const where = { name: { equals: name, mode: 'insensitive' } };
    if (excludeId) where.id = { not: parseInt(excludeId) };
    return await prisma.team.findFirst({ where });
  }

  async changeStatus(id, status) {
    try {
      const statusMap = { 'Activo': 'Active', 'Inactivo': 'Inactive' };
      const backendStatus = statusMap[status] || status;

      const updatedTeam = await prisma.team.update({
        where: { id: parseInt(id) },
        data: { status: backendStatus },
        include: {
          members: {
            include: {
              athlete: { 
                include: { 
                  user: true,
                  inscriptions: {
                    where: { status: "Active" },
                    include: { sportsCategory: true }
                  }
                } 
              },
              employee: { include: { user: true } },
              temporaryPerson: true
            }
          }
        }
      });

      return this.transformToFrontend(updatedTeam);
    } catch (error) {
      console.error('Error en changeStatus():', error);
      throw error;
    }
  }

  async checkNameAvailability(name, excludeId = null) {
    const existing = await this.findByName(name, excludeId);
    return {
      available: !existing,
      message: existing ? 'Nombre en uso' : 'Disponible'
    };
  }

  async getStats() {
    const [total, active, inactive, byType] = await Promise.all([
      prisma.team.count(),
      prisma.team.count({ where: { status: 'Active' } }),
      prisma.team.count({ where: { status: 'Inactive' } }),
      prisma.team.groupBy({ by: ['teamType'], _count: { id: true } })
    ]);

    const typeStats = byType.reduce((acc, item) => {
      acc[item.teamType.toLowerCase()] = item._count.id;
      return acc;
    }, {});

    return {
      total,
      active,
      inactive,
      fundacion: typeStats.fundacion || 0,
      temporal: typeStats.temporal || 0
    };
  }

  async checkDuplicateTemporalTeam(athleteIds, trainerId, excludeId = null) {
    try {
      const where = {
        teamType: 'Temporal',
        status: 'Active'
      };

      if (excludeId) {
        where.id = { not: parseInt(excludeId) };
      }

      const existingTeams = await prisma.team.findMany({
        where,
        include: {
          members: {
            where: { isActive: true },
            select: {
              temporaryPersonId: true,
              position: true
            }
          }
        }
      });

      for (const team of existingTeams) {
        const teamAthleteIds = team.members
          .filter(m => m.temporaryPersonId && m.position !== 'Entrenador')
          .map(m => m.temporaryPersonId)
          .sort();
        
        const teamTrainerId = team.members
          .find(m => m.temporaryPersonId && m.position === 'Entrenador')?.temporaryPersonId;

        const inputAthleteIds = athleteIds.sort();
        
        const sameAthletes = JSON.stringify(teamAthleteIds) === JSON.stringify(inputAthleteIds);
        const sameTrainer = teamTrainerId === trainerId;

        if (sameAthletes && sameTrainer) {
          return {
            isDuplicate: true,
            existingTeamId: team.id,
            existingTeamName: team.name
          };
        }
      }

      return { isDuplicate: false };
    } catch (error) {
      console.error('Error checking duplicate temporal team:', error);
      throw error;
    }
  }

  async checkTemporalPersonAvailability(personId, excludeTeamId = null) {
    try {
      console.log('🔍 [REPO] Verificando disponibilidad:', { personId, excludeTeamId });
      
      const existingMembership = await prisma.teamMember.findFirst({
        where: {
          temporaryPersonId: parseInt(personId),
          isActive: true,
          team: {
            status: 'Active',
            ...(excludeTeamId ? { id: { not: parseInt(excludeTeamId) } } : {})
          }
        },
        include: {
          team: true,
          temporaryPerson: true
        }
      });

      console.log('🔍 [REPO] Resultado búsqueda:', existingMembership ? 'ENCONTRADO' : 'NO ENCONTRADO');

      if (existingMembership) {
        const person = existingMembership.temporaryPerson;
        const team = existingMembership.team;
        console.log('⚠️ [REPO] Persona NO disponible:', {
          person: `${person.firstName} ${person.lastName}`,
          team: team.name
        });
        return {
          available: false,
          message: `${person.firstName} ${person.lastName} ya está asignado/a al equipo "${team.name}"`,
          teamName: team.name
        };
      }

      console.log('✅ [REPO] Persona disponible');
      return {
        available: true,
        message: 'Persona disponible'
      };
    } catch (error) {
      console.error('❌ [REPO] Error checking temporal person availability:', error);
      throw error;
    }
  }

  async checkTemporalMembersInOtherActiveTeams(memberIds, excludeTeamId) {
    try {
      console.log('🔍 [REPO] Verificando conflictos al activar equipo:', { memberIds, excludeTeamId });
      
      const conflicts = [];

      for (const memberId of memberIds) {
        const existingMembership = await prisma.teamMember.findFirst({
          where: {
            temporaryPersonId: parseInt(memberId),
            isActive: true,
            team: {
              status: 'Active',
              id: { not: parseInt(excludeTeamId) }
            }
          },
          include: {
            team: true,
            temporaryPerson: true
          }
        });

        if (existingMembership) {
          const person = existingMembership.temporaryPerson;
          const team = existingMembership.team;
          conflicts.push({
            personId: person.id,
            personName: `${person.firstName} ${person.lastName}`,
            teamId: team.id,
            teamName: team.name
          });
        }
      }

      console.log('🔍 [REPO] Conflictos encontrados:', conflicts.length);
      return conflicts;
    } catch (error) {
      console.error('❌ [REPO] Error checking conflicts:', error);
      throw error;
    }
  }

  async isTeamAssignedToEvent(teamId) {
    try {
      console.log('🔍 [REPO] Verificando si equipo está asignado a eventos:', teamId);
      
      // Buscar participaciones en TODOS los eventos sin importar el estado
      // El equipo NO se puede eliminar si está asignado a cualquier evento
      const participants = await prisma.participant.findMany({
        where: {
          teamId: parseInt(teamId),
          type: 'Team'
        },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              status: true
            }
          }
        }
      });

      const isAssigned = participants.length > 0;
      
      console.log('🔍 [REPO] Equipo asignado a eventos:', {
        isAssigned,
        count: participants.length,
        events: participants.map(p => `${p.service.name} (${p.service.status})`)
      });

      return {
        isAssigned,
        count: participants.length,
        events: participants.map(p => ({
          id: p.service.id,
          name: p.service.name,
          status: p.service.status
        }))
      };
    } catch (error) {
      console.error('❌ [REPO] Error verificando asignación a eventos:', error);
      throw error;
    }
  }

  transformToBackend(frontendData) {
    const entrenadorId = frontendData.entrenadorData?.id || null;
    const segundoEntrenadorId = frontendData.segundoEntrenadorData?.id || null;

    let teamType = frontendData.teamType || 'Temporal';
    if (teamType === 'temporal') teamType = 'Temporal';
    if (teamType === 'fundacion') teamType = 'Fundacion';

    const statusMap = { 'Activo': 'Active', 'Inactivo': 'Inactive' };
    const status = frontendData.estado ? statusMap[frontendData.estado] || 'Active' : 'Active';

    return {
      name: frontendData.nombre?.trim() || '',
      description: frontendData.descripcion?.trim() || null,
      coach: frontendData.entrenador?.trim() || null,
      category: frontendData.categoria?.trim() || null,
      status,
      teamType,
      deportistasIds: frontendData.deportistasIds || [],
      entrenadorId,
      segundoEntrenadorId
    };
  }
}
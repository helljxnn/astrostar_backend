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
        if (member.temporaryPerson) {
          return {
            id: member.temporaryPerson.id,
            name: `${member.temporaryPerson.firstName} ${member.temporaryPerson.lastName}`,
            identification: member.temporaryPerson.identification,
            categoria: member.temporaryPerson.category,
            type: 'temporal'
          };
        }
        if (member.athlete?.user) {
          return {
            id: member.athlete.id,
            name: `${member.athlete.user.firstName} ${member.athlete.user.lastName}`,
            identification: member.athlete.user.identification,
            categoria: member.athlete.inscriptions?.[0]?.sportsCategory?.nombre || 'Sin categoría',
            type: 'fundacion'
          };
        }
        return null;
      })
      .filter(Boolean) || [];

    const entrenadorMember = team.members?.find(member => 
      member.position === 'Entrenador' || member.memberType === 'Employee' || member.employeeId
    );

    let entrenadorData = null;
    if (entrenadorMember) {
      if (entrenadorMember.temporaryPerson) {
        entrenadorData = {
          id: entrenadorMember.temporaryPerson.id,
          name: `${entrenadorMember.temporaryPerson.firstName} ${entrenadorMember.temporaryPerson.lastName}`,
          identification: entrenadorMember.temporaryPerson.identification,
          type: 'temporal'
        };
      } else if (entrenadorMember.employee?.user) {
        entrenadorData = {
          id: entrenadorMember.employee.id,
          name: `${entrenadorMember.employee.user.firstName} ${entrenadorMember.employee.user.lastName}`,
          identification: entrenadorMember.employee.user.identification,
          type: 'fundacion'
        };
      }
    }

    return {
      id: team.id,
      nombre: team.name,
      telefono: team.phone,
      entrenador: team.coach,
      estado: team.status === 'Active' ? 'Activo' : 'Inactivo',
      descripcion: team.description,
      categoria: team.category,
      teamType: team.teamType,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
      members: team.members || [],
      cantidadDeportistas: deportistasCount,
      deportistas: deportistas,
      deportistasIds: deportistas.map(d => d.id),
      entrenadorData: entrenadorData
    };
  }

  async create(teamData) {
    try {
      console.log('📥 Datos recibidos en repository:', JSON.stringify(teamData, null, 2));

      const transformed = this.transformToBackend(teamData);
      const { deportistasIds = [], entrenadorId } = transformed;

      const teamInfo = {
        name: transformed.name,
        description: transformed.description,
        coach: transformed.coach,
        category: transformed.category,
        phone: transformed.phone,
        status: transformed.status || 'Active',
        teamType: transformed.teamType
      };

      console.log('🔧 Team Info transformado:', teamInfo);

      const allMemberIds = [...deportistasIds];
      if (entrenadorId) allMemberIds.push(entrenadorId);
      await this.validateMembers(allMemberIds, teamInfo.teamType);

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

        await Promise.all(memberPromises);

        const createdTeam = await tx.team.findUnique({
          where: { id: newTeam.id },
          include: {
            members: {
              include: {
                athlete: { include: { user: true } },
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
      const { deportistasIds = [], entrenadorId } = transformed;

      const teamInfo = {
        name: transformed.name,
        description: transformed.description,
        coach: transformed.coach,
        category: transformed.category,
        phone: transformed.phone,
        status: transformed.status
      };

      const currentTeam = await this.findById(id);
      if (!currentTeam) throw new Error('Equipo no encontrado');

      const allMemberIds = [...deportistasIds];
      if (entrenadorId) allMemberIds.push(entrenadorId);
      await this.validateMembers(allMemberIds, currentTeam.teamType);

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

        await Promise.all(memberPromises);

        const finalTeam = await tx.team.findUnique({
          where: { id: updatedTeam.id },
          include: {
            members: {
              include: {
                athlete: { include: { user: true } },
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
        const deletedTeam = await tx.team.update({
          where: { id: parseInt(id) },
          data: { status: 'Inactive' }
        });

        return this.transformToFrontend(deletedTeam);
      });
    } catch (error) {
      console.error('Error en delete():', error);
      throw error;
    }
  }

  async findAll({ page = 1, limit = 10, search = '', status = '', teamType = '' }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { coach: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (status) {
      const normalizedStatus = status === 'Activo' ? 'Active' : 
                             status === 'Inactivo' ? 'Inactive' : status;
      where.status = normalizedStatus;
    }
    if (teamType) where.teamType = teamType;

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        skip,
        take: limit,
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
    const team = await prisma.team.findUnique({
      where: { id: parseInt(id) },
      include: {
        members: {
          include: {
            athlete: { include: { user: true } },
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

  transformToBackend(frontendData) {
    const entrenadorId = frontendData.entrenadorData?.id || null;

    let teamType = frontendData.teamType || 'Temporal';
    if (teamType === 'temporal') teamType = 'Temporal';
    if (teamType === 'fundacion') teamType = 'Fundacion';

    const statusMap = { 'Activo': 'Active', 'Inactivo': 'Inactive' };
    const status = statusMap[frontendData.estado] || 'Active';

    return {
      name: frontendData.nombre?.trim() || '',
      description: frontendData.descripcion?.trim() || null,
      coach: frontendData.entrenador?.trim() || null,
      category: frontendData.categoria?.trim() || null,
      phone: frontendData.telefono?.trim() || null,
      status,
      teamType,
      deportistasIds: frontendData.deportistasIds || [],
      entrenadorId
    };
  }
}
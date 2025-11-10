import prisma from "../../../config/database.js";

export class TeamsRepository {
  
  /**
   * Validar que los miembros existen y están disponibles
   */
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

  /**
   * Actualizar categoría y equipo en personas temporales - CORREGIDO
   * Ahora actualiza tanto deportistas como entrenadores temporales
   */
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

      // Primero verificar que las personas existen
      const persons = await prisma.temporaryPerson.findMany({
        where: { id: { in: temporaryPersonIds.map(id => parseInt(id)) } },
        select: { id: true, firstName: true, lastName: true, personType: true }
      });

      console.log('🔍 Personas encontradas para actualizar:', persons);

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
      
      // Log detallado de cada actualización
      results.forEach(person => {
        console.log(`   ✅ ${person.firstName} ${person.lastName} (${person.personType}): equipo="${person.team}", categoría="${person.category}"`);
      });
      
    } catch (error) {
      console.error('❌ Error actualizando personas temporales:', error);
      console.error('❌ Detalle del error:', error.message);
      throw new Error(`Error actualizando personas temporales: ${error.message}`);
    }
  }

  /**
   * Limpiar categoría y equipo de personas temporales - CORREGIDO
   * Ahora limpia tanto deportistas como entrenadores temporales
   */
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

  /**
   * Debug temporal para verificar personas
   */
  async debugTemporaryPerson(personId) {
    try {
      const person = await prisma.temporaryPerson.findUnique({
        where: { id: parseInt(personId) },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          personType: true,
          team: true,
          category: true,
          status: true
        }
      });
      
      console.log('🐛 DEBUG Persona Temporal:', person);
      return person;
    } catch (error) {
      console.error('❌ Error en debug:', error);
      return null;
    }
  }

  /**
   * Transformar equipo de BD a frontend
   */
  transformToFrontend(team) {
    if (!team) return null;

    // ✅ CORRECCIÓN: Contar SOLO deportistas, NO entrenadores
    const deportistasCount = Array.isArray(team.members) ? 
      team.members.filter(member => {
        // Solo contar miembros que NO sean entrenadores
        const isEntrenador = member.position === 'Entrenador' || 
                            member.memberType === 'Employee' || 
                            member.employeeId;
        return !isEntrenador;
      }).length : 0;

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
      cantidadDeportistas: deportistasCount, // ✅ Solo deportistas
      // Mantener datos para edición
      deportistasIds: team.members
        ?.filter(member => {
          const isEntrenador = member.position === 'Entrenador' || 
                              member.memberType === 'Employee' || 
                              member.employeeId;
          return !isEntrenador;
        })
        .map(member => member.athleteId || member.temporaryPersonId) || [],
      entrenadorData: team.members?.find(member => 
        member.position === 'Entrenador' || member.memberType === 'Employee' || member.employeeId
      ) || null
    };
  }

  /**
   * Crear equipo - CORREGIDO para actualizar entrenadores temporales también
   */
  async create(teamData) {
    try {
      console.log('📥 Datos recibidos en repository:', JSON.stringify(teamData, null, 2));

      // Transformar datos del frontend
      const transformed = this.transformToBackend(teamData);
      const { deportistasIds = [], entrenadorId } = transformed;

      // Construir teamInfo manualmente (evitar campos extras)
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
      console.log('👥 Deportistas IDs:', deportistasIds);
      console.log('🏋️ Entrenador ID:', entrenadorId);

      // Validar miembros
      const allMemberIds = [...deportistasIds];
      if (entrenadorId) allMemberIds.push(entrenadorId);
      await this.validateMembers(allMemberIds, teamInfo.teamType);

      // ✅ CORRECCIÓN: Verificar específicamente si el entrenador es temporal
      let entrenadorTemporalId = null;
      if (entrenadorId && teamInfo.teamType === 'Temporal') {
        const entrenador = await prisma.temporaryPerson.findUnique({
          where: { id: parseInt(entrenadorId) }
        });
        
        console.log('🔍 Información del entrenador:', {
          id: entrenadorId,
          encontrado: !!entrenador,
          personType: entrenador?.personType,
          nombre: entrenador ? `${entrenador.firstName} ${entrenador.lastName}` : 'N/A',
          esTemporal: entrenador?.personType === 'Entrenador'
        });
        
        if (entrenador && entrenador.personType === 'Entrenador') {
          entrenadorTemporalId = parseInt(entrenadorId);
          console.log('✅ Entrenador temporal identificado:', entrenadorTemporalId);
          
          // Debug del entrenador
          console.log('🔍 Debug del entrenador temporal:');
          await this.debugTemporaryPerson(entrenadorTemporalId);
        }
      }

      // ✅ CORRECCIÓN: Actualizar TODAS las personas temporales (deportistas Y entrenadores)
      if (teamInfo.teamType === 'Temporal') {
        console.log('🔄 Actualizando personas temporales...');
        
        // Crear array con TODOS los IDs temporales (deportistas + entrenador si es temporal)
        const allTemporaryPersonIds = [...deportistasIds];
        
        // Agregar entrenador temporal si existe
        if (entrenadorTemporalId) {
          allTemporaryPersonIds.push(entrenadorTemporalId);
          console.log('✅ Entrenador temporal incluido para actualización:', entrenadorTemporalId);
        }
        
        console.log('📋 IDs a actualizar:', allTemporaryPersonIds);
        
        if (allTemporaryPersonIds.length > 0) {
          await this.updateTemporaryPersonsCategory(allTemporaryPersonIds, teamInfo.category, teamInfo.name);
        } else {
          console.log('⚠️ No hay personas temporales para actualizar');
        }
      }

      return await prisma.$transaction(async (tx) => {
        console.log('💾 Iniciando transacción...');

        // 1. Crear equipo
        const newTeam = await tx.team.create({ data: teamInfo });
        console.log('✅ Equipo creado con ID:', newTeam.id);

        const memberPromises = [];

        // 2. Crear deportistas
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

        // 3. Crear entrenador
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
        console.log('✅ Miembros creados');

        // 4. Devolver equipo completo
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

        console.log('✅ Equipo completo creado:', createdTeam.name);
        return this.transformToFrontend(createdTeam);
      });
    } catch (error) {
      console.error('❌ Error en create():', error.message);
      console.error('Stack:', error.stack);
      throw error;
    }
  }

  /**
   * Actualizar equipo - CORREGIDO para actualizar entrenadores temporales también
   */
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

      return await prisma.$transaction(async (tx) => {
        // ✅ CORRECCIÓN: Limpiar y actualizar TODAS las personas temporales
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

          // Crear array con TODOS los IDs temporales actuales
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
            await this.updateTemporaryPersonsCategory(allCurrentIds, teamInfo.category, teamInfo.name);
          }
        }

        // Actualizar equipo
        const updatedTeam = await tx.team.update({
          where: { id: parseInt(id) },
          data: teamInfo
        });

        // Eliminar miembros antiguos
        await tx.teamMember.deleteMany({ where: { teamId: parseInt(id) } });

        // Crear nuevos miembros
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

  /**
   * Eliminar equipo (soft delete) - CORREGIDO para limpiar entrenadores temporales también
   */
  async delete(id) {
    try {
      const team = await this.findById(id);
      if (!team) throw new Error('Equipo no encontrado');

      return await prisma.$transaction(async (tx) => {
        if (team.teamType === 'Temporal') {
          // ✅ CORRECCIÓN: Limpiar TODOS los IDs temporales (deportistas y entrenadores)
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

  /**
   * Listar equipos
   */
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
      // Normalizar estado
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

    // ✅ TRANSFORMAR TODOS LOS EQUIPOS AL FORMATO DEL FRONTEND
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

  /**
   * Transformar datos del frontend al formato de BD
   */
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
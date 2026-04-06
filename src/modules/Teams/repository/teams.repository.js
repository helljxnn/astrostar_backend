import prisma from "../../../config/database.js";

export class TeamsRepository {
  async validateTemporalPersonNotInOtherTeams(personId, excludeTeamId, errors) {
    const existingMembership = await prisma.teamMember.findFirst({
      where: {
        temporaryPersonId: personId,
        isActive: true,
        team: {
          status: "Active",
          ...(excludeTeamId ? { id: { not: parseInt(excludeTeamId) } } : {}),
        },
      },
      include: {
        team: true,
        temporaryPerson: true,
      },
    });

    if (existingMembership) {
      const person = existingMembership.temporaryPerson;
      const team = existingMembership.team;
      errors.push(
        `${person.firstName} ${person.lastName} (Temporal) ya está asignado/a al equipo "${team.name}". Las personas temporales no pueden estar en múltiples equipos.`,
      );
    }
  }

  async validateMembersAvailability(memberIds, teamType, excludeTeamId = null) {
    if (!memberIds || memberIds.length === 0) return;

    const errors = [];

    for (const memberId of memberIds) {
      const id = parseInt(memberId);
      if (isNaN(id)) continue;

      if (teamType === "Temporal") {
        await this.validateTemporalPersonNotInOtherTeams(
          id,
          excludeTeamId,
          errors,
        );
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(". "));
    }
  }

  async validateTrainerAvailability(trainerId, teamType, excludeTeamId = null) {
    if (!trainerId) return;

    const id = parseInt(trainerId);
    if (isNaN(id)) return;

    if (teamType === "Temporal") {
      const errors = [];
      await this.validateTemporalPersonNotInOtherTeams(
        id,
        excludeTeamId,
        errors,
      );
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

    if (teamType === "Temporal") {
      const tempPerson = await prisma.temporaryPerson.findUnique({
        where: { id },
      });
      if (!tempPerson) {
        throw new Error(`El entrenador temporal con ID ${id} no existe`);
      }
      if (tempPerson.status !== "Active") {
        throw new Error(
          `El entrenador temporal ${tempPerson.firstName} ${tempPerson.lastName} no está activo`,
        );
      }
      if (tempPerson.personType !== "Entrenador") {
        throw new Error(`La persona temporal con ID ${id} no es un entrenador`);
      }
    } else if (teamType === "Fundacion") {
      const employee = await prisma.employee.findUnique({
        where: { id },
        include: { user: true },
      });
      if (!employee) {
        throw new Error(`El entrenador con ID ${id} no existe`);
      }
      if (employee.status !== "Activo") {
        throw new Error(
          `El entrenador ${employee.user.firstName} ${employee.user.lastName} no está activo`,
        );
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

      if (teamType === "Temporal") {
        const tempPerson = await prisma.temporaryPerson.findUnique({
          where: { id },
        });
        if (!tempPerson) {
          errors.push(`La persona temporal con ID ${id} no existe`);
        } else if (tempPerson.status !== "Active") {
          errors.push(
            `La persona temporal ${tempPerson.firstName} ${tempPerson.lastName} no está activa`,
          );
        }
      } else if (teamType === "Fundacion") {
        const athlete = await prisma.athlete.findUnique({
          where: { id },
          include: { user: true },
        });
        if (!athlete) {
          errors.push(`El deportista con ID ${id} no existe`);
        } else if (athlete.status !== "Active") {
          errors.push(
            `El deportista ${athlete.user.firstName} ${athlete.user.lastName} no está activo`,
          );
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(". "));
    }
  }

  async updateTemporaryPersonsCategory(temporaryPersonIds, category, teamName) {
    if (!temporaryPersonIds || temporaryPersonIds.length === 0) {
      return;
    }

    // Campo legacy eliminado del modelo TemporaryPerson.
    // La asignacion de equipo/categoria se obtiene desde Team y TeamMember.
    return;
  }

  async clearTemporaryPersonsCategory(temporaryPersonIds) {
    if (!temporaryPersonIds || temporaryPersonIds.length === 0) {
      return;
    }

    // Campo legacy eliminado del modelo TemporaryPerson.
    return;
  }

  getTeamRelationsInclude() {
    return {
      members: {
        include: {
          athlete: {
            include: {
              user: true,
              inscriptions: {
                where: { status: "Active" },
                include: { sportsCategory: true },
              },
            },
          },
          employee: {
            include: {
              user: true,
            },
          },
          temporaryPerson: true,
        },
      },
    };
  }

  buildTeamWhereClause({ status = "", teamType = "" } = {}) {
    const where = {};

    if (status) {
      const normalizedStatus =
        status === "Activo"
          ? "Active"
          : status === "Inactivo"
            ? "Inactive"
            : status;
      where.status = normalizedStatus;
    }

    if (teamType) {
      const normalizedType =
        teamType.toLowerCase() === "fundacion" ? "Fundacion" : "Temporal";
      where.teamType = normalizedType;
    }

    return where;
  }

  normalizeSearchText(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  getDateSearchVariants(dateValue) {
    if (!dateValue) return [];

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return [];

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());

    return [
      `${day}/${month}/${year}`,
      `${year}-${month}-${day}`,
      date.toISOString(),
    ];
  }

  buildTeamSearchableValues(team) {
    const athleteValues = Array.isArray(team.deportistas)
      ? team.deportistas.flatMap((deportista) => [
          deportista.name,
          deportista.identification,
          deportista.phoneNumber,
          deportista.categoria,
        ])
      : [];

    return [
      team.nombre,
      team.name,
      team.descripcion,
      team.entrenador,
      team.coach,
      team.categoria,
      team.category,
      team.estado,
      team.teamType,
      team.teamType === "Temporal" ? "Temporales" : "Fundacion",
      team.teamType === "Temporal" ? "Temporal" : "Fundación",
      team.cantidadDeportistas,
      ...athleteValues,
      ...this.getDateSearchVariants(team.createdAt),
      ...this.getDateSearchVariants(team.updatedAt),
    ];
  }

  matchesTeamSearch(team, searchTerm) {
    if (!searchTerm?.trim()) return true;

    const normalizedSearch = this.normalizeSearchText(searchTerm);

    return this.buildTeamSearchableValues(team).some((value) =>
      this.normalizeSearchText(value).includes(normalizedSearch),
    );
  }

  transformToFrontend(team) {
    if (!team) return null;

    try {
      const deportistasCount = Array.isArray(team.members)
        ? team.members.filter((member) => {
            const isEntrenador =
              member.position === "Entrenador" ||
              member.memberType === "Employee" ||
              member.employeeId;
            return !isEntrenador;
          }).length
        : 0;

      const deportistas =
        team.members
          ?.filter((member) => {
            const isEntrenador =
              member.position === "Entrenador" ||
              member.memberType === "Employee" ||
              member.employeeId;
            return !isEntrenador;
          })
          .map((member) => {
            try {
      if (member.temporaryPerson) {
        return {
                  id: member.temporaryPerson.id,
                  name: `${member.temporaryPerson.firstName || ""} ${
                    member.temporaryPerson.lastName || ""
                  }`.trim(),
                  identification: member.temporaryPerson.identification || "",
                  phoneNumber: member.temporaryPerson.phone || "",
                  categoria: team.category || "",
                  type: "temporal",
                };
              }
              if (member.athlete?.user) {
                return {
                  id: member.athlete.id,
                  name: `${member.athlete.user.firstName || ""} ${
                    member.athlete.user.lastName || ""
                  }`.trim(),
                  identification: member.athlete.user.identification || "",
                  phoneNumber: member.athlete.user.phoneNumber || "",
                  categoria:
                    member.athlete.inscriptions?.[0]?.sportsCategory?.nombre ||
                    "Sin categoría",
                  type: "fundacion",
                };
              }
              return null;
            } catch {
              return null;
            }
          })
          .filter(Boolean) || [];

      const entrenadorMembers =
        team.members?.filter(
          (member) =>
            member.position === "Entrenador" ||
            member.memberType === "Employee" ||
            member.employeeId,
        ) || [];

      let entrenadorData = null;
      let segundoEntrenadorData = null;

      if (entrenadorMembers.length > 0) {
        const firstTrainer = entrenadorMembers[0];
        try {
          if (firstTrainer.temporaryPerson) {
            entrenadorData = {
              id: firstTrainer.temporaryPerson.id,
              name: `${firstTrainer.temporaryPerson.firstName || ""} ${
                firstTrainer.temporaryPerson.lastName || ""
              }`.trim(),
              identification: firstTrainer.temporaryPerson.identification || "",
              phoneNumber: firstTrainer.temporaryPerson.phone || "",
              type: "temporal",
            };
          } else if (firstTrainer.employee?.user) {
            entrenadorData = {
              id: firstTrainer.employee.id,
              name: `${firstTrainer.employee.user.firstName || ""} ${
                firstTrainer.employee.user.lastName || ""
              }`.trim(),
              identification: firstTrainer.employee.user.identification || "",
              phoneNumber: firstTrainer.employee.user.phoneNumber || "",
              type: "fundacion",
            };
          }
        } catch {
          // Ignorar errores y continuar con el siguiente entrenador
        }

        // Segundo entrenador (solo para equipos de fundación)
        if (entrenadorMembers.length > 1 && team.teamType === "Fundacion") {
          const secondTrainer = entrenadorMembers[1];
          try {
            if (secondTrainer.employee?.user) {
              segundoEntrenadorData = {
                id: secondTrainer.employee.id,
                name: `${secondTrainer.employee.user.firstName || ""} ${
                  secondTrainer.employee.user.lastName || ""
                }`.trim(),
                identification:
                  secondTrainer.employee.user.identification || "",
                phoneNumber: secondTrainer.employee.user.phoneNumber || "",
                type: "fundacion",
              };
            }
          } catch {
            // Ignorar errores y continuar
          }
        }
      }

      // Determinar teamType desde el campo teamType
      let teamType = team.teamType || "Temporal";
      if (team.members && team.members.length > 0 && !team.teamType) {
        // Fallback: determinar por miembros si no está en phone
        const hasAthletes = team.members.some((m) => m.athleteId);
        const hasTemporary = team.members.some((m) => m.temporaryPersonId);

        if (hasAthletes && !hasTemporary) {
          teamType = "Fundacion";
        } else if (hasTemporary) {
          teamType = "Temporal";
        }
      }

      return {
        id: team.id,
        nombre: team.name || "",
        name: team.name || "", // Para compatibilidad con el frontend
        entrenador: team.coach || "",
        coach: team.coach || "", // Para compatibilidad con el frontend
        estado: team.status === "Active" ? "Activo" : "Inactivo",
        descripcion: team.description || "",
        categoria: team.category || "",
        category: team.category || "", // Para compatibilidad con el frontend
        teamType: teamType,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
        members: team.members || [],
        _count: {
          members: deportistasCount,
        },
        cantidadDeportistas: deportistasCount,
        deportistas: deportistas,
        deportistasIds: deportistas.map((d) => d.id),
        entrenadorData: entrenadorData,
        segundoEntrenadorData: segundoEntrenadorData,
      };
    } catch (error) {
      throw error;
    }
  }

  async create(teamData) {
    try {
      const transformed = this.transformToBackend(teamData);
      const {
        deportistasIds = [],
        entrenadorId,
        segundoEntrenadorId,
      } = transformed;

      const teamInfo = {
        name: transformed.name,
        description: transformed.description,
        coach: transformed.coach,
        category: transformed.category,
        teamType: transformed.teamType,
        status: "Active",
      };

      // Validar solo los deportistas
      await this.validateMembers(deportistasIds, transformed.teamType);

      // Validar entrenadores por separado
      if (entrenadorId) {
        await this.validateTrainer(entrenadorId, transformed.teamType);
      }
      if (segundoEntrenadorId) {
        await this.validateTrainer(segundoEntrenadorId, transformed.teamType);
      }

      await this.validateMembersAvailability(
        deportistasIds,
        transformed.teamType,
      );
      await this.validateTrainerAvailability(
        entrenadorId,
        transformed.teamType,
      );

      let entrenadorTemporalId = null;
      if (entrenadorId && transformed.teamType === "Temporal") {
        const entrenador = await prisma.temporaryPerson.findUnique({
          where: { id: parseInt(entrenadorId) },
        });

        if (entrenador && entrenador.personType === "Entrenador") {
          entrenadorTemporalId = parseInt(entrenadorId);
        }
      }

      if (transformed.teamType === "Temporal") {
        const allTemporaryPersonIds = [...deportistasIds];
        if (entrenadorTemporalId) {
          allTemporaryPersonIds.push(entrenadorTemporalId);
        }

        if (allTemporaryPersonIds.length > 0) {
          await this.updateTemporaryPersonsCategory(
            allTemporaryPersonIds,
            teamInfo.category,
            teamInfo.name,
          );
        }
      }

      return await prisma.$transaction(async (tx) => {
        const newTeam = await tx.team.create({ data: teamInfo });

        const memberPromises = [];

        for (const memberId of deportistasIds) {
          const data = {
            teamId: newTeam.id,
            isActive: true,
            joinedAt: new Date(),
            memberType:
              transformed.teamType === "Temporal"
                ? "TemporaryPerson"
                : "Athlete",
          };
          if (transformed.teamType === "Temporal") {
            data.temporaryPersonId = parseInt(memberId);
          } else {
            data.athleteId = parseInt(memberId);
          }
          memberPromises.push(tx.teamMember.create({ data }));
        }

        if (entrenadorId) {
          const data = {
            teamId: newTeam.id,
            position: "Entrenador",
            isActive: true,
            joinedAt: new Date(),
            memberType:
              transformed.teamType === "Temporal"
                ? "TemporaryPerson"
                : "Employee",
          };
          if (transformed.teamType === "Temporal") {
            data.temporaryPersonId = parseInt(entrenadorId);
          } else {
            data.employeeId = parseInt(entrenadorId);
          }
          memberPromises.push(tx.teamMember.create({ data }));
        }

        // Segundo entrenador (solo para equipos de fundación)
        if (segundoEntrenadorId && transformed.teamType === "Fundacion") {
          const data = {
            teamId: newTeam.id,
            position: "Entrenador",
            isActive: true,
            joinedAt: new Date(),
            memberType: "Employee",
            employeeId: parseInt(segundoEntrenadorId),
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
                      include: { sportsCategory: true },
                    },
                  },
                },
                employee: { include: { user: true } },
                temporaryPerson: true,
              },
            },
          },
        });

        return this.transformToFrontend(createdTeam);
      });
    } catch (error) {
      throw error;
    }
  }

  async update(id, teamData) {
    try {
      const transformed = this.transformToBackend(teamData);
      const {
        deportistasIds = [],
        entrenadorId,
        segundoEntrenadorId,
      } = transformed;

      const resolvedName =
        transformed.name && transformed.name.trim()
          ? transformed.name
          : currentTeam.nombre;
      const resolvedDescription =
        transformed.description !== null && transformed.description !== undefined
          ? transformed.description
          : currentTeam.descripcion || null;
      const resolvedCoach =
        transformed.coach !== null && transformed.coach !== undefined
          ? transformed.coach
          : currentTeam.entrenador || null;
      const resolvedCategory =
        transformed.category !== null && transformed.category !== undefined
          ? transformed.category
          : currentTeam.categoria || null;
      const resolvedTeamType = transformed.teamType || currentTeam.teamType;
      const resolvedStatus =
        transformed.status ||
        (currentTeam.estado === "Inactivo" ? "Inactive" : "Active");

      const teamInfo = {
        name: resolvedName,
        description: resolvedDescription,
        coach: resolvedCoach,
        category: resolvedCategory,
        teamType: resolvedTeamType,
        status: resolvedStatus,
      };

      const currentTeam = await this.findById(id);
      if (!currentTeam) throw new Error("Equipo no encontrado");

      // Validar solo los deportistas
      await this.validateMembers(deportistasIds, currentTeam.teamType);

      // Validar entrenadores por separado
      if (entrenadorId) {
        await this.validateTrainer(entrenadorId, currentTeam.teamType);
      }
      if (segundoEntrenadorId) {
        await this.validateTrainer(segundoEntrenadorId, currentTeam.teamType);
      }

      await this.validateMembersAvailability(
        deportistasIds,
        currentTeam.teamType,
        id,
      );
      await this.validateTrainerAvailability(
        entrenadorId,
        currentTeam.teamType,
        id,
      );

      await this.validateMembersAvailability(deportistasIds, currentTeam.teamType, id);
      await this.validateTrainerAvailability(entrenadorId, currentTeam.teamType, id);

      return await prisma.$transaction(async (tx) => {
        if (currentTeam.teamType === "Temporal") {
          const currentIds = currentTeam.members
            .filter((m) => m.temporaryPersonId)
            .map((m) => m.temporaryPersonId);

          const removedIds = currentIds.filter(
            (id) => !deportistasIds.includes(id) && id !== entrenadorId,
          );

          if (removedIds.length > 0) {
            await this.clearTemporaryPersonsCategory(removedIds);
          }

          const allCurrentIds = [...deportistasIds];
          if (entrenadorId) {
            const entrenador = await prisma.temporaryPerson.findUnique({
              where: { id: parseInt(entrenadorId) },
            });
            if (entrenador && entrenador.personType === "Entrenador") {
              allCurrentIds.push(entrenadorId);
            }
          }

          if (allCurrentIds.length > 0) {
            await this.updateTemporaryPersonsCategory(
              allCurrentIds,
              teamInfo.category,
              teamInfo.name,
            );
          }
        }

        const updatedTeam = await tx.team.update({
          where: { id: parseInt(id) },
          data: teamInfo,
        });

        await tx.teamMember.deleteMany({ where: { teamId: parseInt(id) } });

        const memberPromises = [];

        for (const memberId of deportistasIds) {
          const data = {
            teamId: updatedTeam.id,
            isActive: true,
            joinedAt: new Date(),
            memberType:
              currentTeam.teamType === "Temporal"
                ? "TemporaryPerson"
                : "Athlete",
          };
          if (currentTeam.teamType === "Temporal") {
            data.temporaryPersonId = parseInt(memberId);
          } else {
            data.athleteId = parseInt(memberId);
          }
          memberPromises.push(tx.teamMember.create({ data }));
        }

        if (entrenadorId) {
          const data = {
            teamId: updatedTeam.id,
            position: "Entrenador",
            isActive: true,
            joinedAt: new Date(),
            memberType:
              currentTeam.teamType === "Temporal"
                ? "TemporaryPerson"
                : "Employee",
          };
          if (currentTeam.teamType === "Temporal") {
            data.temporaryPersonId = parseInt(entrenadorId);
          } else {
            data.employeeId = parseInt(entrenadorId);
          }
          memberPromises.push(tx.teamMember.create({ data }));
        }

        // Segundo entrenador (solo para equipos de fundación)
        if (segundoEntrenadorId && currentTeam.teamType === "Fundacion") {
          const data = {
            teamId: updatedTeam.id,
            position: "Entrenador",
            isActive: true,
            joinedAt: new Date(),
            memberType: "Employee",
            employeeId: parseInt(segundoEntrenadorId),
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
                      include: { sportsCategory: true },
                    },
                  },
                },
                employee: { include: { user: true } },
                temporaryPerson: true,
              },
            },
          },
        });

        return this.transformToFrontend(finalTeam);
      });
    } catch (error) {
      throw error;
    }
  }

  async delete(id) {
    try {
      const team = await this.findById(id);
      if (!team) throw new Error("Equipo no encontrado");

      return await prisma.$transaction(async (tx) => {
        if (team.teamType === "Temporal") {
          const tempIds = team.members
            .filter((m) => m.temporaryPersonId)
            .map((m) => m.temporaryPersonId);

          if (tempIds.length > 0) {
            await this.clearTemporaryPersonsCategory(tempIds);
          }
        }

        await tx.teamMember.deleteMany({ where: { teamId: parseInt(id) } });
        const deletedTeam = await tx.team.delete({
          where: { id: parseInt(id) },
        });

        return { nombre: team.nombre };
      });
    } catch (error) {
      throw error;
    }
  }

  async findAll({
    page = 1,
    limit = 10,
    search = "",
    status = "",
    teamType = "",
  }) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    const teams = await prisma.team.findMany({
      where: this.buildTeamWhereClause({ status, teamType }),
      include: this.getTeamRelationsInclude(),
      orderBy: { createdAt: "desc" },
    });

    const filteredTeams = teams
      .map((team) => this.transformToFrontend(team))
      .filter((team) => this.matchesTeamSearch(team, search));

    const total = filteredTeams.length;
    const paginatedTeams = filteredTeams.slice(skip, skip + limitNum);

    return {
      teams: paginatedTeams,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
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
                  include: { sportsCategory: true },
                },
              },
            },
            employee: { include: { user: true } },
            temporaryPerson: true,
          },
        },
      },
    });

    return team ? this.transformToFrontend(team) : null;
  }

  async findByName(name, excludeId = null) {
    const where = { name: { equals: name, mode: "insensitive" } };
    if (excludeId) where.id = { not: parseInt(excludeId) };
    return await prisma.team.findFirst({ where });
  }

  async changeStatus(id, status) {
    try {
      const statusMap = { Activo: "Active", Inactivo: "Inactive" };
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
                    include: { sportsCategory: true },
                  },
                },
              },
              employee: { include: { user: true } },
              temporaryPerson: true,
            },
          },
        },
      });

      return this.transformToFrontend(updatedTeam);
    } catch (error) {
      throw error;
    }
  }

  async checkNameAvailability(name, excludeId = null) {
    const existing = await this.findByName(name, excludeId);
    return {
      available: !existing,
      message: existing ? "Nombre en uso" : "Disponible",
    };
  }

  async getStats() {
    const [total, active, inactive, byType] = await Promise.all([
      prisma.team.count(),
      prisma.team.count({ where: { status: "Active" } }),
      prisma.team.count({ where: { status: "Inactive" } }),
      prisma.team.groupBy({ by: ["teamType"], _count: { id: true } }),
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
      temporal: typeStats.temporal || 0,
    };
  }

  async checkDuplicateTemporalTeam(athleteIds, trainerId, excludeId = null) {
    try {
      const where = {
        teamType: "Temporal",
        status: "Active",
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
              position: true,
            },
          },
        },
      });

      for (const team of existingTeams) {
        const teamAthleteIds = team.members
          .filter((m) => m.temporaryPersonId && m.position !== "Entrenador")
          .map((m) => m.temporaryPersonId)
          .sort();

        const teamTrainerId = team.members.find(
          (m) => m.temporaryPersonId && m.position === "Entrenador",
        )?.temporaryPersonId;

        const inputAthleteIds = athleteIds.sort();

        const sameAthletes =
          JSON.stringify(teamAthleteIds) === JSON.stringify(inputAthleteIds);
        const sameTrainer = teamTrainerId === trainerId;

        if (sameAthletes && sameTrainer) {
          return {
            isDuplicate: true,
            existingTeamId: team.id,
            existingTeamName: team.name,
          };
        }
      }

      return { isDuplicate: false };
    } catch (error) {
      throw error;
    }
  }

  async checkTemporalPersonAvailability(personId, excludeTeamId = null) {
    try {
      const existingMembership = await prisma.teamMember.findFirst({
        where: {
          temporaryPersonId: parseInt(personId),
          isActive: true,
          team: {
            status: "Active",
            ...(excludeTeamId ? { id: { not: parseInt(excludeTeamId) } } : {}),
          },
        },
        include: {
          team: true,
          temporaryPerson: true,
        },
      });

      if (existingMembership) {
        const person = existingMembership.temporaryPerson;
        const team = existingMembership.team;
        return {
          available: false,
          message: `${person.firstName} ${person.lastName} ya está asignado/a al equipo "${team.name}"`,
          teamName: team.name,
        };
      }

      return {
        available: true,
        message: "Persona disponible",
      };
    } catch (error) {
      throw error;
    }
  }

  async checkTemporalMembersInOtherActiveTeams(memberIds, excludeTeamId) {
    try {
      const conflicts = [];

      for (const memberId of memberIds) {
        const existingMembership = await prisma.teamMember.findFirst({
          where: {
            temporaryPersonId: parseInt(memberId),
            isActive: true,
            team: {
              status: "Active",
              id: { not: parseInt(excludeTeamId) },
            },
          },
          include: {
            team: true,
            temporaryPerson: true,
          },
        });

        if (existingMembership) {
          const person = existingMembership.temporaryPerson;
          const team = existingMembership.team;
          conflicts.push({
            personId: person.id,
            personName: `${person.firstName} ${person.lastName}`,
            teamId: team.id,
            teamName: team.name,
          });
        }
      }

      return conflicts;
    } catch (error) {
      throw error;
    }
  }

  async isTeamAssignedToEvent(teamId) {
    try {
      // Buscar participaciones en TODOS los eventos sin importar el estado
      // El equipo NO se puede eliminar si está asignado a cualquier evento
      const participants = await prisma.participant.findMany({
        where: {
          teamId: parseInt(teamId),
          type: "Team",
        },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      });

      const isAssigned = participants.length > 0;

      return {
        isAssigned,
        count: participants.length,
        events: participants.map((p) => ({
          id: p.service.id,
          name: p.service.name,
          status: p.service.status,
        })),
      };
    } catch (error) {
      throw error;
    }
  }

  transformToBackend(frontendData) {
    const normalizeUtf8Text = (value) => {
      if (typeof value !== "string") return null;
      const trimmed = value.trim();
      if (!trimmed) return null;
      try {
        return trimmed.normalize("NFC");
      } catch {
        return trimmed;
      }
    };

    const entrenadorId = frontendData.entrenadorData?.id || null;
    const segundoEntrenadorId = frontendData.segundoEntrenadorData?.id || null;

    let teamType = frontendData.teamType;
    if (teamType) {
      if (teamType === "temporal") teamType = "Temporal";
      if (teamType === "fundacion") teamType = "Fundacion";
    }

    const statusMap = { Activo: "Active", Inactivo: "Inactive" };
    const status = frontendData.estado
      ? statusMap[frontendData.estado] || "Active"
      : null;

    return {
      name: normalizeUtf8Text(frontendData.nombre) || null,
      description: normalizeUtf8Text(frontendData.descripcion),
      coach: normalizeUtf8Text(frontendData.entrenador),
      category: normalizeUtf8Text(frontendData.categoria),
      status,
      teamType,
      deportistasIds: frontendData.deportistasIds || [],
      entrenadorId,
      segundoEntrenadorId,
    };
  }

  /**
   * Obtener todos los equipos para reporte (SIN PAGINACION)
   */
  async findAllForReport({
    search = "",
    status = "",
    teamType = "",
  }) {
    const teams = await prisma.team.findMany({
      where: this.buildTeamWhereClause({ status, teamType }),
      include: this.getTeamRelationsInclude(),
      orderBy: { createdAt: "desc" },
    });

    const transformedTeams = teams
      .map((team) => this.transformToFrontend(team))
      .filter((team) => this.matchesTeamSearch(team, search));

    return {
      teams: transformedTeams,
    };
  }
}


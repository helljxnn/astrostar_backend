import prisma from "../../../../config/database.js";

export class MembershipRepository {
  /**
   * Crear membresía
   */
  async create(membershipData) {
    return await prisma.groupMembership.create({
      data: membershipData,
      include: {
        athlete: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                middleName: true,
                lastName: true,
                secondLastName: true,
                email: true,
              },
            },
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });
  }

  /**
   * Buscar membresía por ID
   */
  async findById(id) {
    return await prisma.groupMembership.findUnique({
      where: { id: parseInt(id) },
      include: {
        athlete: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                middleName: true,
                lastName: true,
                secondLastName: true,
                email: true,
                birthDate: true,
              },
            },
          },
        },
        group: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Actualizar membresía
   */
  async update(id, membershipData) {
    return await prisma.groupMembership.update({
      where: { id: parseInt(id) },
      data: membershipData,
      include: {
        athlete: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });
  }

  /**
   * Eliminar membresía (cambiar estado a INACTIVE)
   */
  async delete(id) {
    return await prisma.groupMembership.update({
      where: { id: parseInt(id) },
      data: {
        status: "INACTIVE",
        endDate: new Date(),
      },
    });
  }

  /**
   * Verificar si existe una deportista
   */
  async athleteExists(athleteId) {
    const athlete = await prisma.athlete.findUnique({
      where: { id: parseInt(athleteId) },
    });
    return !!athlete;
  }

  /**
   * Verificar si existe un grupo
   */
  async groupExists(groupId) {
    const group = await prisma.group.findUnique({
      where: { id: parseInt(groupId) },
    });
    return !!group;
  }

  /**
   * Obtener membresías de un grupo
   */
  async findByGroup(groupId, status = null) {
    const where = { groupId: parseInt(groupId) };
    if (status) {
      where.status = status;
    }

    return await prisma.groupMembership.findMany({
      where,
      include: {
        athlete: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                middleName: true,
                lastName: true,
                secondLastName: true,
                email: true,
                birthDate: true,
                age: true,
              },
            },
          },
        },
      },
      orderBy: { startDate: "desc" },
    });
  }

  /**
   * Obtener membresías de una deportista
   */
  async findByAthlete(athleteId) {
    return await prisma.groupMembership.findMany({
      where: { athleteId: parseInt(athleteId) },
      include: {
        group: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { startDate: "desc" },
    });
  }
}


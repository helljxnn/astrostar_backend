import prisma from "../../../config/database.js";

export const enrollmentsRepository = {
  async create(data) {
    return await prisma.enrollment.create({
      data,
      include: {
        athlete: {
          include: {
            user: {
              include: {
                documentType: true,
              },
            },
            guardian: true,
          },
        },
      },
    });
  },

  async findAll({ estado, athleteId, page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (estado) {
      where.estado = estado;
    }

    if (athleteId) {
      where.athleteId = parseInt(athleteId);
    }

    const [data, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          athleteId: true,
          fechaInicio: true,
          fechaVencimiento: true,
          estado: true,
          observaciones: true,
          createdAt: true,
          updatedAt: true,
          athlete: {
            select: {
              id: true,
              status: true,
              inactivityReason: true,
              guardianId: true,
              relationship: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  secondLastName: true,
                  identification: true,
                  email: true,
                  phoneNumber: true,
                  birthDate: true,
                  age: true,
                  address: true,
                  documentTypeId: true,
                },
              },
              guardian: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  identification: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.enrollment.count({ where }),
    ]);

    return {
      data,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id) {
    return await prisma.enrollment.findUnique({
      where: { id: parseInt(id) },
      include: {
        athlete: {
          include: {
            user: {
              include: {
                documentType: true,
              },
            },
            guardian: true,
          },
        },
      },
    });
  },

  async findByAthleteId(athleteId) {
    return await prisma.enrollment.findMany({
      where: { athleteId: parseInt(athleteId) },
      orderBy: { createdAt: "desc" },
    });
  },

  async findActiveByAthleteId(athleteId) {
    return await prisma.enrollment.findFirst({
      where: {
        athleteId: parseInt(athleteId),
        estado: "Vigente",
      },
    });
  },

  async update(id, data) {
    return await prisma.enrollment.update({
      where: { id: parseInt(id) },
      data,
    });
  },

  async delete(id) {
    return await prisma.enrollment.delete({
      where: { id: parseInt(id) },
    });
  },
};

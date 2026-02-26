import prisma from "../../../config/database.js";

export const preRegistrationsRepository = {
  async create(data) {
    return await prisma.preRegistration.create({
      data,
    });
  },

  async findAll({ status, page = 1, limit = 10, search }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (status) {
      // Capitalizar primera letra para que coincida con el enum
      // "pendiente" -> "Pendiente", "procesada" -> "Procesada"
      where.status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { identification: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.preRegistration.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          identification: true,
          birthDate: true,
          phoneNumber: true,
          email: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.preRegistration.count({ where }),
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
    return await prisma.preRegistration.findUnique({
      where: { id: parseInt(id) },
    });
  },

  async update(id, data) {
    return await prisma.preRegistration.update({
      where: { id: parseInt(id) },
      data,
    });
  },

  async delete(id) {
    return await prisma.preRegistration.delete({
      where: { id: parseInt(id) },
    });
  },

  async findByDocument(identification) {
    return await prisma.preRegistration.findUnique({
      where: { identification },
      select: {
        id: true,
        identification: true,
        status: true,
      },
    });
  },
};

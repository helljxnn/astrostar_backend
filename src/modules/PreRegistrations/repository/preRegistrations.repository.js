import prisma from "../../../config/database.js";

export const preRegistrationsRepository = {
  async create(data) {
    return await prisma.preRegistration.create({
      data,
    });
  },

  async findAll({ estado, page = 1, limit = 10, search }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (estado) {
      // Capitalizar primera letra para que coincida con el enum
      // "pendiente" -> "Pendiente", "procesada" -> "Procesada"
      where.estado = estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
    }

    if (search) {
      where.OR = [
        { nombres: { contains: search, mode: "insensitive" } },
        { apellidos: { contains: search, mode: "insensitive" } },
        { correo: { contains: search, mode: "insensitive" } },
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
          nombres: true,
          apellidos: true,
          numeroDocumento: true,
          fechaNacimiento: true,
          telefono: true,
          correo: true,
          estado: true,
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
};

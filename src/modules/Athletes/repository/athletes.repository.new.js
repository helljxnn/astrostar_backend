import prisma from "../../../config/database.js";

export const athletesRepository = {
  async findAll({ estado, categoria, search, page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (estado) {
      where.estado = estado;
    }

    if (categoria) {
      where.categoria = categoria;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { identification: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.athlete.findMany({
        where,
        skip,
        take: limit,
        include: {
          documentType: true,
          guardian: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
            },
          },
          enrollments: {
            where: { estado: "Vigente" },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.athlete.count({ where }),
    ]);

    // Transformar datos para incluir acudiente y enrollment activo
    const transformedData = data.map((athlete) => ({
      ...athlete,
      acudiente: athlete.guardian,
      activeEnrollment: athlete.enrollments[0] || null,
    }));

    return {
      data: transformedData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id) {
    return await prisma.athlete.findUnique({
      where: { id: parseInt(id) },
      include: {
        documentType: true,
        guardian: true,
        enrollments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },

  async findByIdentification(identification) {
    return await prisma.athlete.findUnique({
      where: { identification },
    });
  },

  async update(id, data) {
    return await prisma.athlete.update({
      where: { id: parseInt(id) },
      data,
      include: {
        documentType: true,
        guardian: true,
        enrollments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },

  async delete(id) {
    return await prisma.athlete.delete({
      where: { id: parseInt(id) },
    });
  },

  async getStats() {
    const [total, activos, inactivos] = await Promise.all([
      prisma.athlete.count(),
      prisma.athlete.count({ where: { estado: "Activo" } }),
      prisma.athlete.count({ where: { estado: "Inactivo" } }),
    ]);

    // Estadísticas por categoría
    const byCategoria = await prisma.athlete.groupBy({
      by: ["categoria"],
      _count: { id: true },
    });

    const categoriaStats = byCategoria.reduce((acc, item) => {
      acc[item.categoria] = item._count.id;
      return acc;
    }, {});

    return {
      total,
      activos,
      inactivos,
      porCategoria: categoriaStats,
    };
  },
};

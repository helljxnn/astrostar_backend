import prisma from "../../../config/database.js";

export class RoleRepository {
  // Get all roles with pagination and search
  async findAll({ page, limit, search }) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        skip,
        take: limit,
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.role.count({ where }),
    ]);

    return {
      roles,
      total,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Create a new role
  async create(roleData) {
    return await prisma.role.create({
      data: roleData,
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // Find role by ID
  async findById(id) {
    return await prisma.role.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // Find role by name
  async findByName(name) {
    return await prisma.role.findUnique({
      where: { name },
    });
  }

  // Find role by name (case-insensitive)
  async findByNameCaseInsensitive(name) {
    return await prisma.role.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });
  }

  // Update role
  async update(id, roleData) {
    try {
      return await prisma.role.update({
        where: { id },
        data: roleData,
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === "P2025") {
        return null; // Role not found
      }
      throw error;
    }
  }

  // Delete role
  async delete(id) {
    try {
      // Verificar si el rol existe y obtener información completa
      const role = await prisma.role.findUnique({
        where: { id },
        select: { 
          name: true, 
          status: true,
          users: {
            select: { id: true }
          }
        },
      });

      if (!role) {
        return false; // Role not found
      }

      // Proteger rol de administrador
      if (role.name === "Administrador") {
        throw new Error(
          `El rol "${role.name}" es un rol del sistema y no puede ser eliminado por razones de seguridad.`
        );
      }

      // Verificar si el rol está siendo usado por usuarios
      if (role.users && role.users.length > 0) {
        const userCount = role.users.length;
        const userWord = userCount === 1 ? 'usuario' : 'usuarios';
        
        throw new Error(
          `No se puede eliminar el rol "${role.name}" porque está asignado a ${userCount} ${userWord}. Para eliminarlo, primero debe reasignar ${userCount === 1 ? 'este usuario' : 'estos usuarios'} a otro rol.`
        );
      }

      // Proteger roles activos
      if (role.status === "Active") {
        throw new Error(
          `No se puede eliminar el rol "${role.name}" porque tiene estado "Activo". Primero cambie el estado a "Inactivo" y luego inténtelo de nuevo.`
        );
      }

      await prisma.role.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (error.code === "P2025") {
        return false; // Role not found
      }
      throw error;
    }
  }

  // Check if role exists
  async exists(id) {
    const role = await prisma.role.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!role;
  }

  // Get role statistics
  async getStats() {
    const [total, active, inactive] = await Promise.all([
      prisma.role.count(),
      prisma.role.count({ where: { status: "Active" } }),
      prisma.role.count({ where: { status: "Inactive" } }),
    ]);

    return {
      total,
      active,
      inactive,
    };
  }
}

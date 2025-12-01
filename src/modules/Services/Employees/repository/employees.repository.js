import { PrismaClient } from '../../../../../generated/prisma/index.js';

const prisma = new PrismaClient();



export class EmployeeRepository {
  
  /**
   * Obtener todos los empleados con paginación y búsqueda
   */
  async findAll({ page, limit, search, status }) {
    const skip = (page - 1) * limit;

    // Construir condiciones de búsqueda
    const where = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { user: { firstName: { contains: search, mode: 'insensitive' } } },
          { user: { lastName: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { user: { identification: { contains: search, mode: 'insensitive' } } }
        ]
      })
    };

    // Ejecutar consultas en paralelo para optimizar performance
    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            include: {
              role: true,
              documentType: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.employee.count({ where })
    ]);

    return {
      employees,
      total,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Buscar empleado por ID
   */
  async findById(id) {
    return await prisma.employee.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          include: {
            role: true,
            documentType: true
          }
        },
        employeePermissions: {
          include: {
            permission: true
          }
        },
        purchases: true
      }
    });
  }

  /**
   * Buscar empleado por userId
   */
  async findByUserId(userId) {
    return await prisma.employee.findUnique({
      where: { userId: parseInt(userId) },
      include: {
        user: {
          include: {
            role: true,
            documentType: true
          }
        }
      }
    });
  }

  /**
   * Crear empleado con usuario en transacción
   */
  async create(employeeData, userData) {
    return await prisma.$transaction(async (tx) => {
      // 1. Crear el usuario primero
      const newUser = await tx.user.create({
        data: userData,
        include: {
          role: true,
          documentType: true
        }
      });

      // 2. Crear el empleado vinculado al usuario
      const newEmployee = await tx.employee.create({
        data: {
          ...employeeData,
          userId: newUser.id
        },
        include: {
          user: {
            include: {
              role: true,
              documentType: true
            }
          }
        }
      });

      return newEmployee;
    });
  }

  /**
   * Actualizar empleado
   */
  async update(id, employeeData, userData) {
    return await prisma.$transaction(async (tx) => {
      // 1. Actualizar datos del usuario si se proporcionan
      if (userData && Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: employeeData.userId },
          data: userData
        });
      }

      // 2. Actualizar datos del empleado
      const updatedEmployee = await tx.employee.update({
        where: { id: parseInt(id) },
        data: employeeData,
        include: {
          user: {
            include: {
              role: true,
              documentType: true
            }
          }
        }
      });

      return updatedEmployee;
    });
  }

  /**
   * Eliminar empleado (hard delete)
   */
  async delete(id) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: parseInt(id) },
        include: { user: true }
      });

      if (!employee) {
        return false;
      }

      // Verificar si el empleado tiene estado "Active"
      if (employee.status === 'Active') {
        throw new Error(
          `No se puede eliminar el empleado "${employee.user.firstName} ${employee.user.lastName}" porque tiene estado "Activo". Primero cambie el estado a "Deshabilitado" y luego inténtelo de nuevo.`
        );
      }

      // Hard delete: eliminar empleado y usuario completamente
      await prisma.$transaction(async (tx) => {
        // Primero eliminar el empleado
        await tx.employee.delete({
          where: { id: parseInt(id) }
        });

        // Luego eliminar el usuario (esto se hace automáticamente por onDelete: Cascade)
        // Pero lo hacemos explícito para mayor claridad
        await tx.user.delete({
          where: { id: employee.userId }
        });
      });

      return true;
    } catch (error) {
      if (error.code === 'P2025') {
        return false; // Empleado no encontrado
      }
      throw error;
    }
  }

  /**
   * Verificar si el email ya existe
   */
  async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
      include: { employee: true }
    });
  }

  /**
   * Verificar si la identificación ya existe
   */
  async findByIdentification(identification) {
    return await prisma.user.findUnique({
      where: { identification },
      include: { employee: true }
    });
  }

  /**
   * Obtener estadísticas de empleados
   */
  async getStats() {
    const [total, active, disabled, onVacation, retired] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: 'Active' } }),
      prisma.employee.count({ where: { status: 'Disabled' } }),
      prisma.employee.count({ where: { status: 'OnVacation' } }),
      prisma.employee.count({ where: { status: 'Retired' } })
    ]);

    return { total, active, disabled, onVacation, retired };
  }



  /**
   * Obtener roles disponibles para empleados
   */
  async getAvailableRoles() {
    return await prisma.role.findMany({
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Obtener tipos de documento (excluye NIT para personas naturales)
   */
  async getDocumentTypes() {
    return await prisma.documentType.findMany({
      where: {
        NOT: {
          name: 'Número de Identificación Tributaria'
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Actualizar contraseña de usuario
   */
  async updateUserPassword(userId, hashedPassword) {
    return await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword }
    });
  }
}
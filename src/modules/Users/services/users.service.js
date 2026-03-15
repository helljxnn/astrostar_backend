import usersRepository from "../repository/users.repository.js";

export class UsersService {
  /**
   * Obtener todos los usuarios (SOLO LECTURA)
   */
  async getUsers(params = {}) {
    try {
      const result = await usersRepository.findAll(params);

      // Formatear respuesta
      const formattedUsers = result.users.map((user) =>
        this.formatUserResponse(user)
      );

      return {
        success: true,
        data: formattedUsers,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("Error in getUsers service:", error);
      throw new Error(`Error obteniendo usuarios: ${error.message}`);
    }
  }

  /**
   * Obtener usuario por ID (SOLO LECTURA)
   */
  async getUserById(id) {
    try {
      const user = await usersRepository.findById(id);

      if (!user) {
        return {
          success: false,
          message: "Usuario no encontrado",
        };
      }

      const formattedUser = this.formatUserResponse(user);

      return {
        success: true,
        data: formattedUser,
      };
    } catch (error) {
      console.error("Error in getUserById service:", error);
      throw new Error(`Error obteniendo usuario: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de usuarios
   */
  async getUserStats() {
    try {
      const stats = await usersRepository.getStats();

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error("Error in getUserStats service:", error);
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }
  }

  /**
   * Verificar disponibilidad de email
   */
  async checkEmailAvailability(email, excludeUserId = null) {
    try {
      const existingUser = await usersRepository.findByEmail(email, excludeUserId);
      
      if (!existingUser) {
        return {
          success: true,
          available: true,
          message: "",
        };
      }

      if (excludeUserId && existingUser.id === parseInt(excludeUserId)) {
        return {
          success: true,
          available: true,
          message: "",
        };
      }

      return {
        success: true,
        available: false,
        message: 'Este email ya está registrado en el sistema',
      };
    } catch (error) {
      console.error("Error in checkEmailAvailability service:", error);
      throw new Error(`Error verificando email: ${error.message}`);
    }
  }

  /**
   * Verificar disponibilidad de identificación
   */
  async checkIdentificationAvailability(identification, excludeUserId = null) {
    try {
      const existingUser = await usersRepository.findByIdentification(identification, excludeUserId);
      
      if (!existingUser) {
        return {
          success: true,
          available: true,
          message: "",
        };
      }

      if (excludeUserId && existingUser.id === parseInt(excludeUserId)) {
        return {
          success: true,
          available: true,
          message: "",
        };
      }

      return {
        success: true,
        available: false,
        message: 'Este documento ya está registrado en el sistema',
      };
    } catch (error) {
      console.error("Error in checkIdentificationAvailability service:", error);
      throw new Error(`Error verificando identificación: ${error.message}`);
    }
  }

  /**
   * Obtener todos los usuarios para reporte (SIN PAGINACIÓN)
   */
  async getAllUsersForReport(params = {}) {
    try {
      const result = await usersRepository.findAllForReport(params);

      // Formatear respuesta
      const formattedUsers = result.users.map((user) =>
        this.formatUserResponse(user)
      );

      return {
        success: true,
        data: formattedUsers,
      };
    } catch (error) {
      console.error("Error in getAllUsersForReport service:", error);
      throw new Error(`Error obteniendo usuarios para reporte: ${error.message}`);
    }
  }

  /**
   * Formatear respuesta del usuario (eliminar datos sensibles)
   */
  formatUserResponse(user) {
    const { passwordHash, ...userWithoutPassword } = user;

    // Determinar tipo de usuario
    let userType = "user";
    if (user.athlete) userType = "athlete";
    if (user.employee) userType = "employee";

    return {
      ...userWithoutPassword,
      userType,
      // Información resumida para fácil acceso
      summary: {
        fullName: `${user.firstName} ${user.lastName}`,
        type: userType,
        status: user.status,
        role: user.role?.name,
        hasLogin: !!(user.email && user.email.trim() !== ""),
      },
    };
  }
}

export default new UsersService();

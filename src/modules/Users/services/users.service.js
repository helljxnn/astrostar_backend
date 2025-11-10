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

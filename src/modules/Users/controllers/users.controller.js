// UsersController.js
import usersService from "../services/users.service.js";

export class UsersController {
  async getUsers(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        status,
        roleId,
        userType,
      } = req.query;

      const result = await usersService.getUsers({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        roleId: roleId ? parseInt(roleId) : undefined,
        userType,
      });

      res.json(result);
    } catch (error) {
      console.error("Error in getUsers controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener usuarios",
      });
    }
  }

  async getUserById(req, res) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de usuario inválido",
        });
      }

      const result = await usersService.getUserById(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error("Error in getUserById controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener usuario",
      });
    }
  }

  async getUserStats(req, res) {
    try {
      const result = await usersService.getUserStats();
      res.json(result);
    } catch (error) {
      console.error("Error in getUserStats controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener estadísticas",
      });
    }
  }

  async checkEmailAvailability(req, res) {
    try {
      const { email, excludeUserId } = req.query;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "El email es requerido",
        });
      }

      const result = await usersService.checkEmailAvailability(email, excludeUserId);
      res.json(result);
    } catch (error) {
      console.error("Error in checkEmailAvailability controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al verificar email",
      });
    }
  }

  async checkIdentificationAvailability(req, res) {
    try {
      const { identification, excludeUserId } = req.query;
      
      if (!identification) {
        return res.status(400).json({
          success: false,
          message: "La identificación es requerida",
        });
      }

      const result = await usersService.checkIdentificationAvailability(identification, excludeUserId);
      res.json(result);
    } catch (error) {
      console.error("Error in checkIdentificationAvailability controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al verificar identificación",
      });
    }
  }
}

export default new UsersController();

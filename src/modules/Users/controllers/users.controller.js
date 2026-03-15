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
      console.log('🔍 [UsersController] checkEmailAvailability llamado');
      console.log('🔍 [UsersController] Query params:', req.query);
      
      const { email, excludeUserId } = req.query;
      
      console.log('🔍 [UsersController] Email recibido:', email);
      console.log('🔍 [UsersController] excludeUserId recibido:', excludeUserId);
      
      // Si no hay email, devolver disponible (para evitar errores en el frontend)
      if (!email || email.trim() === '') {
        console.log('⚠️ [UsersController] Email vacío, devolviendo disponible');
        return res.json({
          success: true,
          available: true,
          message: '',
        });
      }

      const result = await usersService.checkEmailAvailability(email, excludeUserId);
      console.log('✅ [UsersController] Resultado:', result);
      res.json(result);
    } catch (error) {
      console.error("❌ [UsersController] Error:", error);
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

  async getAllUsersForReport(req, res) {
    try {
      const {
        search = "",
        status,
        roleId,
        userType,
      } = req.query;

      const result = await usersService.getAllUsersForReport({
        search,
        status,
        roleId: roleId ? parseInt(roleId) : undefined,
        userType,
      });

      res.json({
        success: true,
        data: result.data,
        message: `Se encontraron ${result.data.length} usuarios para el reporte.`,
      });
    } catch (error) {
      console.error("Error in getAllUsersForReport controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener usuarios para reporte",
      });
    }
  }
}

export default new UsersController();

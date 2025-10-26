import usersService from '../services/users.service.js';

export class UsersController {
  /**
   * Obtener todos los usuarios
   */
  async getUsers(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        status, 
        roleId, 
        userType 
      } = req.query;

      const result = await usersService.getUsers({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        roleId: roleId ? parseInt(roleId) : undefined,
        userType
      });

      res.json(result);
    } catch (error) {
      console.error('Error in getUsers controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener usuarios'
      });
    }
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(req, res) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario inválido'
        });
      }

      const result = await usersService.getUserById(id);
      
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in getUserById controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener usuario'
      });
    }
  }

  /**
   * Obtener estadísticas de usuarios
   */
  async getUserStats(req, res) {
    try {
      const result = await usersService.getUserStats();
      res.json(result);
    } catch (error) {
      console.error('Error in getUserStats controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener estadísticas'
      });
    }
  }
}

export default new UsersController();
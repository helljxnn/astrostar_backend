import { GroupService } from "../services/groups.service.js";

export class GroupController {
  constructor() {
    this.groupService = new GroupService();
  }

  /**
   * Obtener todos los grupos
   */
  getAllGroups = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        status = "",
        level = "",
      } = req.query;

      const result = await this.groupService.getAllGroups({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        level,
      });

      res.json({
        success: true,
        data: result.groups,
        pagination: result.pagination,
        message: `Se encontraron ${result.pagination.total} grupos.`,
      });
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener grupos.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * Obtener grupo por ID
   */
  getGroupById = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await this.groupService.getGroupById(id);

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message,
        });
      }

      res.json({
        success: true,
        data: result.data,
        message: "Grupo encontrado exitosamente.",
      });
    } catch (error) {
      console.error("Error fetching group by ID:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener el grupo.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * Crear nuevo grupo
   */
  createGroup = async (req, res) => {
    try {
      const groupData = req.body;
      const result = await this.groupService.createGroup(groupData);

      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      console.error("Error creating group:", error);

      if (error.message.includes("no existe")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor al crear el grupo.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * Actualizar grupo
   */
  updateGroup = async (req, res) => {
    try {
      const { id } = req.params;
      const groupData = req.body;

      const result = await this.groupService.updateGroup(id, groupData);

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message,
        });
      }

      res.json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      console.error("Error updating group:", error);

      if (
        error.message.includes("no existe") ||
        error.message.includes("No se puede reducir")
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor al actualizar el grupo.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * Actualizar estado del grupo
   */
  updateGroupStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const result = await this.groupService.updateGroupStatus(id, status);

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message,
        });
      }

      res.json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      console.error("Error updating group status:", error);
      res.status(500).json({
        success: false,
        message:
          "Error interno del servidor al actualizar el estado del grupo.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * Eliminar grupo (archivado lógico)
   */
  deleteGroup = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await this.groupService.deleteGroup(id);

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message,
        });
      }

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("Error deleting group:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al eliminar el grupo.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * Obtener estadísticas de grupos
   */
  getGroupStats = async (req, res) => {
    try {
      const result = await this.groupService.getGroupStats();

      res.json({
        success: true,
        data: result.data,
        message: "Estadísticas obtenidas exitosamente.",
      });
    } catch (error) {
      console.error("Error fetching group stats:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener estadísticas.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };
}

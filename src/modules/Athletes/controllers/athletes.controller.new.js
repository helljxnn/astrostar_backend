import { athletesService } from "../services/athletes.service.new.js";

// Validación simple sin dependencias externas
const validateUpdate = (data) => {
  const errors = [];
  const validStates = ["Activo", "Inactivo"];
  const validParentesco = [
    "Mother", "Father", "Grandparent", "Uncle_Aunt", "Sibling",
    "Cousin", "Legal_Guardian", "Neighbor", "Family_Friend", "Other"
  ];
  
  if (data.firstName && data.firstName.length < 2) {
    errors.push({ field: 'firstName', message: 'Nombre debe tener mínimo 2 caracteres' });
  }
  
  if (data.lastName && data.lastName.length < 2) {
    errors.push({ field: 'lastName', message: 'Apellido debe tener mínimo 2 caracteres' });
  }
  
  if (data.estado && !validStates.includes(data.estado)) {
    errors.push({ field: 'estado', message: 'Estado inválido' });
  }
  
  if (data.parentesco && data.parentesco !== null && !validParentesco.includes(data.parentesco)) {
    errors.push({ field: 'parentesco', message: 'Parentesco inválido' });
  }
  
  if (errors.length > 0) {
    return { error: { details: errors }, value: null };
  }
  
  return { error: null, value: data };
};

export const athletesController = {
  async findAll(req, res) {
    try {
      const { estado, categoria, search, page, limit } = req.query;
      const result = await athletesService.findAll({
        estado,
        categoria,
        search,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
      });

      return res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  async findById(req, res) {
    try {
      const { id } = req.params;
      const athlete = await athletesService.findById(id);

      return res.json({
        success: true,
        data: athlete,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = validateUpdate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const athlete = await athletesService.update(id, value);

      return res.json({
        success: true,
        message: "Deportista actualizada",
        data: athlete,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      await athletesService.delete(id);

      return res.json({
        success: true,
        message: "Deportista eliminada",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  async getStats(req, res) {
    try {
      const stats = await athletesService.getStats();

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};


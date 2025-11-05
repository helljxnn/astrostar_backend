import { SportsCategoryService } from '../services/sportsCategory.service.js';

export class SportsCategoryController {
  constructor() {
    this.sportsCategoryService = new SportsCategoryService();
  }

  // Obtener todas las categorías deportivas
  getAllSportsCategories = async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      
      const result = await this.sportsCategoryService.getAllSportsCategories({
        page: parseInt(page),
        limit: parseInt(limit),
        search
      });

      const totalCategories = result.pagination.total;
      const currentPage = result.pagination.page;
      const totalPages = result.pagination.pages;
      
      let message = '';
      if (totalCategories === 0) {
        message = 'No se encontraron categorías deportivas en el sistema.';
      } else if (totalCategories === 1) {
        message = 'Se encontró 1 categoría deportiva en el sistema.';
      } else {
        message = `Se encontraron ${totalCategories} categorías deportivas en el sistema (página ${currentPage} de ${totalPages}).`;
      }

      res.json({
        success: true,
        data: result.categories,
        pagination: result.pagination,
        message: message
      });
    } catch (error) {
      console.error('Error al obtener categorías deportivas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las categorías deportivas',
        error: error.message
      });
    }
  };

  // Crear una nueva categoría deportiva
  createSportsCategory = async (req, res) => {
    try {
      const { nombre, edadMinima, edadMaxima, descripcion, archivo, estado, publicar } = req.body;

      const newCategory = await this.sportsCategoryService.createSportsCategory({
        nombre: nombre.trim(),
        edadMinima: parseInt(edadMinima),
        edadMaxima: parseInt(edadMaxima),
        descripcion: descripcion?.trim() || null,
        archivo: archivo || null,
        estado: estado || 'Activo',
        publicar: publicar === true || publicar === 'true'
      });

      res.status(201).json({
        success: true,
        data: newCategory,
        message: `La categoría deportiva "${newCategory.nombre}" ha sido creada exitosamente`
      });
    } catch (error) {
      console.error('Error al crear categoría deportiva:', error);
      
      // Error de nombre duplicado de Prisma
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: `El nombre "${req.body.nombre}" ya está en uso. Elija otro nombre.`
        });
      }

      // Error personalizado del servicio
      if (error.message.includes('ya existe')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al crear la categoría deportiva. Por favor, inténtelo de nuevo.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Obtener categoría deportiva por ID
  getSportsCategoryById = async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'El ID de la categoría proporcionado no es válido. Debe ser un número entero positivo.'
        });
      }

      const category = await this.sportsCategoryService.getSportsCategoryById(parseInt(id));

      if (!category) {
        return res.status(404).json({
          success: false,
          message: `No se encontró la categoría deportiva con ID ${id}. Verifique que la categoría existe y que el ID es correcto.`
        });
      }

      res.json({
        success: true,
        data: category,
        message: `Información de la categoría deportiva "${category.nombre}" obtenida exitosamente`
      });
    } catch (error) {
      console.error('Error al obtener categoría deportiva:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener la categoría deportiva. Por favor, inténtelo de nuevo.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Actualizar categoría deportiva
  updateSportsCategory = async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, edadMinima, edadMaxima, descripcion, archivo, estado, publicar } = req.body;

      const updatedCategory = await this.sportsCategoryService.updateSportsCategory(parseInt(id), {
        nombre: nombre ? nombre.trim() : undefined,
        edadMinima: edadMinima ? parseInt(edadMinima) : undefined,
        edadMaxima: edadMaxima ? parseInt(edadMaxima) : undefined,
        descripcion: descripcion !== undefined ? (descripcion?.trim() || null) : undefined,
        archivo: archivo !== undefined ? archivo : undefined,
        estado,
        publicar: publicar !== undefined ? (publicar === true || publicar === 'true') : undefined
      });

      if (!updatedCategory) {
        return res.status(404).json({
          success: false,
          message: `No se encontró la categoría deportiva con ID ${id}. Verifique que la categoría existe y que el ID es correcto.`
        });
      }

      res.json({
        success: true,
        data: updatedCategory,
        message: `La categoría deportiva "${updatedCategory.nombre}" ha sido actualizada exitosamente`
      });
    } catch (error) {
      console.error('Error al actualizar categoría deportiva:', error);
      
      // Error de nombre duplicado de Prisma
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: `El nombre "${req.body.nombre}" ya está en uso. Elija otro nombre.`
        });
      }

      // Error personalizado del servicio
      if (error.message.includes('ya existe')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al actualizar la categoría deportiva. Por favor, inténtelo de nuevo.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Eliminar categoría deportiva
  deleteSportsCategory = async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'El ID de la categoría proporcionado no es válido. Debe ser un número entero positivo.'
        });
      }

      const result = await this.sportsCategoryService.deleteSportsCategory(parseInt(id));

      if (!result.success) {
        return res.status(result.statusCode || 404).json({
          success: false,
          message: result.message
        });
      }

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error al eliminar categoría deportiva:', error);
      
      // Error de restricción de clave foránea (categoría en uso)
      if (error.code === 'P2003') {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar esta categoría deportiva porque está siendo utilizada por inscripciones o participantes. Para eliminarla, primero debe reasignar esos registros a otra categoría.'
        });
      }

      // Manejar errores específicos de restricciones
      if (error.message.includes('categorías con estado Activo')) {
        return res.status(400).json({
          success: false,
          message: 'No se pueden eliminar categorías con estado "Activo". Primero cambie el estado de la categoría a "Inactivo" y luego inténtelo de nuevo.'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al eliminar la categoría deportiva. Por favor, inténtelo de nuevo.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Obtener estadísticas de categorías deportivas
  getSportsCategoryStats = async (req, res) => {
    try {
      const stats = await this.sportsCategoryService.getSportsCategoryStats();

      res.json({
        success: true,
        data: stats,
        message: `Estadísticas de categorías deportivas obtenidas exitosamente: ${stats.total} categorías en total (${stats.activas} activas, ${stats.inactivas} inactivas).`
      });
    } catch (error) {
      console.error('Error al obtener estadísticas de categorías deportivas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener las estadísticas. Por favor, inténtelo de nuevo.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Verificar disponibilidad del nombre
  checkCategoryNameAvailability = async (req, res) => {
    try {
      const { nombre } = req.query;
      const { excludeId } = req.query; // Para excluir la categoría actual al editar

      if (!nombre || nombre.trim().length < 3) {
        return res.json({
          success: true,
          data: {
            available: false,
            message: 'El nombre debe tener al menos 3 caracteres.'
          }
        });
      }

      const existingCategory = await this.sportsCategoryService.checkCategoryNameExists(nombre.trim(), excludeId ? parseInt(excludeId) : null);

      if (existingCategory) {
        return res.json({
          success: true,
          data: {
            available: false,
            message: `El nombre "${nombre}" ya está en uso.`,
            existingCategory: existingCategory.nombre
          }
        });
      }

      res.json({
        success: true,
        data: {
          available: true,
          message: 'Nombre disponible'
        }
      });
    } catch (error) {
      console.error('Error al verificar disponibilidad del nombre:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al verificar disponibilidad del nombre.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Obtener atletas inscritos en una categoría
  getAthletesByCategory = async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'El ID de la categoría proporcionado no es válido.'
        });
      }

      const athletes = await this.sportsCategoryService.getAthletesByCategory(parseInt(id));

      res.json({
        success: true,
        data: athletes,
        message: `Se encontraron ${athletes.length} atleta(s) inscrito(s) en esta categoría.`
      });
    } catch (error) {
      console.error('Error al obtener atletas de la categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los atletas de la categoría.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
}
// src/controllers/providers.controller.js
import { ProvidersService } from '../services/providers.service.js';

export class ProvidersController {
  constructor() {
    this.providersService = new ProvidersService();
  }

  /**
   * Obtener todos los proveedores
   */
  getAllProviders = async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        status, 
        entityType 
      } = req.query;

      const result = await this.providersService.getAllProviders({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        entityType
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: `Se encontraron ${result.pagination?.total || 0} proveedores.`
      });
    } catch (error) {
      console.error('Error in getAllProviders controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener proveedores',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Obtener proveedor por ID
   */
  getProviderById = async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de proveedor inválido'
        });
      }

      const result = await this.providersService.getProviderById(id);
      
      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: 'Proveedor encontrado exitosamente.'
      });
    } catch (error) {
      console.error('Error in getProviderById controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener proveedor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Crear nuevo proveedor
   */
  createProvider = async (req, res) => {
    try {
      console.log('📥 Datos recibidos en createProvider:', req.body);
      
      const result = await this.providersService.createProvider(req.body);
      
      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } catch (error) {
      console.error('Error in createProvider controller:', error);
      
      if (error.message.includes('ya está registrado')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al crear proveedor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Actualizar proveedor
   */
  updateProvider = async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de proveedor inválido'
        });
      }

      console.log('📥 Datos recibidos en updateProvider:', { id, data: req.body });

      const result = await this.providersService.updateProvider(id, req.body);
      
      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: result.message
      });
    } catch (error) {
      console.error('Error in updateProvider controller:', error);
      
      if (error.message.includes('ya está registrado')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al actualizar proveedor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Eliminar proveedor
   */
  deleteProvider = async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de proveedor inválido'
        });
      }

      const result = await this.providersService.deleteProvider(id);
      
      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error in deleteProvider controller:', error);
      
      if (error.message.includes('No se puede eliminar')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al eliminar proveedor'
      });
    }
  };

  /**
   * Cambiar estado de proveedor
   */
  changeProviderStatus = async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de proveedor inválido'
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'El estado es requerido'
        });
      }

      const result = await this.providersService.changeProviderStatus(id, status);
      
      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: result.message
      });
    } catch (error) {
      console.error('Error in changeProviderStatus controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al cambiar estado'
      });
    }
  };

   //Verificar si un proveedor tiene compras activas
  checkActivePurchases = async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de proveedor inválido'
        });
      }

      const result = await this.providersService.checkActivePurchases(id);
      
      res.json({
        success: true,
        hasActivePurchases: result.hasActivePurchases,
        message: result.hasActivePurchases 
          ? 'El proveedor tiene compras activas' 
          : 'El proveedor no tiene compras activas'
      });
    } catch (error) {
      console.error('Error in checkActivePurchases controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar compras activas',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Verificar disponibilidad de NIT/Identificación
   */
  checkNitAvailability = async (req, res) => {
    try {
      const { nit, excludeId, tipoEntidad = 'juridica' } = req.query;

      console.log('🔍 Checking NIT availability:', { nit, excludeId, tipoEntidad });

      if (!nit) {
        return res.status(400).json({
          success: false,
          message: tipoEntidad === 'juridica' 
            ? 'El NIT es requerido' 
            : 'El documento de identidad es requerido'
        });
      }

      const result = await this.providersService.checkNitAvailability(nit, excludeId, tipoEntidad);

      res.json({
        success: true,
        available: result.available,
        message: result.available 
          ? (tipoEntidad === 'juridica' ? 'NIT disponible' : 'Documento disponible')
          : result.message
      });
    } catch (error) {
      console.error('❌ Error checking NIT availability:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar disponibilidad',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Verificar disponibilidad de razón social/nombre
   */
  checkBusinessNameAvailability = async (req, res) => {
    try {
      const { businessName, excludeId, tipoEntidad = 'juridica' } = req.query;

      console.log('🔍 Checking business name availability:', { businessName, excludeId, tipoEntidad });

      if (!businessName) {
        return res.status(400).json({
          success: false,
          message: tipoEntidad === 'juridica' 
            ? 'La razón social es requerida' 
            : 'El nombre es requerido'
        });
      }

      const result = await this.providersService.checkBusinessNameAvailability(businessName, excludeId, tipoEntidad);

      res.json({
        success: true,
        available: result.available,
        message: result.available 
          ? (tipoEntidad === 'juridica' ? 'Razón social disponible' : 'Nombre disponible')
          : result.message
      });
    } catch (error) {
      console.error('❌ Error checking business name availability:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar disponibilidad',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Verificar disponibilidad de email
   */
  checkEmailAvailability = async (req, res) => {
    try {
      const { email, excludeId } = req.query;

      console.log('🔍 Checking email availability:', { email, excludeId });

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'El email es requerido'
        });
      }

      const result = await this.providersService.checkEmailAvailability(email, excludeId);

      res.json({
        success: true,
        available: result.available,
        message: result.available ? 'Email disponible' : result.message
      });
    } catch (error) {
      console.error('❌ Error checking email availability:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar disponibilidad del email',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Verificar disponibilidad de contacto principal
   */
  checkContactAvailability = async (req, res) => {
    try {
      const { contact, excludeId } = req.query;

      console.log('🔍 Checking contact availability:', { contact, excludeId });

      if (!contact) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de contacto es requerido'
        });
      }

      const result = await this.providersService.checkContactAvailability(contact, excludeId);

      res.json({
        success: true,
        available: result.available,
        message: result.available ? 'Nombre de contacto disponible' : result.message
      });
    } catch (error) {
      console.error('❌ Error checking contact availability:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar disponibilidad del contacto',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Obtener estadísticas de proveedores
   */
  getProviderStats = async (req, res) => {
    try {
      const result = await this.providersService.getProviderStats();

      res.json({
        success: true,
        data: result.data,
        message: 'Estadísticas obtenidas exitosamente.'
      });
    } catch (error) {
      console.error('Error in getProviderStats controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener estadísticas',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
}

// Exportar instancia única del servicio
export default new ProvidersController();
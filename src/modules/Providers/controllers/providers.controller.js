import providersService from '../services/providers.service.js';

export class ProvidersController {
  /**
   * Obtener todos los proveedores
   */
  async getProviders(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        status, 
        entityType 
      } = req.query;

      const result = await providersService.getProviders({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        entityType
      });

      res.json(result);
    } catch (error) {
      console.error('Error in getProviders controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener proveedores'
      });
    }
  }

  /**
   * Obtener proveedor por ID
   */
  async getProviderById(req, res) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de proveedor inválido'
        });
      }

      const result = await providersService.getProviderById(id);
      
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in getProviderById controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener proveedor'
      });
    }
  }

  /**
   * Crear nuevo proveedor
   */
  async createProvider(req, res) {
    try {
      const result = await providersService.createProvider(req.body);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Error in createProvider controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al crear proveedor'
      });
    }
  }

  /**
   * Actualizar proveedor
   */
  async updateProvider(req, res) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de proveedor inválido'
        });
      }

      const result = await providersService.updateProvider(id, req.body);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in updateProvider controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al actualizar proveedor'
      });
    }
  }

  /**
   * Eliminar proveedor
   */
  async deleteProvider(req, res) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de proveedor inválido'
        });
      }

      const result = await providersService.deleteProvider(id);
      
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in deleteProvider controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al eliminar proveedor'
      });
    }
  }

  /**
   * Cambiar estado de proveedor
   */
  async changeProviderStatus(req, res) {
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

      const result = await providersService.changeProviderStatus(id, status);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in changeProviderStatus controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al cambiar estado'
      });
    }
  }

  /**
   * Verificar disponibilidad de NIT/Identificación
   * Endpoint: GET /api/providers/check-nit
   * Query params: nit, excludeId (opcional), tipoEntidad (opcional)
   */
  async checkNitAvailability(req, res) {
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

      const existingProvider = await providersService.checkNitExists(
        nit,
        excludeId ? parseInt(excludeId) : null
      );

      if (existingProvider) {
        return res.json({
          success: true,
          data: {
            available: false,
            message: tipoEntidad === 'juridica' 
              ? `El NIT "${nit}" ya está registrado.`
              : `El documento de identidad "${nit}" ya está registrado.`,
            existingProvider: {
              nit: existingProvider.nit,
              razonSocial: existingProvider.razonSocial,
              tipoEntidad: existingProvider.tipoEntidad
            }
          }
        });
      }

      return res.json({
        success: true,
        data: {
          available: true,
          message: tipoEntidad === 'juridica' ? 'NIT disponible' : 'Documento disponible'
        }
      });
    } catch (error) {
      console.error('❌ Error checking NIT availability:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al verificar disponibilidad',
        error: error.message
      });
    }
  }

  /**
   * Verificar disponibilidad de razón social/nombre
   * Endpoint: GET /api/providers/check-business-name
   * Query params: businessName, excludeId (opcional), tipoEntidad (opcional)
   */
  async checkBusinessNameAvailability(req, res) {
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

      const existingProvider = await providersService.checkBusinessNameExists(
        businessName,
        excludeId ? parseInt(excludeId) : null
      );

      if (existingProvider) {
        return res.json({
          success: true,
          data: {
            available: false,
            message: tipoEntidad === 'juridica'
              ? `La razón social "${businessName}" ya está registrada.`
              : `El nombre "${businessName}" ya está registrado.`,
            existingProvider: {
              razonSocial: existingProvider.razonSocial,
              nit: existingProvider.nit,
              tipoEntidad: existingProvider.tipoEntidad
            }
          }
        });
      }

      return res.json({
        success: true,
        data: {
          available: true,
          message: tipoEntidad === 'juridica' ? 'Razón social disponible' : 'Nombre disponible'
        }
      });
    } catch (error) {
      console.error('❌ Error checking business name availability:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al verificar disponibilidad',
        error: error.message
      });
    }
  }

  /**
   * Verificar disponibilidad de email
   * Endpoint: GET /api/providers/check-email
   * Query params: email, excludeId (opcional)
   */
  async checkEmailAvailability(req, res) {
    try {
      const { email, excludeId } = req.query;

      console.log('🔍 Checking email availability:', { email, excludeId });

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'El email es requerido'
        });
      }

      const existingProvider = await providersService.checkEmailExists(
        email,
        excludeId ? parseInt(excludeId) : null
      );

      if (existingProvider) {
        return res.json({
          success: true,
          data: {
            available: false,
            message: `El correo "${email}" ya está registrado.`,
            existingProvider: {
              correo: existingProvider.correo,
              razonSocial: existingProvider.razonSocial
            }
          }
        });
      }

      return res.json({
        success: true,
        data: {
          available: true,
          message: 'Email disponible'
        }
      });
    } catch (error) {
      console.error('❌ Error checking email availability:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al verificar disponibilidad del email',
        error: error.message
      });
    }
  }

  /**
   * Verificar disponibilidad de contacto principal
   * Endpoint: GET /api/providers/check-contact
   * Query params: contact, excludeId (opcional)
   */
  async checkContactAvailability(req, res) {
    try {
      const { contact, excludeId } = req.query;

      console.log('🔍 Checking contact availability:', { contact, excludeId });

      if (!contact) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de contacto es requerido'
        });
      }

      const existingProvider = await providersService.checkContactExists(
        contact,
        excludeId ? parseInt(excludeId) : null
      );

      if (existingProvider) {
        return res.json({
          success: true,
          data: {
            available: false,
            message: `El nombre de contacto "${contact}" ya está registrado.`,
            existingProvider: {
              contactoPrincipal: existingProvider.contactoPrincipal,
              razonSocial: existingProvider.razonSocial
            }
          }
        });
      }

      return res.json({
        success: true,
        data: {
          available: true,
          message: 'Nombre de contacto disponible'
        }
      });
    } catch (error) {
      console.error('❌ Error checking contact availability:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al verificar disponibilidad del contacto',
        error: error.message
      });
    }
  }

  /**
   * Obtener estadísticas de proveedores
   */
  async getProviderStats(req, res) {
    try {
      const result = await providersService.getProviderStats();
      res.json(result);
    } catch (error) {
      console.error('Error in getProviderStats controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener estadísticas'
      });
    }
  }
}

export default new ProvidersController();
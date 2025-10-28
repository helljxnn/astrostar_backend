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
   * Verificar disponibilidad de NIT
   */
  async checkNitAvailability(req, res) {
    try {
      const { nit, excludeId } = req.query;
      
      if (!nit) {
        return res.status(400).json({
          success: false,
          message: 'El NIT es requerido'
        });
      }

      const result = await providersService.checkNitAvailability(
        nit, 
        excludeId ? parseInt(excludeId) : null
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error in checkNitAvailability controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al verificar NIT'
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
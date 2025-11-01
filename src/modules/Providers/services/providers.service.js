import providersRepository from '../repository/providers.repository.js';

export class ProvidersService {
  /**
   * Obtener todos los proveedores
   */
  async getProviders(params) {
    try {
      const result = await providersRepository.findAll(params);
      return {
        success: true,
        data: result.providers,
        pagination: result.pagination
      };
    } catch (error) {
      throw new Error(`Error obteniendo proveedores: ${error.message}`);
    }
  }

  /**
   * Obtener proveedor por ID
   */
  async getProviderById(id) {
    try {
      const provider = await providersRepository.findById(id);
      if (!provider) {
        return {
          success: false,
          message: 'Proveedor no encontrado'
        };
      }

      return {
        success: true,
        data: provider
      };
    } catch (error) {
      throw new Error(`Error obteniendo proveedor: ${error.message}`);
    }
  }

  /**
   * Crear nuevo proveedor
   */
  async createProvider(providerData) {
    try {
      // Verificar NIT único
      const isNitAvailable = await providersRepository.isNitAvailable(providerData.nit);
      if (!isNitAvailable) {
        return {
          success: false,
          message: 'El NIT ya está registrado'
        };
      }

      // Verificar email único
      if (providerData.correo) {
        const isEmailAvailable = await providersRepository.isEmailAvailable(providerData.correo);
        if (!isEmailAvailable) {
          return {
            success: false,
            message: 'El email ya está registrado'
          };
        }
      }

      const provider = await providersRepository.create(providerData);

      return {
        success: true,
        message: 'Proveedor creado exitosamente',
        data: provider
      };
    } catch (error) {
      throw new Error(`Error creando proveedor: ${error.message}`);
    }
  }

  /**
   * Actualizar proveedor
   */
  async updateProvider(id, providerData) {
    try {
      const existingProvider = await providersRepository.findById(id);
      if (!existingProvider) {
        return {
          success: false,
          message: 'Proveedor no encontrado'
        };
      }

      // Verificar NIT único (excluyendo el actual)
      if (providerData.nit && providerData.nit !== existingProvider.nit) {
        const isNitAvailable = await providersRepository.isNitAvailable(providerData.nit, id);
        if (!isNitAvailable) {
          return {
            success: false,
            message: 'El NIT ya está registrado'
          };
        }
      }

      // Verificar email único (excluyendo el actual)
      if (providerData.correo && providerData.correo !== existingProvider.correo) {
        const isEmailAvailable = await providersRepository.isEmailAvailable(providerData.correo, id);
        if (!isEmailAvailable) {
          return {
            success: false,
            message: 'El email ya está registrado'
          };
        }
      }

      const updatedProvider = await providersRepository.update(id, providerData);

      return {
        success: true,
        message: 'Proveedor actualizado exitosamente',
        data: updatedProvider
      };
    } catch (error) {
      throw new Error(`Error actualizando proveedor: ${error.message}`);
    }
  }

  /**
   * Eliminar proveedor (ACTUALIZADO con validaciones de HUs)
   */
  async deleteProvider(id) {
    try {
      const existingProvider = await providersRepository.findById(id);
      if (!existingProvider) {
        return {
          success: false,
          message: "Proveedor no encontrado"
        };
      }

      // Estas validaciones ya se hacen en el validador, pero por seguridad:
      const hasPurchases = await providersRepository.hasActivePurchases(id);
      if (hasPurchases) {
        return {
          success: false,
          message: "No se puede eliminar un proveedor con compras activas asociadas"
        };
      }

      if (existingProvider.estado === 'Activo') {
        return {
          success: false,
          message: "No se puede eliminar un proveedor con estado activo"
        };
      }

      await providersRepository.delete(id);

      return {
        success: true,
        message: "Proveedor eliminado exitosamente"
      };
    } catch (error) {
      throw new Error(`Error eliminando proveedor: ${error.message}`);
    }
  }

  /**
   * Cambiar estado de proveedor
   */
  async changeProviderStatus(id, status) {
    try {
      const existingProvider = await providersRepository.findById(id);
      if (!existingProvider) {
        return {
          success: false,
          message: 'Proveedor no encontrado'
        };
      }

      const updatedProvider = await providersRepository.changeStatus(id, status);

      return {
        success: true,
        message: `Estado del proveedor cambiado a ${status}`,
        data: updatedProvider
      };
    } catch (error) {
      throw new Error(`Error cambiando estado: ${error.message}`);
    }
  }

  /**
   * Verificar disponibilidad de NIT
   */
  async checkNitAvailability(nit, excludeId = null) {
    try {
      const isAvailable = await providersRepository.isNitAvailable(nit, excludeId);
      return {
        success: true,
        data: {
          nit,
          available: isAvailable
        }
      };
    } catch (error) {
      throw new Error(`Error verificando NIT: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de proveedores
   */
  async getProviderStats() {
    try {
      const stats = await providersRepository.getStats();
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }
  }
}

export default new ProvidersService();
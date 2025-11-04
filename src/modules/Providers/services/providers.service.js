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
      // Verificar NIT único (para ambos tipos)
      const isNitAvailable = await providersRepository.isNitAvailable(providerData.nit);
      if (!isNitAvailable) {
        return {
          success: false,
          message: providerData.tipoEntidad === 'juridica' 
            ? 'El NIT ya está registrado' 
            : 'El documento de identidad ya está registrado'
        };
      }

      // Verificar razón social única (solo para jurídica)
      if (providerData.tipoEntidad === 'juridica') {
        const businessNameExists = await providersRepository.findByBusinessName(
          providerData.razonSocial
        );
        if (businessNameExists) {
          return {
            success: false,
            message: `La razón social "${providerData.razonSocial}" ya está registrada`
          };
        }
      }

      // Verificar nombre único (solo para natural)
      if (providerData.tipoEntidad === 'natural') {
        const nameExists = await providersRepository.findByNameCaseInsensitive(
          providerData.razonSocial // En natural, razonSocial es el nombre
        );
        if (nameExists) {
          return {
            success: false,
            message: `El nombre "${providerData.razonSocial}" ya está registrado`
          };
        }
      }

      // Verificar que nombre y razón social no sean iguales (si aplica)
      if (providerData.tipoEntidad === 'juridica' && providerData.contactoPrincipal) {
        if (providerData.razonSocial.toLowerCase() === providerData.contactoPrincipal.toLowerCase()) {
          return {
            success: false,
            message: 'La razón social y el contacto principal no pueden ser iguales'
          };
        }
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

      // Verificar contacto único
      if (providerData.contactoPrincipal) {
        const contactExists = await providersRepository.findByNameCaseInsensitive(
          providerData.contactoPrincipal
        );
        if (contactExists) {
          return {
            success: false,
            message: `El nombre de contacto "${providerData.contactoPrincipal}" ya está registrado`
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
            message: providerData.tipoEntidad === 'juridica' 
              ? 'El NIT ya está registrado' 
              : 'El documento de identidad ya está registrado'
          };
        }
      }

      // Verificar razón social única (excluyendo el actual, solo para jurídica)
      if (providerData.razonSocial && providerData.razonSocial !== existingProvider.razonSocial) {
        if (providerData.tipoEntidad === 'juridica') {
          const businessNameExists = await providersRepository.findByBusinessName(
            providerData.razonSocial,
            id
          );
          if (businessNameExists) {
            return {
              success: false,
              message: `La razón social "${providerData.razonSocial}" ya está registrada`
            };
          }
        } else {
          // Para persona natural, validar como nombre único
          const nameExists = await providersRepository.findByNameCaseInsensitive(
            providerData.razonSocial,
            id
          );
          if (nameExists) {
            return {
              success: false,
              message: `El nombre "${providerData.razonSocial}" ya está registrado`
            };
          }
        }
      }

      // Verificar que nombre y razón social no sean iguales (si aplica)
      if (providerData.tipoEntidad === 'juridica' && providerData.contactoPrincipal) {
        if (providerData.razonSocial.toLowerCase() === providerData.contactoPrincipal.toLowerCase()) {
          return {
            success: false,
            message: 'La razón social y el contacto principal no pueden ser iguales'
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

      // Verificar contacto único (excluyendo el actual)
      if (providerData.contactoPrincipal && 
          providerData.contactoPrincipal !== existingProvider.contactoPrincipal) {
        const contactExists = await providersRepository.findByNameCaseInsensitive(
          providerData.contactoPrincipal,
          id
        );
        if (contactExists) {
          return {
            success: false,
            message: `El nombre de contacto "${providerData.contactoPrincipal}" ya está registrado`
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
   * Eliminar proveedor
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

      // Validación HU04.1_04_04: No eliminar con compras activas
      const hasPurchases = await providersRepository.hasActivePurchases(id);
      if (hasPurchases) {
        return {
          success: false,
          message: "No se puede eliminar un proveedor con compras activas asociadas"
        };
      }

      // Validación HU04.1_04_05: No eliminar si está activo
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
   * Verificar si el NIT existe
   * Para validación en tiempo real
   */
  async checkNitExists(nit, excludeId = null) {
    try {
      const provider = await providersRepository.findByNit(nit);
      
      if (provider && provider.id !== excludeId) {
        return provider;
      }
      
      return null;
    } catch (error) {
      console.error('Service error - checkNitExists:', error);
      throw error;
    }
  }

  /**
   * Verificar si la razón social existe
   * Para validación en tiempo real
   */
  async checkBusinessNameExists(businessName, excludeId = null) {
    try {
      const provider = await providersRepository.findByBusinessName(
        businessName,
        excludeId
      );
      
      if (provider && provider.id !== excludeId) {
        return provider;
      }
      
      return null;
    } catch (error) {
      console.error('Service error - checkBusinessNameExists:', error);
      throw error;
    }
  }

  /**
   * Verificar si el email existe
   * Para validación en tiempo real
   */
  async checkEmailExists(email, excludeId = null) {
    try {
      const provider = await providersRepository.findByEmail(email);
      
      if (provider && provider.id !== excludeId) {
        return provider;
      }
      
      return null;
    } catch (error) {
      console.error('Service error - checkEmailExists:', error);
      throw error;
    }
  }

  /**
   * Verificar si el contacto existe
   * Para validación en tiempo real
   */
  async checkContactExists(contact, excludeId = null) {
    try {
      const provider = await providersRepository.findByNameCaseInsensitive(
        contact,
        excludeId
      );
      
      if (provider && provider.id !== excludeId) {
        return provider;
      }
      
      return null;
    } catch (error) {
      console.error('Service error - checkContactExists:', error);
      throw error;
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
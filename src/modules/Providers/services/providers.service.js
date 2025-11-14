// src/services/providers.service.js
import { ProvidersRepository } from "../repository/providers.repository.js";

export class ProvidersService {
  constructor() {
    this.providersRepository = new ProvidersRepository();
  }

  async getAllProviders({
    page = 1,
    limit = 10,
    search = "",
    status,
    entityType,
  }) {
    try {
      const result = await this.providersRepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        entityType,
      });

      return {
        success: true,
        data: result.providers,
        pagination: result.pagination,
      };
    } catch (error) {
      throw error;
    }
  }

  async getProviderById(id) {
    try {
      const provider = await this.providersRepository.findById(id);

      if (!provider) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el proveedor con ID ${id}.`,
        };
      }

      return {
        success: true,
        data: provider,
      };
    } catch (error) {
      throw error;
    }
  }

  async createProvider(providerData) {
    try {
      const existingByNit = await this.providersRepository.findByNit(
        providerData.nit
      );
      if (existingByNit) {
        const fieldName =
          providerData.tipoEntidad === "juridica"
            ? "NIT"
            : "documento de identificación";
        throw new Error(
          `El ${fieldName} "${providerData.nit}" ya está registrado.`
        );
      }

      const existingByName = await this.providersRepository.findByBusinessName(
        providerData.razonSocial,
        null,
        providerData.tipoEntidad
      );
      if (existingByName) {
        const fieldName =
          providerData.tipoEntidad === "juridica" ? "razón social" : "nombre";
        throw new Error(
          `El ${fieldName} "${providerData.razonSocial}" ya está registrado.`
        );
      }

      const existingByEmail = await this.providersRepository.findByEmail(
        providerData.correo
      );
      if (existingByEmail) {
        throw new Error(
          `El email "${providerData.correo}" ya está registrado.`
        );
      }

      const newProvider = await this.providersRepository.create(providerData);

      return {
        success: true,
        data: newProvider,
        message: `Proveedor "${providerData.razonSocial}" creado exitosamente.`,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateProvider(id, updateData) {
    try {
      const existingProvider = await this.providersRepository.findById(id);
      if (!existingProvider) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el proveedor con ID ${id}.`,
        };
      }

      if (updateData.nit && updateData.nit !== existingProvider.nit) {
        const existingByNit = await this.providersRepository.findByNit(
          updateData.nit
        );
        if (existingByNit && existingByNit.id !== id) {
          const fieldName =
            updateData.tipoEntidad === "juridica"
              ? "NIT"
              : "documento de identificación";
          throw new Error(
            `El ${fieldName} "${updateData.nit}" ya está registrado por otro proveedor.`
          );
        }
      }

      if (
        updateData.razonSocial &&
        updateData.razonSocial !== existingProvider.razonSocial
      ) {
        const existingByName =
          await this.providersRepository.findByBusinessName(
            updateData.razonSocial,
            id,
            updateData.tipoEntidad || existingProvider.tipoEntidad
          );
        if (existingByName) {
          const fieldName =
            updateData.tipoEntidad === "juridica" ? "razón social" : "nombre";
          throw new Error(
            `El ${fieldName} "${updateData.razonSocial}" ya está registrado por otro proveedor.`
          );
        }
      }

      if (updateData.correo && updateData.correo !== existingProvider.correo) {
        const existingByEmail = await this.providersRepository.findByEmail(
          updateData.correo
        );
        if (existingByEmail && existingByEmail.id !== id) {
          throw new Error(
            `El email "${updateData.correo}" ya está registrado por otro proveedor.`
          );
        }
      }

      const updatedProvider = await this.providersRepository.update(
        id,
        updateData
      );

      return {
        success: true,
        data: updatedProvider,
        message: `Proveedor "${updatedProvider.razonSocial}" actualizado exitosamente.`,
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteProvider(id) {
    try {
      const providerToDelete = await this.providersRepository.findById(id);
      if (!providerToDelete) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el proveedor con ID ${id}.`,
        };
      }

      if (providerToDelete.estado === "Activo") {
        return {
          success: false,
          statusCode: 400,
          message: `No se puede eliminar el proveedor "${providerToDelete.razonSocial}" porque está en estado "Activo". Primero cambie el estado a "Inactivo".`,
        };
      }

      const hasActivePurchases =
        await this.providersRepository.hasActivePurchases(id);
      if (hasActivePurchases) {
        return {
          success: false,
          statusCode: 400,
          message: `No se puede eliminar el proveedor "${providerToDelete.razonSocial}" porque tiene compras activas asociadas.`,
        };
      }

      const deletedProvider = await this.providersRepository.delete(id);

      return {
        success: true,
        message: `Proveedor "${deletedProvider.razonSocial}" eliminado exitosamente.`,
      };
    } catch (error) {
      throw error;
    }
  }

  async changeProviderStatus(id, status) {
    try {
      const existingProvider = await this.providersRepository.findById(id);
      if (!existingProvider) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el proveedor con ID ${id}.`,
        };
      }

      const updatedProvider = await this.providersRepository.changeStatus(
        id,
        status
      );

      return {
        success: true,
        data: updatedProvider,
        message: `Estado del proveedor "${updatedProvider.razonSocial}" cambiado a "${status}" exitosamente.`,
      };
    } catch (error) {
      throw error;
    }
  }

  async checkNitAvailability(nit, excludeId = null, tipoEntidad = "juridica") {
    try {
      const existingProvider = await this.providersRepository.findByNit(nit);

      if (!existingProvider) {
        return { available: true };
      }

      if (excludeId && existingProvider.id === parseInt(excludeId)) {
        return { available: true };
      }

      const fieldName =
        tipoEntidad === "juridica" ? "NIT" : "documento de identificación";
      return {
        available: false,
        message: `El ${fieldName} "${nit}" ya está registrado.`,
      };
    } catch (error) {
      throw error;
    }
  }

  async checkBusinessNameAvailability(
    businessName,
    excludeId = null,
    tipoEntidad = "juridica"
  ) {
    try {
      const existingProvider =
        await this.providersRepository.findByBusinessName(
          businessName,
          excludeId,
          tipoEntidad
        );

      if (!existingProvider) {
        return { available: true };
      }

      const fieldName = tipoEntidad === "juridica" ? "razón social" : "nombre";
      return {
        available: false,
        message: `El ${fieldName} "${businessName}" ya está registrado.`,
      };
    } catch (error) {
      throw error;
    }
  }

  async checkEmailAvailability(email, excludeId = null) {
    try {
      const existingProvider = await this.providersRepository.findByEmail(
        email
      );

      if (!existingProvider) {
        return { available: true };
      }

      if (excludeId && existingProvider.id === parseInt(excludeId)) {
        return { available: true };
      }

      return {
        available: false,
        message: `El email "${email}" ya está registrado.`,
      };
    } catch (error) {
      throw error;
    }
  }

  async checkContactAvailability(contact, excludeId = null) {
    try {
      const existingProvider =
        await this.providersRepository.findByNameCaseInsensitive(
          contact,
          excludeId
        );

      if (!existingProvider) {
        return { available: true };
      }

      return {
        available: false,
        message: `El contacto "${contact}" ya está registrado.`,
      };
    } catch (error) {
      throw error;
    }
  }

  async getProviderStats() {
    try {
      const stats = await this.providersRepository.getStats();
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw error;
    }
  }

  async checkActivePurchases(providerId) {
    try {
      const hasActivePurchases =
        await this.providersRepository.hasActivePurchases(providerId);
      return {
        success: true,
        hasActivePurchases,
      };
    } catch (error) {
      throw error;
    }
  }

  async getDocumentTypes() {
    try {
      const documentTypes = await this.providersRepository.getDocumentTypes();
      return {
        success: true,
        data: documentTypes
      };
    } catch (error) {
      console.error('Service error - getDocumentTypes:', error);
      throw error;
    }
  }
}
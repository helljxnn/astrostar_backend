import prisma from "../../../../config/database.js";
import { GuardiansRepository } from "../repository/guardians.repository.js";

const normalizeDocumentTypeName = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const isForbiddenGuardianDocumentType = (documentTypeName) => {
  const normalized = normalizeDocumentTypeName(documentTypeName);

  return (
    normalized === "ti" ||
    normalized === "nit" ||
    (normalized.includes("tarjeta") && normalized.includes("identidad")) ||
    (normalized.includes("registro") && normalized.includes("civil")) ||
    normalized.includes("tributaria")
  );
};

export class GuardiansService {
  constructor() {
    this.guardiansRepository = new GuardiansRepository();
  }

  async validateGuardianDocumentType(documentTypeId) {
    const parsedDocumentTypeId = parseInt(documentTypeId, 10);
    if (!Number.isFinite(parsedDocumentTypeId)) {
      throw new Error("El tipo de documento del acudiente es obligatorio.");
    }

    const documentType = await prisma.documentType.findUnique({
      where: { id: parsedDocumentTypeId },
      select: { id: true, name: true },
    });

    if (!documentType) {
      throw new Error("Tipo de documento de acudiente no encontrado.");
    }

    if (isForbiddenGuardianDocumentType(documentType.name)) {
      throw new Error(
        "El acudiente no puede usar Registro Civil, Tarjeta de Identidad ni NIT. Selecciona un documento válido para adulto."
      );
    }
  }

  async getAllGuardians({ page = 1, limit = 10, search = "", status }) {
    try {
      const result = await this.guardiansRepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
      });

      return {
        success: true,
        data: result.guardians,
        pagination: result.pagination,
      };
    } catch (error) {
      throw error;
    }
  }

  async getGuardianById(id) {
    try {
      const guardian = await this.guardiansRepository.findById(id);

      if (!guardian) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el acudiente con ID ${id}.`,
        };
      }

      return {
        success: true,
        data: guardian,
      };
    } catch (error) {
      throw error;
    }
  }

  async createGuardian(guardianData) {
    try {
      // Establecer estado por defecto como "Activo" si no se proporciona
      const dataWithDefaults = {
        ...guardianData,
        estado: guardianData.estado || "Activo"
      };

      await this.validateGuardianDocumentType(dataWithDefaults.documentTypeId);

      const existingGuardian = await this.guardiansRepository.findByDocument(dataWithDefaults.identification);
      if (existingGuardian) {
        throw new Error(`El acudiente con documento "${dataWithDefaults.identification}" ya está registrado.`);
      }

      const newGuardian = await this.guardiansRepository.create(dataWithDefaults);

      return {
        success: true,
        data: newGuardian,
        message: `Acudiente "${dataWithDefaults.nombreCompleto}" creado exitosamente con estado Activo.`,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateGuardian(id, updateData) {
    try {
      const existingGuardian = await this.guardiansRepository.findById(id);
      if (!existingGuardian) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el acudiente con ID ${id}.`,
        };
      }

      if (updateData.documentTypeId !== undefined && updateData.documentTypeId !== null && updateData.documentTypeId !== "") {
        await this.validateGuardianDocumentType(updateData.documentTypeId);
      }

      if (updateData.identificacion && updateData.identificacion !== existingGuardian.identificacion) {
        const existingByDocument = await this.guardiansRepository.findByDocument(
          updateData.identificacion,
          id
        );
        if (existingByDocument) {
          throw new Error(
            `El documento "${updateData.identificacion}" ya está registrado por otro acudiente.`
          );
        }
      }

      const updatedGuardian = await this.guardiansRepository.update(id, updateData);

      return {
        success: true,
        data: updatedGuardian,
        message: `Acudiente "${updatedGuardian.nombreCompleto}" actualizado exitosamente.`,
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteGuardian(id) {
    try {
      const guardianToDelete = await this.guardiansRepository.findById(id);
      if (!guardianToDelete) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el acudiente con ID ${id}.`,
        };
      }

      // Verificar si tiene deportistas MENORES DE EDAD asociados
      const minorAthletes = await this.guardiansRepository.getMinorAthletes(id);
      if (minorAthletes.length > 0) {
        const names = minorAthletes.map(a => `${a.user.firstName} ${a.user.lastName}`).join(', ');
        return {
          success: false,
          statusCode: 400,
          message: `No se puede eliminar el acudiente "${guardianToDelete.nombreCompleto}" porque está asignado a deportistas menores de edad: ${names}`,
        };
      }

      const deletedGuardian = await this.guardiansRepository.delete(id);

      return {
        success: true,
        message: `Acudiente "${deletedGuardian.nombreCompleto}" eliminado exitosamente.`,
      };
    } catch (error) {
      throw error;
    }
  }

  async getGuardianStats() {
    try {
      const stats = await this.guardiansRepository.getStats();
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verificar disponibilidad de email
   */
  async checkEmailAvailability(email, excludeId = null) {
    try {
      const existingGuardian = await this.guardiansRepository.findByEmail(email, excludeId);
      
      if (!existingGuardian) {
        return { available: true };
      }

      if (excludeId && existingGuardian.id === parseInt(excludeId)) {
        return { available: true };
      }

      return { 
        available: false, 
        message: `El email "${email}" ya está en uso.` 
      };
    } catch (error) {
throw error;
    }
  }

  /**
   * Verificar disponibilidad de identificación
   */
  async checkIdentificationAvailability(identification, excludeId = null) {
    try {
      const existingGuardian = await this.guardiansRepository.findByIdentification(identification, excludeId);
      
      if (!existingGuardian) {
        return { available: true };
      }

      if (excludeId && existingGuardian.id === parseInt(excludeId)) {
        return { available: true };
      }

      return { 
        available: false, 
        message: `La identificación "${identification}" ya está en uso.` 
      };
    } catch (error) {
throw error;
    }
  }
}


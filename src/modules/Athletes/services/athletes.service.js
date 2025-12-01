import { AthletesRepository } from "../repository/athletes.repository.js";

export class AthletesService {
  constructor() {
    this.athletesRepository = new AthletesRepository();
  }

  async getAllAthletes({
    page = 1,
    limit = 10,
    search = "",
    status,
    categoria,
    estadoInscripcion,
  }) {
    try {
      const result = await this.athletesRepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        categoria,
        estadoInscripcion,
      });

      return {
        success: true,
        data: result.athletes,
        pagination: result.pagination,
      };
    } catch (error) {
      throw error;
    }
  }

  async getAthleteById(id) {
    try {
      const athlete = await this.athletesRepository.findById(id);

      if (!athlete) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el deportista con ID ${id}.`,
        };
      }

      return {
        success: true,
        data: athlete,
      };
    } catch (error) {
      throw error;
    }
  }

  async createAthlete(athleteData) {
    try {
      console.log('🔍 [SERVICE] Datos recibidos:', JSON.stringify(athleteData, null, 2));
      
      // Establecer estado por defecto como "Activo" si no se proporciona
      const dataWithDefaults = {
        ...athleteData,
        estado: athleteData.estado || "Activo"
      };
      
      // Validar documento único
      const existingAthlete = await this.athletesRepository.findByDocument(dataWithDefaults.identification);
      if (existingAthlete) {
        throw new Error(`El deportista con documento "${dataWithDefaults.identification}" ya está registrado.`);
      }

      // Validar acudiente si es menor de edad
      const age = this.calculateAge(dataWithDefaults.birthDate);
      if (age < 18 && !dataWithDefaults.acudiente) {
        throw new Error("Los menores de edad deben tener un acudiente asignado.");
      }

      // Validar que el acudiente existe si se proporciona
      if (dataWithDefaults.acudiente) {
        const guardianExists = await this.athletesRepository.validateGuardian(dataWithDefaults.acudiente);
        if (!guardianExists) {
          throw new Error(`El acudiente con ID ${dataWithDefaults.acudiente} no existe.`);
        }
      }

      console.log('🔍 [SERVICE] Creando deportista en repositorio...');
      const newAthlete = await this.athletesRepository.create(dataWithDefaults);

      return {
        success: true,
        data: newAthlete,
        message: `Deportista "${dataWithDefaults.firstName} ${dataWithDefaults.lastName}" creado exitosamente con estado Activo.`,
      };
    } catch (error) {
      console.error('❌ [SERVICE] Error en createAthlete:', error);
      throw error;
    }
  }

  async updateAthlete(id, updateData) {
    try {
      const existingAthlete = await this.athletesRepository.findById(id);
      if (!existingAthlete) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el deportista con ID ${id}.`,
        };
      }

      // Validar documento único si se está actualizando
      if (updateData.identification && updateData.identification !== existingAthlete.identification) {
        const existingByDocument = await this.athletesRepository.findByDocument(
          updateData.identification,
          id
        );
        if (existingByDocument) {
          throw new Error(
            `El documento "${updateData.identification}" ya está registrado por otro deportista.`
          );
        }
      }

      // Validar acudiente si es menor de edad
      if (updateData.birthDate) {
        const age = this.calculateAge(updateData.birthDate);
        if (age < 18 && !updateData.acudiente && !existingAthlete.acudiente) {
          throw new Error("Los menores de edad deben tener un acudiente asignado.");
        }
      }

      // Validar que el acudiente existe si se proporciona
      if (updateData.acudiente) {
        const guardianExists = await this.athletesRepository.validateGuardian(updateData.acudiente);
        if (!guardianExists) {
          throw new Error(`El acudiente con ID ${updateData.acudiente} no existe.`);
        }
      }

      const updatedAthlete = await this.athletesRepository.update(id, updateData);

      return {
        success: true,
        data: updatedAthlete,
        message: `Deportista "${updatedAthlete.firstName} ${updatedAthlete.lastName}" actualizado exitosamente.`,
      };
    } catch (error) {
      console.error('Error en updateAthlete:', error);
      throw error;
    }
  }

  async deleteAthlete(id) {
    try {
      const athleteToDelete = await this.athletesRepository.findById(id);
      if (!athleteToDelete) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el deportista con ID ${id}.`,
        };
      }

      const deletedAthlete = await this.athletesRepository.delete(id);

      return {
        success: true,
        message: `Deportista "${deletedAthlete.nombres} ${deletedAthlete.apellidos}" eliminado exitosamente.`,
      };
    } catch (error) {
      throw error;
    }
  }

  async changeAthleteStatus(id, status) {
    try {
      const existingAthlete = await this.athletesRepository.findById(id);
      if (!existingAthlete) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el deportista con ID ${id}.`,
        };
      }

      const updatedAthlete = await this.athletesRepository.changeStatus(id, status);

      return {
        success: true,
        data: updatedAthlete,
        message: `Estado del deportista "${updatedAthlete.nombres} ${updatedAthlete.apellidos}" cambiado a "${status}" exitosamente.`,
      };
    } catch (error) {
      throw error;
    }
  }

  async getAthleteStats() {
    try {
      const stats = await this.athletesRepository.getStats();
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw error;
    }
  }

  async getReferenceData() {
    try {
      const referenceData = await this.athletesRepository.getReferenceData();
      return {
        success: true,
        data: referenceData,
      };
    } catch (error) {
      throw error;
    }
  }

  async getDocumentTypes() {
    try {
      const documentTypes = await this.athletesRepository.getDocumentTypes();
      return {
        success: true,
        data: documentTypes,
      };
    } catch (error) {
      throw error;
    }
  }

  calculateAge(birthDate) {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }
}

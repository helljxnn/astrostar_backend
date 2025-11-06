import { TemporaryWorkersRepository } from './temporaryworkers.repository.js';

export class TemporaryWorkersService {
  constructor() {
    this.temporaryWorkersRepository = new TemporaryWorkersRepository();
  }

  /**
   * Obtener todas las personas temporales
   */
  async getAllTemporaryWorkers(filters) {
    try {
      const result = await this.temporaryWorkersRepository.findAll(filters);
      return result;
    } catch (error) {
      console.error('Error in getAllTemporaryWorkers service:', error);
      throw error;
    }
  }

  /**
   * Obtener persona temporal por ID
   */
  async getTemporaryWorkerById(id) {
    try {
      const temporaryWorker = await this.temporaryWorkersRepository.findById(id);
      
      if (!temporaryWorker) {
        return {
          success: false,
          statusCode: 404,
          message: 'Persona temporal no encontrada.'
        };
      }

      return {
        success: true,
        data: temporaryWorker
      };
    } catch (error) {
      console.error('Error in getTemporaryWorkerById service:', error);
      throw error;
    }
  }

  /**
   * Crear nueva persona temporal
   */
  async createTemporaryWorker(data) {
    try {
      // Validar datos únicos
      await this.validateUniqueFields(data);

      // Calcular edad si se proporciona fecha de nacimiento
      if (data.birthDate) {
        data.age = this.calculateAge(data.birthDate);
      }

      // Mapear campos del frontend al backend
      const mappedData = this.mapFrontendToBackend(data);

      const temporaryWorker = await this.temporaryWorkersRepository.create(mappedData);

      return {
        success: true,
        data: temporaryWorker,
        message: `Persona temporal '${temporaryWorker.firstName} ${temporaryWorker.lastName}' creada exitosamente.`
      };
    } catch (error) {
      console.error('Error in createTemporaryWorker service:', error);
      throw error;
    }
  }

  /**
   * Actualizar persona temporal
   */
  async updateTemporaryWorker(id, data) {
    try {
      // Verificar que existe
      const existing = await this.temporaryWorkersRepository.findById(id);
      if (!existing) {
        return {
          success: false,
          statusCode: 404,
          message: 'Persona temporal no encontrada.'
        };
      }

      // Validar datos únicos (excluyendo el registro actual)
      await this.validateUniqueFields(data, id);

      // Calcular edad si se proporciona fecha de nacimiento
      if (data.birthDate) {
        data.age = this.calculateAge(data.birthDate);
      }

      // Mapear campos del frontend al backend
      const mappedData = this.mapFrontendToBackend(data);

      const updatedWorker = await this.temporaryWorkersRepository.update(id, mappedData);

      return {
        success: true,
        data: updatedWorker,
        message: `Persona temporal '${updatedWorker.firstName} ${updatedWorker.lastName}' actualizada exitosamente.`
      };
    } catch (error) {
      console.error('Error in updateTemporaryWorker service:', error);
      throw error;
    }
  }

  /**
   * Eliminar persona temporal (solo si está inactiva)
   */
  async deleteTemporaryWorker(id) {
    try {
      const existing = await this.temporaryWorkersRepository.findById(id);
      if (!existing) {
        return {
          success: false,
          statusCode: 404,
          message: 'Persona temporal no encontrada.'
        };
      }

      const personName = `${existing.firstName} ${existing.lastName}`;

      if (existing.status === 'Active') {
        return {
          success: false,
          statusCode: 400,
          message: 'No se puede eliminar una persona temporal activa. Primero cambie el estado a "Inactivo" y luego inténtelo de nuevo.'
        };
      }

      // Si está inactiva, hacer eliminación física
      await this.temporaryWorkersRepository.hardDelete(id);

      return {
        success: true,
        message: `La persona temporal '${personName}' ha sido eliminada permanentemente.`
      };
    } catch (error) {
      console.error('Error in deleteTemporaryWorker service:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas
   */
  async getTemporaryWorkerStats() {
    try {
      const stats = await this.temporaryWorkersRepository.getStats();
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error in getTemporaryWorkerStats service:', error);
      throw error;
    }
  }

  /**
   * Obtener datos de referencia
   */
  async getReferenceData() {
    try {
      const data = await this.temporaryWorkersRepository.getReferenceData();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error in getReferenceData service:', error);
      throw error;
    }
  }

  /**
   * Verificar disponibilidad de identificación
   */
  async checkIdentificationAvailability(identification, excludeId = null) {
    try {
      const existing = await this.temporaryWorkersRepository.findByIdentification(identification, excludeId);
      return {
        available: !existing,
        message: existing ? 'La identificación ya está en uso.' : 'Identificación disponible.'
      };
    } catch (error) {
      console.error('Error in checkIdentificationAvailability service:', error);
      throw error;
    }
  }

  /**
   * Verificar disponibilidad de email
   */
  async checkEmailAvailability(email, excludeId = null) {
    try {
      const existing = await this.temporaryWorkersRepository.findByEmail(email, excludeId);
      return {
        available: !existing,
        message: existing ? 'El email ya está en uso.' : 'Email disponible.'
      };
    } catch (error) {
      console.error('Error in checkEmailAvailability service:', error);
      throw error;
    }
  }

  /**
   * Validar campos únicos
   */
  async validateUniqueFields(data, excludeId = null) {
    const errors = [];

    // Validar identificación si se proporciona
    if (data.identification) {
      const identificationExists = await this.temporaryWorkersRepository.findByIdentification(data.identification, excludeId);
      if (identificationExists) {
        errors.push('La identificación ya está en uso por otra persona temporal.');
      }
    }

    // Validar email si se proporciona
    if (data.email) {
      const emailExists = await this.temporaryWorkersRepository.findByEmail(data.email, excludeId);
      if (emailExists) {
        errors.push('El email ya está en uso por otra persona temporal.');
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(' '));
    }
  }

  /**
   * Calcular edad basada en fecha de nacimiento
   */
  calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age >= 0 ? age : 0;
  }

  /**
   * Mapear campos del frontend al backend
   */
  mapFrontendToBackend(frontendData) {
    const backendData = {};

    // Mapeo de campos
    if (frontendData.firstName) backendData.firstName = frontendData.firstName;
    if (frontendData.lastName) backendData.lastName = frontendData.lastName;
    if (frontendData.identification) backendData.identification = frontendData.identification;
    if (frontendData.email) backendData.email = frontendData.email;
    if (frontendData.phone) backendData.phone = frontendData.phone;
    if (frontendData.birthDate) backendData.birthDate = new Date(frontendData.birthDate);
    if (frontendData.age !== undefined) backendData.age = parseInt(frontendData.age);
    if (frontendData.address) backendData.address = frontendData.address;
    if (frontendData.team !== undefined) backendData.team = frontendData.team;
    if (frontendData.category !== undefined) backendData.category = frontendData.category;
    if (frontendData.status) backendData.status = frontendData.status;
    if (frontendData.documentTypeId) backendData.documentTypeId = parseInt(frontendData.documentTypeId);
    if (frontendData.personType) backendData.personType = frontendData.personType;

    // Mapeo de campos del modal actual (compatibilidad)
    if (frontendData.nombre && !backendData.firstName) {
      const nombres = frontendData.nombre.split(' ');
      backendData.firstName = nombres[0];
      if (nombres.length > 1) {
        backendData.lastName = nombres.slice(1).join(' ');
      }
    }
    if (frontendData.apellido && !backendData.lastName) backendData.lastName = frontendData.apellido;
    if (frontendData.telefono && !backendData.phone) backendData.phone = frontendData.telefono;
    if (frontendData.fechaNacimiento && !backendData.birthDate) backendData.birthDate = new Date(frontendData.fechaNacimiento);
    if (frontendData.tipoPersona && !backendData.personType) {
      // Mapear tipos del frontend al backend
      const typeMap = {
        'Deportista': 'Deportista',
        'Entrenador': 'Entrenador', 
        'Participante': 'Participante'
      };
      backendData.personType = typeMap[frontendData.tipoPersona] || frontendData.tipoPersona;
    }
    if (frontendData.estado && !backendData.status) {
      backendData.status = frontendData.estado === 'Activo' ? 'Active' : 'Inactive';
    }
    if (frontendData.equipo !== undefined && !backendData.team) backendData.team = frontendData.equipo;
    if (frontendData.categoria !== undefined && !backendData.category) backendData.category = frontendData.categoria;

    return backendData;
  }
}
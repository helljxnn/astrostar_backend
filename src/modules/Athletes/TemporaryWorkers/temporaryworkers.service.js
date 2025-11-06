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
      // Validar campos requeridos
      this.validateRequiredFields(data);

      // Validar formato de datos
      this.validateDataFormats(data);

      // Validar datos únicos
      await this.validateUniqueFields(data);

      // Validar lógica de negocio
      this.validateBusinessRules(data);

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

      // Validar formato de datos (solo los campos que se están actualizando)
      this.validateDataFormats(data, false);

      // Validar datos únicos (excluyendo el registro actual)
      await this.validateUniqueFields(data, id);

      // Validar lógica de negocio
      this.validateBusinessRules(data, existing);

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
   * Validar campos requeridos
   */
  validateRequiredFields(data) {
    const errors = [];

    if (!data.firstName || !data.firstName.trim()) {
      errors.push('El nombre es requerido');
    }

    if (!data.lastName || !data.lastName.trim()) {
      errors.push('El apellido es requerido');
    }

    if (!data.personType) {
      errors.push('El tipo de persona es requerido');
    }

    if (errors.length > 0) {
      throw new Error(errors.join('. '));
    }
  }

  /**
   * Validar formato de datos
   */
  validateDataFormats(data, isCreate = true) {
    const errors = [];

    // Validar nombre
    if (data.firstName !== undefined) {
      if (typeof data.firstName !== 'string' || data.firstName.length < 2 || data.firstName.length > 100) {
        errors.push('El nombre debe tener entre 2 y 100 caracteres');
      }
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(data.firstName)) {
        errors.push('El nombre solo puede contener letras y espacios');
      }
    }

    // Validar apellido
    if (data.lastName !== undefined) {
      if (typeof data.lastName !== 'string' || data.lastName.length < 2 || data.lastName.length > 100) {
        errors.push('El apellido debe tener entre 2 y 100 caracteres');
      }
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(data.lastName)) {
        errors.push('El apellido solo puede contener letras y espacios');
      }
    }

    // Validar tipo de persona
    if (data.personType !== undefined) {
      const validTypes = ['Deportista', 'Entrenador', 'Participante'];
      if (!validTypes.includes(data.personType)) {
        errors.push('El tipo de persona debe ser: Deportista, Entrenador o Participante');
      }
    }

    // Validar identificación
    if (data.identification !== undefined && data.identification !== null && data.identification !== '') {
      if (typeof data.identification !== 'string' || data.identification.length < 6 || data.identification.length > 50) {
        errors.push('La identificación debe tener entre 6 y 50 caracteres');
      }
      if (!/^[a-zA-Z0-9\-]+$/.test(data.identification)) {
        errors.push('La identificación solo puede contener letras, números y guiones');
      }
    }

    // Validar email
    if (data.email !== undefined && data.email !== null && data.email !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push('El formato del email no es válido');
      }
      if (data.email.length > 150) {
        errors.push('El email no puede exceder 150 caracteres');
      }
    }

    // Validar teléfono
    if (data.phone !== undefined && data.phone !== null && data.phone !== '') {
      if (!/^[0-9\s\-\+\(\)]+$/.test(data.phone)) {
        errors.push('El teléfono solo puede contener números, espacios, guiones, paréntesis y el signo +');
      }
      if (data.phone.length < 7 || data.phone.length > 20) {
        errors.push('El teléfono debe tener entre 7 y 20 caracteres');
      }
    }

    // Validar fecha de nacimiento
    if (data.birthDate !== undefined && data.birthDate !== null && data.birthDate !== '') {
      const birthDate = new Date(data.birthDate);
      if (isNaN(birthDate.getTime())) {
        errors.push('La fecha de nacimiento debe tener un formato válido');
      } else {
        const today = new Date();
        const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
        const maxDate = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());

        if (birthDate < minDate) {
          errors.push('La fecha de nacimiento no puede ser anterior a 120 años');
        }
        if (birthDate > maxDate) {
          errors.push('La persona debe tener al menos 5 años de edad');
        }
      }
    }

    // Validar edad
    if (data.age !== undefined && data.age !== null) {
      const age = parseInt(data.age);
      if (isNaN(age) || age < 5 || age > 120) {
        errors.push('La edad debe estar entre 5 y 120 años');
      }
    }

    // Validar dirección
    if (data.address !== undefined && data.address !== null && data.address !== '') {
      if (data.address.length > 200) {
        errors.push('La dirección no puede exceder 200 caracteres');
      }
    }

    // Validar equipo
    if (data.team !== undefined && data.team !== null && data.team !== '') {
      if (data.team.length > 100) {
        errors.push('El nombre del equipo no puede exceder 100 caracteres');
      }
    }

    // Validar categoría
    if (data.category !== undefined && data.category !== null && data.category !== '') {
      if (data.category.length > 100) {
        errors.push('La categoría no puede exceder 100 caracteres');
      }
    }

    // Validar estado
    if (data.status !== undefined) {
      const validStatuses = ['Active', 'Inactive'];
      if (!validStatuses.includes(data.status)) {
        errors.push('El estado debe ser Active o Inactive');
      }
    }

    // Validar tipo de documento
    if (data.documentTypeId !== undefined && data.documentTypeId !== null) {
      const docTypeId = parseInt(data.documentTypeId);
      if (isNaN(docTypeId) || docTypeId < 1) {
        errors.push('El tipo de documento debe ser un número válido');
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join('. '));
    }
  }

  /**
   * Validar reglas de negocio
   */
  validateBusinessRules(data, existingData = null) {
    const errors = [];

    // Obtener datos actuales (para actualizaciones)
    const currentPersonType = data.personType || (existingData ? existingData.personType : null);
    const currentTeam = data.team !== undefined ? data.team : (existingData ? existingData.team : null);
    const currentCategory = data.category !== undefined ? data.category : (existingData ? existingData.category : null);

    // Validar coherencia entre fecha de nacimiento y edad
    if (data.birthDate && data.age) {
      const calculatedAge = this.calculateAge(data.birthDate);
      if (Math.abs(calculatedAge - parseInt(data.age)) > 1) {
        errors.push('La edad proporcionada no coincide con la fecha de nacimiento');
      }
    }

    // Validar que si se especifica equipo o categoría, no estén vacíos
    if (currentTeam !== null && currentTeam !== undefined && currentTeam.trim() === '') {
      errors.push('Si se especifica un equipo, no puede estar vacío');
    }

    if (currentCategory !== null && currentCategory !== undefined && currentCategory.trim() === '') {
      errors.push('Si se especifica una categoría, no puede estar vacía');
    }

    // Validar que deportistas y entrenadores menores de edad tengan información adicional
    if ((currentPersonType === 'Deportista' || currentPersonType === 'Entrenador')) {
      const age = data.age || (existingData ? existingData.age : null);
      const birthDate = data.birthDate || (existingData ? existingData.birthDate : null);
      
      let calculatedAge = age;
      if (birthDate && !age) {
        calculatedAge = this.calculateAge(birthDate);
      }

      if (calculatedAge && calculatedAge < 18) {
        // Para menores de edad deportistas/entrenadores, se recomienda tener más información
        // Esto es solo una advertencia, no un error bloqueante
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join('. '));
    }
  }

  /**
   * Mapear campos del frontend al backend
   */
  mapFrontendToBackend(frontendData) {
    const backendData = {};

    // Mapeo de campos
    if (frontendData.firstName) backendData.firstName = frontendData.firstName.trim();
    if (frontendData.lastName) backendData.lastName = frontendData.lastName.trim();
    if (frontendData.identification) backendData.identification = frontendData.identification.trim();
    if (frontendData.email) backendData.email = frontendData.email.toLowerCase().trim();
    if (frontendData.phone) backendData.phone = frontendData.phone.trim();
    if (frontendData.birthDate) backendData.birthDate = new Date(frontendData.birthDate);
    if (frontendData.age !== undefined) backendData.age = parseInt(frontendData.age);
    if (frontendData.address) backendData.address = frontendData.address.trim();
    if (frontendData.team !== undefined) backendData.team = frontendData.team ? frontendData.team.trim() : null;
    if (frontendData.category !== undefined) backendData.category = frontendData.category ? frontendData.category.trim() : null;
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
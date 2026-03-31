import { TemporaryWorkersRepository } from "../repository/temporaryworkers.repository.js";

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
      const temporaryPersons = (result.temporaryPersons || []).map((worker) =>
        this.mapBackendToFrontend(worker),
      );
      return { ...result, temporaryPersons };
    } catch (error) {
      console.error("Error in getAllTemporaryWorkers service:", error);
      throw error;
    }
  }

  /**
   * Obtener persona temporal por ID
   */
  async getTemporaryWorkerById(id) {
    try {
      const temporaryWorker =
        await this.temporaryWorkersRepository.findById(id);

      if (!temporaryWorker) {
        return {
          success: false,
          statusCode: 404,
          message: "Persona temporal no encontrada.",
        };
      }

      return {
        success: true,
        data: this.mapBackendToFrontend(temporaryWorker),
      };
    } catch (error) {
      console.error("Error in getTemporaryWorkerById service:", error);
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

      const temporaryWorker =
        await this.temporaryWorkersRepository.create(mappedData);

      return {
        success: true,
        data: this.mapBackendToFrontend(temporaryWorker),
        message: `Persona temporal '${temporaryWorker.firstName} ${temporaryWorker.lastName}' creada exitosamente.`,
      };
    } catch (error) {
      console.error("Error in createTemporaryWorker service:", error);
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
          message: "Persona temporal no encontrada.",
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

      const updatedWorker = await this.temporaryWorkersRepository.update(
        id,
        mappedData,
      );

      return {
        success: true,
        data: this.mapBackendToFrontend(updatedWorker),
        message: `Persona temporal '${updatedWorker.firstName} ${updatedWorker.lastName}' actualizada exitosamente.`,
      };
    } catch (error) {
      console.error("Error in updateTemporaryWorker service:", error);
      throw error;
    }
  }

  /**
   * Eliminar persona temporal (solo si no está asociada a ningún equipo)
   */
  async deleteTemporaryWorker(id) {
    try {
      const existing = await this.temporaryWorkersRepository.findById(id);
      if (!existing) {
        return {
          success: false,
          statusCode: 404,
          message: "Persona temporal no encontrada.",
        };
      }

      // Verificar si está asociada a algún equipo
      const teamAssociation =
        await this.temporaryWorkersRepository.isAssociatedWithTeam(id);
      if (teamAssociation) {
        return {
          success: false,
          statusCode: 400,
          message: `No se puede eliminar la persona temporal porque está asociada al equipo '${teamAssociation.team.name}'. Primero debe removerla del equipo.`,
        };
      }

      const personName = `${existing.firstName} ${existing.lastName}`;

      // Permitir eliminación solo si no está asociada a equipos
      await this.temporaryWorkersRepository.hardDelete(id);

      return {
        success: true,
        message: `La persona temporal '${personName}' ha sido eliminada permanentemente.`,
      };
    } catch (error) {
      console.error("Error in deleteTemporaryWorker service:", error);
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
        data: stats,
      };
    } catch (error) {
      console.error("Error in getTemporaryWorkerStats service:", error);
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
        data,
      };
    } catch (error) {
      console.error("Error in getReferenceData service:", error);
      throw error;
    }
  }

  /**
   * Verificar disponibilidad de identificación
   */
  async checkIdentificationAvailability(identification, excludeId = null) {
    try {
      const existing =
        await this.temporaryWorkersRepository.findByIdentification(
          identification,
          excludeId,
        );
      return {
        available: !existing,
        message: existing
          ? "La identificación ya está en uso."
          : "Identificación disponible.",
      };
    } catch (error) {
      console.error("Error in checkIdentificationAvailability service:", error);
      throw error;
    }
  }

  /**
   * Verificar disponibilidad de email
   */
  async checkEmailAvailability(email, excludeId = null) {
    try {
      const existing = await this.temporaryWorkersRepository.findByEmail(
        email,
        excludeId,
      );
      return {
        available: !existing,
        message: existing ? "El email ya está en uso." : "Email disponible.",
      };
    } catch (error) {
      console.error("Error in checkEmailAvailability service:", error);
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
      const identificationExists =
        await this.temporaryWorkersRepository.findByIdentification(
          data.identification,
          excludeId,
        );
      if (identificationExists) {
        errors.push(
          "La identificación ya está en uso por otra persona temporal.",
        );
      }
    }

    // Validar email si se proporciona
    if (data.email) {
      const emailExists = await this.temporaryWorkersRepository.findByEmail(
        data.email,
        excludeId,
      );
      if (emailExists) {
        errors.push("El email ya está en uso por otra persona temporal.");
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(" "));
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

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
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
      errors.push("El nombre es requerido");
    }

    if (!data.lastName || !data.lastName.trim()) {
      errors.push("El apellido es requerido");
    }

    if (!data.personType) {
      errors.push("El tipo de persona es requerido");
    }

    if (errors.length > 0) {
      throw new Error(errors.join(". "));
    }
  }

  /**
   * Validar formato de datos
   */
  validateDataFormats(data, isCreate = true) {
    const errors = [];

    // Validar nombre
    if (data.firstName !== undefined) {
      if (
        typeof data.firstName !== "string" ||
        data.firstName.length < 2 ||
        data.firstName.length > 100
      ) {
        errors.push("El nombre debe tener entre 2 y 100 caracteres");
      }
      if (!/^[\p{L}\p{M}\s]+$/u.test(data.firstName)) {
        errors.push("El nombre solo puede contener letras y espacios");
      }
    }

    // Validar apellido
    if (data.lastName !== undefined) {
      if (
        typeof data.lastName !== "string" ||
        data.lastName.length < 2 ||
        data.lastName.length > 100
      ) {
        errors.push("El apellido debe tener entre 2 y 100 caracteres");
      }
      if (!/^[\p{L}\p{M}\s]+$/u.test(data.lastName)) {
        errors.push("El apellido solo puede contener letras y espacios");
      }
    }

    // Validar tipo de persona
    if (data.personType !== undefined) {
      const validTypes = ["Deportista", "Entrenador"];
      if (!validTypes.includes(data.personType)) {
        errors.push("El tipo de persona debe ser: Deportista o Entrenador");
      }
    }

    // Validar identificación
    if (
      data.identification !== undefined &&
      data.identification !== null &&
      data.identification !== ""
    ) {
      if (
        typeof data.identification !== "string" ||
        data.identification.length < 6 ||
        data.identification.length > 50
      ) {
        errors.push("La identificación debe tener entre 6 y 50 caracteres");
      }
      if (!/^[a-zA-Z0-9\-]+$/.test(data.identification)) {
        errors.push(
          "La identificación solo puede contener letras, números y guiones",
        );
      }
    }

    // Validar email
    if (data.email !== undefined && data.email !== null && data.email !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push("El formato del email no es válido");
      }
      if (data.email.length > 150) {
        errors.push("El email no puede exceder 150 caracteres");
      }
    }

    // Validar teléfono
    if (data.phone !== undefined && data.phone !== null && data.phone !== "") {
      if (!/^[0-9\s\-\+\(\)]+$/.test(data.phone)) {
        errors.push(
          "El teléfono solo puede contener números, espacios, guiones, paréntesis y el signo +",
        );
      }
      if (data.phone.length < 7 || data.phone.length > 20) {
        errors.push("El teléfono debe tener entre 7 y 20 caracteres");
      }
    }

    // Validar fecha de nacimiento
    if (
      data.birthDate !== undefined &&
      data.birthDate !== null &&
      data.birthDate !== ""
    ) {
      const birthDate = new Date(data.birthDate);
      if (isNaN(birthDate.getTime())) {
        errors.push("La fecha de nacimiento debe tener un formato válido");
      } else {
        const today = new Date();
        const minDate = new Date(
          today.getFullYear() - 100,
          today.getMonth(),
          today.getDate(),
        );
        const maxDate = new Date(
          today.getFullYear() - 5,
          today.getMonth(),
          today.getDate(),
        );

        if (birthDate < minDate) {
          errors.push(
            "La fecha de nacimiento no puede ser anterior a 100 años",
          );
        }
        if (birthDate > maxDate) {
          errors.push("La persona debe tener al menos 5 años de edad");
        }
      }
    }

    // Validar edad
    if (data.age !== undefined && data.age !== null) {
      const age = parseInt(data.age);
      if (isNaN(age) || age < 5 || age > 100) {
        errors.push("La edad debe estar entre 5 y 100 años");
      }
    }

    // Validar dirección
    if (
      data.address !== undefined &&
      data.address !== null &&
      data.address !== ""
    ) {
      if (data.address.length > 200) {
        errors.push("La dirección no puede exceder 200 caracteres");
      }
    }

    // Validar equipo
    if (data.team !== undefined && data.team !== null && data.team !== "") {
      if (data.team.length > 100) {
        errors.push("El nombre del equipo no puede exceder 100 caracteres");
      }
    }

    // Validar categoría
    if (
      data.category !== undefined &&
      data.category !== null &&
      data.category !== ""
    ) {
      if (data.category.length > 100) {
        errors.push("La categoría no puede exceder 100 caracteres");
      }
    }

    // Validar estado
    if (data.status !== undefined) {
      const validStatuses = ["Active", "Inactive"];
      if (!validStatuses.includes(data.status)) {
        errors.push("El estado debe ser Active o Inactive");
      }
    }

    // Validar tipo de documento
    if (data.documentTypeId !== undefined && data.documentTypeId !== null) {
      const docTypeId = parseInt(data.documentTypeId);
      if (isNaN(docTypeId) || docTypeId < 1) {
        errors.push("El tipo de documento debe ser un número válido");
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(". "));
    }
  }

  /**
   * Validar reglas de negocio
   */
  validateBusinessRules(data, existingData = null) {
    const errors = [];

    // Obtener datos actuales (para actualizaciones)
    const currentPersonType =
      data.personType || (existingData ? existingData.personType : null);
    const currentTeam =
      data.team !== undefined
        ? data.team
        : existingData
          ? existingData.team
          : null;
    const currentCategory =
      data.category !== undefined
        ? data.category
        : existingData
          ? existingData.category
          : null;

    // Validar coherencia entre fecha de nacimiento y edad
    if (data.birthDate && data.age) {
      const calculatedAge = this.calculateAge(data.birthDate);
      if (Math.abs(calculatedAge - parseInt(data.age)) > 1) {
        errors.push(
          "La edad proporcionada no coincide con la fecha de nacimiento",
        );
      }
    }

    // Validar que si se especifica equipo o categoría, no estén vacíos
    if (
      currentTeam !== null &&
      currentTeam !== undefined &&
      currentTeam.trim() === ""
    ) {
      errors.push("Si se especifica un equipo, no puede estar vacío");
    }

    if (
      currentCategory !== null &&
      currentCategory !== undefined &&
      currentCategory.trim() === ""
    ) {
      errors.push("Si se especifica una categoría, no puede estar vacía");
    }

    // Validar que deportistas y entrenadores menores de edad tengan información adicional
    if (
      currentPersonType === "Deportista" ||
      currentPersonType === "Entrenador"
    ) {
      const age = data.age || (existingData ? existingData.age : null);
      const birthDate =
        data.birthDate || (existingData ? existingData.birthDate : null);

      let calculatedAge = age;
      if (birthDate && !age) {
        calculatedAge = this.calculateAge(birthDate);
      }

      // Validar que entrenadores sean mayores de edad
      if (
        currentPersonType === "Entrenador" &&
        calculatedAge &&
        calculatedAge < 18
      ) {
        errors.push("Los entrenadores deben ser mayores de 18 años");
      }

      // Validar edad según tipo de documento
      const documentTypeId =
        data.documentTypeId !== undefined
          ? data.documentTypeId
          : existingData
            ? existingData.documentTypeId
            : null;
      if (
        documentTypeId &&
        calculatedAge !== null &&
        calculatedAge !== undefined
      ) {
        // Asumiendo que documentTypeId 1 = CC (Cédula) y 2 = TI (Tarjeta de Identidad)
        // Esto debería ajustarse según los IDs reales en la base de datos
        if (documentTypeId == 1) {
          // Cédula de Ciudadanía
          if (calculatedAge < 18) {
            errors.push(
              "Para cédula de ciudadanía la persona debe ser mayor de edad (18 años)",
            );
          }
        } else if (documentTypeId == 2) {
          // Tarjeta de Identidad
          if (calculatedAge >= 18) {
            errors.push(
              "Para tarjeta de identidad la persona debe ser menor de edad (menor a 18 años)",
            );
          }
        }
      }
    }

    // Validar que entrenadores no puedan usar Tarjeta de Identidad (ID 2)
    const documentTypeId =
      data.documentTypeId !== undefined
        ? data.documentTypeId
        : existingData
          ? existingData.documentTypeId
          : null;
    if (currentPersonType === "Entrenador" && documentTypeId == 2) {
      errors.push(
        "Los entrenadores no pueden usar Tarjeta de Identidad ya que deben ser mayores de edad",
      );
    }

    // Validar campos requeridos según tipo de persona
    if (currentPersonType === "Entrenador") {
      const email =
        data.email !== undefined
          ? data.email
          : existingData
            ? existingData.email
            : null;
      const phone =
        data.phone !== undefined
          ? data.phone
          : existingData
            ? existingData.phone
            : null;
      const address =
        data.address !== undefined
          ? data.address
          : existingData
            ? existingData.address
            : null;

      if (!email || !email.trim()) {
        errors.push("El email es requerido para entrenadores");
      }
      if (!phone || !phone.trim()) {
        errors.push("El teléfono es requerido para entrenadores");
      }
      if (!address || !address.trim()) {
        errors.push("La dirección es requerida para entrenadores");
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(". "));
    }
  }

  /**
   * Mapear campos del backend al formato esperado por frontend
   */
  mapBackendToFrontend(backendData) {
    if (!backendData) return backendData;

    const normalizeUtf8Text = (value) => {
      if (typeof value !== "string") return value;
      try {
        return value.normalize("NFC");
      } catch {
        return value;
      }
    };

    const splitName = (value) => {
      const normalized = normalizeUtf8Text(value || "").trim();
      if (!normalized) return { primary: "", secondary: null };
      const parts = normalized.split(/\s+/).filter(Boolean);
      return {
        primary: parts[0] || "",
        secondary: parts.length > 1 ? parts.slice(1).join(" ") : null,
      };
    };

    const first = splitName(backendData.firstName);
    const last = splitName(backendData.lastName);

    // Obtener equipo y categoría desde la relación TeamMember activa
    const activeMembership = backendData.teamMembers?.[0];
    const teamName =
      activeMembership?.team?.name ?? backendData.organization ?? null;
    const category = activeMembership?.team?.category ?? null;

    return {
      ...backendData,
      firstName: first.primary,
      middleName: first.secondary,
      lastName: last.primary,
      secondLastName: last.secondary,
      team: teamName,
      category: category,
    };
  }

  /**
   * Mapear campos del frontend al backend
   */
  mapFrontendToBackend(frontendData) {
    const backendData = {};
    const normalizeUtf8Text = (value) => {
      if (typeof value !== "string") return null;
      const trimmed = value.trim();
      if (!trimmed) return null;
      try {
        return trimmed.normalize("NFC");
      } catch {
        return trimmed;
      }
    };

    // Mapeo de campos
    const firstName = normalizeUtf8Text(frontendData.firstName);
    const middleName = normalizeUtf8Text(frontendData.middleName);
    const lastName = normalizeUtf8Text(frontendData.lastName);
    const secondLastName = normalizeUtf8Text(frontendData.secondLastName);

    if (firstName || middleName) {
      backendData.firstName = [firstName, middleName].filter(Boolean).join(" ");
    }
    // El modelo TemporaryPerson no tiene secondLastName separado.
    if (lastName || secondLastName) {
      backendData.lastName = [lastName, secondLastName]
        .filter(Boolean)
        .join(" ");
    }
    if (frontendData.identification)
      backendData.identification = normalizeUtf8Text(
        frontendData.identification,
      );
    if (frontendData.email) {
      const normalizedEmail = normalizeUtf8Text(frontendData.email);
      backendData.email = normalizedEmail
        ? normalizedEmail.toLowerCase()
        : null;
    }
    if (frontendData.phone)
      backendData.phone = normalizeUtf8Text(frontendData.phone);
    if (frontendData.birthDate)
      backendData.birthDate = new Date(frontendData.birthDate);
    if (frontendData.age !== undefined)
      backendData.age = parseInt(frontendData.age);
    if (frontendData.address)
      backendData.address = normalizeUtf8Text(frontendData.address);
    if (frontendData.personType)
      backendData.personType = frontendData.personType;
    if (frontendData.team !== undefined)
      backendData.organization = frontendData.team
        ? normalizeUtf8Text(frontendData.team)
        : null;
    if (frontendData.status) backendData.status = frontendData.status;
    if (frontendData.documentTypeId) {
      backendData.documentType = {
        connect: { id: parseInt(frontendData.documentTypeId) },
      };
    }

    // Mapeo de campos del modal actual (compatibilidad)
    if (frontendData.nombre && !backendData.firstName) {
      const nombreNormalizado = normalizeUtf8Text(frontendData.nombre) || "";
      const nombres = nombreNormalizado.split(" ");
      backendData.firstName = nombres[0];
      if (nombres.length > 1) {
        backendData.lastName = nombres.slice(1).join(" ");
      }
    }
    if (frontendData.apellido && !backendData.lastName)
      backendData.lastName = normalizeUtf8Text(frontendData.apellido);
    if (frontendData.telefono && !backendData.phone)
      backendData.phone = normalizeUtf8Text(frontendData.telefono);
    if (frontendData.fechaNacimiento && !backendData.birthDate)
      backendData.birthDate = new Date(frontendData.fechaNacimiento);
    if (frontendData.estado && !backendData.status) {
      backendData.status =
        frontendData.estado === "Activo" ? "Active" : "Inactive";
    }
    if (frontendData.equipo !== undefined && !backendData.organization)
      backendData.organization = normalizeUtf8Text(frontendData.equipo);

    return backendData;
  }
}

import bcrypt from "bcrypt";
import { AthletesRepository } from "../repository/athletes.repository.js";
import emailService from "../../../services/emailService.js";

export class AthletesService {
  constructor() {
    this.athletesRepository = new AthletesRepository();
  }

  /**
   * Normalizar clave de rol para comparaciones
   */
  normalizeRoleKey(value) {
    return value
      ? String(value)
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "")
      : "";
  }

  /**
   * Resolver filtros de alcance según el usuario
   */
  async resolveScopeFilters(filters = {}, user = null) {
    const scoped = { ...filters };
    const roleKey = this.normalizeRoleKey(user?.role?.name || user?.rol || "");
    const isAdmin = roleKey === "admin" || roleKey === "administrador";
    const isHealthProfessional =
      roleKey === "profesionaldelasalud" || roleKey === "profesionaldesalud";

    // Los administradores pueden ver todos los deportistas
    if (isAdmin) {
      return scoped;
    }

    // Los profesionales de salud solo pueden ver deportistas activos
    if (isHealthProfessional) {
      scoped.status = "Activo";
      return scoped;
    }

    return scoped;
  }

  async getAllAthletes(
    { page = 1, limit = 10, search = "", status, categoria, estadoInscripcion },
    user = null,
  ) {
    try {
      const scopedFilters = await this.resolveScopeFilters(
        {
          page,
          limit,
          search,
          status,
          categoria,
          estadoInscripcion,
        },
        user,
      );

      const result = await this.athletesRepository.findAll({
        page: parseInt(scopedFilters.page),
        limit: parseInt(scopedFilters.limit),
        search: scopedFilters.search,
        status: scopedFilters.status,
        categoria: scopedFilters.categoria,
        estadoInscripcion: scopedFilters.estadoInscripcion,
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
      // Establecer estado por defecto como "Activo" si no se proporciona
      const dataWithDefaults = {
        ...athleteData,
        estado: athleteData.estado || "Activo",
      };

      // Validar documento único en TODOS los usuarios
      const existingUserByDocument =
        await this.athletesRepository.findByIdentification(
          dataWithDefaults.identification,
        );
      if (existingUserByDocument) {
        throw new Error(
          `El documento "${dataWithDefaults.identification}" ya está registrado.`,
        );
      }

      // Validar email único
      if (dataWithDefaults.email) {
        const existingByEmail = await this.athletesRepository.findByEmail(
          dataWithDefaults.email,
        );
        if (existingByEmail) {
          throw new Error(
            `El email "${dataWithDefaults.email}" ya está registrado por otro usuario.`,
          );
        }
      }

      // Validar acudiente si es menor de edad
      const age = this.calculateAge(dataWithDefaults.birthDate);
      if (age < 18 && !dataWithDefaults.acudiente) {
        throw new Error(
          "Los menores de edad deben tener un acudiente asignado.",
        );
      }

      // Validar que el acudiente existe si se proporciona
      if (dataWithDefaults.acudiente) {
        const guardianExists = await this.athletesRepository.validateGuardian(
          dataWithDefaults.acudiente,
        );
        if (!guardianExists) {
          throw new Error(
            `El acudiente con ID ${dataWithDefaults.acudiente} no existe.`,
          );
        }
      }

      // REGLA DE NEGOCIO: Usar documento de identidad como contraseña inicial
      const temporaryPassword = dataWithDefaults.identification?.trim();
      dataWithDefaults.temporaryPassword = temporaryPassword;

      const newAthlete = await this.athletesRepository.create(dataWithDefaults);

      // 🔥 NUEVO: Si viene de inscripción del landing, marcarla como procesada
      if (athleteData.preRegistrationId) {
        try {
          const prisma = (await import("../../../config/database.js")).default;
          await prisma.preRegistration.update({
            where: { id: parseInt(athleteData.preRegistrationId) },
            data: { status: "Processed" }, // ← Cambiado a inglés
          });
        } catch (error) {
          // No fallar la creación del atleta si falla marcar la inscripción
        }
      } else {
      }

      // Enviar email de bienvenida con credenciales
      const emailResult = await this.sendWelcomeEmail(
        newAthlete,
        temporaryPassword,
      );

      return {
        success: true,
        data: newAthlete,
        temporaryPassword:
          process.env.NODE_ENV === "development"
            ? temporaryPassword
            : undefined,
        emailSent: emailResult.success,
        message: `Deportista "${dataWithDefaults.firstName} ${dataWithDefaults.lastName}" creado exitosamente con estado Activo. ${emailResult.success ? "Credenciales enviadas por email." : "Error enviando credenciales por email."}`,
      };
    } catch (error) {
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

      // Detectar si el email cambió
      const emailChanged =
        updateData.email && updateData.email !== existingAthlete.email;
      const oldEmail = existingAthlete.email;

      // Validar documento único si se está actualizando (en todos los usuarios)
      if (
        updateData.identification &&
        updateData.identification !== existingAthlete.identification
      ) {
        const existingByDocument =
          await this.athletesRepository.findByIdentification(
            updateData.identification,
            existingAthlete.userId,
          );
        if (existingByDocument) {
          throw new Error(
            `El documento "${updateData.identification}" ya está registrado.`,
          );
        }
        const newPassword = updateData.identification?.trim();
        if (newPassword) {
          updateData.passwordHash = await bcrypt.hash(newPassword, 10);
        }
      }

      // Validar email único si se está actualizando
      if (emailChanged) {
        const existingByEmail = await this.athletesRepository.findByEmail(
          updateData.email,
          existingAthlete.userId,
        );
        if (existingByEmail) {
          throw new Error(
            `El email "${updateData.email}" ya está registrado por otro usuario.`,
          );
        }
      }

      // Validar acudiente si es menor de edad
      if (updateData.birthDate) {
        const age = this.calculateAge(updateData.birthDate);
        if (age < 18 && !updateData.acudiente && !existingAthlete.acudiente) {
          throw new Error(
            "Los menores de edad deben tener un acudiente asignado.",
          );
        }
      }

      // Validar que el acudiente existe si se proporciona
      if (updateData.acudiente) {
        const guardianExists = await this.athletesRepository.validateGuardian(
          updateData.acudiente,
        );
        if (!guardianExists) {
          throw new Error(
            `El acudiente con ID ${updateData.acudiente} no existe.`,
          );
        }
      }

      const updatedAthlete = await this.athletesRepository.update(
        id,
        updateData,
      );

      // Si el email cambió, enviar correo de verificación al nuevo email
      let emailSent = false;
      if (emailChanged) {
        const emailResult = await this.sendWelcomeEmail(
          {
            email: updateData.email,
            firstName: updatedAthlete.firstName,
            lastName: updatedAthlete.lastName,
          },
          existingAthlete.identification, // Usar el documento como contraseña
        );
        emailSent = emailResult.success;
      }

      return {
        success: true,
        data: updatedAthlete,
        emailSent,
        message: `Deportista "${updatedAthlete.firstName} ${updatedAthlete.lastName}" actualizado exitosamente.${emailChanged ? (emailSent ? " Credenciales enviadas al nuevo email." : " Error enviando credenciales al nuevo email.") : ""}`,
      };
    } catch (error) {
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

      const updatedAthlete = await this.athletesRepository.changeStatus(
        id,
        status,
      );
      const athleteName =
        updatedAthlete?.nombreCompleto ||
        `${updatedAthlete?.firstName || ""} ${updatedAthlete?.lastName || ""}`.trim();

      return {
        success: true,
        data: updatedAthlete,
        message: `Estado del deportista "${athleteName}" cambiado a "${updatedAthlete.estado}" exitosamente.`,
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
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  }

  /**
   * Generar contraseña temporal segura
   */
  generateTemporaryPassword() {
    // Caracteres seguros (sin caracteres ambiguos como 0, O, l, I)
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercase = "abcdefghijkmnpqrstuvwxyz";
    const numbers = "23456789";
    const symbols = "!@#$%&*";

    let password = "";

    // Asegurar al menos un carácter de cada tipo
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));

    // Completar con caracteres aleatorios
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = 4; i < 12; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Mezclar la contraseña
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  }

  /**
   * Enviar email de bienvenida con credenciales
   */
  async sendWelcomeEmail(athleteData, temporaryPassword) {
    try {
      const athleteInfo = {
        email: athleteData.email,
        firstName: athleteData.firstName,
        lastName: athleteData.lastName,
      };

      const credentials = {
        email: athleteData.email,
        temporaryPassword,
      };

      const result = await emailService.sendAthleteWelcomeEmail(
        athleteInfo,
        credentials,
      );

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Verificar disponibilidad de email
   */
  async checkEmailAvailability(email, excludeUserId = null) {
    try {
      const existingUser = await this.athletesRepository.findByEmail(
        email,
        excludeUserId,
      );

      if (!existingUser) {
        return { available: true };
      }

      if (excludeUserId && existingUser.id === parseInt(excludeUserId)) {
        return { available: true };
      }

      return {
        available: false,
        message: "Este email ya está registrado en el sistema",
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verificar disponibilidad de identificación
   */
  async checkIdentificationAvailability(identification, excludeUserId = null) {
    try {
      const existingUser = await this.athletesRepository.findByIdentification(
        identification,
        excludeUserId,
      );

      if (!existingUser) {
        return { available: true };
      }

      if (excludeUserId && existingUser.id === parseInt(excludeUserId)) {
        return { available: true };
      }

      return {
        available: false,
        message: "Este documento ya está registrado en el sistema",
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remover acudiente de un deportista
   */
  async removeGuardian(athleteId) {
    try {
      const athlete = await this.athletesRepository.findById(athleteId);

      if (!athlete) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el deportista con ID ${athleteId}.`,
        };
      }

      if (!athlete.acudiente) {
        return {
          success: false,
          statusCode: 400,
          message: "El deportista no tiene un acudiente asignado.",
        };
      }

      // 🔥 VALIDACIÓN: No permitir remover acudiente si es menor de edad
      // Nota: findById ya devuelve el objeto transformado con birthDate y age calculado
      const age = athlete.age || this.calculateAge(athlete.birthDate);

      if (age < 18) {
        return {
          success: false,
          statusCode: 400,
          message: `No se puede remover el acudiente de "${athlete.firstName} ${athlete.lastName}" porque es menor de edad (${age} años). Los menores de edad deben tener un acudiente asignado en todo momento.`,
        };
      }

      // Remover el acudiente usando Prisma directamente (solo actualizar el atleta, no el usuario)
      const updatedAthlete =
        await this.athletesRepository.removeGuardianFromAthlete(athleteId);

      return {
        success: true,
        data: updatedAthlete,
        message: "Acudiente removido correctamente del deportista.",
      };
    } catch (error) {
      throw error;
    }
  }
}

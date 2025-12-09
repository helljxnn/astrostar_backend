import { preRegistrationsRepository } from "../repository/preRegistrations.repository.js";
import emailService from "../../../services/emailService.js";

export const preRegistrationsService = {
  async create(data) {
    // 1. Verificar si ya existe una pre-inscripción pendiente con el mismo correo o documento
    const existing = await preRegistrationsRepository.findAll({
      search: data.correo,
      estado: "Pendiente",
      page: 1,
      limit: 1,
    });

    if (existing.data && existing.data.length > 0) {
      const existingReg = existing.data[0];
      
      // Verificar si es el mismo correo o documento
      if (existingReg.correo === data.correo || existingReg.numeroDocumento === data.numeroDocumento) {
        throw new Error(
          "Ya existe una pre-inscripción pendiente con este correo o documento. " +
          "Si no recibiste el correo, usa la opción de reenviar."
        );
      }
    }

    // 2. Convertir fechaNacimiento a Date si viene como string
    const dataToCreate = {
      ...data,
      fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : new Date(),
      estado: "Pendiente",
    };

    // 3. Crear pre-inscripción
    const preRegistration = await preRegistrationsRepository.create(dataToCreate);

    // 4. Enviar correo de confirmación (no bloqueante)
    emailService.sendPreRegistrationEmail(preRegistration).catch((error) => {
      console.error("Error enviando correo de pre-inscripción:", error);
    });

    return preRegistration;
  },

  async findAll(filters) {
    return await preRegistrationsRepository.findAll(filters);
  },

  async findById(id) {
    const preRegistration = await preRegistrationsRepository.findById(id);
    if (!preRegistration) {
      throw new Error("Pre-inscripción no encontrada");
    }
    return preRegistration;
  },

  async delete(id) {
    await this.findById(id);
    return await preRegistrationsRepository.delete(id);
  },

  async updateStatus(id, estado) {
    await this.findById(id);
    return await preRegistrationsRepository.update(id, { estado });
  },

  async resendEmail(email) {
    // Buscar pre-inscripción más reciente con ese email
    const preRegistrations = await preRegistrationsRepository.findAll({
      search: email,
      page: 1,
      limit: 1,
    });

    if (!preRegistrations.data || preRegistrations.data.length === 0) {
      throw new Error("No se encontró ninguna pre-inscripción con ese correo");
    }

    const preRegistration = preRegistrations.data[0];

    // Si el email cambió, actualizar
    if (preRegistration.correo !== email) {
      await preRegistrationsRepository.update(preRegistration.id, {
        correo: email,
      });
      preRegistration.correo = email;
    }

    // Reenviar correo
    const result = await emailService.sendPreRegistrationEmail(preRegistration);

    if (!result.success) {
      throw new Error("Error al enviar el correo");
    }

    return {
      email,
      sentAt: new Date(),
    };
  },
};

import { preRegistrationsRepository } from "../repository/preRegistrations.repository.js";
import emailService from "../../../services/emailService.js";
import prisma from "../../../config/database.js";

export const preRegistrationsService = {
  async create(data) {
    // 1. Verificar si ya existe una pre-inscripción pendiente con el mismo correo o documento
    const existing = await preRegistrationsRepository.findAll({
      search: data.email,
      status: "Pendiente",
      page: 1,
      limit: 1,
    });

    if (existing.data && existing.data.length > 0) {
      const existingReg = existing.data[0];
      
      // Verificar si es el mismo correo o documento
      if (existingReg.email === data.email || existingReg.identification === data.identification) {
        throw new Error(
          "Ya existe una pre-inscripción pendiente con este correo o documento. " +
          "Si no recibiste el correo, usa la opción de reenviar."
        );
      }
    }

    // 2. Convertir birthDate a Date si viene como string
    const dataToCreate = {
      ...data,
      birthDate: data.birthDate ? new Date(data.birthDate) : new Date(),
      status: "Pendiente",
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

  async updateStatus(id, status) {
    await this.findById(id);
    return await preRegistrationsRepository.update(id, { status });
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
    if (preRegistration.email !== email) {
      await preRegistrationsRepository.update(preRegistration.id, {
        email: email,
      });
      preRegistration.email = email;
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

  async checkDocumentExists(identification) {
    // 1. Buscar en pre-registros
    const existingPreRegistration = await preRegistrationsRepository.findByDocument(identification);
    
    // 2. Buscar en usuarios (deportistas matriculados)
    const existingUser = await prisma.user.findFirst({
      where: { identification },
      select: {
        id: true,
        identification: true,
        firstName: true,
        lastName: true,
      }
    });

    // Si existe en cualquiera de las dos tablas
    const exists = !!(existingPreRegistration || existingUser);
    
    let message = 'Documento disponible';
    let location = null;
    
    if (existingPreRegistration) {
      message = 'Este documento ya tiene una inscripción pendiente';
      location = 'preRegistration';
    } else if (existingUser) {
      message = 'Este documento ya está matriculado en el sistema';
      location = 'user';
    }

    return {
      exists,
      message,
      location,
      data: existingPreRegistration || existingUser || null,
    };
  },
};

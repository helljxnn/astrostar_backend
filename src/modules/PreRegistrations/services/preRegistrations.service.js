import { preRegistrationsRepository } from "../repository/preRegistrations.repository.js";
import emailService from "../../../services/emailService.js";
import prisma from "../../../config/database.js";

export const preRegistrationsService = {
  async create(data) {
    // 1. Verificar si ya existe una pre-inscripción con el mismo correo o documento
    // Nota: Las inscripciones rechazadas se eliminan automáticamente, así que solo buscamos activas
    const existingByEmail = await prisma.preRegistration.findUnique({
      where: { email: data.email },
      select: { id: true, status: true }
    });

    if (existingByEmail) {
      throw new Error('Este email ya está inscrito');
    }

    const existingByDocument = await prisma.preRegistration.findUnique({
      where: { identification: data.identification },
      select: { id: true, status: true }
    });

    if (existingByDocument) {
      throw new Error('Este documento ya está inscrito');
    }

    // 2. Convertir birthDate a Date si viene como string
    const dataToCreate = {
      ...data,
      birthDate: data.birthDate ? (() => {
        const date = new Date(data.birthDate);
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
      })() : new Date(),
      status: "Pending",
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
      throw new Error("Inscripción no encontrada");
    }
    return preRegistration;
  },

  async delete(id) {
    await this.findById(id);
    return await preRegistrationsRepository.delete(id);
  },

  async updateStatus(id, status) {
    await this.findById(id);
    
    // Si se rechaza, eliminar físicamente para liberar email y documento
    if (status === 'Rejected') {
      await preRegistrationsRepository.delete(id);
      return { 
        id, 
        status: 'Rejected', 
        deleted: true,
        message: 'Inscripción rechazada y eliminada del sistema'
      };
    }
    
    // Para otros status, actualizar normalmente
    return await preRegistrationsRepository.update(id, { status });
  },

  async resendEmail(data) {
    const { email, identification } = data;
    
    // Buscar inscripción por documento (más confiable) o por email
    let preRegistration = null;
    
    if (identification) {
      // Buscar por documento
      preRegistration = await prisma.preRegistration.findUnique({
        where: { identification },
      });
    } else if (email) {
      // Buscar por email (si no se proporcionó documento)
      preRegistration = await prisma.preRegistration.findUnique({
        where: { email },
      });
    }

    if (!preRegistration) {
      throw new Error(
        identification 
          ? "No se encontró ninguna inscripción con ese documento"
          : "No se encontró ninguna inscripción con ese correo"
      );
    }

    // Si el email cambió, actualizar
    if (email && preRegistration.email !== email) {
      // Validar que el nuevo email no esté en uso
      const existingWithNewEmail = await prisma.preRegistration.findUnique({
        where: { email },
      });
      
      if (existingWithNewEmail && existingWithNewEmail.id !== preRegistration.id) {
        throw new Error("El nuevo correo ya está en uso por otra inscripción");
      }
      
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
      email: preRegistration.email,
      sentAt: new Date(),
    };
  },

  async checkDocumentExists(identification) {
    // 1. Buscar en pre-registros (las rechazadas se eliminan automáticamente)
    const existingPreRegistration = await prisma.preRegistration.findUnique({
      where: { identification },
      select: {
        id: true,
        identification: true,
        status: true,
      }
    });
    
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
      message = 'Este documento ya está inscrito';
      location = 'preRegistration';
    } else if (existingUser) {
      message = 'Este documento ya está registrado en el sistema';
      location = 'user';
    }

    return {
      exists,
      message,
      location,
      data: existingPreRegistration || existingUser || null,
    };
  },

  async checkEmailExists(email) {
    // 1. Buscar en pre-registros (las rechazadas se eliminan automáticamente)
    const existingPreRegistration = await prisma.preRegistration.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        status: true,
      }
    });
    
    // 2. Buscar en usuarios (deportistas matriculados)
    const existingUser = await prisma.user.findFirst({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      }
    });

    // Si existe en cualquiera de las dos tablas
    const exists = !!(existingPreRegistration || existingUser);
    
    let message = 'Email disponible';
    let location = null;
    
    if (existingPreRegistration) {
      message = 'Este email ya está inscrito';
      location = 'preRegistration';
    } else if (existingUser) {
      message = 'Este email ya está registrado en el sistema';
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

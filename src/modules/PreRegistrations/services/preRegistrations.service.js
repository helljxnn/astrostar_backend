import { preRegistrationsRepository } from "../repository/preRegistrations.repository.js";
import emailService from "../../../services/emailService.js";
import prisma from "../../../config/database.js";

const STATUS_ALIASES = {
  pending: ["pending", "pendiente", "enproceso"],
  processed: ["processed", "procesado", "procesada", "aprobado", "aprobada", "accepted", "aceptado", "aceptada"],
  rejected: ["rejected", "rechazado", "rechazada", "denegado", "denegada"],
};

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

let enumValuesCache = null;

const getPreRegistrationEnumValues = async () => {
  if (enumValuesCache && enumValuesCache.length > 0) {
    return enumValuesCache;
  }

  const rows = await prisma.$queryRaw`
    SELECT e.enumlabel AS value
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE LOWER(t.typname) = LOWER('PreRegistrationStatus')
    ORDER BY e.enumsortorder
  `;

  enumValuesCache = Array.isArray(rows)
    ? rows.map((r) => r.value).filter(Boolean)
    : [];

  return enumValuesCache;
};

const resolveStatusCanonical = (rawStatus) => {
  const normalized = normalizeText(rawStatus);
  if (!normalized) return null;

  if (STATUS_ALIASES.pending.some((v) => normalized.includes(v))) return "pending";
  if (STATUS_ALIASES.processed.some((v) => normalized.includes(v))) return "processed";
  if (STATUS_ALIASES.rejected.some((v) => normalized.includes(v))) return "rejected";
  return null;
};

const resolveStatusForDb = async (rawStatus, { required = false } = {}) => {
  if (rawStatus === undefined || rawStatus === null || rawStatus === "") {
    if (required) {
      throw new Error("El estado es requerido");
    }
    return null;
  }

  const enumValues = await getPreRegistrationEnumValues();
  const normalizedMap = new Map(enumValues.map((v) => [normalizeText(v), v]));

  // 1) Coincidencia exacta contra valores reales de BD
  const exact = normalizedMap.get(normalizeText(rawStatus));
  if (exact) {
    return {
      dbValue: exact,
      canonical: resolveStatusCanonical(exact),
    };
  }

  // 2) Coincidencia por alias (ingles/espanol)
  const canonical = resolveStatusCanonical(rawStatus);
  if (canonical) {
    const candidates = STATUS_ALIASES[canonical];
    for (const candidate of candidates) {
      const matched = normalizedMap.get(normalizeText(candidate));
      if (matched) {
        return { dbValue: matched, canonical };
      }
    }
  }

  throw new Error(
    `Estado de preinscripcion no valido: "${rawStatus}". Valores permitidos: ${enumValues.join(", ")}`
  );
};

const resolveInitialCreateStatus = async () => {
  // Preferir "pendiente" (en cualquier variante del enum real)
  try {
    const resolvedPending = await resolveStatusForDb("pending");
    if (resolvedPending?.dbValue) {
      return resolvedPending.dbValue;
    }
  } catch {
    // Continuar con fallback
  }

  // Fallback defensivo: primer valor del enum en BD
  const enumValues = await getPreRegistrationEnumValues();
  if (enumValues.length > 0) {
    return enumValues[0];
  }

  throw new Error("No se pudieron resolver valores del enum PreRegistrationStatus en la base de datos");
};

export const preRegistrationsService = {
  async create(data) {
    const { acceptDataPolicy: _acceptDataPolicy, ...preRegistrationData } = data;

    // 1. Verificar si ya existe una pre-inscripción con el mismo correo o documento
    // Nota: Las inscripciones rechazadas se eliminan automáticamente, así que solo buscamos activas
    const existingByEmail = await prisma.preRegistration.findUnique({
      where: { email: preRegistrationData.email },
      select: { id: true, status: true }
    });

    if (existingByEmail) {
      throw new Error('Este email ya está inscrito');
    }

    const existingByDocument = await prisma.preRegistration.findUnique({
      where: { identification: preRegistrationData.identification },
      select: { id: true, status: true }
    });

    if (existingByDocument) {
      throw new Error('Este documento ya está inscrito');
    }

    const initialStatus = await resolveInitialCreateStatus();

    // 2. Convertir birthDate a Date si viene como string
    const dataToCreate = {
      ...preRegistrationData,
      birthDate: preRegistrationData.birthDate ? (() => {
        const date = new Date(preRegistrationData.birthDate);
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
      })() : new Date(),
      // Forzar un estado inicial valido segun el enum real en BD
      // para evitar errores por defaults desalineados tras migraciones/pulls.
      status: initialStatus,
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
    const resolvedStatus = await resolveStatusForDb(filters?.status);
    return await preRegistrationsRepository.findAll({
      ...filters,
      status: resolvedStatus?.dbValue,
    });
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
    const resolvedStatus = await resolveStatusForDb(status, { required: true });
    
    // Si se rechaza, eliminar físicamente para liberar email y documento
    if (resolvedStatus.canonical === "rejected") {
      await preRegistrationsRepository.delete(id);
      return { 
        id, 
        status: resolvedStatus.dbValue,
        deleted: true,
        message: 'Inscripción rechazada y eliminada del sistema'
      };
    }
    
    // Para otros status, actualizar normalmente
    return await preRegistrationsRepository.update(id, {
      status: resolvedStatus.dbValue,
    });
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

  /**
   * Obtener todas las inscripciones para reporte (SIN PAGINACIÓN)
   */
  async findAllForReport(filters) {
    const resolvedStatus = await resolveStatusForDb(filters?.status);
    const data = await preRegistrationsRepository.findAllForReport({
      ...filters,
      status: resolvedStatus?.dbValue,
    });
    return {
      success: true,
      data,
      message: `Se encontraron ${data.length} inscripciones para el reporte.`,
    };
  },
};


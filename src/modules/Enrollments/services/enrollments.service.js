import prisma from "../../../config/database.js";
import { enrollmentsRepository } from "../repository/enrollments.repository.js";
import emailService from "../../../services/emailService.js";
import { paymentsService } from "../../Payments/services/payments.service.js";

// ============================================================================
// CONSTANTES Y CONFIGURACIÓN
// ============================================================================
const ENROLLMENT_CONSTANTS = {
  ADULT_AGE: 18,
  ENROLLMENT_DURATION_YEARS: 1,
  ENROLLMENT_MINIMUM_AGE_MONTHS: 12,
  DEFAULT_ROLE_NAME: 'Deportista',
  DEFAULT_ADDRESS: 'N/A',
  BCRYPT_SALT_ROUNDS: 10,
};

const ENROLLMENT_STATUS = {
  PENDING_PAYMENT: 'Pending_Payment',
  ACTIVE: 'Vigente',
  EXPIRED: 'Vencida',
};

const ATHLETE_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

const PRE_REGISTRATION_STATUS = {
  PENDING: 'Pending',
  PROCESSED: 'Processed',
};

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Calcula la edad de una persona basándose en su fecha de nacimiento
 * @param {Date|string} birthDate - Fecha de nacimiento
 * @returns {number} Edad en años
 */
const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Normaliza los campos del atleta para soportar múltiples formatos
 * @param {Object} athlete - Datos del atleta
 * @returns {Object} Datos normalizados
 */
const normalizeAthleteFields = (athlete) => {
  return {
    ...athlete,
    guardianId: athlete.guardianId || athlete.acudiente || null,
    relationship: athlete.relationship || athlete.parentesco || null,
  };
};

/**
 * Limpia y normaliza un email
 * @param {string} email - Email a normalizar
 * @returns {string} Email normalizado
 */
const normalizeEmail = (email) => {
  return email?.trim().toLowerCase() || '';
};

/**
 * Calcula la fecha de vencimiento de una matrícula
 * @param {Date} startDate - Fecha de inicio
 * @param {number} years - Años de duración
 * @returns {Date} Fecha de vencimiento
 */
const calculateExpirationDate = (startDate, years = ENROLLMENT_CONSTANTS.ENROLLMENT_DURATION_YEARS) => {
  const expirationDate = new Date(startDate);
  expirationDate.setFullYear(expirationDate.getFullYear() + years);
  return expirationDate;
};

// ============================================================================
// VALIDACIONES
// ============================================================================

/**
 * Valida que un usuario no exista por documento
 * @param {Object} tx - Transacción de Prisma
 * @param {string} identification - Documento de identidad
 * @throws {Error} Si el usuario ya existe
 */
const validateUserDoesNotExist = async (tx, identification) => {
  const existingUser = await tx.user.findUnique({
    where: { identification },
    select: { id: true },
  });

  if (existingUser) {
    throw new Error("Ya existe una deportista con ese documento");
  }
};

/**
 * Valida y obtiene el acudiente si es necesario
 * @param {Object} tx - Transacción de Prisma
 * @param {number} age - Edad del atleta
 * @param {number|null} guardianId - ID del acudiente
 * @returns {Promise<number|null>} ID del acudiente validado o null
 * @throws {Error} Si la validación falla
 */
const validateAndGetGuardian = async (tx, age, guardianId) => {
  const isMinor = age < ENROLLMENT_CONSTANTS.ADULT_AGE;
  
  // Si es menor de edad, el acudiente es obligatorio
  if (isMinor && !guardianId) {
    throw new Error(`El acudiente es obligatorio para menores de ${ENROLLMENT_CONSTANTS.ADULT_AGE} años`);
  }
  
  // Si no hay guardianId, retornar null
  if (!guardianId) {
    return null;
  }
  
  // Validar que el ID sea un número válido
  const parsedGuardianId = parseInt(guardianId);
  if (isNaN(parsedGuardianId) || parsedGuardianId <= 0) {
    throw new Error("El ID del acudiente debe ser un número entero positivo");
  }
  
  // Verificar que el acudiente existe
  const guardian = await tx.guardian.findUnique({
    where: { id: parsedGuardianId },
    select: { id: true, firstName: true, lastName: true },
  });
  
  if (!guardian) {
    throw new Error("Acudiente no encontrado");
  }
  
  return parsedGuardianId;
};

// ============================================================================
// OPERACIONES DE BASE DE DATOS
// ============================================================================

/**
 * Obtiene o crea el rol de atleta
 * @param {Object} tx - Transacción de Prisma
 * @returns {Promise<Object>} Rol de atleta
 */
const getOrCreateAthleteRole = async (tx) => {
  let athleteRole = await tx.role.findFirst({
    where: { name: ENROLLMENT_CONSTANTS.DEFAULT_ROLE_NAME }
  });

  if (!athleteRole) {
    // Permisos básicos para deportistas
    const athletePermissions = {
      "Perfil": {
        "Ver": true,
        "Editar": true
      },
      "Citas": {
        "Ver": true,
        "Crear": true,
        "Editar": true
      },
      "Matriculas": {
        "Ver": true
      },
      "Inscripciones": {
        "Ver": true
      },
      "Eventos": {
        "Ver": true
      }
    };

    athleteRole = await tx.role.create({
      data: {
        name: ENROLLMENT_CONSTANTS.DEFAULT_ROLE_NAME,
        description: 'Rol de deportista',
        status: ATHLETE_STATUS.ACTIVE,
        permissions: athletePermissions
      }
    });
    
    console.log('✅ [ENROLLMENT] Rol de Athlete creado con permisos básicos');
  }

  return athleteRole;
};

/**
 * Crea un nuevo usuario en el sistema
 * @param {Object} tx - Transacción de Prisma
 * @param {Object} athleteData - Datos del atleta
 * @param {number} roleId - ID del rol
 * @param {number} age - Edad calculada
 * @returns {Promise<Object>} Usuario creado
 */
const createUser = async (tx, athleteData, roleId, age) => {
  const bcrypt = await import('bcrypt');
  const tempPassword = athleteData.identification?.trim();
  const passwordHash = await bcrypt.default.hash(tempPassword, ENROLLMENT_CONSTANTS.BCRYPT_SALT_ROUNDS);
  const cleanEmail = normalizeEmail(athleteData.email);
  
  const newUser = await tx.user.create({
    data: {
      firstName: athleteData.firstName?.trim(),
      middleName: athleteData.middleName?.trim() || null,
      lastName: athleteData.lastName?.trim(),
      secondLastName: athleteData.secondLastName?.trim() || null,
      documentTypeId: parseInt(athleteData.documentTypeId),
      identification: athleteData.identification?.trim(),
      email: cleanEmail,
      phoneNumber: athleteData.phoneNumber?.trim(),
      birthDate: new Date(athleteData.birthDate),
      age: age,
      address: athleteData.address?.trim() || ENROLLMENT_CONSTANTS.DEFAULT_ADDRESS,
      passwordHash: passwordHash,
      roleId: roleId,
      status: ATHLETE_STATUS.ACTIVE
    },
    include: {
      documentType: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      role: true
    },
  });

  return { user: newUser, tempPassword };
};

/**
 * Crea un nuevo atleta en el sistema
 * @param {Object} tx - Transacción de Prisma
 * @param {number} userId - ID del usuario
 * @param {number|null} guardianId - ID del acudiente
 * @param {string|null} relationship - Relación con el acudiente
 * @returns {Promise<Object>} Atleta creado
 */
const createAthlete = async (tx, userId, guardianId, relationship) => {
  return await tx.athlete.create({
    data: {
      userId: userId,
      status: ATHLETE_STATUS.ACTIVE,
      inactivityReason: null,
      guardianId: guardianId,
      relationship: relationship,
      currentInscriptionStatus: ATHLETE_STATUS.ACTIVE
    },
    include: {
      user: {
        include: {
          documentType: true
        }
      },
      guardian: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
        },
      },
    },
  });
};

/**
 * Crea una nueva matrícula
 * @param {Object} tx - Transacción de Prisma
 * @param {number} athleteId - ID del atleta
 * @param {Object} enrollmentData - Datos de la matrícula
 * @returns {Promise<Object>} Matrícula creada
 */
const createEnrollment = async (tx, athleteId, enrollmentData) => {
  const fechaInicio = enrollmentData?.fechaMatricula
    ? new Date(enrollmentData.fechaMatricula)
    : new Date();
  
  const fechaVencimiento = calculateExpirationDate(fechaInicio);

  return await tx.enrollment.create({
    data: {
      athleteId: athleteId,
      fechaInicio: fechaInicio,
      fechaVencimiento: fechaVencimiento,
      fechaMatricula: fechaInicio,
      estado: ENROLLMENT_STATUS.PENDING_PAYMENT, // Empieza en Pending_Payment hasta aprobar pago inicial
      observaciones: enrollmentData?.observaciones || null,
      comprobantePago: enrollmentData?.comprobantePago || null,
    },
  });
};

/**
 * Marca una pre-inscripción como procesada
 * @param {Object} tx - Transacción de Prisma
 * @param {number|null} preRegistrationId - ID de la pre-inscripción
 * @param {string} email - Email del atleta
 * @param {string} identification - Documento del atleta
 */
const markPreRegistrationAsProcessed = async (tx, preRegistrationId, email, identification) => {
  if (preRegistrationId) {
    console.log('🔄 [ENROLLMENT] Marcando inscripción como Procesada, ID:', preRegistrationId);
    
    await tx.preRegistration.update({
      where: { id: preRegistrationId },
      data: { status: PRE_REGISTRATION_STATUS.PROCESSED },
    });
    
    console.log('✅ [ENROLLMENT] Inscripción marcada como Procesada');
    return;
  }

  // Buscar por email o documento
  console.log('⚠️ [ENROLLMENT] No hay preRegistrationId, buscando por email/documento...');
  
  let preRegistration = await tx.preRegistration.findFirst({
    where: {
      email: email,
      status: PRE_REGISTRATION_STATUS.PENDING
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!preRegistration) {
    preRegistration = await tx.preRegistration.findFirst({
      where: {
        identification: identification,
        status: PRE_REGISTRATION_STATUS.PENDING
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  if (preRegistration) {
    console.log('✅ [ENROLLMENT] Inscripción encontrada:', preRegistration.id);
    await tx.preRegistration.update({
      where: { id: preRegistration.id },
      data: { status: PRE_REGISTRATION_STATUS.PROCESSED },
    });
    console.log('✅ [ENROLLMENT] Inscripción marcada como Procesada');
  } else {
    console.log('⚠️ [ENROLLMENT] No se encontró inscripción pendiente');
  }
};

/**
 * Envía email de bienvenida al atleta
 * @param {Object} user - Datos del usuario
 * @param {string} tempPassword - Contraseña temporal
 */
const sendWelcomeEmail = async (user, tempPassword) => {
  try {
    const athleteInfo = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    };

    const credentials = {
      email: user.email,
      temporaryPassword: tempPassword
    };

    await emailService.sendAthleteWelcomeEmail(athleteInfo, credentials);
    console.log('✅ [ENROLLMENT] Email de bienvenida enviado');
  } catch (emailError) {
    console.error('❌ [ENROLLMENT] Error enviando email de bienvenida:', emailError);
    // No lanzar error, continuar con el proceso
  }
};

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

export const enrollmentsService = {
  /**
   * Crea una nueva matrícula con su atleta asociado
   * @param {Object} params - Parámetros de creación
   * @param {number|null} params.preRegistrationId - ID de pre-inscripción
   * @param {Object} params.athlete - Datos del atleta
   * @param {Object} params.enrollment - Datos de la matrícula
   * @returns {Promise<Object>} Resultado de la creación
   */
  async create({ preRegistrationId, athlete, enrollment }) {
    console.log('🔍 [ENROLLMENT] ========================================');
    console.log('🔍 [ENROLLMENT] INICIANDO CREACIÓN DE MATRÍCULA');
    console.log('🔍 [ENROLLMENT] preRegistrationId:', preRegistrationId, 'Tipo:', typeof preRegistrationId);
    console.log('🔍 [ENROLLMENT] ========================================');
    
    const result = await prisma.$transaction(async (tx) => {
      // 1. Normalizar campos del atleta
      const normalizedAthlete = normalizeAthleteFields(athlete);
      const cleanEmail = normalizeEmail(normalizedAthlete.email);
      const cleanIdentification = normalizedAthlete.identification?.trim();
      
      // 2. Validar que el documento no exista
      await validateUserDoesNotExist(tx, cleanIdentification);

      // 3. Calcular edad
      const age = calculateAge(new Date(normalizedAthlete.birthDate));
      console.log('📊 [ENROLLMENT] Edad calculada:', age, 'años');

      // 4. Validar y obtener acudiente
      const validatedGuardianId = await validateAndGetGuardian(
        tx, 
        age, 
        normalizedAthlete.guardianId
      );
      
      if (validatedGuardianId) {
        console.log('✅ [ENROLLMENT] Acudiente validado, ID:', validatedGuardianId);
      }

      // 5. Obtener o crear rol de atleta
      const athleteRole = await getOrCreateAthleteRole(tx);

      // 6. Crear usuario
      const { user: newUser, tempPassword } = await createUser(
        tx, 
        normalizedAthlete, 
        athleteRole.id, 
        age
      );
      console.log('✅ [ENROLLMENT] Usuario creado, ID:', newUser.id);

      // 7. Crear atleta
      const newAthlete = await createAthlete(
        tx,
        newUser.id,
        validatedGuardianId,
        normalizedAthlete.relationship
      );
      console.log('✅ [ENROLLMENT] Atleta creado, ID:', newAthlete.id);

      // 8. Crear matrícula (empieza en Pending_Payment)
      const newEnrollment = await createEnrollment(tx, newAthlete.id, enrollment);
      console.log('✅ [ENROLLMENT] Matrícula creada en Pending_Payment, ID:', newEnrollment.id);

      // 9. Generar obligación de pago inicial automáticamente (fuera de la tx para evitar deadlock)
      // Se ejecuta después de la transacción principal

      // 10. Enviar email de bienvenida
      await sendWelcomeEmail(newUser, tempPassword);

      // 11. Marcar pre-inscripción como procesada
      await markPreRegistrationAsProcessed(
        tx,
        preRegistrationId,
        cleanEmail,
        cleanIdentification
      );

      console.log('✅ [ENROLLMENT] Proceso completado exitosamente');

      return {
        athlete: newAthlete,
        enrollment: newEnrollment,
        temporaryPassword: process.env.NODE_ENV === 'development' ? tempPassword : undefined,
        emailSent: true
      };
    });

    // Generar la obligación de pago inicial FUERA de la transacción principal
    // para evitar deadlocks. Se ejecuta solo si la transacción fue exitosa.
    try {
      await paymentsService.generateInitialEnrollmentObligation(
        result.athlete.id,
        result.enrollment.id
      );
      console.log('✅ [ENROLLMENT] Obligación de pago inicial generada');
    } catch (paymentError) {
      // Log el error pero no falla el proceso de matrícula
      // La admin puede generar la obligación manualmente si es necesario
      console.error('⚠️ [ENROLLMENT] Error generando obligación inicial (no crítico):', paymentError.message);
    }

    return result;
  },

  async findAll(filters) {
    return await enrollmentsRepository.findAll(filters);
  },

  async findById(id) {
    const enrollment = await enrollmentsRepository.findById(id);
    if (!enrollment) {
      throw new Error("Matrícula no encontrada");
    }
    return enrollment;
  },

  async findByAthleteId(athleteId) {
    return await enrollmentsRepository.findByAthleteId(athleteId);
  },

  async update(id, data) {
    await this.findById(id);
    return await enrollmentsRepository.update(id, data);
  },

  async delete(id) {
    // Verificar que la matrícula existe
    const enrollment = await this.findById(id);
    
    // REGLA DE NEGOCIO: No se puede eliminar una matrícula reciente (menos de 1 año desde su creación)
    const now = new Date();
    const enrollmentDate = new Date(enrollment.fechaMatricula);
    const oneYearLater = new Date(enrollmentDate);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    
    if (now < oneYearLater) {
      const monthsRemaining = Math.ceil((oneYearLater - now) / (1000 * 60 * 60 * 24 * 30));
      throw new Error(
        `No se puede eliminar una matrícula reciente. ` +
        `Debe esperar ${monthsRemaining} mes(es) desde la fecha de matrícula (${enrollmentDate.toLocaleDateString('es-CO')}). ` +
        `Podrá eliminarla después del ${oneYearLater.toLocaleDateString('es-CO')}.`
      );
    }
    
    // REGLA DE NEGOCIO: No se puede eliminar una matrícula vigente
    if (enrollment.estado === 'Vigente') {
      throw new Error(
        'No se puede eliminar una matrícula vigente. ' +
        'Primero debe vencer o ser cancelada.'
      );
    }
    
    return await enrollmentsRepository.delete(id);
  },

  /**
   * Procesa matrículas vencidas (ejecutar diariamente con cron job)
   * @returns {Promise<Object>} Resultado del procesamiento
   */
  async processExpiredEnrollments() {
    return await prisma.$transaction(async (tx) => {
      const now = new Date();
      
      const expiredEnrollments = await tx.enrollment.findMany({
        where: {
          estado: ENROLLMENT_STATUS.ACTIVE,
          fechaVencimiento: { lte: now }
        },
        include: {
          athlete: {
            include: { user: true }
          }
        }
      });

      console.log(`🔍 [ENROLLMENT] Encontradas ${expiredEnrollments.length} matrículas vencidas`);

      const results = [];

      for (const enrollment of expiredEnrollments) {
        try {
          // SOLO cambiar matrícula a VENCIDA (simple)
          // NO cambiar estado del atleta - eso lo maneja el sistema de pagos dinámicamente
          await tx.enrollment.update({
            where: { id: enrollment.id },
            data: { estado: ENROLLMENT_STATUS.EXPIRED }
          });

          results.push({
            enrollmentId: enrollment.id,
            athleteId: enrollment.athleteId,
            athleteName: `${enrollment.athlete.user.firstName} ${enrollment.athlete.user.lastName}`,
            fechaVencimiento: enrollment.fechaVencimiento,
            status: 'processed'
          });
        } catch (error) {
          results.push({
            enrollmentId: enrollment.id,
            status: 'error',
            error: error.message
          });
        }
      }

      return {
        processed: results.filter(r => r.status === 'processed').length,
        errors: results.filter(r => r.status === 'error').length,
        details: results
      };
    });
  },

  /**
   * Renueva una matrícula vencida
   * @param {number} athleteId - ID del atleta
   * @param {Object} enrollmentData - Datos de la nueva matrícula
   * @returns {Promise<Object>} Matrícula renovada
   */
  async renewEnrollment(athleteId, enrollmentData = {}) {
    return await prisma.$transaction(async (tx) => {
      const athlete = await tx.athlete.findUnique({
        where: { id: parseInt(athleteId) },
        include: {
          user: true,
          enrollments: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      if (!athlete) {
        throw new Error('Deportista no encontrado');
      }

      const fechaInicio = enrollmentData.fechaInicio
        ? new Date(enrollmentData.fechaInicio)
        : new Date();
      
      const fechaVencimiento = calculateExpirationDate(fechaInicio);

      const newEnrollment = await tx.enrollment.create({
        data: {
          athleteId: parseInt(athleteId),
          fechaInicio: fechaInicio,
          fechaVencimiento: fechaVencimiento,
          fechaMatricula: fechaInicio,
          estado: ENROLLMENT_STATUS.ACTIVE,
          observaciones: enrollmentData.observaciones || 'Renovación de matrícula',
          comprobantePago: enrollmentData.comprobantePago || null
        }
      });

      await tx.athlete.update({
        where: { id: parseInt(athleteId) },
        data: {
          status: ATHLETE_STATUS.ACTIVE,
          inactivityReason: null
        }
      });

      console.log('✅ [ENROLLMENT] Matrícula renovada exitosamente');

      return {
        enrollment: newEnrollment,
        athlete: athlete
      };
    });
  },
};

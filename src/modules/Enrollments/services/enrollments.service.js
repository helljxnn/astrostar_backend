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
      "Pagos": {
        "Ver": true,
        "Crear": true
      },
      "Matriculas": {
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
  return await tx.enrollment.create({
    data: {
      athleteId: athleteId,
      estado: ENROLLMENT_STATUS.PENDING_PAYMENT, // Empieza en Pending_Payment
      observaciones: enrollmentData?.observaciones || null,
      // createdAt = cuándo se creó | fechaInicio/fechaVencimiento = cuando se apruebe pago inicial
      fechaInicio: null,
      fechaVencimiento: null,
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
    
    await tx.preRegistration.update({
      where: { id: preRegistrationId },
      data: { status: PRE_REGISTRATION_STATUS.PROCESSED },
    });
    
    return;
  }

  // Buscar por email o documento
  
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
    await tx.preRegistration.update({
      where: { id: preRegistration.id },
      data: { status: PRE_REGISTRATION_STATUS.PROCESSED },
    });
  } else {
  }
};

/**
 * Envía email de bienvenida al atleta (versión async no bloqueante)
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

    // Envío asíncrono sin await para no bloquear
    emailService.sendAthleteWelcomeEmail(athleteInfo, credentials)
      .catch(error => console.error('❌ [ENROLLMENT] Error enviando email:', error));
      
  } catch (emailError) {
    console.error('❌ [ENROLLMENT] Error preparando email de bienvenida:', emailError);
  }
};

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

export const enrollmentsService = {
  /**
   * Crea una nueva matrícula con su atleta asociado (VERSIÓN ULTRA-OPTIMIZADA)
   * @param {Object} params - Parámetros de creación
   * @param {number|null} params.preRegistrationId - ID de pre-inscripción
   * @param {Object} params.athlete - Datos del atleta
   * @param {Object} params.enrollment - Datos de la matrícula
   * @returns {Promise<Object>} Resultado de la creación
   */
  async create({ preRegistrationId, athlete, enrollment }) {
    
    const startTime = Date.now();
    
    // PASO 1: Preparar TODOS los datos fuera de la transacción
    const normalizedAthlete = normalizeAthleteFields(athlete);
    const cleanEmail = normalizeEmail(normalizedAthlete.email);
    const cleanIdentification = normalizedAthlete.identification?.trim();
    const age = calculateAge(new Date(normalizedAthlete.birthDate));
    

    // PASO 2: Validaciones críticas en paralelo (fuera de transacción)
    const [existingUser, athleteRole, guardian] = await Promise.all([
      // Verificar usuario existente
      prisma.user.findUnique({
        where: { identification: cleanIdentification },
        select: { id: true },
      }),
      
      // Obtener o crear rol de atleta
      prisma.role.findFirst({
        where: { name: ENROLLMENT_CONSTANTS.DEFAULT_ROLE_NAME },
        select: { id: true }
      }).then(async (role) => {
        if (role) return role;
        
        // Crear rol si no existe
        return await prisma.role.create({
          data: {
            name: ENROLLMENT_CONSTANTS.DEFAULT_ROLE_NAME,
            description: 'Rol de deportista',
            status: ATHLETE_STATUS.ACTIVE,
            permissions: {
              "Perfil": { "Ver": true, "Editar": true },
              "Pagos": { "Ver": true, "Crear": true },
              "Matriculas": { "Ver": true }
            }
          },
          select: { id: true }
        });
      }),
      
      // Validar acudiente si es necesario
      normalizedAthlete.guardianId ? prisma.guardian.findUnique({
        where: { id: parseInt(normalizedAthlete.guardianId) },
        select: { id: true },
      }) : Promise.resolve(null)
    ]);

    // Validaciones de negocio
    if (existingUser) {
      throw new Error("Ya existe un deportista con ese documento");
    }

    const validatedGuardianId = normalizedAthlete.guardianId ? parseInt(normalizedAthlete.guardianId) : null;
    
    if (validatedGuardianId && !guardian) {
      throw new Error("Acudiente no encontrado");
    }

    if (age < ENROLLMENT_CONSTANTS.ADULT_AGE && !validatedGuardianId) {
      throw new Error(`El acudiente es obligatorio para menores de ${ENROLLMENT_CONSTANTS.ADULT_AGE} años`);
    }

    // PASO 3: Preparar hash de contraseña fuera de transacción
    const bcrypt = await import('bcrypt');
    const tempPassword = cleanIdentification;
    const passwordHash = await bcrypt.default.hash(tempPassword, ENROLLMENT_CONSTANTS.BCRYPT_SALT_ROUNDS);


    // PASO 4: Transacción ULTRA-OPTIMIZADA (solo operaciones críticas)
    const transactionStart = Date.now();
    const result = await prisma.$transaction(async (tx) => {
      // Crear usuario (operación atómica)
      const newUser = await tx.user.create({
        data: {
          firstName: normalizedAthlete.firstName?.trim(),
          middleName: normalizedAthlete.middleName?.trim() || null,
          lastName: normalizedAthlete.lastName?.trim(),
          secondLastName: normalizedAthlete.secondLastName?.trim() || null,
          documentTypeId: parseInt(normalizedAthlete.documentTypeId),
          identification: cleanIdentification,
          email: cleanEmail,
          phoneNumber: normalizedAthlete.phoneNumber?.trim(),
          birthDate: new Date(normalizedAthlete.birthDate),
          age: age,
          address: normalizedAthlete.address?.trim() || ENROLLMENT_CONSTANTS.DEFAULT_ADDRESS,
          passwordHash: passwordHash,
          roleId: athleteRole.id,
          status: ATHLETE_STATUS.ACTIVE
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          identification: true
        }
      });

      // Crear atleta (operación atómica)
      const newAthlete = await tx.athlete.create({
        data: {
          userId: newUser.id,
          status: ATHLETE_STATUS.ACTIVE,
          inactivityReason: null,
          guardianId: validatedGuardianId,
          relationship: normalizedAthlete.relationship,
          currentInscriptionStatus: ATHLETE_STATUS.ACTIVE
        },
        select: {
          id: true,
          userId: true,
          status: true
        }
      });

      // Crear matrícula (operación atómica)
      const newEnrollment = await tx.enrollment.create({
        data: {
          athleteId: newAthlete.id,
          estado: ENROLLMENT_STATUS.PENDING_PAYMENT,
          observaciones: enrollment?.observaciones || null,
          fechaInicio: null,
          fechaVencimiento: null,
        },
        select: {
          id: true,
          athleteId: true,
          estado: true,
          createdAt: true
        }
      });

      // Marcar pre-inscripción como procesada (solo si existe ID)
      if (preRegistrationId) {
        await tx.preRegistration.update({
          where: { id: preRegistrationId },
          data: { status: PRE_REGISTRATION_STATUS.PROCESSED },
        });
      }

      return {
        athlete: { ...newAthlete, user: newUser },
        enrollment: newEnrollment,
        tempPassword: tempPassword,
        cleanEmail: cleanEmail,
        cleanIdentification: cleanIdentification,
        categoria: normalizedAthlete.categoria
      };
    }, {
      timeout: 15000, // 15 segundos de timeout
      isolationLevel: 'ReadCommitted' // Nivel de aislamiento más eficiente
    });


    // OPERACIONES POST-TRANSACCIÓN (ejecutar en background sin await)
    
    // 1. Crear inscripción con categoría
    if (result.categoria) {
      setImmediate(async () => {
        try {
          const sportsCategory = await prisma.sportsCategory.findFirst({
            where: { nombre: { equals: result.categoria, mode: "insensitive" } },
            select: { id: true, nombre: true }
          });

          if (sportsCategory) {
            await prisma.inscription.create({
              data: {
                athleteId: result.athlete.id,
                sportsCategoryId: sportsCategory.id,
                type: "initial_inscription",
                status: "Active",
                inscriptionDate: new Date(),
                conceptDate: new Date(),
                expirationDate: calculateExpirationDate(new Date()),
                concept: `Inscripción inicial en categoría ${sportsCategory.nombre}`,
              },
            });
          }
        } catch (error) {
          console.error('⚠️ [ENROLLMENT] Error creando inscripción:', error.message);
        }
      });
    }

    // 2. Enviar email de bienvenida
    setImmediate(async () => {
      try {
        const athleteInfo = {
          email: result.athlete.user.email,
          firstName: result.athlete.user.firstName,
          lastName: result.athlete.user.lastName
        };

        const credentials = {
          email: result.athlete.user.email,
          temporaryPassword: result.tempPassword
        };

        await emailService.sendAthleteWelcomeEmail(athleteInfo, credentials);
      } catch (emailError) {
        console.error('❌ [ENROLLMENT] Error enviando email:', emailError.message);
      }
    });

    // 3. Procesar pre-inscripción por datos
    if (!preRegistrationId) {
      setImmediate(async () => {
        try {
          await this.processPreRegistrationByData(result.cleanEmail, result.cleanIdentification);
        } catch (error) {
          console.error('⚠️ [ENROLLMENT] Error procesando pre-inscripción:', error.message);
        }
      });
    }

    // 4. Generar obligación de pago inicial
    setImmediate(async () => {
      try {
        await prisma.paymentObligation.create({
          data: {
            athleteId: result.athlete.id,
            type: 'ENROLLMENT_INITIAL',
            period: null,
            baseAmount: 40000,
            dueStart: new Date(),
            dueEnd: new Date(Date.now() + (5 * 24 * 60 * 60 * 1000)),
            metadata: { enrollmentId: result.enrollment.id }
          }
        });
      } catch (paymentError) {
        console.error('⚠️ [ENROLLMENT] Error generando obligación:', paymentError.message);
      }
    });

    const totalTime = Date.now() - startTime;

    // Retornar resultado inmediatamente
    return {
      athlete: result.athlete,
      enrollment: result.enrollment,
      temporaryPassword: process.env.NODE_ENV === 'development' ? result.tempPassword : undefined,
      emailSent: true,
      performanceMs: totalTime
    };
  },

  /**
   * Procesa pre-inscripción por email o documento (método auxiliar)
   */
  async processPreRegistrationByData(email, identification) {
    try {
      let preRegistration = await prisma.preRegistration.findFirst({
        where: {
          email: email,
          status: PRE_REGISTRATION_STATUS.PENDING
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!preRegistration) {
        preRegistration = await prisma.preRegistration.findFirst({
          where: {
            identification: identification,
            status: PRE_REGISTRATION_STATUS.PENDING
          },
          orderBy: { createdAt: 'desc' }
        });
      }

      if (preRegistration) {
        await prisma.preRegistration.update({
          where: { id: preRegistration.id },
          data: { status: PRE_REGISTRATION_STATUS.PROCESSED },
        });
      }
    } catch (error) {
      console.error('❌ [ENROLLMENT] Error procesando pre-inscripción por datos:', error);
    }
  },

  async findAll(filters) {
    await enrollmentsRepository.normalizeStatuses();
    const rawSearch = String(filters?.search ?? "").trim();
    const searchLower = rawSearch.toLowerCase();

    const parseSearchDate = (value) => {
      const isoMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (isoMatch) {
        const [, y, m, d] = isoMatch;
        return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      }
      const dmyMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (dmyMatch) {
        const [, d, m, y] = dmyMatch;
        return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      }
      return null;
    };

    let searchEstado = null;
    if (searchLower.includes('pendiente') && searchLower.includes('pago')) {
      searchEstado = 'Pending_Payment';
    } else if (searchLower.includes('vigente')) {
      searchEstado = 'Vigente';
    } else if (searchLower.includes('vencida') || searchLower.includes('vencido')) {
      searchEstado = 'Vencida';
    }

    const searchNoActivation =
      searchLower.includes('no activada') ||
      searchLower.includes('no activado') ||
      searchLower.includes('pendiente de activacion');

    const searchDate = parseSearchDate(rawSearch);
    let searchDateRange = null;
    if (searchDate && !Number.isNaN(searchDate.getTime())) {
      const from = new Date(searchDate);
      from.setHours(0, 0, 0, 0);
      const to = new Date(searchDate);
      to.setHours(23, 59, 59, 999);
      searchDateRange = { from, to };
    }
    const normalizeDate = (value, isEnd = false) => {
      if (!value) return undefined;
      let date;
      if (value instanceof Date) {
        date = new Date(value);
      } else if (typeof value === 'string' && value.includes('/')) {
        const parts = value.split('/');
        if (parts.length === 3) {
          const [d, m, y] = parts.map(p => parseInt(p, 10));
          date = new Date(y, (m || 1) - 1, d || 1);
        } else {
          date = new Date(value);
        }
      } else {
        date = new Date(value);
      }
      if (Number.isNaN(date.getTime())) return undefined;
      if (isEnd) {
        date.setHours(23, 59, 59, 999);
      } else {
        date.setHours(0, 0, 0, 0);
      }
      return date;
    };

    const normalizedDateFrom = normalizeDate(filters?.dateFrom, false);
    const normalizedDateTo = normalizeDate(filters?.dateTo, true);

    let vencimientoRange = null;
    if (filters?.vencimiento === 'expiring') {
      const now = new Date();
      const from = new Date(now);
      from.setHours(0, 0, 0, 0);
      const to = new Date(now);
      to.setDate(to.getDate() + 30);
      to.setHours(23, 59, 59, 999);
      vencimientoRange = { from, to };
    }

    // 🚨 FORZAR showAll=false para mostrar solo la matrícula más reciente por deportista
    // Esto activa el DISTINCT ON en el repository
    const enhancedFilters = {
      ...filters,
      searchText: rawSearch,
      searchEstado,
      searchNoActivation,
      searchDateRange,
      dateFrom: normalizedDateFrom,
      dateTo: normalizedDateTo,
      vencimientoRange,
      showAll: false // SIEMPRE mostrar solo la más reciente por deportista
    };
    
    
    return await enrollmentsRepository.findAll(enhancedFilters);
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
    // ❌ PROTECCIÓN: Las matrículas no pueden eliminarse para mantener historial
    throw new Error(
      'Operación no permitida: Las matrículas no pueden eliminarse. ' +
      'Solo pueden cambiar de estado: Vigente, Vencida, Pending_Payment.'
    );
  },

  /**
   * Procesa matrículas vencidas (ejecutar diariamente con cron job)
   * 
   * FLUJO AUTOMÁTICO DE RENOVACIÓN:
   * 1. Detecta matrículas con fechaVencimiento <= hoy
   * 2. Cambia estado de 'Vigente' → 'Vencida'
   * 3. El CRON genera automáticamente obligación ENROLLMENT_RENEWAL
   * 4. Deportista ve obligación en "Mis Pagos" y sube comprobante
   * 5. Admin aprueba pago → Sistema crea nueva matrícula vigente
   * 
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


      const results = [];

      for (const enrollment of expiredEnrollments) {
        try {
          // Marcar matrícula como VENCIDA
          // NOTA: NO cambiar estado del atleta - eso lo maneja el sistema de pagos dinámicamente
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
          console.error(`❌ [ENROLLMENT] Error procesando matrícula ${enrollment.id}:`, error.message);
          results.push({
            enrollmentId: enrollment.id,
            status: 'error',
            error: error.message
          });
        }
      }

      const processed = results.filter(r => r.status === 'processed').length;
      const errors = results.filter(r => r.status === 'error').length;


      return {
        processed,
        errors,
        details: results
      };
    });
  },

  /**
   * Activa una matrícula cuando se aprueba el pago inicial
   * @param {number} enrollmentId - ID de la matrícula
   * @returns {Promise<Object>} Matrícula activada
   */
  async activateEnrollment(enrollmentId) {
    return await prisma.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.findUnique({
        where: { id: parseInt(enrollmentId) },
        include: {
          athlete: {
            include: { user: true }
          }
        }
      });

      if (!enrollment) {
        throw new Error('Matrícula no encontrada');
      }

      if (enrollment.estado !== ENROLLMENT_STATUS.PENDING_PAYMENT) {
        throw new Error('La matrícula no está pendiente de pago');
      }

      const fechaInicio = new Date();
      const fechaVencimiento = calculateExpirationDate(fechaInicio);

      const activatedEnrollment = await tx.enrollment.update({
        where: { id: parseInt(enrollmentId) },
        data: {
          estado: ENROLLMENT_STATUS.ACTIVE,
          fechaInicio: fechaInicio,
          fechaVencimiento: fechaVencimiento,
        }
      });

      // Actualizar estado del atleta
      await tx.athlete.update({
        where: { id: enrollment.athleteId },
        data: {
          status: ATHLETE_STATUS.ACTIVE,
          inactivityReason: null
        }
      });


      return {
        enrollment: activatedEnrollment,
        athlete: enrollment.athlete
      };
    });
  },

  // NOTA: La función renewEnrollment ha sido eliminada por seguridad
  // La renovación se maneja automáticamente a través del sistema de pagos:
  // 1. CRON detecta vencimiento y genera obligación ENROLLMENT_RENEWAL
  // 2. Deportista paga y admin aprueba
  // 3. Sistema automáticamente crea nueva matrícula vigente
  // Ver: src/modules/Payments/services/payments.service.js -> _processEnrollmentRenewal()

  /**
   * Obtener todas las matrículas para reporte (SIN PAGINACIÓN)
   */
  async findAllForReport(filters) {
    const data = await enrollmentsRepository.findAllForReport(filters);
    return {
      success: true,
      data,
      message: `Se encontraron ${data.length} matrículas para el reporte.`,
    };
  },
  /**
   * Obtener historial completo de matrículas de un deportista específico
   * Retorna TODAS las matrículas ordenadas cronológicamente (más antigua primero)
   * con estados corregidos automáticamente
   *
   * @param {number} athleteId - ID del deportista
   * @returns {Promise<Object>} Historial de matrículas
   */
  async getAthleteEnrollmentHistory(athleteId) {
    try {

      // Obtener TODAS las matrículas del deportista
      const enrollments = await prisma.enrollment.findMany({
        where: { athleteId: parseInt(athleteId) },
        orderBy: { createdAt: 'asc' }, // Cronológico: más antigua primero
        include: {
          athlete: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  secondLastName: true,
                  identification: true,
                  email: true,
                  phoneNumber: true,
                  birthDate: true,
                  age: true
                }
              },
              guardian: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  identification: true,
                  email: true,
                  phone: true
                }
              }
            }
          }
        }
      });

      if (enrollments.length === 0) {
        return {
          success: true,
          data: [],
          message: 'No se encontraron matrículas para este deportista.',
          athleteInfo: null
        };
      }

      // Procesar estados correctamente para el historial
      const processedEnrollments = enrollments.map((enrollment, index) => {
        const isLatest = index === enrollments.length - 1; // La última (más reciente)

        // Lógica de estados para historial cronológico:
        let correctedStatus = enrollment.estado;
        let statusNote = null;

        // Si hay múltiples matrículas y esta no es la más reciente
        if (enrollments.length > 1 && !isLatest) {
          // Las matrículas anteriores deberían estar "Vencidas"
          if (enrollment.estado === ENROLLMENT_STATUS.ACTIVE) {
            correctedStatus = ENROLLMENT_STATUS.EXPIRED;
            statusNote = 'Estado corregido automáticamente para historial';
          }
        }

        // Agregar información de posición en el historial
        const enrollmentNumber = index + 1;
        const isRenewal = index > 0;

        return {
          ...enrollment,
          estado: correctedStatus,
          statusNote,
          enrollmentNumber,
          isRenewal,
          isLatest,
          // Agregar fecha de matrícula para compatibilidad
          fechaMatricula: enrollment.createdAt,
          // Agregar nombre completo del deportista
          nombreCompleto: [
            enrollment.athlete.user.firstName,
            enrollment.athlete.user.middleName,
            enrollment.athlete.user.lastName,
            enrollment.athlete.user.secondLastName
          ].filter(Boolean).join(' ')
        };
      });

      // Información del deportista (usar la primera matrícula como referencia)
      const athleteInfo = {
        id: enrollments[0].athlete.id,
        nombreCompleto: processedEnrollments[0].nombreCompleto,
        identification: enrollments[0].athlete.user.identification,
        email: enrollments[0].athlete.user.email,
        phoneNumber: enrollments[0].athlete.user.phoneNumber,
        age: enrollments[0].athlete.user.age,
        totalEnrollments: enrollments.length,
        hasRenewals: enrollments.length > 1,
        guardian: enrollments[0].athlete.guardian
      };


      return {
        success: true,
        data: processedEnrollments,
        athleteInfo,
        message: `Historial de ${enrollments.length} matrícula(s) obtenido exitosamente.`
      };

    } catch (error) {
      console.error('❌ [ENROLLMENT HISTORY] Error:', error);
      throw new Error(`Error obteniendo historial de matrículas: ${error.message}`);
    }
  },
};




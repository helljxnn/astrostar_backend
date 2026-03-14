import { paymentsRepository } from "../repository/payments.repository.js";
import { paymentSettingsRepository } from "../repository/paymentSettings.repository.js";
import prisma from "../../../config/database.js";

// ============================================================================
// CONSTANTES FIJAS DEL NEGOCIO (según especificaciones del cliente)
// ============================================================================
const BUSINESS_CONSTANTS = {
  LATE_FEE_DAILY: 2000,        // Mora diaria FIJA: 2,000 pesos (ACTUALIZADO)
  MAX_LATE_DAYS_MONTHLY: 15,   // Días máximos FIJOS: 15 días
  GRACE_DAYS: 5,               // Días de gracia FIJOS: del 1 al 5 de cada mes
  MAX_LATE_DAYS_CAP: 90,       // Límite máximo para cálculo de mora (90 días)
};

// ============================================================================
// CACHE DE CONFIGURACIÓN (Solo para valores variables)
// ============================================================================
let cachedSettings = null;
let cacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Obtener configuración de pagos con cache inteligente
 */
const getPaymentSettings = async () => {
  const now = Date.now();
  
  // Si no hay cache o expiró, recargar
  if (!cachedSettings || !cacheTimestamp || (now - cacheTimestamp) > CACHE_TTL) {
    cachedSettings = await paymentSettingsRepository.getSettings();
    cacheTimestamp = now;
    
    // Si no existe configuración, crear una por defecto
    if (!cachedSettings) {
      cachedSettings = await paymentSettingsRepository.createInitialSettings();
    }
  }
  
  return cachedSettings;
};

/**
 * Invalidar cache cuando admin actualiza configuración
 */
const invalidateSettingsCache = () => {
  cachedSettings = null;
  cacheTimestamp = null;
};

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Calcula los días de mora
 */
const calculateLateDays = (dueEnd) => {
  const now = new Date();
  const due = new Date(dueEnd);
  
  if (now <= due) return 0;
  
  const diffTime = now - due;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Calcula la mora total usando la tarifa diaria de la configuración
 * ✅ REGLA SIMPLE: No calcular mora si atleta inactivo o matrícula vencida
 * @param {number} lateDays - Días de mora
 * @param {number} [lateFeeDailyAmount] - Tarifa diaria (lee de BD). Fallback: constante.
 * @param {Object} [athlete] - Datos del atleta (opcional, para validar estado)
 * @param {Object} [enrollment] - Datos de matrícula (opcional, para validar estado)
 */
const calculateLateFee = (lateDays, lateFeeDailyAmount = BUSINESS_CONSTANTS.LATE_FEE_DAILY, athlete = null, enrollment = null) => {
  if (lateDays <= 0) return 0;
  
  // ✅ REGLA CRÍTICA: No calcular mora si atleta inactivo
  if (athlete && athlete.status !== 'Active') {
    return 0;
  }
  
  // ✅ REGLA CRÍTICA: No calcular mora si matrícula vencida
  if (enrollment && enrollment.estado !== 'Vigente') {
    return 0;
  }
  
  // Aplicar límite máximo de días para mora
  const cappedLateDays = Math.min(lateDays, BUSINESS_CONSTANTS.MAX_LATE_DAYS_CAP);
  
  return cappedLateDays * lateFeeDailyAmount;
};

/**
 * Genera el periodo actual (YYYY-MM)
 */
const getCurrentPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Calcula fechas de vencimiento para mensualidad usando días de gracia fijos
 */
const calculateMonthlyDueDates = async (year, month) => {
  const dueStart = new Date(year, month - 1, 1); // Día 1 del mes
  const dueEnd = new Date(year, month - 1, BUSINESS_CONSTANTS.GRACE_DAYS); // Día 5 fijo
  
  return { dueStart, dueEnd };
};

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

export const paymentsService = {
  // ============================================================================
  // GENERACIÓN AUTOMÁTICA DE OBLIGACIONES
  // ============================================================================

  /**
   * Generar mensualidades automáticamente (CRON - día 1 de cada mes)
   */
  async generateMonthlyObligations() {
    const now = new Date();
    const currentPeriod = getCurrentPeriod();
    const { dueStart, dueEnd } = await calculateMonthlyDueDates(now.getFullYear(), now.getMonth() + 1);
    const settings = await getPaymentSettings();

    console.log(`🔄 [PAYMENTS] Generando mensualidades para periodo: ${currentPeriod}`);

    return await prisma.$transaction(async (tx) => {
      // Buscar atletas activos, NO becados, con matrícula vigente Y activa
      const activeAthletes = await tx.athlete.findMany({
        where: {
          status: 'Active',
          isScholarship: false,
          enrollments: {
            some: {
              estado: 'Vigente',
              fechaVencimiento: { gt: now },
              fechaInicio: { lte: now }  // Validar que matrícula ya inició
            }
          }
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              identification: true
            }
          }
        }
      });

      console.log(`📊 [PAYMENTS] Encontrados ${activeAthletes.length} atletas activos`);

      const results = [];

      for (const athlete of activeAthletes) {
        try {
          // Validación adicional de integridad de matrícula
          const enrollment = await tx.enrollment.findFirst({
            where: {
              athleteId: athlete.id,
              estado: 'Vigente',
              fechaVencimiento: { gt: now },
              fechaInicio: { lte: now }
            },
            orderBy: { createdAt: 'desc' }
          });
          
          if (!enrollment) {
            results.push({
              athleteId: athlete.id,
              athleteName: `${athlete.user.firstName} ${athlete.user.lastName}`,
              status: 'skipped',
              reason: 'No tiene matrícula vigente y activa'
            });
            continue;
          }
          
          // Validar consistencia de fechas
          if (enrollment.fechaInicio > enrollment.fechaVencimiento) {
            console.warn(`⚠️ [PAYMENTS] Matrícula inconsistente para atleta ${athlete.id}: fechaInicio > fechaVencimiento`);
            results.push({
              athleteId: athlete.id,
              athleteName: `${athlete.user.firstName} ${athlete.user.lastName}`,
              status: 'error',
              reason: 'Matrícula con fechas inconsistentes'
            });
            continue;
          }
          
          // Verificar si ya existe obligación para este periodo
          const existing = await paymentsRepository.findExistingObligation(
            athlete.id,
            'MONTHLY',
            currentPeriod
          );

          if (existing) {
            results.push({
              athleteId: athlete.id,
              athleteName: `${athlete.user.firstName} ${athlete.user.lastName}`,
              status: 'skipped',
              reason: 'Ya existe obligación para este periodo'
            });
            continue;
          }

          // Crear nueva obligación mensual con configuración dinámica
          await tx.paymentObligation.create({
            data: {
              athleteId: athlete.id,
              type: 'MONTHLY',
              period: currentPeriod,
              baseAmount: settings.monthlyAmount, // ✅ Variable - se congela
              dueStart,
              dueEnd
            }
          });

          results.push({
            athleteId: athlete.id,
            athleteName: `${athlete.user.firstName} ${athlete.user.lastName}`,
            status: 'created',
            period: currentPeriod,
            amount: settings.monthlyAmount // ✅ Dinámico
          });

        } catch (error) {
          results.push({
            athleteId: athlete.id,
            status: 'error',
            error: error.message
          });
        }
      }

      const created = results.filter(r => r.status === 'created').length;
      const skipped = results.filter(r => r.status === 'skipped').length;
      const errors = results.filter(r => r.status === 'error').length;

      console.log(`✅ [PAYMENTS] Mensualidades generadas: ${created}, omitidas: ${skipped}, errores: ${errors}`);

      return {
        period: currentPeriod,
        created,
        skipped,
        errors,
        details: results
      };
    });
  },

  /**
   * Generar obligación de renovación de matrícula
   */
  async generateEnrollmentRenewalObligation(athleteId) {
    const settings = await getPaymentSettings();
    const now = new Date();
    const dueEnd = new Date(now.getTime() + (BUSINESS_CONSTANTS.GRACE_DAYS * 24 * 60 * 60 * 1000));

    // Verificar si ya existe obligación de renovación pendiente
    const existing = await paymentsRepository.findExistingObligation(
      athleteId,
      'ENROLLMENT_RENEWAL'
    );

    if (existing) {
      throw new Error('Ya existe una obligación de renovación de matrícula pendiente');
    }

    return await paymentsRepository.createObligation({
      athleteId,
      type: 'ENROLLMENT_RENEWAL',
      period: null,
      baseAmount: settings.enrollmentAmount,
      dueStart: now,
      dueEnd
    });
  },

  /**
   * Generar obligación de pago inicial de matrícula (nueva matrícula)
   * Se llama cuando la admin crea la matrícula. La matrícula empieza en Pending_Payment.
   */
  async generateInitialEnrollmentObligation(athleteId, enrollmentId) {
    const settings = await getPaymentSettings();
    const now = new Date();
    const dueEnd = new Date(now.getTime() + (BUSINESS_CONSTANTS.GRACE_DAYS * 24 * 60 * 60 * 1000));

    // Verificar que no exista ya una obligación inicial pendiente
    const existing = await paymentsRepository.findExistingObligation(
      athleteId,
      'ENROLLMENT_INITIAL'
    );

    if (existing) {
      throw new Error('Ya existe una obligación de pago inicial de matrícula pendiente');
    }

    return await paymentsRepository.createObligation({
      athleteId,
      type: 'ENROLLMENT_INITIAL',
      period: null,
      baseAmount: settings.enrollmentAmount,
      dueStart: now,
      dueEnd,
      metadata: enrollmentId ? { enrollmentId } : undefined
    });
  },

  // ============================================================================
  // CONSULTA DE ESTADO FINANCIERO
  // ============================================================================

  /**
   * Obtener estado financiero completo de un atleta (MEJORADO)
   * Incluye TODAS las obligaciones pendientes, no solo la actual
   */
  async getAthleteFinancialStatus(athleteId) {
    const now = new Date();
    const currentMonth = getCurrentPeriod();
    const settings = await getPaymentSettings();

    // ✅ Obtener datos del atleta y matrícula para validar estado
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      select: { status: true }
    });

    const enrollment = await prisma.enrollment.findFirst({
      where: { athleteId },
      orderBy: { createdAt: 'desc' },
      select: { estado: true, fechaVencimiento: true }
    });

    // Buscar TODAS las obligaciones sin pago aprobado
    const pendingObligations = await paymentsRepository.getAllPendingObligations(athleteId);
    
    // Separar por tipo
    const monthlyObligations = pendingObligations.filter(o => o.type === 'MONTHLY');
    const enrollmentObligation = pendingObligations.find(
      o => o.type === 'ENROLLMENT_RENEWAL' || o.type === 'ENROLLMENT_INITIAL'
    );
    
    // Calcular deuda total mensual
    let totalMonthlyDebt = 0;
    let totalLateFee = 0;
    let maxDaysLate = 0;
    
    const monthlyDetails = [];
    
    for (const obligation of monthlyObligations) {
      const daysLate = calculateLateDays(obligation.dueEnd);
      // ✅ Pasar atleta y enrollment para validar estado
      const lateFee = calculateLateFee(daysLate, settings.lateFeeDailyAmount, athlete, enrollment);
      
      totalMonthlyDebt += obligation.baseAmount;
      totalLateFee += lateFee;
      maxDaysLate = Math.max(maxDaysLate, daysLate);
      
      monthlyDetails.push({
        id: obligation.id,
        period: obligation.period,
        baseAmount: obligation.baseAmount,
        daysLate,
        lateFee,
        totalToPay: obligation.baseAmount + lateFee,
        paymentStatus: this.getLatestPaymentStatus(obligation.payments),
        dueStart: obligation.dueStart,
        dueEnd: obligation.dueEnd
      });
    }

    // Buscar mensualidad actual específicamente
    const currentMonthObligation = monthlyDetails.find(m => m.period === currentMonth);

    return {
      // Mensualidad actual (para compatibilidad)
      currentMonth: currentMonthObligation || null,
      
      // NUEVO: Todas las mensualidades pendientes
      allMonthlyDebts: monthlyDetails,
      
      // NUEVO: Resumen total
      totalDebt: {
        monthlyAmount: totalMonthlyDebt,
        lateFeeAmount: totalLateFee,
        totalAmount: totalMonthlyDebt + totalLateFee,
        maxDaysLate,
        obligationsCount: monthlyObligations.length
      },
      
      // Estado de matrícula (inicial o renovación)
      enrollment: enrollmentObligation ? {
        needsRenewal: enrollmentObligation.type === 'ENROLLMENT_RENEWAL', // ✅ Solo true para renovaciones
        isInitial: enrollmentObligation.type === 'ENROLLMENT_INITIAL',    // ✅ Nuevo campo
        type: enrollmentObligation.type,                                  // ✅ Tipo explícito
        amount: enrollmentObligation.baseAmount,
        obligationId: enrollmentObligation.id,
        dueDate: enrollmentObligation.dueEnd,
        paymentStatus: this.getLatestPaymentStatus(enrollmentObligation.payments),
        // NUEVO: Estado actual de la matrícula
        estado: currentEnrollment?.estado || null,
        fechaInicio: currentEnrollment?.fechaInicio || null,
        fechaVencimiento: currentEnrollment?.fechaVencimiento || null
      } : {
        needsRenewal: false,
        isInitial: false,
        // NUEVO: Estado actual de la matrícula (incluso si no hay obligaciones)
        estado: currentEnrollment?.estado || null,
        fechaInicio: currentEnrollment?.fechaInicio || null,
        fechaVencimiento: currentEnrollment?.fechaVencimiento || null
      }
    };
  },

  /**
   * Obtener el estado del último pago de una obligación
   */
  getLatestPaymentStatus(payments) {
    if (!payments || payments.length === 0) return null;
    
    // Buscar pago aprobado
    const approved = payments.find(p => p.status === 'APPROVED');
    if (approved) return 'APPROVED';
    
    // Buscar pago pendiente más reciente
    const pending = payments
      .filter(p => p.status === 'PENDING')
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
    if (pending) return 'PENDING';
    
    // Buscar pago rechazado más reciente
    const rejected = payments
      .filter(p => p.status === 'REJECTED')
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
    if (rejected) return 'REJECTED';
    
    return null;
  },


  // ============================================================================
  // GESTIÓN DE COMPROBANTES
  // ============================================================================

  /**
   * Subir comprobante de pago (MEJORADO - Evita duplicados PENDING)
   */
  async uploadPaymentReceipt(obligationId, athleteId, receiptData) {
    return await prisma.$transaction(async (tx) => {
      // Verificar que la obligación existe y pertenece al atleta
      const obligation = await tx.paymentObligation.findFirst({
        where: {
          id: obligationId,
          athleteId
        }
      });

      if (!obligation) {
        throw new Error('Obligación de pago no encontrada');
      }

      // Verificar si ya hay un pago aprobado
      const approvedPayment = await tx.payment.findFirst({
        where: {
          obligationId,
          status: 'APPROVED'
        }
      });

      if (approvedPayment) {
        throw new Error('Esta obligación ya tiene un pago aprobado');
      }

      // NUEVO: Verificar si ya hay un pago PENDING
      const pendingPayment = await tx.payment.findFirst({
        where: {
          obligationId,
          status: 'PENDING'
        }
      });

      if (pendingPayment) {
        throw new Error('Ya tienes un comprobante pendiente de revisión. Espera la respuesta del administrador antes de subir otro.');
      }

      return await paymentsRepository.createPayment({
        obligationId,
        athleteId,
        receiptUrl: receiptData.url,
        receiptName: receiptData.originalName,
        status: 'PENDING'
      });
    });
  },

  /**
   * Obtener pago por ID
   */
  async getPaymentById(paymentId) {
    return await paymentsRepository.getPaymentById(paymentId);
  },
  /**
   * Obtener pago por ID
   */
  async getPaymentById(paymentId) {
    return await paymentsRepository.getPaymentById(paymentId);
  },

  /**
   * Aprobar pago (MEJORADO - Con transacción y control de concurrencia)
   */
  async approvePayment(paymentId, reviewedBy) {
    return await prisma.$transaction(async (tx) => {
      // Verificar estado actual del pago (control de concurrencia)
      const currentPayment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { obligation: true }
      });

      if (!currentPayment) {
        throw new Error('Pago no encontrado');
      }

      if (currentPayment.status !== 'PENDING') {
        throw new Error(`El pago ya fue ${currentPayment.status.toLowerCase()}. No se puede aprobar.`);
      }

      // Actualizar estado del pago
      const payment = await paymentsRepository.updatePaymentStatus(
        paymentId,
        'APPROVED',
        reviewedBy
      );

      // Manejar lógica post-aprobación según tipo de obligación
      if (currentPayment.obligation.type === 'ENROLLMENT_INITIAL') {
        // Pago inicial: activar la matrícula que estaba en Pending_Payment
        await this._processInitialEnrollmentPayment(currentPayment.athleteId);
      } else if (currentPayment.obligation.type === 'ENROLLMENT_RENEWAL') {
        // Renovación: crear nueva matrícula por 1 año
        await this._processEnrollmentRenewal(currentPayment.athleteId);
      }

      return payment;
    });
  },

  /**
   * Rechazar pago (MEJORADO - Con transacción y control de concurrencia)
   */
  async rejectPayment(paymentId, reviewedBy, rejectionReason) {
    return await prisma.$transaction(async (tx) => {
      // Verificar estado actual del pago (control de concurrencia)
      const currentPayment = await tx.payment.findUnique({
        where: { id: paymentId }
      });

      if (!currentPayment) {
        throw new Error('Pago no encontrado');
      }

      if (currentPayment.status !== 'PENDING') {
        throw new Error(`El pago ya fue ${currentPayment.status.toLowerCase()}. No se puede rechazar.`);
      }

      return await paymentsRepository.updatePaymentStatus(
        paymentId,
        'REJECTED',
        reviewedBy,
        rejectionReason
      );
    });
  },

  // ============================================================================
  // VALIDACIÓN DE ACCESO (MIDDLEWARE)
  // ============================================================================

  /**
   * Verificar si un atleta está bloqueado por pagos
   */
  async checkAthleteAccessRestrictions(athleteId) {
    const overdueObligations = await paymentsRepository.getOverdueObligations(athleteId);
    const settings = await getPaymentSettings();
    
    if (overdueObligations.length === 0) {
      return { restricted: false };
    }

    // Verificar bloqueo por mensualidad
    const monthlyOverdue = overdueObligations.find(o => o.type === 'MONTHLY');
    if (monthlyOverdue) {
      const lateDays = calculateLateDays(monthlyOverdue.dueEnd);
      if (lateDays > BUSINESS_CONSTANTS.MAX_LATE_DAYS_MONTHLY) { // ✅ Constante fija
        return {
          restricted: true,
          reason: 'MONTHLY_OVERDUE',
          message: `Tu cuenta está bloqueada por mora en mensualidad. Días de retraso: ${lateDays}`,
          lateDays
        };
      }
    }

    // Verificar bloqueo por matrícula (inicial o renovación pendiente)
    const enrollmentOverdue = overdueObligations.find(
      o => o.type === 'ENROLLMENT_RENEWAL' || o.type === 'ENROLLMENT_INITIAL'
    );
    if (enrollmentOverdue) {
      const isInitial = enrollmentOverdue.type === 'ENROLLMENT_INITIAL';
      return {
        restricted: true,
        reason: isInitial ? 'ENROLLMENT_INITIAL_PENDING' : 'ENROLLMENT_PENDING',
        message: isInitial
          ? 'Tu matrícula está pendiente de pago inicial'
          : 'Tu matrícula anual está pendiente de renovación',
        obligation: enrollmentOverdue
      };
    }

    return { restricted: false };
  },

  // ============================================================================
  // GESTIÓN DE PAGOS (ADMIN)
  // ============================================================================

  /**
   * Obtener pagos pendientes de aprobación
   */
  async getPendingPayments(filters = {}) {
    try {
      const { page = 1, limit = 20, type, search } = filters;
      const offset = (page - 1) * limit;

      const whereClause = {
        status: 'PENDING'
      };

      // Filtro por tipo de obligación
      if (type) {
        whereClause.obligation = {
          type: type
        };
      }

      // Filtro por búsqueda (nombre o identificación del atleta)
      if (search) {
        whereClause.athlete = {
          user: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { identification: { contains: search, mode: 'insensitive' } }
            ]
          }
        };
      }

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where: whereClause,
          include: {
            athlete: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    identification: true,
                    email: true
                  }
                }
              }
            },
            obligation: {
              select: {
                id: true,
                type: true,
                period: true,
                baseAmount: true,
                dueStart: true,
                dueEnd: true
              }
            }
          },
          orderBy: {
            uploadedAt: 'desc'
          },
          skip: offset,
          take: limit
        }),
        prisma.payment.count({
          where: whereClause
        })
      ]);

      return {
        payments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ Error obteniendo pagos pendientes:', error);
      throw new Error('Error al obtener pagos pendientes');
    }
  },

  /**
   * Obtener todos los pagos con filtros
   */
  async getAllPayments(filters = {}) {
    try {
      const { page = 1, limit = 20, status, type, dateFrom, dateTo, excludeStatus, search } = filters;
      const offset = (page - 1) * limit;

      const whereClause = {};

      // Filtro por estado (incluir o excluir)
      if (status) {
        whereClause.status = status;
      } else if (excludeStatus) {
        // Para el historial: excluir PENDING
        whereClause.status = {
          not: excludeStatus
        };
      }

      // Filtro por tipo de obligación
      if (type) {
        whereClause.obligation = {
          type: type
        };
      }

      // Filtro por búsqueda (nombre o identificación del atleta)
      if (search) {
        whereClause.athlete = {
          user: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { identification: { contains: search, mode: 'insensitive' } }
            ]
          }
        };
      }

      // Filtro por fecha
      if (dateFrom || dateTo) {
        whereClause.uploadedAt = {};
        if (dateFrom) {
          whereClause.uploadedAt.gte = new Date(dateFrom);
        }
        if (dateTo) {
          whereClause.uploadedAt.lte = new Date(dateTo);
        }
      }

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where: whereClause,
          include: {
            athlete: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    identification: true,
                    email: true
                  }
                }
              }
            },
            obligation: {
              select: {
                id: true,
                type: true,
                period: true,
                baseAmount: true,
                dueStart: true,
                dueEnd: true
              }
            }
          },
          orderBy: {
            uploadedAt: 'desc'
          },
          skip: offset,
          take: limit
        }),
        prisma.payment.count({
          where: whereClause
        })
      ]);

      return {
        payments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ Error obteniendo todos los pagos:', error);
      throw new Error('Error al obtener pagos');
    }
  },

  /**
   * Aprobar un pago
   */
  async approvePayment(paymentId, reviewedBy) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: parseInt(paymentId) },
        include: {
          obligation: true,
          athlete: true
        }
      });

      if (!payment) {
        throw new Error('Pago no encontrado');
      }

      if (payment.status !== 'PENDING') {
        throw new Error('Solo se pueden aprobar pagos pendientes');
      }

      // Actualizar el pago
      const updatedPayment = await prisma.payment.update({
        where: { id: parseInt(paymentId) },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: reviewedBy
        }
      });

      // Si es un pago de matrícula inicial o renovación, activar la matrícula
      if (payment.obligation.type === 'ENROLLMENT_INITIAL' || payment.obligation.type === 'ENROLLMENT_RENEWAL') {
        await this._activateEnrollmentAfterPayment(payment.athleteId, payment.obligation.type);
      }

      return updatedPayment;
    } catch (error) {
      console.error('❌ Error aprobando pago:', error);
      throw error;
    }
  },

  /**
   * Rechazar un pago
   */
  async rejectPayment(paymentId, rejectionReason, reviewedBy) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: parseInt(paymentId) }
      });

      if (!payment) {
        throw new Error('Pago no encontrado');
      }

      if (payment.status !== 'PENDING') {
        throw new Error('Solo se pueden rechazar pagos pendientes');
      }

      const updatedPayment = await prisma.payment.update({
        where: { id: parseInt(paymentId) },
        data: {
          status: 'REJECTED',
          rejectionReason,
          reviewedAt: new Date(),
          reviewedBy: reviewedBy
        }
      });

      return updatedPayment;
    } catch (error) {
      console.error('❌ Error rechazando pago:', error);
      throw error;
    }
  },

  /**
   * Activar matrícula después de aprobar pago
   */
  async _activateEnrollmentAfterPayment(athleteId, paymentType) {
    try {
      if (paymentType === 'ENROLLMENT_INITIAL') {
        // Activar matrícula inicial
        await prisma.enrollment.updateMany({
          where: {
            athleteId: athleteId,
            estado: 'Pending_Payment'
          },
          data: {
            estado: 'Vigente'
          }
        });
      } else if (paymentType === 'ENROLLMENT_RENEWAL') {
        // Crear nueva matrícula para renovación
        const settings = await getPaymentSettings();
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);

        await prisma.enrollment.create({
          data: {
            athleteId: athleteId,
            fechaInicio: startDate,
            fechaVencimiento: endDate,
            estado: 'Vigente',
            monto: settings.enrollmentAmount
          }
        });
      }
    } catch (error) {
      console.error('❌ Error activando matrícula:', error);
      throw error;
    }
  },

  // ============================================================================
  // GESTIÓN DE CONFIGURACIÓN (NUEVOS MÉTODOS)
  // ============================================================================

  /**
   * Obtener configuración actual de pagos
   */
  async getPaymentSettings() {
    return await getPaymentSettings();
  },

  /**
   * Actualizar configuración de pagos (solo admin)
   */
  async updatePaymentSettings(newSettings) {
    const updated = await paymentSettingsRepository.updateSettings(newSettings);
    invalidateSettingsCache(); // ✅ Invalidar cache
    return updated;
  },

  // ============================================================================
  // GESTIÓN MENSUAL ADMINISTRATIVA (NUEVO - NO AFECTA FUNCIONALIDAD EXISTENTE)
  // ============================================================================

  /**
   * Obtener gestión completa de pagos mensuales para administradores
   * Incluye cálculo de mora, estados y filtros avanzados
   */
  async getMonthlyPaymentsManagement(filters = {}) {
    try {
      const { page = 1, limit = 20, status, search, dateFrom, dateTo } = filters;
      const offset = (page - 1) * limit;
      const now = new Date();
      const settings = await getPaymentSettings();

      console.log('📊 [PAYMENTS] Procesando gestión mensual:', {
        page, limit, status, search, dateFrom, dateTo
      });

      // Construir filtros dinámicos
      const whereClause = {
        type: 'MONTHLY'
      };

      // Filtro por estado de pago
      if (status === 'PAID') {
        whereClause.payments = {
          some: { status: 'APPROVED' }
        };
      } else if (status === 'PENDING') {
        whereClause.payments = {
          some: { status: 'PENDING' }
        };
      } else if (status === 'OVERDUE') {
        whereClause.dueEnd = { lt: now };
        whereClause.payments = {
          none: { status: 'APPROVED' }
        };
      } else if (status === 'EXCESSIVE_OVERDUE') {
        const fifteenDaysAgo = new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000));
        whereClause.dueEnd = { lt: fifteenDaysAgo };
        whereClause.payments = {
          none: { status: 'APPROVED' }
        };
      }

      // Filtro por búsqueda (nombre o identificación)
      if (search) {
        whereClause.athlete = {
          user: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { identification: { contains: search, mode: 'insensitive' } }
            ]
          }
        };
      }

      // Filtro por fecha
      if (dateFrom || dateTo) {
        whereClause.dueEnd = {};
        if (dateFrom) {
          whereClause.dueEnd.gte = new Date(dateFrom);
        }
        if (dateTo) {
          whereClause.dueEnd.lte = new Date(dateTo);
        }
      }

      // Ejecutar consultas en paralelo para mejor rendimiento
      const [obligations, total] = await Promise.all([
        prisma.paymentObligation.findMany({
          where: whereClause,
          include: {
            athlete: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    identification: true,
                    email: true
                  }
                }
              }
            },
            payments: {
              orderBy: { uploadedAt: 'desc' },
              take: 1,
              select: {
                id: true,
                status: true,
                uploadedAt: true,
                reviewedAt: true,
                receiptUrl: true,
                receiptName: true
              }
            }
          },
          orderBy: [
            { dueEnd: 'desc' },
            { createdAt: 'desc' }
          ],
          skip: offset,
          take: limit
        }),
        prisma.paymentObligation.count({ where: whereClause })
      ]);

      // Procesar cada obligación con cálculo de mora
      const obligationsWithDetails = obligations.map(obligation => {
        const lateDays = calculateLateDays(obligation.dueEnd);
        const lateFee = calculateLateFee(lateDays, settings.lateFeeDailyAmount);
        const totalAmount = obligation.baseAmount + lateFee;
        
        // Determinar estado de mora
        let moraStatus = 'AL_DIA';
        let moraText = 'Al día';
        let moraColor = 'success';
        
        if (lateDays > 15) {
          moraStatus = 'MORA_EXCESIVA';
          moraText = `${lateDays} días de mora (EXCESIVA)`;
          moraColor = 'danger';
        } else if (lateDays > 0) {
          moraStatus = 'EN_MORA';
          moraText = `${lateDays} días de mora`;
          moraColor = 'warning';
        } else if (lateDays > -5) {
          const diasRestantes = Math.abs(lateDays);
          moraStatus = 'PERIODO_GRACIA';
          moraText = `${diasRestantes} días restantes`;
          moraColor = 'info';
        }

        // Determinar estado de pago
        const latestPayment = obligation.payments[0];
        let paymentStatus = 'SIN_PAGO';
        let paymentText = 'Sin comprobante';
        
        if (latestPayment) {
          switch (latestPayment.status) {
            case 'APPROVED':
              paymentStatus = 'PAGADO';
              paymentText = 'Pagado';
              break;
            case 'PENDING':
              paymentStatus = 'PENDIENTE_REVISION';
              paymentText = 'Pendiente de revisión';
              break;
            case 'REJECTED':
              paymentStatus = 'RECHAZADO';
              paymentText = 'Rechazado';
              break;
          }
        }

        return {
          id: obligation.id,
          athleteId: obligation.athleteId,
          athleteName: `${obligation.athlete.user.firstName} ${obligation.athlete.user.lastName}`,
          athleteIdentification: obligation.athlete.user.identification,
          athleteEmail: obligation.athlete.user.email,
          period: obligation.period,
          baseAmount: obligation.baseAmount,
          lateDays,
          lateFee,
          totalAmount,
          dueStart: obligation.dueStart,
          dueEnd: obligation.dueEnd,
          createdAt: obligation.createdAt,
          
          // Estados calculados
          moraStatus,
          moraText,
          moraColor,
          paymentStatus,
          paymentText,
          
          // Información del pago
          latestPayment: latestPayment ? {
            id: latestPayment.id,
            status: latestPayment.status,
            uploadedAt: latestPayment.uploadedAt,
            reviewedAt: latestPayment.reviewedAt,
            receiptUrl: latestPayment.receiptUrl,
            receiptName: latestPayment.receiptName
          } : null
        };
      });

      // Calcular estadísticas de resumen
      const summary = {
        totalObligations: total,
        paidCount: obligationsWithDetails.filter(o => o.paymentStatus === 'PAGADO').length,
        pendingCount: obligationsWithDetails.filter(o => o.paymentStatus === 'PENDIENTE_REVISION').length,
        overdueCount: obligationsWithDetails.filter(o => o.moraStatus === 'EN_MORA').length,
        excessiveOverdueCount: obligationsWithDetails.filter(o => o.moraStatus === 'MORA_EXCESIVA').length,
        totalOverdueAmount: obligationsWithDetails
          .filter(o => o.lateDays > 0)
          .reduce((sum, o) => sum + o.lateFee, 0)
      };

      console.log('✅ [PAYMENTS] Gestión mensual procesada:', {
        obligationsFound: obligations.length,
        totalInDB: total,
        summary
      });

      return {
        obligations: obligationsWithDetails,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        summary,
        filters: {
          status,
          search,
          dateFrom,
          dateTo
        }
      };

    } catch (error) {
      console.error('❌ [PAYMENTS] Error en gestión mensual:', error);
      throw new Error(`Error al obtener gestión mensual: ${error.message}`);
    }
  },

  // ============================================================================
  // MÉTODOS PRIVADOS
  // ============================================================================

  /**
   * Procesar renovación de matrícula después de pago aprobado.
   * Crea una nueva matrícula vigente por 1 año.
   */
  async _processEnrollmentRenewal(athleteId) {
    return await prisma.$transaction(async (tx) => {
      const now = new Date();
      const expirationDate = new Date(now);
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);

      await tx.enrollment.create({
        data: {
          athleteId,
          fechaInicio: now,
          fechaVencimiento: expirationDate,
          estado: 'Vigente',
          observaciones: 'Renovación automática por pago aprobado'
        }
      });

      await tx.athlete.update({
        where: { id: athleteId },
        data: { status: 'Active', inactivityReason: null }
      });

      console.log(`✅ [PAYMENTS] Matrícula renovada automáticamente para atleta ${athleteId}`);
    });
  },

  /**
   * Procesar pago inicial de matrícula después de que fue aprobado.
   * Activa la matrícula que estaba en estado Pending_Payment → Vigente.
   */
  async _processInitialEnrollmentPayment(athleteId) {
    return await prisma.$transaction(async (tx) => {
      const now = new Date();
      const expirationDate = new Date(now);
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);

      const pendingEnrollment = await tx.enrollment.findFirst({
        where: { athleteId, estado: 'Pending_Payment' },
        orderBy: { createdAt: 'desc' }
      });

      if (!pendingEnrollment) {
        throw new Error(`No se encontró matrícula en Pending_Payment para el atleta ${athleteId}`);
      }

      // 1. Activar la matrícula
      await tx.enrollment.update({
        where: { id: pendingEnrollment.id },
        data: {
          estado: 'Vigente',
          fechaInicio: now,
          fechaVencimiento: expirationDate,
          observaciones: 'Activada automáticamente al aprobarse el pago inicial de matrícula'
        }
      });

      // 2. Activar el atleta
      await tx.athlete.update({
        where: { id: athleteId },
        data: { status: 'Active' }
      });

      console.log(`✅ [PAYMENTS] Matrícula inicial activada para atleta ${athleteId} — vigente hasta ${expirationDate.toISOString().split('T')[0]}`);
    });
  },

  // ============================================================================
  // GESTIÓN MENSUAL ADMINISTRATIVA (NUEVO - NO AFECTA FUNCIONALIDAD EXISTENTE)
  // ============================================================================

  /**
   * Obtener gestión completa de pagos mensuales para administradores
   * Incluye cálculo de mora, estados y filtros avanzados
   */
  async getMonthlyPaymentsManagement(filters = {}) {
    try {
      const { page = 1, limit = 20, status, search, dateFrom, dateTo } = filters;
      const offset = (page - 1) * limit;
      const now = new Date();
      const settings = await getPaymentSettings();

      console.log('📊 [PAYMENTS] Procesando gestión mensual:', {
        page, limit, status, search, dateFrom, dateTo
      });

      // Construir filtros dinámicos
      const whereClause = {
        type: 'MONTHLY'
      };

      // Filtro por estado de pago
      if (status === 'PAID') {
        whereClause.payments = {
          some: { status: 'APPROVED' }
        };
      } else if (status === 'PENDING') {
        whereClause.payments = {
          some: { status: 'PENDING' }
        };
      } else if (status === 'OVERDUE') {
        whereClause.dueEnd = { lt: now };
        whereClause.payments = {
          none: { status: 'APPROVED' }
        };
      } else if (status === 'EXCESSIVE_OVERDUE') {
        const fifteenDaysAgo = new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000));
        whereClause.dueEnd = { lt: fifteenDaysAgo };
        whereClause.payments = {
          none: { status: 'APPROVED' }
        };
      }

      // Filtro por búsqueda (nombre o identificación)
      if (search) {
        whereClause.athlete = {
          user: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { identification: { contains: search, mode: 'insensitive' } }
            ]
          }
        };
      }

      // Filtro por fecha
      if (dateFrom || dateTo) {
        whereClause.dueEnd = {};
        if (dateFrom) {
          whereClause.dueEnd.gte = new Date(dateFrom);
        }
        if (dateTo) {
          whereClause.dueEnd.lte = new Date(dateTo);
        }
      }

      // Ejecutar consultas en paralelo para mejor rendimiento
      const [obligations, total] = await Promise.all([
        prisma.paymentObligation.findMany({
          where: whereClause,
          include: {
            athlete: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    identification: true,
                    email: true
                  }
                }
              }
            },
            payments: {
              orderBy: { uploadedAt: 'desc' },
              take: 1,
              select: {
                id: true,
                status: true,
                uploadedAt: true,
                reviewedAt: true,
                receiptUrl: true,
                receiptName: true
              }
            }
          },
          orderBy: [
            { dueEnd: 'desc' },
            { createdAt: 'desc' }
          ],
          skip: offset,
          take: limit
        }),
        prisma.paymentObligation.count({ where: whereClause })
      ]);

      // Procesar cada obligación con cálculo de mora
      const obligationsWithDetails = obligations.map(obligation => {
        const lateDays = calculateLateDays(obligation.dueEnd);
        const lateFee = calculateLateFee(lateDays, settings.lateFeeDailyAmount);
        const totalAmount = obligation.baseAmount + lateFee;
        
        // Determinar estado de mora
        let moraStatus = 'AL_DIA';
        let moraText = 'Al día';
        let moraColor = 'success';
        
        if (lateDays > 15) {
          moraStatus = 'MORA_EXCESIVA';
          moraText = `${lateDays} días de mora (EXCESIVA)`;
          moraColor = 'danger';
        } else if (lateDays > 0) {
          moraStatus = 'EN_MORA';
          moraText = `${lateDays} días de mora`;
          moraColor = 'warning';
        } else if (lateDays > -5) {
          const diasRestantes = Math.abs(lateDays);
          moraStatus = 'PERIODO_GRACIA';
          moraText = `${diasRestantes} días restantes`;
          moraColor = 'info';
        }

        // Determinar estado de pago
        const latestPayment = obligation.payments[0];
        let paymentStatus = 'SIN_PAGO';
        let paymentText = 'Sin comprobante';
        
        if (latestPayment) {
          switch (latestPayment.status) {
            case 'APPROVED':
              paymentStatus = 'PAGADO';
              paymentText = 'Pagado';
              break;
            case 'PENDING':
              paymentStatus = 'PENDIENTE_REVISION';
              paymentText = 'Pendiente de revisión';
              break;
            case 'REJECTED':
              paymentStatus = 'RECHAZADO';
              paymentText = 'Rechazado';
              break;
          }
        }

        return {
          id: obligation.id,
          athleteId: obligation.athleteId,
          athleteName: `${obligation.athlete.user.firstName} ${obligation.athlete.user.lastName}`,
          athleteIdentification: obligation.athlete.user.identification,
          athleteEmail: obligation.athlete.user.email,
          period: obligation.period,
          baseAmount: obligation.baseAmount,
          lateDays,
          lateFee,
          totalAmount,
          dueStart: obligation.dueStart,
          dueEnd: obligation.dueEnd,
          createdAt: obligation.createdAt,
          
          // Estados calculados
          moraStatus,
          moraText,
          moraColor,
          paymentStatus,
          paymentText,
          
          // Información del pago
          latestPayment: latestPayment ? {
            id: latestPayment.id,
            status: latestPayment.status,
            uploadedAt: latestPayment.uploadedAt,
            reviewedAt: latestPayment.reviewedAt,
            receiptUrl: latestPayment.receiptUrl,
            receiptName: latestPayment.receiptName
          } : null
        };
      });

      // Calcular estadísticas de resumen
      const summary = {
        totalObligations: total,
        paidCount: obligationsWithDetails.filter(o => o.paymentStatus === 'PAGADO').length,
        pendingCount: obligationsWithDetails.filter(o => o.paymentStatus === 'PENDIENTE_REVISION').length,
        overdueCount: obligationsWithDetails.filter(o => o.moraStatus === 'EN_MORA').length,
        excessiveOverdueCount: obligationsWithDetails.filter(o => o.moraStatus === 'MORA_EXCESIVA').length,
        totalOverdueAmount: obligationsWithDetails
          .filter(o => o.lateDays > 0)
          .reduce((sum, o) => sum + o.lateFee, 0)
      };

      console.log('✅ [PAYMENTS] Gestión mensual procesada:', {
        obligationsFound: obligations.length,
        totalInDB: total,
        summary
      });

      return {
        obligations: obligationsWithDetails,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        summary,
        filters: {
          status,
          search,
          dateFrom,
          dateTo
        }
      };

    } catch (error) {
      console.error('❌ [PAYMENTS] Error en gestión mensual:', error);
      throw new Error(`Error al obtener gestión mensual: ${error.message}`);
    }
  }
};
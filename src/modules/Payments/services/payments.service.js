import { paymentsRepository } from "../repository/payments.repository.js";
import { paymentSettingsRepository } from "../repository/paymentSettings.repository.js";
import prisma from "../../../config/database.js";

// ============================================================================
// CONSTANTES FIJAS DEL NEGOCIO (según especificaciones del cliente)
// ============================================================================
const BUSINESS_CONSTANTS = {
  LATE_FEE_DAILY: 1000,        // Mora diaria FIJA: 1,000 pesos (ACTUALIZADO)
  MAX_LATE_DAYS_MONTHLY: 15,   // Días máximos FIJOS: 15 días
  GRACE_DAYS: 5,               // Días de gracia FIJOS: del 1 al 5 de cada mes
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
 * Calcula la mora total usando constantes fijas del negocio
 */
const calculateLateFee = (lateDays) => {
  if (lateDays <= 0) return 0;
  return lateDays * BUSINESS_CONSTANTS.LATE_FEE_DAILY; // ✅ Constante fija
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
      // Buscar atletas activos, NO becados, con matrícula vigente
      const activeAthletes = await tx.athlete.findMany({
        where: {
          status: 'Active',
          isScholarship: false,
          enrollments: {
            some: {
              estado: 'Vigente',
              fechaVencimiento: { gt: now }
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

    // Buscar TODAS las obligaciones sin pago aprobado
    const pendingObligations = await paymentsRepository.getAllPendingObligations(athleteId);
    
    // Separar por tipo
    const monthlyObligations = pendingObligations.filter(o => o.type === 'MONTHLY');
    const enrollmentObligation = pendingObligations.find(o => o.type === 'ENROLLMENT_RENEWAL');
    
    // Calcular deuda total mensual
    let totalMonthlyDebt = 0;
    let totalLateFee = 0;
    let maxDaysLate = 0;
    
    const monthlyDetails = [];
    
    for (const obligation of monthlyObligations) {
      const daysLate = calculateLateDays(obligation.dueEnd);
      const lateFee = calculateLateFee(daysLate); // ✅ Usa constante fija
      
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
      
      // Renovación de matrícula
      enrollment: enrollmentObligation ? {
        needsRenewal: true,
        amount: enrollmentObligation.baseAmount,
        obligationId: enrollmentObligation.id,
        dueDate: enrollmentObligation.dueEnd,
        paymentStatus: this.getLatestPaymentStatus(enrollmentObligation.payments)
      } : {
        needsRenewal: false
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
   * Obtener pagos pendientes para administración
   */
  async getPendingPayments(filters = {}) {
    return await paymentsRepository.getPendingPayments(filters);
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

    // Verificar bloqueo por matrícula
    const enrollmentOverdue = overdueObligations.find(o => o.type === 'ENROLLMENT_RENEWAL');
    if (enrollmentOverdue) {
      return {
        restricted: true,
        reason: 'ENROLLMENT_PENDING',
        message: 'Tu matrícula anual está pendiente de renovación',
        obligation: enrollmentOverdue
      };
    }

    return { restricted: false };
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
          fechaMatricula: now,
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

      await tx.enrollment.update({
        where: { id: pendingEnrollment.id },
        data: {
          estado: 'Vigente',
          fechaInicio: now,
          fechaVencimiento: expirationDate,
          observaciones: 'Activada automáticamente al aprobarse el pago inicial de matrícula'
        }
      });

      await tx.athlete.update({
        where: { id: athleteId },
        data: { status: 'Active' }
      });

      console.log(`✅ [PAYMENTS] Matrícula inicial activada para atleta ${athleteId} — vigente hasta ${expirationDate.toISOString().split('T')[0]}`);
    });
  }
};
import { paymentsService } from '../modules/Payments/services/payments.service.js';
import prisma from '../config/database.js';

// Prioridades de bloqueo (menor número = mayor prioridad)
const BLOCKING_PRIORITIES = {
  ENROLLMENT_INITIAL_PENDING: 1,  // Prioridad más alta
  MATRICULA_VENCIDA: 2,
  ENROLLMENT_RENEWAL_PENDING: 2,  // Misma prioridad que matrícula vencida
  MORA_MENSUALIDAD: 3              // Prioridad más baja
};

/**
 * Middleware ROBUSTO para verificar restricciones de pago
 * Valida dinámicamente en cada request, no solo en login
 */
export const checkPaymentRestrictions = async (req, res, next) => {
  try {
    // Solo aplicar a atletas
    if (!req.user?.athlete) {
      return next();
    }

    const athleteId = req.user.athlete.id;

    // 1. Verificar matrícula vigente
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        athleteId,
        estado: 'Vigente'
      },
      orderBy: { createdAt: 'desc' }
    });

    // Si NO tiene matrícula vigente = está vencida
    if (!enrollment) {
      return res.json({
        success: true,
        user: req.user,
        token: req.token,
        restricted: true,
        reason: 'MATRICULA_VENCIDA',
        message: 'Tu matrícula ha vencido. Solo puedes acceder a Gestión de Pagos para renovarla.'
      });
    }

    // 2. Verificar obligaciones pendientes (MEJORADO)
    const financialStatus = await paymentsService.getAthleteFinancialStatus(athleteId);
    
    // Verificar si tiene deudas graves
    const hasEnrollmentDebt = financialStatus.enrollment.needsRenewal;
    const hasOverdueMonthly = financialStatus.totalDebt.maxDaysLate >= 15;
    
    if (hasEnrollmentDebt) {
      return res.json({
        success: true,
        user: req.user,
        token: req.token,
        restricted: true,
        reason: 'MATRICULA_VENCIDA',
        message: 'Tu matrícula necesita renovación. Solo puedes acceder a Gestión de Pagos.'
      });
    }
    
    if (hasOverdueMonthly) {
      return res.json({
        success: true,
        user: req.user,
        token: req.token,
        restricted: true,
        reason: 'MORA_MENSUALIDAD',
        message: `Tienes ${financialStatus.totalDebt.maxDaysLate} días de mora acumulada. Solo puedes acceder a Gestión de Pagos.`
      });
    }

    // Sin restricciones - acceso normal
    next();

  } catch (error) {
    console.error('Error verificando restricciones:', error);
    // En caso de error, permitir acceso normal para no bloquear el sistema
    next();
  }
};

/**
 * Middleware GLOBAL para proteger rutas automáticamente
 * Se aplica a todas las rutas protegidas excepto /gestion-pagos
 */
export const globalPaymentProtection = async (req, res, next) => {
  try {
    // Solo aplicar a atletas autenticados
    if (!req.user?.athlete) {
      return next();
    }

    // No aplicar en rutas de gestión de pagos
    if (req.path.includes('/payments') || req.path.includes('/gestion-pagos')) {
      return next();
    }

    const athleteId = req.user.athlete.id;

    // Verificar restricciones dinámicamente
    const isRestricted = await isAthleteRestricted(athleteId);
    
    if (isRestricted.restricted) {
      return res.status(403).json({
        success: false,
        message: 'Acceso restringido por pagos pendientes',
        reason: isRestricted.reason,
        redirectTo: '/gestion-pagos'
      });
    }

    next();

  } catch (error) {
    console.error('Error en proteccion global:', error);
    next();
  }
};

/**
 * Función auxiliar para verificar si un atleta está restringido
 * MEJORADA con sistema de prioridades para múltiples bloqueos
 */
export const isAthleteRestricted = async (athleteId) => {
  try {
    // Recolectar todas las condiciones de bloqueo con prioridades
    const blockingConditions = [];
    
    // 1. Verificar ENROLLMENT_INITIAL pendiente (Prioridad 1)
    const enrollmentInitialObligation = await prisma.paymentObligation.findFirst({
      where: {
        athleteId,
        type: 'ENROLLMENT_INITIAL',
        payments: {
          none: { status: 'APPROVED' }
        }
      }
    });
    
    if (enrollmentInitialObligation) {
      blockingConditions.push({
        priority: BLOCKING_PRIORITIES.ENROLLMENT_INITIAL_PENDING,
        reason: 'ENROLLMENT_INITIAL_PENDING',
        message: 'Tu matrícula está pendiente de pago inicial'
      });
    }
    
    // 2. Verificar matrícula vencida (Prioridad 2)
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        athleteId,
        estado: 'Vigente'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!enrollment) {
      blockingConditions.push({
        priority: BLOCKING_PRIORITIES.MATRICULA_VENCIDA,
        reason: 'MATRICULA_VENCIDA',
        message: 'Matrícula vencida'
      });
    }
    
    // 3. Verificar ENROLLMENT_RENEWAL pendiente (Prioridad 2)
    const financialStatus = await paymentsService.getAthleteFinancialStatus(athleteId);
    
    if (financialStatus.enrollment.needsRenewal) {
      blockingConditions.push({
        priority: BLOCKING_PRIORITIES.ENROLLMENT_RENEWAL_PENDING,
        reason: 'MATRICULA_VENCIDA',
        message: 'Matrícula necesita renovación'
      });
    }
    
    // 4. Verificar mora excesiva (Prioridad 3)
    if (financialStatus.totalDebt.maxDaysLate > 15) {
      blockingConditions.push({
        priority: BLOCKING_PRIORITIES.MORA_MENSUALIDAD,
        reason: 'MORA_MENSUALIDAD',
        message: `Mora de ${financialStatus.totalDebt.maxDaysLate} días`
      });
    }

    // Si no hay bloqueos, retornar acceso libre
    if (blockingConditions.length === 0) {
      return { restricted: false };
    }
    
    // Retornar el bloqueo de mayor prioridad (menor número)
    const highestPriorityBlock = blockingConditions.sort((a, b) => a.priority - b.priority)[0];
    
    return {
      restricted: true,
      reason: highestPriorityBlock.reason,
      message: highestPriorityBlock.message
    };

  } catch (error) {
    console.error('Error verificando restricciones:', error);
    return { restricted: false };
  }
};

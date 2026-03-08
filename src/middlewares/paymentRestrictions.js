import { paymentsService } from '../modules/Payments/services/payments.service.js';
import prisma from '../config/database.js';

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
    console.error('❌ Error verificando restricciones:', error);
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
    console.error('❌ Error en protección global:', error);
    next();
  }
};

/**
 * Función auxiliar para verificar si un atleta está restringido
 * MEJORADA para verificar todas las deudas con configuración dinámica
 */
export const isAthleteRestricted = async (athleteId) => {
  try {
    // Verificar matrícula
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        athleteId,
        estado: 'Vigente'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!enrollment) {
      return {
        restricted: true,
        reason: 'MATRICULA_VENCIDA',
        message: 'Matrícula vencida'
      };
    }

    // Verificar deudas con configuración dinámica
    const financialStatus = await paymentsService.getAthleteFinancialStatus(athleteId);
    
    if (financialStatus.enrollment.needsRenewal) {
      return {
        restricted: true,
        reason: 'MATRICULA_VENCIDA',
        message: 'Matrícula necesita renovación'
      };
    }
    
    // Obtener configuración para días máximos de mora
    const settings = await paymentsService.getPaymentSettings();
    
    if (financialStatus.totalDebt.maxDaysLate >= 15) { // ✅ Constante fija
      return {
        restricted: true,
        reason: 'MORA_MENSUALIDAD',
        message: `Mora de ${financialStatus.totalDebt.maxDaysLate} días`
      };
    }

    return { restricted: false };

  } catch (error) {
    console.error('❌ Error verificando restricciones:', error);
    return { restricted: false };
  }
};
import { paymentsService } from "../services/payments.service.js";

/**
 * Middleware para verificar restricciones de acceso por pagos
 * Se ejecuta después del middleware de autenticación
 */
export const checkPaymentRestrictions = async (req, res, next) => {
  try {
    // Solo aplicar a atletas
    if (!req.user.athlete) {
      return next();
    }

    const athleteId = req.user.athlete.id;
    
    // Verificar restricciones de acceso
    const accessCheck = await paymentsService.checkAthleteAccessRestrictions(athleteId);
    
    if (!accessCheck.restricted) {
      return next();
    }

    // Si está restringido, agregar información al request
    req.paymentRestriction = {
      restricted: true,
      reason: accessCheck.reason,
      message: accessCheck.message,
      lateDays: accessCheck.lateDays,
      obligation: accessCheck.obligation
    };

    // Permitir acceso solo a rutas de gestión de pagos
    const allowedPaths = [
      '/api/payments',
      '/api/auth/logout',
      '/api/auth/profile'
    ];

    const isPaymentRoute = allowedPaths.some(path => req.path.startsWith(path));
    
    if (isPaymentRoute) {
      return next();
    }

    // Bloquear acceso a otras rutas
    return res.status(403).json({
      success: false,
      message: accessCheck.message,
      restricted: true,
      reason: accessCheck.reason,
      redirectTo: '/payments' // Frontend debe redirigir aquí
    });

  } catch (error) {
    console.error('❌ [PAYMENT MIDDLEWARE] Error:', error);
    // En caso de error, permitir acceso para no bloquear completamente
    return next();
  }
};

/**
 * Middleware para verificar permisos de administrador en rutas de pagos
 */
export const requirePaymentAdminPermissions = (req, res, next) => {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Acceso no autorizado"
      });
    }

    // Verificar permisos de administrador
    const userPermissions = req.user.role?.permissions || {};
    const hasPaymentPermissions = userPermissions.Pagos?.Administrar || 
                                 userPermissions.Admin || 
                                 req.user.role?.name === 'Administrador';

    if (!hasPaymentPermissions) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para administrar pagos"
      });
    }

    next();
  } catch (error) {
    console.error('❌ [PAYMENT ADMIN MIDDLEWARE] Error:', error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};

/**
 * Middleware para verificar que el atleta solo acceda a sus propios datos
 */
export const requireAthleteOwnership = (req, res, next) => {
  try {
    const { athleteId } = req.params;
    const userAthleteId = req.user.athlete?.id;

    // Si es admin, permitir acceso
    const userPermissions = req.user.role?.permissions || {};
    const isAdmin = userPermissions.Admin || req.user.role?.name === 'Administrador';
    
    if (isAdmin) {
      return next();
    }

    // Si es atleta, verificar que sea su propio ID
    if (!userAthleteId || parseInt(athleteId) !== userAthleteId) {
      return res.status(403).json({
        success: false,
        message: "Solo puedes acceder a tu propia información de pagos"
      });
    }

    next();
  } catch (error) {
    console.error('❌ [ATHLETE OWNERSHIP MIDDLEWARE] Error:', error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};
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
    const requestedAthleteId = parseInt(athleteId);

    // Si es admin, permitir acceso
    const userPermissions = req.user.role?.permissions || {};
    const isAdmin = userPermissions.Admin || 
                   userPermissions.Pagos?.Administrar ||
                   req.user.role?.name === 'Administrador';
    
    if (isAdmin) {
      return next();
    }

    // ✅ CORRECCIÓN: Verificar múltiples formas de obtener el athleteId
    let userAthleteId = null;
    
    // Opción 1: req.user.athlete.id (si existe la relación)
    if (req.user.athlete?.id) {
      userAthleteId = req.user.athlete.id;
    }
    // Opción 2: req.user.id (si el usuario ES el atleta directamente)
    else if (req.user.role?.name === 'Deportista') {
      userAthleteId = req.user.id;
    }

    console.log('🔍 [OWNERSHIP DEBUG]', {
      requestedAthleteId,
      userAthleteId,
      userRole: req.user.role?.name,
      hasAthleteRelation: !!req.user.athlete,
      athleteRelationId: req.user.athlete?.id
    });

    // Si no se pudo determinar el athleteId del usuario
    if (!userAthleteId) {
      return res.status(403).json({
        success: false,
        message: "No se pudo verificar tu identidad como deportista"
      });
    }

    // ✅ CORRECCIÓN CRÍTICA: Si el usuario está pidiendo su propio user.id pero tiene athlete.id diferente,
    // redirigir automáticamente al athlete.id correcto
    if (req.user.role?.name === 'Deportista' && req.user.athlete?.id && requestedAthleteId === req.user.id) {
      console.log('🔄 [AUTO-REDIRECT] Redirigiendo de user.id a athlete.id:', {
        from: req.user.id,
        to: req.user.athlete.id
      });
      
      // Modificar la URL para usar el athlete.id correcto
      req.params.athleteId = req.user.athlete.id.toString();
      return next();
    }

    // Verificar que el atleta acceda solo a sus propios datos
    if (requestedAthleteId !== userAthleteId) {
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
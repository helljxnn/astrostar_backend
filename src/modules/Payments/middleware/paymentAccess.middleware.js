import { paymentsService } from "../services/payments.service.js";
import {
  hasNormalizedPermission,
  resolveModuleKey,
} from "../../Roles/config/permissions.config.js";

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

    // Verificar permisos por RBAC normalizado
    const roleName = String(req.user.role?.name || "").toLowerCase();
    const isAdminByRole = roleName === "admin" || roleName === "administrador";
    const userPermissions = req.user.role?.permissions || {};
    const resolvedModule = resolveModuleKey("paymentsManagement", userPermissions);
    const hasPaymentPermissions =
      isAdminByRole ||
      hasNormalizedPermission(userPermissions, resolvedModule, "Aprobar");

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
 * Middleware para descarga de comprobantes:
 * - Admin/staff: requiere paymentsManagement.Descargar
 * - Deportista: solo puede descargar sus propios comprobantes
 */
export const requirePaymentReceiptAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Acceso no autorizado",
      });
    }

    const roleName = String(req.user.role?.name || "").toLowerCase();
    const isAdminByRole = roleName === "admin" || roleName === "administrador";
    const permissions = req.user.role?.permissions || {};
    const resolvedPaymentsModule = resolveModuleKey("paymentsManagement", permissions);
    const canDownloadAsAdmin =
      isAdminByRole ||
      hasNormalizedPermission(permissions, resolvedPaymentsModule, "Descargar");

    if (canDownloadAsAdmin) {
      return next();
    }

    const paymentId = Number.parseInt(req.params.paymentId, 10);
    if (Number.isNaN(paymentId)) {
      return res.status(400).json({
        success: false,
        message: "ID de pago inválido",
      });
    }

    const payment = await paymentsService.getPaymentById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Comprobante no encontrado",
      });
    }

    if (!req.user.athlete?.id || payment.athleteId !== req.user.athlete.id) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para descargar este comprobante",
      });
    }

    return next();
  } catch (error) {
    console.error("[PAYMENT RECEIPT ACCESS] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
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


import rateLimit from "express-rate-limit";

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Rate Limiter General para toda la API
 * Previene abuso y ataques DDoS
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isDevelopment ? 10000 : 1000, // En desarrollo: 10000, en producción: 1000
  message: {
    success: false,
    message:
      "Demasiadas peticiones desde esta IP, por favor intenta más tarde.",
    retryAfter: "15 minutos",
  },
  skip: (req) => {
    const path = req.path || "";
    const hasAuthHeader = Boolean(req.headers.authorization);
    const hasSessionCookie = Boolean(req.cookies?.refreshToken);

    return (
      req.method === "OPTIONS" ||
      hasAuthHeader ||
      hasSessionCookie ||
      path === "/events/public" ||
      path === "/events/check-name" ||
      path.startsWith("/events/upload/") ||
      path === "/health"
    );
  },
  standardHeaders: true, // Retorna info de rate limit en headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
  // Handler cuando se excede el límite
  handler: (req, res) => {
    console.warn(`⚠️  Rate limit excedido para IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message:
        "Demasiadas peticiones desde esta IP, por favor intenta más tarde.",
      retryAfter: "15 minutos",
    });
  },
  // Skip para requests exitosos (opcional)
  skipSuccessfulRequests: false,
  // Skip para requests fallidos (opcional)
  skipFailedRequests: false,
});

/**
 * Rate Limiter Estricto para Autenticación
 * Previene ataques de fuerza bruta en login
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isDevelopment ? 1000 : 5, // En desarrollo: 1000, en producción: 5
  message: {
    success: false,
    message:
      "Demasiados intentos de inicio de sesión. Por favor intenta en 15 minutos.",
    retryAfter: "15 minutos",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // No contar requests exitosos
  handler: (req, res) => {
    console.warn(
      `⚠️  Intentos de login excedidos para IP: ${req.ip}, Email: ${req.body?.email}`,
    );
    res.status(429).json({
      success: false,
      message:
        "Demasiados intentos de inicio de sesión. Por favor intenta en 15 minutos.",
      retryAfter: "15 minutos",
    });
  },
});

/**
 * Rate Limiter para Creación de Recursos
 * Previene spam de creación de datos
 */
export const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: isDevelopment ? 1000 : 20, // En desarrollo: 1000, en producción: 20
  message: {
    success: false,
    message: "Límite de creación alcanzado. Por favor intenta más tarde.",
    retryAfter: "1 hora",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`⚠️  Límite de creación excedido para IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Límite de creación alcanzado. Por favor intenta más tarde.",
      retryAfter: "1 hora",
    });
  },
});

/**
 * Rate Limiter para Endpoints Públicos
 * Más permisivo para endpoints que no requieren autenticación
 */
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isDevelopment ? 10000 : 500, // En desarrollo: 10000, en producción: 500
  message: {
    success: false,
    message: "Demasiadas peticiones. Por favor intenta más tarde.",
    retryAfter: "15 minutos",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate Limiter para Uploads
 * Previene abuso de subida de archivos
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: isDevelopment ? 1000 : 30, // En desarrollo: 1000, en producción: 30
  message: {
    success: false,
    message:
      "Límite de subida de archivos alcanzado. Por favor intenta más tarde.",
    retryAfter: "1 hora",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`⚠️  Límite de uploads excedido para IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message:
        "Límite de subida de archivos alcanzado. Por favor intenta más tarde.",
      retryAfter: "1 hora",
    });
  },
});

export default {
  apiLimiter,
  authLimiter,
  createLimiter,
  publicLimiter,
  uploadLimiter,
};


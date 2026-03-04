import rateLimit from "express-rate-limit";

/**
 * Rate Limiter General para toda la API
 * Previene abuso y ataques DDoS
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requests por IP en la ventana
  message: {
    success: false,
    message:
      "Demasiadas peticiones desde esta IP, por favor intenta más tarde.",
    retryAfter: "15 minutos",
  },
  standardHeaders: true, // Retorna info de rate limit en headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
  // Función para generar key única por IP
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
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
  max: 5, // Máximo 5 intentos de login
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
  max: 20, // Máximo 20 creaciones por hora
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
  max: 200, // Máximo 200 requests por IP
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
  max: 10, // Máximo 10 uploads por hora
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

import logger from "../config/logger.js";

/**
 * Middleware para logging de requests HTTP
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Capturar el método original de res.json
  const originalJson = res.json.bind(res);

  // Override res.json para capturar la respuesta
  res.json = function (body) {
    const responseTime = Date.now() - startTime;

    // Log del request
    logger.logRequest(req, res.statusCode, responseTime);

    // Llamar al método original
    return originalJson(body);
  };

  // Capturar errores
  res.on("finish", () => {
    if (res.statusCode >= 400) {
      const responseTime = Date.now() - startTime;
      logger.logRequest(req, res.statusCode, responseTime);
    }
  });

  next();
};

/**
 * Middleware para logging de errores
 */
export const errorLogger = (err, req, res, next) => {
  logger.logError(err, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
    body: req.body,
  });

  next(err);
};


import logger from "../utils/logger.js";

// Middleware para loggear peticiones HTTP
export const requestLogger = (req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === "development";

  // Solo loguear en desarrollo y filtrar ruido
  if (isDevelopment) {
    const method = req.method;
    const url = req.url;

    // Filtrar OPTIONS, health checks, y requests muy frecuentes
    const shouldLog = !(
      method === "OPTIONS" ||
      url.includes("/health") ||
      url.includes("/auth/refresh") ||
      url.includes("/favicon.ico")
    );

    if (shouldLog) {
      // Capturar el código de respuesta
      const originalSend = res.send;
      res.send = function (data) {
        logger.http(method, url, res.statusCode);
        originalSend.call(this, data);
      };
    }
  }

  next();
};

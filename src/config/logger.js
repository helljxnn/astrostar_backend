import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDir = path.join(__dirname, "../../logs");

// Formato personalizado para logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// Formato para consola (desarrollo)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  }),
);

// Transport para errores
const errorTransport = new DailyRotateFile({
  filename: path.join(logDir, "error-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  level: "error",
  maxSize: "20m",
  maxFiles: "30d",
  format: logFormat,
  zippedArchive: true,
});

// Transport para todos los logs
const combinedTransport = new DailyRotateFile({
  filename: path.join(logDir, "combined-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  maxSize: "20m",
  maxFiles: "14d",
  format: logFormat,
  zippedArchive: true,
});

// Transport para logs de seguridad
const securityTransport = new DailyRotateFile({
  filename: path.join(logDir, "security-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  level: "warn",
  maxSize: "20m",
  maxFiles: "90d", // Mantener logs de seguridad por 90 días
  format: logFormat,
  zippedArchive: true,
});

// Transport para logs de acceso
const accessTransport = new DailyRotateFile({
  filename: path.join(logDir, "access-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  maxSize: "20m",
  maxFiles: "7d",
  format: logFormat,
  zippedArchive: true,
});

// Crear logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  defaultMeta: {
    service: "astrostar-backend",
    environment: process.env.NODE_ENV || "development",
  },
  transports: [
    errorTransport,
    combinedTransport,
    securityTransport,
    accessTransport,
  ],
  // Manejar excepciones no capturadas
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, "exceptions-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "30d",
      format: logFormat,
    }),
  ],
  // Manejar rechazos de promesas no capturados
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, "rejections-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "30d",
      format: logFormat,
    }),
  ],
});

// En desarrollo, también mostrar en consola
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    }),
  );
}

// Métodos de utilidad
logger.logRequest = (req, statusCode, responseTime) => {
  logger.info("HTTP Request", {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    userId: req.user?.id,
  });
};

logger.logSecurity = (event, details) => {
  logger.warn("Security Event", {
    event,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

logger.logAuth = (event, email, success, details = {}) => {
  logger.info("Auth Event", {
    event,
    email,
    success,
    ...details,
  });
};

logger.logError = (error, context = {}) => {
  logger.error("Application Error", {
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

export default logger;


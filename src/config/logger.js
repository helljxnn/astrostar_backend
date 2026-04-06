import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { sanitizeLogValue } from "../utils/asciiSanitizer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isAzureAppService = Boolean(process.env.WEBSITE_SITE_NAME);
const defaultLogDir = isAzureAppService
  ? "/home/LogFiles/astrostar"
  : path.join(__dirname, "../../logs");
const logDir = process.env.LOG_DIR || defaultLogDir;

const canUseFileLogs = (() => {
  try {
    fs.mkdirSync(logDir, { recursive: true });
    return true;
  } catch (error) {
    console.error("[LOGGER] File logging disabled", {
      message: error.message,
      code: error.code,
      path: logDir,
    });
    return false;
  }
})();

const asciiFormat = winston.format((info) => sanitizeLogValue(info))();

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  asciiFormat,
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "HH:mm:ss" }),
  asciiFormat,
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  }),
);

const createRotateTransport = (options) => new DailyRotateFile(options);

const fileTransports = canUseFileLogs
  ? [
      createRotateTransport({
        filename: path.join(logDir, "error-%DATE%.log"),
        datePattern: "YYYY-MM-DD",
        level: "error",
        maxSize: "20m",
        maxFiles: "30d",
        format: logFormat,
        zippedArchive: true,
      }),
      createRotateTransport({
        filename: path.join(logDir, "combined-%DATE%.log"),
        datePattern: "YYYY-MM-DD",
        maxSize: "20m",
        maxFiles: "14d",
        format: logFormat,
        zippedArchive: true,
      }),
      createRotateTransport({
        filename: path.join(logDir, "security-%DATE%.log"),
        datePattern: "YYYY-MM-DD",
        level: "warn",
        maxSize: "20m",
        maxFiles: "90d",
        format: logFormat,
        zippedArchive: true,
      }),
      createRotateTransport({
        filename: path.join(logDir, "access-%DATE%.log"),
        datePattern: "YYYY-MM-DD",
        maxSize: "20m",
        maxFiles: "7d",
        format: logFormat,
        zippedArchive: true,
      }),
    ]
  : [];

const exceptionHandlers = canUseFileLogs
  ? [
      createRotateTransport({
        filename: path.join(logDir, "exceptions-%DATE%.log"),
        datePattern: "YYYY-MM-DD",
        maxSize: "20m",
        maxFiles: "30d",
        format: logFormat,
      }),
    ]
  : [];

const rejectionHandlers = canUseFileLogs
  ? [
      createRotateTransport({
        filename: path.join(logDir, "rejections-%DATE%.log"),
        datePattern: "YYYY-MM-DD",
        maxSize: "20m",
        maxFiles: "30d",
        format: logFormat,
      }),
    ]
  : [];

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  defaultMeta: {
    service: "astrostar-backend",
    environment: process.env.NODE_ENV || "development",
  },
  transports: fileTransports,
  exceptionHandlers,
  rejectionHandlers,
});

if (process.env.NODE_ENV !== "production" || !canUseFileLogs) {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    }),
  );
}

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

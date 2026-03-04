/**
 * Sistema de logging configurable por niveles
 * Uso: import logger from './utils/logger.js'
 *      logger.info('mensaje'), logger.error('error'), etc.
 */

const LOG_LEVELS = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info;
const isProduction = process.env.NODE_ENV === "production";

const logger = {
  error: (...args) => {
    if (currentLevel >= LOG_LEVELS.error) {
      console.error("❌", ...args);
    }
  },

  warn: (...args) => {
    if (currentLevel >= LOG_LEVELS.warn) {
      console.warn("⚠️", ...args);
    }
  },

  info: (...args) => {
    if (currentLevel >= LOG_LEVELS.info) {
      console.log("ℹ️", ...args);
    }
  },

  debug: (...args) => {
    if (currentLevel >= LOG_LEVELS.debug) {
      console.log("🔍", ...args);
    }
  },

  // Método especial para requests HTTP (solo en desarrollo)
  http: (method, url, statusCode) => {
    if (!isProduction && currentLevel >= LOG_LEVELS.debug) {
      const emoji = statusCode >= 400 ? "❌" : "✅";
      console.log(`${emoji} ${method} ${url} - ${statusCode}`);
    }
  },
};

export default logger;

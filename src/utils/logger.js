import { sanitizeLogValue } from "./asciiSanitizer.js";

const LOG_LEVELS = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info;
const isProduction = process.env.NODE_ENV === "production";

const sanitizeArgs = (args) => args.map((value) => sanitizeLogValue(value));

const logger = {
  error: (...args) => {
    if (currentLevel >= LOG_LEVELS.error) {
      console.error("[ERROR]", ...sanitizeArgs(args));
    }
  },

  warn: (...args) => {
    if (currentLevel >= LOG_LEVELS.warn) {
      console.warn("[WARN]", ...sanitizeArgs(args));
    }
  },

  info: (...args) => {
    if (currentLevel >= LOG_LEVELS.info) {
      console.log("[INFO]", ...sanitizeArgs(args));
    }
  },

  debug: (...args) => {
    if (currentLevel >= LOG_LEVELS.debug) {
      console.log("[DEBUG]", ...sanitizeArgs(args));
    }
  },

  http: (method, url, statusCode) => {
    if (!isProduction && currentLevel >= LOG_LEVELS.debug) {
      const level = statusCode >= 400 ? "[ERROR]" : "[OK]";
      const safeLine = sanitizeLogValue(`${level} ${method} ${url} - ${statusCode}`);
      console.log(safeLine);
    }
  },
};

export default logger;

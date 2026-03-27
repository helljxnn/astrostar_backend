import { sanitizeLogValue } from "./asciiSanitizer.js";

const PATCH_FLAG = "__astrostar_ascii_console_patched__";
const LOG_METHODS = ["log", "info", "warn", "error", "debug"];

export const patchConsoleForAscii = () => {
  if (!globalThis.console || globalThis.console[PATCH_FLAG]) {
    return;
  }

  for (const method of LOG_METHODS) {
    const original = globalThis.console[method];
    if (typeof original !== "function") {
      continue;
    }

    globalThis.console[method] = (...args) => {
      const sanitizedArgs = args.map((arg) => sanitizeLogValue(arg));
      original.apply(globalThis.console, sanitizedArgs);
    };
  }

  Object.defineProperty(globalThis.console, PATCH_FLAG, {
    value: true,
    writable: false,
    enumerable: false,
    configurable: false,
  });
};

patchConsoleForAscii();

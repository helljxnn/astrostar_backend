const MOJIBAKE_HINT = /(?:\u00C3.|\u00C2.|\u00E2.|\u00F0|\u00D0|\u00D1)/;

const isPlainObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  Object.getPrototypeOf(value) === Object.prototype;

const decodeUtf8FromLatin1 = (value) => {
  if (typeof value !== "string" || value.length === 0) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0) & 0xff);
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);

    if (!decoded || decoded.includes("\uFFFD")) {
      return value;
    }

    return decoded;
  } catch {
    return value;
  }
};

const repairMojibake = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  if (!MOJIBAKE_HINT.test(value)) {
    return value;
  }

  return decodeUtf8FromLatin1(value);
};

export const sanitizeAsciiText = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  const repaired = repairMojibake(value);

  return repaired
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
};

export const sanitizeLogValue = (value, seen = new WeakSet()) => {
  if (typeof value === "string") {
    return sanitizeAsciiText(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeLogValue(entry, seen));
  }

  if (value instanceof Error) {
    return {
      name: sanitizeAsciiText(value.name),
      message: sanitizeAsciiText(value.message),
      stack: sanitizeAsciiText(value.stack || ""),
    };
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return "[Circular]";
  }

  if (isPlainObject(value)) {
    seen.add(value);
    const output = {};
    for (const [key, entry] of Object.entries(value)) {
      output[sanitizeAsciiText(key)] = sanitizeLogValue(entry, seen);
    }
    seen.delete(value);
    return output;
  }

  return value;
};

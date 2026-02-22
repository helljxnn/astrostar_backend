import crypto from "crypto";

/**
 * Genera un token seguro para RSVP
 * @returns {string} Token hexadecimal de 64 caracteres
 */
export function generateRSVPToken() {
  return crypto.randomBytes(32).toString("hex");
}

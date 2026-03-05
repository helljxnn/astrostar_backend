import crypto from "crypto";

/**
 * Script para generar secretos seguros para variables de entorno
 * Ejecutar: node scripts/generate-secrets.js
 */

const generateSecret = (length = 64) => {
  return crypto.randomBytes(length).toString("hex");
};

console.log("🔐 Generando secretos seguros para AstroStar...\n");
console.log("═══════════════════════════════════════════════════════════════");
console.log("⚠️  IMPORTANTE: Copia estos valores a tu archivo .env");
console.log("⚠️  NO compartas estos secretos con nadie");
console.log("⚠️  Guárdalos en un lugar seguro (gestor de contraseñas)");
console.log(
  "═══════════════════════════════════════════════════════════════\n",
);

console.log("# JWT Secrets (copiar a .env)");
console.log(`JWT_SECRET=${generateSecret(64)}`);
console.log(`JWT_REFRESH_SECRET=${generateSecret(64)}`);
console.log("");

console.log("# Session Secret (si se usa express-session)");
console.log(`SESSION_SECRET=${generateSecret(64)}`);
console.log("");

console.log("# Encryption Key (para datos sensibles)");
console.log(`ENCRYPTION_KEY=${generateSecret(32)}`);
console.log("");

console.log("═══════════════════════════════════════════════════════════════");
console.log("✅ Secretos generados exitosamente");
console.log("");
console.log("📝 Próximos pasos:");
console.log("1. Copia los valores generados arriba");
console.log("2. Actualiza tu archivo .env con los nuevos valores");
console.log("3. Reinicia el servidor backend");
console.log(
  "4. IMPORTANTE: Todos los usuarios deberán volver a iniciar sesión",
);
console.log("5. Los refresh tokens existentes quedarán invalidados");
console.log("═══════════════════════════════════════════════════════════════");

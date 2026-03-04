import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script para verificar configuración de seguridad
 * Ejecutar: node scripts/check-security.js
 */

console.log("🔍 Verificando configuración de seguridad de AstroStar...\n");

let hasErrors = false;
let hasWarnings = false;

// ═══════════════════════════════════════════════════════════════
// 1. Verificar archivo .env
// ═══════════════════════════════════════════════════════════════
console.log("📋 1. Verificando archivo .env...");

const envPath = path.join(__dirname, "..", ".env");
if (!fs.existsSync(envPath)) {
  console.error("   ❌ ERROR: Archivo .env no encontrado");
  console.error("   → Copia .env.example como .env y configura los valores");
  hasErrors = true;
} else {
  console.log("   ✅ Archivo .env existe");

  // Leer contenido del .env
  const envContent = fs.readFileSync(envPath, "utf-8");

  // Verificar secretos débiles
  const weakSecrets = [
    "AstroStar2024",
    "SuperSecretKey",
    "your-secret-key",
    "GENERAR_SECRETO",
    "tu-",
    "example",
    "test",
  ];

  let hasWeakSecrets = false;
  weakSecrets.forEach((weak) => {
    if (envContent.includes(weak)) {
      hasWeakSecrets = true;
    }
  });

  if (hasWeakSecrets) {
    console.error("   ❌ ERROR: Detectados secretos débiles o de ejemplo");
    console.error("   → Ejecuta: node scripts/generate-secrets.js");
    console.error("   → Actualiza JWT_SECRET y JWT_REFRESH_SECRET");
    hasErrors = true;
  } else {
    console.log("   ✅ No se detectaron secretos débiles");
  }

  // Verificar longitud de JWT_SECRET
  const jwtSecretMatch = envContent.match(/JWT_SECRET=(.+)/);
  if (jwtSecretMatch) {
    const jwtSecret = jwtSecretMatch[1].trim();
    if (jwtSecret.length < 32) {
      console.error("   ❌ ERROR: JWT_SECRET muy corto (mínimo 32 caracteres)");
      hasErrors = true;
    } else if (jwtSecret.length < 64) {
      console.warn(
        "   ⚠️  ADVERTENCIA: JWT_SECRET debería tener al menos 64 caracteres",
      );
      hasWarnings = true;
    } else {
      console.log("   ✅ JWT_SECRET tiene longitud adecuada");
    }
  }
}

console.log("");

// ═══════════════════════════════════════════════════════════════
// 2. Verificar .gitignore
// ═══════════════════════════════════════════════════════════════
console.log("📋 2. Verificando .gitignore...");

const gitignorePath = path.join(__dirname, "..", ".gitignore");
if (!fs.existsSync(gitignorePath)) {
  console.error("   ❌ ERROR: Archivo .gitignore no encontrado");
  hasErrors = true;
} else {
  const gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");

  if (!gitignoreContent.includes(".env")) {
    console.error("   ❌ ERROR: .env no está en .gitignore");
    console.error('   → Agrega ".env" a .gitignore');
    hasErrors = true;
  } else {
    console.log("   ✅ .env está en .gitignore");
  }

  if (!gitignoreContent.includes("node_modules")) {
    console.warn("   ⚠️  ADVERTENCIA: node_modules no está en .gitignore");
    hasWarnings = true;
  } else {
    console.log("   ✅ node_modules está en .gitignore");
  }
}

console.log("");

// ═══════════════════════════════════════════════════════════════
// 3. Verificar archivo .env.example
// ═══════════════════════════════════════════════════════════════
console.log("📋 3. Verificando .env.example...");

const envExamplePath = path.join(__dirname, "..", ".env.example");
if (!fs.existsSync(envExamplePath)) {
  console.warn("   ⚠️  ADVERTENCIA: .env.example no encontrado");
  console.warn(
    "   → Crea .env.example como plantilla para otros desarrolladores",
  );
  hasWarnings = true;
} else {
  console.log("   ✅ .env.example existe");

  const envExampleContent = fs.readFileSync(envExamplePath, "utf-8");

  // Verificar que no tenga secretos reales
  const envContent = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, "utf-8")
    : "";
  const jwtSecretMatch = envContent.match(/JWT_SECRET=(.+)/);

  if (jwtSecretMatch && envExampleContent.includes(jwtSecretMatch[1])) {
    console.error("   ❌ ERROR: .env.example contiene secretos reales");
    console.error("   → Reemplaza los secretos con valores de ejemplo");
    hasErrors = true;
  } else {
    console.log("   ✅ .env.example no contiene secretos reales");
  }
}

console.log("");

// ═══════════════════════════════════════════════════════════════
// 4. Verificar configuración de CORS
// ═══════════════════════════════════════════════════════════════
console.log("📋 4. Verificando configuración de CORS...");

const appJsPath = path.join(__dirname, "..", "src", "app.js");
if (!fs.existsSync(appJsPath)) {
  console.error("   ❌ ERROR: src/app.js no encontrado");
  hasErrors = true;
} else {
  const appJsContent = fs.readFileSync(appJsPath, "utf-8");

  if (appJsContent.includes("origin: true")) {
    console.error(
      '   ❌ ERROR: CORS configurado con "origin: true" (permite todos los orígenes)',
    );
    console.error("   → Configura whitelist de dominios permitidos");
    hasErrors = true;
  } else if (appJsContent.includes("allowedOrigins")) {
    console.log("   ✅ CORS configurado con whitelist de orígenes");
  } else {
    console.warn(
      "   ⚠️  ADVERTENCIA: No se pudo verificar configuración de CORS",
    );
    hasWarnings = true;
  }
}

console.log("");

// ═══════════════════════════════════════════════════════════════
// 5. Verificar dependencias de seguridad
// ═══════════════════════════════════════════════════════════════
console.log("📋 5. Verificando dependencias de seguridad...");

const packageJsonPath = path.join(__dirname, "..", "package.json");
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  // Verificar bcrypt
  if (dependencies.bcrypt || dependencies.bcryptjs) {
    console.log("   ✅ bcrypt instalado para hashing de contraseñas");
  } else {
    console.error("   ❌ ERROR: bcrypt no instalado");
    hasErrors = true;
  }

  // Verificar jsonwebtoken
  if (dependencies.jsonwebtoken) {
    console.log("   ✅ jsonwebtoken instalado para JWT");
  } else {
    console.error("   ❌ ERROR: jsonwebtoken no instalado");
    hasErrors = true;
  }

  // Verificar helmet (recomendado)
  if (dependencies.helmet) {
    console.log("   ✅ helmet instalado para headers de seguridad");
  } else {
    console.warn(
      "   ⚠️  RECOMENDADO: Instalar helmet para headers de seguridad",
    );
    console.warn("   → npm install helmet");
    hasWarnings = true;
  }

  // Verificar express-rate-limit (recomendado)
  if (dependencies["express-rate-limit"]) {
    console.log("   ✅ express-rate-limit instalado");
  } else {
    console.warn("   ⚠️  RECOMENDADO: Instalar express-rate-limit");
    console.warn("   → npm install express-rate-limit");
    hasWarnings = true;
  }
}

console.log("");

// ═══════════════════════════════════════════════════════════════
// Resumen
// ═══════════════════════════════════════════════════════════════
console.log("═══════════════════════════════════════════════════════════════");

if (hasErrors) {
  console.error("❌ VERIFICACIÓN FALLIDA - Se encontraron errores críticos");
  console.error(
    "   Por favor corrige los errores antes de desplegar a producción",
  );
  process.exit(1);
} else if (hasWarnings) {
  console.warn("⚠️  VERIFICACIÓN COMPLETADA CON ADVERTENCIAS");
  console.warn(
    "   Se recomienda atender las advertencias para mejorar la seguridad",
  );
  process.exit(0);
} else {
  console.log("✅ VERIFICACIÓN EXITOSA - Configuración de seguridad correcta");
  process.exit(0);
}

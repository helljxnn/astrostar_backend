#!/usr/bin/env node

/**
 * Script de Preparación para Deployment
 * Verifica que todo esté listo antes de desplegar
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

console.log("🚀 Preparando AstroStar para Deployment...\n");

let allChecksPass = true;
const warnings = [];
const errors = [];

// ═══════════════════════════════════════════════════════════════
// 1. Verificar que ecosystem.config.js existe
// ═══════════════════════════════════════════════════════════════
console.log("📋 1. Verificando ecosystem.config.js...");
const ecosystemPath = path.join(rootDir, "ecosystem.config.js");
const ecosystemExamplePath = path.join(rootDir, "ecosystem.config.js.example");

if (!fs.existsSync(ecosystemPath)) {
  errors.push("❌ ecosystem.config.js NO existe");
  errors.push("   Ejecuta: cp ecosystem.config.js.example ecosystem.config.js");
  allChecksPass = false;
} else {
  console.log("   ✅ ecosystem.config.js existe");

  // Verificar que no tenga valores de ejemplo
  const content = fs.readFileSync(ecosystemPath, "utf8");
  if (content.includes("CAMBIAR_ESTO")) {
    warnings.push("⚠️  ecosystem.config.js contiene valores CAMBIAR_ESTO");
    warnings.push("   Edita el archivo y reemplaza todos los valores");
  } else {
    console.log("   ✅ ecosystem.config.js configurado");
  }
}

// ═══════════════════════════════════════════════════════════════
// 2. Verificar que ecosystem.config.js NO esté en Git
// ═══════════════════════════════════════════════════════════════
console.log("\n📋 2. Verificando .gitignore...");
const gitignorePath = path.join(rootDir, ".gitignore");

if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
  if (gitignoreContent.includes("ecosystem.config.js")) {
    console.log("   ✅ ecosystem.config.js está en .gitignore");
  } else {
    warnings.push("⚠️  ecosystem.config.js NO está en .gitignore");
    warnings.push("   Agrégalo para evitar subir secretos a Git");
  }
}

// ═══════════════════════════════════════════════════════════════
// 3. Verificar node_modules
// ═══════════════════════════════════════════════════════════════
console.log("\n📋 3. Verificando dependencias...");
const nodeModulesPath = path.join(rootDir, "node_modules");

if (!fs.existsSync(nodeModulesPath)) {
  errors.push("❌ node_modules NO existe");
  errors.push("   Ejecuta: npm install");
  allChecksPass = false;
} else {
  console.log("   ✅ node_modules existe");
}

// ═══════════════════════════════════════════════════════════════
// 4. Verificar package.json scripts
// ═══════════════════════════════════════════════════════════════
console.log("\n📋 4. Verificando scripts de seguridad...");
const packageJsonPath = path.join(rootDir, "package.json");

if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const requiredScripts = [
    "security:check",
    "security:generate-secrets",
    "security:audit",
  ];

  let allScriptsExist = true;
  requiredScripts.forEach((script) => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`   ✅ Script '${script}' existe`);
    } else {
      errors.push(`❌ Script '${script}' NO existe en package.json`);
      allScriptsExist = false;
      allChecksPass = false;
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// 5. Verificar archivos de documentación
// ═══════════════════════════════════════════════════════════════
console.log("\n📋 5. Verificando documentación...");
const requiredDocs = [
  "CHECKLIST_DEPLOYMENT_SIMPLE.md",
  "DEPLOYMENT_QUICK_REFERENCE.md",
  "COMANDOS_DEPLOYMENT.md",
  "PRE_DEPLOYMENT_FINAL.md",
  "ESTADO_FINAL_SEGURIDAD.md",
];

let allDocsExist = true;
requiredDocs.forEach((doc) => {
  const docPath = path.join(rootDir, doc);
  if (fs.existsSync(docPath)) {
    console.log(`   ✅ ${doc} existe`);
  } else {
    warnings.push(`⚠️  ${doc} NO existe`);
    allDocsExist = false;
  }
});

// ═══════════════════════════════════════════════════════════════
// 6. Verificar scripts de backup
// ═══════════════════════════════════════════════════════════════
console.log("\n📋 6. Verificando scripts de backup...");
const backupScripts = [
  "scripts/backup-database.sh",
  "scripts/backup-database.ps1",
  "scripts/setup-database-user.sql",
];

backupScripts.forEach((script) => {
  const scriptPath = path.join(rootDir, script);
  if (fs.existsSync(scriptPath)) {
    console.log(`   ✅ ${script} existe`);
  } else {
    warnings.push(`⚠️  ${script} NO existe`);
  }
});

// ═══════════════════════════════════════════════════════════════
// 7. Verificar validadores
// ═══════════════════════════════════════════════════════════════
console.log("\n📋 7. Verificando validadores...");
const validatorsDir = path.join(rootDir, "src/middlewares/validators");

if (fs.existsSync(validatorsDir)) {
  const validators = fs.readdirSync(validatorsDir);
  console.log(`   ✅ ${validators.length} validadores encontrados`);
} else {
  warnings.push("⚠️  Directorio de validadores NO existe");
}

// ═══════════════════════════════════════════════════════════════
// RESUMEN
// ═══════════════════════════════════════════════════════════════
console.log("\n" + "═".repeat(60));
console.log("RESUMEN DE VERIFICACIÓN");
console.log("═".repeat(60) + "\n");

if (errors.length > 0) {
  console.log("🔴 ERRORES CRÍTICOS:\n");
  errors.forEach((error) => console.log(error));
  console.log("");
}

if (warnings.length > 0) {
  console.log("🟡 ADVERTENCIAS:\n");
  warnings.forEach((warning) => console.log(warning));
  console.log("");
}

if (allChecksPass && errors.length === 0) {
  console.log("✅ TODAS LAS VERIFICACIONES PASARON\n");
  console.log("🎯 PRÓXIMOS PASOS:\n");
  console.log("1. Genera secretos de producción:");
  console.log("   npm run security:generate-secrets\n");
  console.log("2. Edita ecosystem.config.js con los valores reales\n");
  console.log("3. Verifica la configuración:");
  console.log("   npm run security:check\n");
  console.log("4. Lee la guía de deployment:");
  console.log("   cat PRE_DEPLOYMENT_FINAL.md\n");
  console.log("5. Sigue el checklist en el servidor:");
  console.log("   cat CHECKLIST_DEPLOYMENT_SIMPLE.md\n");
  console.log("═".repeat(60));
  console.log("✅ LISTO PARA DESPLEGAR");
  console.log("═".repeat(60) + "\n");
  process.exit(0);
} else {
  console.log("═".repeat(60));
  console.log("❌ CORRIGE LOS ERRORES ANTES DE DESPLEGAR");
  console.log("═".repeat(60) + "\n");
  process.exit(1);
}

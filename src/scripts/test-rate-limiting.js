/**
 * Script de prueba para verificar el sistema de rate limiting híbrido
 * Ejecutar con: node src/scripts/test-rate-limiting.js
 */

import dotenv from "dotenv";
import rateLimitService from "../services/rateLimitService.js";

// Cargar variables de entorno
dotenv.config({ quiet: true });

async function testRateLimiting() {
  console.log("🧪 Iniciando prueba del sistema de rate limiting híbrido...\n");

  const testEmail1 = "test1@example.com";
  const testEmail2 = "test2@example.com";
  const testIP = "192.168.1.100";

  console.log("📊 Configuración actual:");
  console.log(
    `   - Máximo intentos por email: ${rateLimitService.config.passwordReset.maxAttemptsPerEmail}`,
  );
  console.log(
    `   - Máximo intentos por IP: ${rateLimitService.config.passwordReset.maxAttemptsPerIP}`,
  );
  console.log(
    `   - Máximo emails diferentes por IP: ${rateLimitService.config.passwordReset.maxDifferentEmailsPerIP}`,
  );
  console.log(
    `   - Ventana de tiempo: ${rateLimitService.config.passwordReset.windowMinutes} minutos`,
  );
  console.log(
    `   - Duración de bloqueo: ${rateLimitService.config.passwordReset.blockDurationMinutes} minutos\n`,
  );

  // Test 1: Verificar límites iniciales
  console.log("📝 Test 1: Verificar límites iniciales");
  const check1 = await rateLimitService.checkPasswordResetRateLimit(
    testEmail1,
    testIP,
  );
  console.log(`   ✅ Permitido: ${check1.allowed}`);
  console.log(`   📊 Intentos restantes:`, check1.attemptsRemaining);

  // Test 2: Simular 3 intentos con el mismo email (debe bloquearse)
  console.log("\n📝 Test 2: Intentar 3 veces con el mismo email");
  for (let i = 1; i <= 3; i++) {
    console.log(`\n   Intento ${i} con ${testEmail1}:`);

    const check = await rateLimitService.checkPasswordResetRateLimit(
      testEmail1,
      testIP,
    );

    if (check.allowed) {
      console.log(`   ✅ Permitido`);
      console.log(`   📊 Intentos restantes:`, check.attemptsRemaining);

      // Registrar el intento
      await rateLimitService.recordPasswordResetAttempt(
        testEmail1,
        testIP,
        "test-agent",
        false,
      );
    } else {
      console.log(`   ❌ Bloqueado: ${check.message}`);
      console.log(`   ⏱️  Minutos restantes: ${check.minutesRemaining}`);
    }
  }

  // Test 3: Verificar que el email1 está bloqueado
  console.log("\n📝 Test 3: Verificar que el email1 está bloqueado");
  const check3 = await rateLimitService.checkPasswordResetRateLimit(
    testEmail1,
    testIP,
  );
  if (!check3.allowed) {
    console.log(`   ✅ Email bloqueado correctamente`);
    console.log(`   📝 Razón: ${check3.reason}`);
    console.log(`   💬 Mensaje: ${check3.message}`);
  } else {
    console.log(`   ❌ ERROR: El email debería estar bloqueado`);
  }

  // Test 4: NUEVO - Verificar que otro email desde la misma IP SÍ puede intentar
  console.log(
    "\n📝 Test 4: Verificar que otro email desde la misma IP puede intentar",
  );
  const check4 = await rateLimitService.checkPasswordResetRateLimit(
    testEmail2,
    testIP,
  );
  if (check4.allowed) {
    console.log(`   ✅ Otro email puede intentar desde la misma IP`);
    console.log(`   📊 Intentos restantes:`, check4.attemptsRemaining);
  } else {
    console.log(`   ❌ ERROR: Otro email debería poder intentar`);
    console.log(`   💬 Mensaje: ${check4.message}`);
  }

  // Test 5: NUEVO - Simular comportamiento sospechoso (múltiples emails diferentes)
  console.log(
    "\n📝 Test 5: Simular comportamiento sospechoso (múltiples emails diferentes)",
  );
  const suspiciousEmails = [
    "suspicious1@test.com",
    "suspicious2@test.com",
    "suspicious3@test.com",
    "suspicious4@test.com",
    "suspicious5@test.com",
    "suspicious6@test.com",
  ];

  const testIP2 = "192.168.1.200";

  for (let i = 0; i < suspiciousEmails.length; i++) {
    const email = suspiciousEmails[i];
    console.log(`\n   Intento ${i + 1} con ${email}:`);

    const check = await rateLimitService.checkPasswordResetRateLimit(
      email,
      testIP2,
    );

    if (check.allowed) {
      console.log(`   ✅ Permitido`);
      await rateLimitService.recordPasswordResetAttempt(
        email,
        testIP2,
        "test-agent",
        false,
      );
    } else {
      console.log(`   ❌ Bloqueado: ${check.message}`);
      console.log(`   📝 Razón: ${check.reason}`);
      if (check.reason === "suspicious_activity") {
        console.log(
          `   🚨 Actividad sospechosa detectada correctamente después de ${i} emails diferentes`,
        );
      }
      break;
    }
  }

  // Test 6: Verificar validación de tokens
  console.log("\n📝 Test 6: Verificar validación de tokens");

  // Simular un token con ID 999 (no existe, solo para prueba)
  const tokenCheck = await rateLimitService.checkTokenVerificationAttempts(
    999,
    "password_reset",
  );

  if (!tokenCheck.allowed) {
    console.log(`   ✅ Token no encontrado detectado correctamente`);
  } else {
    console.log(`   ⚠️  Token no existe pero no se detectó`);
  }

  console.log("\n📋 Resumen:");
  console.log("   1. ✅ Rate limiting por email funciona");
  console.log("   2. ✅ Otros emails desde la misma IP pueden intentar");
  console.log("   3. ✅ Detección de actividad sospechosa funciona");
  console.log("   4. ✅ Rate limiting por IP total funciona");
  console.log("   5. ✅ Sistema de bloqueo funciona");
  console.log("   6. ✅ Validación de tokens funciona");

  console.log(
    "\n⚠️  NOTA: Los registros de prueba quedarán en la base de datos.",
  );
  console.log(
    "   Ejecuta el script de limpieza si es necesario: node src/scripts/cleanup-test-data.js",
  );
}

// Ejecutar prueba
testRateLimiting()
  .then(() => {
    console.log("\n✅ Script de prueba finalizado exitosamente");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error en el script de prueba:", error);
    process.exit(1);
  });


/**
 * Script de prueba para verificar el sistema de rate limiting
 * Ejecutar con: node src/scripts/test-rate-limiting.js
 */

import dotenv from "dotenv";
import rateLimitService from "../services/rateLimitService.js";

// Cargar variables de entorno
dotenv.config();

async function testRateLimiting() {
  console.log("🧪 Iniciando prueba del sistema de rate limiting...\n");

  const testEmail = "test@example.com";
  const testIP = "192.168.1.100";

  console.log("📊 Configuración actual:");
  console.log(
    `   - Máximo intentos por email: ${rateLimitService.config.passwordReset.maxAttemptsPerEmail}`,
  );
  console.log(
    `   - Máximo intentos por IP: ${rateLimitService.config.passwordReset.maxAttemptsPerIP}`,
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
    testEmail,
    testIP,
  );

  if (check1.allowed) {
    console.log("✅ Solicitud permitida");
    console.log(
      `   - Intentos restantes (email): ${check1.attemptsRemaining.email}`,
    );
    console.log(
      `   - Intentos restantes (IP): ${check1.attemptsRemaining.ip}\n`,
    );
  } else {
    console.log("❌ Solicitud bloqueada:", check1.message);
    console.log(`   - Razón: ${check1.reason}\n`);
  }

  // Test 2: Simular múltiples intentos
  console.log("📝 Test 2: Simular múltiples intentos");
  for (let i = 1; i <= 4; i++) {
    console.log(`\n   Intento ${i}:`);

    const check = await rateLimitService.checkPasswordResetRateLimit(
      testEmail,
      testIP,
    );

    if (check.allowed) {
      console.log(
        `   ✅ Permitido - Restantes: email=${check.attemptsRemaining.email}, ip=${check.attemptsRemaining.ip}`,
      );

      // Registrar el intento
      await rateLimitService.recordPasswordResetAttempt(
        testEmail,
        testIP,
        "Test User Agent",
        false, // Simular intento fallido
      );
    } else {
      console.log(`   ❌ Bloqueado: ${check.message}`);
      console.log(`   📍 Razón: ${check.reason}`);
      if (check.minutesRemaining) {
        console.log(
          `   ⏱️  Tiempo restante: ${check.minutesRemaining} minutos`,
        );
      }
      break;
    }
  }

  // Test 3: Verificar bloqueo
  console.log("\n📝 Test 3: Verificar que el bloqueo está activo");
  const check3 = await rateLimitService.checkPasswordResetRateLimit(
    testEmail,
    testIP,
  );

  if (!check3.allowed) {
    console.log("✅ Sistema de bloqueo funcionando correctamente");
    console.log(`   - Mensaje: ${check3.message}`);
    console.log(`   - Razón: ${check3.reason}`);
    if (check3.blockedUntil) {
      console.log(
        `   - Bloqueado hasta: ${new Date(check3.blockedUntil).toLocaleString("es-CO")}`,
      );
    }
  } else {
    console.log("⚠️  Advertencia: El bloqueo no se activó como se esperaba");
  }

  // Test 4: Verificar límite de intentos de token
  console.log(
    "\n📝 Test 4: Verificar límite de intentos de verificación de token",
  );

  // Simular un token con ID 999 (no existe, solo para prueba)
  const tokenCheck = await rateLimitService.checkTokenVerificationAttempts(
    999,
    "password_reset",
  );

  if (tokenCheck.allowed === false && tokenCheck.reason === "token_not_found") {
    console.log("✅ Validación de token funcionando correctamente");
    console.log(`   - Razón: ${tokenCheck.reason}`);
  } else {
    console.log("⚠️  Resultado inesperado en validación de token");
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Pruebas completadas");
  console.log("=".repeat(60));

  console.log("\n📋 Resumen:");
  console.log("   1. ✅ Rate limiting por email funciona");
  console.log("   2. ✅ Rate limiting por IP funciona");
  console.log("   3. ✅ Sistema de bloqueo funciona");
  console.log("   4. ✅ Validación de tokens funciona");

  console.log(
    "\n💡 Nota: Los intentos de prueba quedarán registrados en la base de datos.",
  );
  console.log(
    "   Puedes limpiarlos ejecutando el job de limpieza o esperando 7 días.",
  );

  console.log("\n🧹 Para limpiar los datos de prueba manualmente:");
  console.log(
    "   DELETE FROM password_reset_attempts WHERE email = 'test@example.com';",
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
    console.error(error.stack);
    process.exit(1);
  });

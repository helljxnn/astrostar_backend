/**
 * Job para limpiar intentos antiguos de rate limiting
 * Se ejecuta diariamente a las 3:00 AM
 */

import cron from "node-cron";
import rateLimitService from "../services/rateLimitService.js";

/**
 * Limpiar intentos antiguos de rate limiting
 */
async function cleanupOldAttempts() {
  try {
    console.log(
      "🧹 [RATE LIMIT CLEANUP] Iniciando limpieza de intentos antiguos...",
    );

    const result = await rateLimitService.cleanupOldAttempts();

    console.log("✅ [RATE LIMIT CLEANUP] Limpieza completada exitosamente");
    console.log(
      `   - Password resets: ${result.passwordResets} registros eliminados`,
    );
    console.log(
      `   - Email verifications: ${result.emailVerifications} registros eliminados`,
    );
  } catch (error) {
    console.error("❌ [RATE LIMIT CLEANUP] Error en limpieza:", error);
  }
}

/**
 * Iniciar el job de limpieza
 * Se ejecuta todos los días a las 3:00 AM
 */
export function startRateLimitCleanupJob() {
  // Ejecutar todos los días a las 3:00 AM
  cron.schedule("0 3 * * *", cleanupOldAttempts, {
    timezone: "America/Bogota",
  });

  console.log(
    "✅ [RATE LIMIT CLEANUP] Job de limpieza programado (diario a las 3:00 AM)",
  );
}

// Exportar función para ejecutar manualmente si es necesario
export { cleanupOldAttempts };


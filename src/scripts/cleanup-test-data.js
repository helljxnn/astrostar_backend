/**
 * Script para limpiar datos de prueba del rate limiting
 */

import prisma from "../config/database.js";

async function cleanupTestData() {
  console.log("🧹 Limpiando datos de prueba...\n");

  try {
    // Eliminar intentos de prueba
    const deleted = await prisma.passwordResetAttempt.deleteMany({
      where: {
        email: "test@example.com",
      },
    });

    console.log(`✅ ${deleted.count} registros de prueba eliminados`);
    console.log("✅ Base de datos limpia\n");
  } catch (error) {
    console.error("❌ Error limpiando datos:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestData();

/**
 * Script para limpiar datos de prueba del rate limiting
 */

import prisma from "../config/database.js";

async function cleanupTestData() {
  console.log("🧹 Limpiando datos de prueba del rate limiting...\n");

  try {
    // Lista de emails de prueba
    const testEmails = [
      "test@example.com",
      "test1@example.com",
      "test2@example.com",
      "test3@example.com",
      "suspicious1@test.com",
      "suspicious2@test.com",
      "suspicious3@test.com",
      "suspicious4@test.com",
      "suspicious5@test.com",
      "suspicious6@test.com",
    ];

    // Eliminar intentos de prueba
    const deleted = await prisma.passwordResetAttempt.deleteMany({
      where: {
        email: {
          in: testEmails,
        },
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


/**
 * Script para corregir eventos con fechas/horas NULL
 * Ejecutar: node scripts/fix-events-null-times.js
 */

import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

async function fixEventsWithNullTimes() {
  console.log("🔍 Buscando eventos con fechas/horas incompletas...\n");

  try {
    // 1. Identificar eventos problemáticos
    const problematicEvents = await prisma.service.findMany({
      where: {
        OR: [
          { startTime: null },
          { endTime: null },
          { startDate: null },
          { endDate: null },
        ],
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        startTime: true,
        endDate: true,
        endTime: true,
        status: true,
        createdAt: true,
      },
    });

    console.log(`📊 Eventos encontrados: ${problematicEvents.length}\n`);

    if (problematicEvents.length === 0) {
      console.log("✅ No hay eventos con datos incompletos. Todo está bien!\n");
      return;
    }

    // Mostrar eventos problemáticos
    console.log("Eventos con problemas:");
    problematicEvents.forEach((event, index) => {
      console.log(`\n${index + 1}. ${event.name} (ID: ${event.id})`);
      console.log(`   - Fecha inicio: ${event.startDate || "❌ NULL"}`);
      console.log(`   - Hora inicio: ${event.startTime || "❌ NULL"}`);
      console.log(`   - Fecha fin: ${event.endDate || "❌ NULL"}`);
      console.log(`   - Hora fin: ${event.endTime || "❌ NULL"}`);
      console.log(`   - Estado: ${event.status}`);
    });

    console.log("\n⚠️  OPCIONES DE CORRECCIÓN:\n");
    console.log("1. Actualizar con valores por defecto");
    console.log("2. Eliminar eventos incompletos");
    console.log("3. Cancelar (no hacer nada)\n");

    // Para este script, vamos a actualizar con valores por defecto
    console.log(
      "🔧 Aplicando corrección automática (valores por defecto)...\n",
    );

    let updatedCount = 0;

    for (const event of problematicEvents) {
      const updateData = {};

      // Asignar valores por defecto
      if (!event.startTime) {
        updateData.startTime = "09:00";
      }
      if (!event.endTime) {
        updateData.endTime = "17:00";
      }
      if (!event.startDate) {
        updateData.startDate = event.createdAt;
      }
      if (!event.endDate) {
        updateData.endDate = event.createdAt;
      }

      // Actualizar el evento
      await prisma.service.update({
        where: { id: event.id },
        data: updateData,
      });

      updatedCount++;
      console.log(`✅ Actualizado: ${event.name}`);
    }

    console.log(`\n✅ Se actualizaron ${updatedCount} eventos exitosamente!\n`);

    // Verificación final
    const remainingProblems = await prisma.service.count({
      where: {
        OR: [
          { startTime: null },
          { endTime: null },
          { startDate: null },
          { endDate: null },
        ],
      },
    });

    if (remainingProblems === 0) {
      console.log("✅ VERIFICACIÓN: Todos los eventos están corregidos!\n");
    } else {
      console.log(
        `⚠️  ADVERTENCIA: Aún quedan ${remainingProblems} eventos con problemas\n`,
      );
    }
  } catch (error) {
    console.error("❌ Error al corregir eventos:", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
fixEventsWithNullTimes()
  .then(() => {
    console.log("🎉 Script completado exitosamente!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error fatal:", error);
    process.exit(1);
  });

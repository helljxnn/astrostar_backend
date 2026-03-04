import prisma from "../src/config/database.js";

/**
 * Script para asignar entrenadores a todos los equipos que no tienen
 *
 * Asignaciones sugeridas:
 * - Astrostar Infantil (1) → Carla Sanchez (2)
 * - Astrostar PreJuvenil (2) → Roberto Sánchez (3)
 * - Visitantes Infantil (4) → Diana Torres (4)
 * - Invitados PreJuvenil (5) → Miguel Ramírez (5)
 */

const assignments = [
  {
    teamId: 1,
    employeeId: 2,
    teamName: "Astrostar Infantil",
    coachName: "Carla Sanchez",
  },
  {
    teamId: 2,
    employeeId: 3,
    teamName: "Astrostar PreJuvenil",
    coachName: "Roberto Sánchez",
  },
  {
    teamId: 4,
    employeeId: 4,
    teamName: "Visitantes Infantil",
    coachName: "Diana Torres",
  },
  {
    teamId: 5,
    employeeId: 5,
    teamName: "Invitados PreJuvenil",
    coachName: "Miguel Ramírez",
  },
];

async function assignAllCoaches() {
  console.log("\n🔄 Asignando entrenadores a equipos...\n");

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const assignment of assignments) {
    try {
      // Verificar si ya tiene entrenador
      const existing = await prisma.teamMember.findFirst({
        where: {
          teamId: assignment.teamId,
          employeeId: { not: null },
          isActive: true,
        },
      });

      if (existing) {
        console.log(
          `⏭️  ${assignment.teamName} - Ya tiene entrenador asignado`,
        );
        skipCount++;
        continue;
      }

      // Asignar entrenador
      await prisma.teamMember.create({
        data: {
          teamId: assignment.teamId,
          employeeId: assignment.employeeId,
          memberType: "Employee",
          position: "Entrenador",
          isActive: true,
        },
      });

      console.log(`✅ ${assignment.teamName} → ${assignment.coachName}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error en ${assignment.teamName}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ Asignados: ${successCount}`);
  console.log(`   ⏭️  Omitidos (ya tenían): ${skipCount}`);
  console.log(`   ❌ Errores: ${errorCount}`);

  if (successCount > 0) {
    console.log(
      `\n🎉 ¡Listo! Ahora ${successCount} equipos más pueden recibir emails RSVP.`,
    );
  }

  await prisma.$disconnect();
}

assignAllCoaches();

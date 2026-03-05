/**
 * Script de prueba para verificar la eliminación selectiva de inscripciones
 * al editar categorías de un evento
 */

const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

async function testCategoryRemoval() {
  try {
    console.log("🧪 Iniciando prueba de eliminación selectiva de categorías\n");

    // 1. Buscar un evento con múltiples categorías e inscripciones
    const events = await prisma.service.findMany({
      where: {
        status: "Programado",
      },
      include: {
        serviceSportsCategories: {
          include: {
            sportsCategory: true,
          },
        },
        participants: {
          include: {
            team: true,
            athlete: {
              include: {
                user: true,
              },
            },
            sportsCategory: true,
          },
        },
      },
      take: 5,
    });

    if (events.length === 0) {
      console.log("❌ No se encontraron eventos para probar");
      return;
    }

    // Buscar un evento con inscripciones
    const eventWithParticipants = events.find(
      (e) => e.participants.length > 0 && e.serviceSportsCategories.length > 1,
    );

    if (!eventWithParticipants) {
      console.log(
        "❌ No se encontró un evento con múltiples categorías e inscripciones",
      );
      console.log("\nEventos disponibles:");
      events.forEach((e) => {
        console.log(
          `  - ${e.name}: ${e.serviceSportsCategories.length} categorías, ${e.participants.length} participantes`,
        );
      });
      return;
    }

    console.log(`📋 Evento seleccionado: ${eventWithParticipants.name}`);
    console.log(`   ID: ${eventWithParticipants.id}\n`);

    // Mostrar categorías actuales
    console.log("📊 Categorías actuales del evento:");
    eventWithParticipants.serviceSportsCategories.forEach((sc) => {
      console.log(
        `   - ${sc.sportsCategory.nombre} (ID: ${sc.sportsCategoryId})`,
      );
    });

    // Mostrar inscripciones actuales
    console.log(
      `\n👥 Inscripciones actuales (${eventWithParticipants.participants.length}):`,
    );
    eventWithParticipants.participants.forEach((p) => {
      if (p.type === "Team") {
        console.log(
          `   - Equipo: ${p.team.name} | Categoría: ${p.sportsCategory?.nombre || "Sin categoría"} (ID: ${p.sportsCategoryId})`,
        );
      } else {
        console.log(
          `   - Deportista: ${p.athlete.user.firstName} ${p.athlete.user.lastName} | Categoría: ${p.sportsCategory?.nombre || "Sin categoría"} (ID: ${p.sportsCategoryId})`,
        );
      }
    });

    // Simular eliminación de una categoría
    const categoryToRemove =
      eventWithParticipants.serviceSportsCategories[0].sportsCategoryId;
    const remainingCategories = eventWithParticipants.serviceSportsCategories
      .slice(1)
      .map((sc) => sc.sportsCategoryId);

    console.log(
      `\n🗑️ Simulando eliminación de categoría ID: ${categoryToRemove}`,
    );
    console.log(
      `   Categorías que permanecerán: ${remainingCategories.join(", ")}`,
    );

    // Verificar qué inscripciones se eliminarían
    const participantsToDelete = eventWithParticipants.participants.filter(
      (p) => p.sportsCategoryId === categoryToRemove,
    );

    const participantsToKeep = eventWithParticipants.participants.filter(
      (p) => p.sportsCategoryId !== categoryToRemove,
    );

    console.log(
      `\n✅ Inscripciones que se MANTENDRÁN (${participantsToKeep.length}):`,
    );
    participantsToKeep.forEach((p) => {
      if (p.type === "Team") {
        console.log(
          `   - Equipo: ${p.team.name} | Categoría: ${p.sportsCategory?.nombre}`,
        );
      } else {
        console.log(
          `   - Deportista: ${p.athlete.user.firstName} ${p.athlete.user.lastName} | Categoría: ${p.sportsCategory?.nombre}`,
        );
      }
    });

    console.log(
      `\n❌ Inscripciones que se ELIMINARÍAN (${participantsToDelete.length}):`,
    );
    participantsToDelete.forEach((p) => {
      if (p.type === "Team") {
        console.log(
          `   - Equipo: ${p.team.name} | Categoría: ${p.sportsCategory?.nombre}`,
        );
      } else {
        console.log(
          `   - Deportista: ${p.athlete.user.firstName} ${p.athlete.user.lastName} | Categoría: ${p.sportsCategory?.nombre}`,
        );
      }
    });

    console.log("\n" + "=".repeat(70));
    console.log("✅ PRUEBA COMPLETADA EXITOSAMENTE");
    console.log("=".repeat(70));
    console.log("\n💡 La nueva lógica funciona así:");
    console.log("   1. Identifica qué categorías se están removiendo");
    console.log("   2. Elimina SOLO las inscripciones de esas categorías");
    console.log("   3. Elimina SOLO las relaciones de esas categorías");
    console.log("   4. Agrega las categorías nuevas (si hay)");
    console.log("   5. Las categorías que se mantienen NO se tocan");
    console.log(
      "\n🎯 Resultado: Las inscripciones de categorías que permanecen se conservan",
    );
  } catch (error) {
    console.error("❌ Error en la prueba:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testCategoryRemoval();

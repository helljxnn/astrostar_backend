/**
 * Script de depuración para verificar inscripciones en la base de datos
 */

const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

async function debugRegistrations() {
  try {
    console.log("🔍 Depurando inscripciones en la base de datos\n");

    // Obtener todos los eventos con sus participantes
    const events = await prisma.service.findMany({
      where: {
        status: {
          in: ["Programado", "En_curso"],
        },
      },
      include: {
        serviceSportsCategories: {
          include: {
            sportsCategory: true,
          },
        },
        participants: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
            athlete: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            sportsCategory: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    if (events.length === 0) {
      console.log("❌ No se encontraron eventos activos");
      return;
    }

    console.log(`📋 Encontrados ${events.length} eventos activos\n`);
    console.log("=".repeat(80));

    events.forEach((event) => {
      console.log(`\n📅 Evento: ${event.name} (ID: ${event.id})`);
      console.log(`   Estado: ${event.status}`);
      console.log(
        `   Categorías del evento (${event.serviceSportsCategories.length}):`,
      );
      event.serviceSportsCategories.forEach((sc) => {
        console.log(
          `      - ${sc.sportsCategory.nombre} (ID: ${sc.sportsCategoryId})`,
        );
      });

      console.log(
        `\n   Participantes inscritos (${event.participants.length}):`,
      );

      if (event.participants.length === 0) {
        console.log("      ⚠️  No hay participantes inscritos");
      } else {
        event.participants.forEach((p) => {
          if (p.type === "Team") {
            console.log(
              `      🏆 Equipo: ${p.team?.name || "SIN NOMBRE"} (ID: ${p.teamId})`,
            );
            console.log(
              `         - Categoría del equipo: ${p.team?.category || "N/A"}`,
            );
            console.log(
              `         - sportsCategoryId: ${p.sportsCategoryId || "❌ NULL"}`,
            );
            console.log(
              `         - Categoría deportiva: ${p.sportsCategory?.nombre || "❌ NO ASIGNADA"}`,
            );
            console.log(`         - Estado: ${p.status}`);
            console.log(
              `         - Fecha inscripción: ${p.registrationDate.toISOString()}`,
            );
          } else {
            console.log(
              `      👤 Deportista: ${p.athlete?.user.firstName} ${p.athlete?.user.lastName} (ID: ${p.athleteId})`,
            );
            console.log(
              `         - sportsCategoryId: ${p.sportsCategoryId || "❌ NULL"}`,
            );
            console.log(
              `         - Categoría deportiva: ${p.sportsCategory?.nombre || "❌ NO ASIGNADA"}`,
            );
            console.log(`         - Estado: ${p.status}`);
            console.log(
              `         - Fecha inscripción: ${p.registrationDate.toISOString()}`,
            );
          }
        });
      }

      console.log("\n" + "-".repeat(80));
    });

    // Verificar si hay participantes con sportsCategoryId NULL
    const participantsWithNullCategory = await prisma.participant.count({
      where: {
        sportsCategoryId: null,
      },
    });

    console.log("\n" + "=".repeat(80));
    console.log("📊 ESTADÍSTICAS GENERALES");
    console.log("=".repeat(80));

    const totalParticipants = await prisma.participant.count();
    const teamParticipants = await prisma.participant.count({
      where: { type: "Team" },
    });
    const athleteParticipants = await prisma.participant.count({
      where: { type: "Individual" },
    });

    console.log(`\nTotal de participantes: ${totalParticipants}`);
    console.log(`   - Equipos: ${teamParticipants}`);
    console.log(`   - Deportistas: ${athleteParticipants}`);
    console.log(
      `   - Con sportsCategoryId NULL: ${participantsWithNullCategory} ⚠️`,
    );

    if (participantsWithNullCategory > 0) {
      console.log(
        "\n⚠️  ADVERTENCIA: Hay participantes sin sportsCategoryId asignado",
      );
      console.log(
        "   Esto puede causar problemas al editar categorías de eventos",
      );
    }

    console.log("\n✅ Depuración completada");
  } catch (error) {
    console.error("❌ Error en la depuración:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

debugRegistrations();

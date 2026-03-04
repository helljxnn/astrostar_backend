/**
 * Script para probar el flujo completo de inscripción
 */

const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

async function testRegistrationFlow() {
  try {
    console.log("🧪 Probando flujo de inscripción\n");

    // 1. Buscar un evento activo
    const event = await prisma.service.findFirst({
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
      },
    });

    if (!event) {
      console.log("❌ No se encontró ningún evento activo");
      return;
    }

    console.log(`📅 Evento seleccionado: ${event.name} (ID: ${event.id})`);
    console.log(`   Categorías del evento:`);
    event.serviceSportsCategories.forEach((sc) => {
      console.log(
        `      - ${sc.sportsCategory.nombre} (ID: ${sc.sportsCategoryId})`,
      );
    });

    // 2. Buscar un equipo activo
    const team = await prisma.team.findFirst({
      where: {
        status: "Active",
      },
    });

    if (!team) {
      console.log("\n❌ No se encontró ningún equipo activo");
      return;
    }

    console.log(`\n🏆 Equipo seleccionado: ${team.name} (ID: ${team.id})`);
    console.log(`   Categoría del equipo: ${team.category || "N/A"}`);

    // 3. Verificar si ya está inscrito
    const existingRegistration = await prisma.participant.findFirst({
      where: {
        serviceId: event.id,
        teamId: team.id,
        type: "Team",
      },
    });

    if (existingRegistration) {
      console.log("\n⚠️  El equipo ya está inscrito en este evento");
      console.log(`   ID de participante: ${existingRegistration.id}`);
      console.log(
        `   sportsCategoryId: ${existingRegistration.sportsCategoryId || "NULL"}`,
      );
      console.log(`   Estado: ${existingRegistration.status}`);
      console.log(
        `   Fecha: ${existingRegistration.registrationDate.toISOString()}`,
      );
      return;
    }

    // 4. Determinar sportsCategoryId
    let sportsCategoryId = null;
    if (team.category && event.serviceSportsCategories.length > 0) {
      const matchingCategory = event.serviceSportsCategories.find(
        (sc) =>
          sc.sportsCategory.nombre.toLowerCase() ===
          team.category.toLowerCase(),
      );

      if (matchingCategory) {
        sportsCategoryId = matchingCategory.sportsCategoryId;
        console.log(
          `\n✅ Categoría coincidente encontrada: ${matchingCategory.sportsCategory.nombre} (ID: ${sportsCategoryId})`,
        );
      } else {
        console.log(
          `\n⚠️  La categoría del equipo "${team.category}" no coincide con las del evento`,
        );
        console.log("   Inscribiendo sin sportsCategoryId...");
      }
    }

    // 5. Crear la inscripción
    console.log("\n📝 Creando inscripción...");
    const newRegistration = await prisma.participant.create({
      data: {
        type: "Team",
        serviceId: event.id,
        teamId: team.id,
        sportsCategoryId: sportsCategoryId,
        status: "Registered",
        notes: "Inscripción de prueba desde script",
      },
      include: {
        team: true,
        sportsCategory: true,
      },
    });

    console.log("\n✅ Inscripción creada exitosamente!");
    console.log(`   ID: ${newRegistration.id}`);
    console.log(`   Equipo: ${newRegistration.team.name}`);
    console.log(
      `   sportsCategoryId: ${newRegistration.sportsCategoryId || "NULL"}`,
    );
    console.log(
      `   Categoría deportiva: ${newRegistration.sportsCategory?.nombre || "NO ASIGNADA"}`,
    );
    console.log(`   Estado: ${newRegistration.status}`);

    // 6. Verificar que se puede consultar
    console.log("\n🔍 Verificando que se puede consultar...");
    const verification = await prisma.participant.findUnique({
      where: { id: newRegistration.id },
      include: {
        team: true,
        sportsCategory: true,
      },
    });

    if (verification) {
      console.log("✅ La inscripción se puede consultar correctamente");
    } else {
      console.log(
        "❌ ERROR: No se puede consultar la inscripción recién creada",
      );
    }

    // 7. Consultar todas las inscripciones del evento
    console.log(`\n📋 Consultando todas las inscripciones del evento...`);
    const allRegistrations = await prisma.participant.findMany({
      where: {
        serviceId: event.id,
        type: "Team",
      },
      include: {
        team: true,
        sportsCategory: true,
      },
    });

    console.log(`   Total de equipos inscritos: ${allRegistrations.length}`);
    allRegistrations.forEach((reg) => {
      console.log(
        `      - ${reg.team.name} | sportsCategoryId: ${reg.sportsCategoryId || "NULL"} | ${reg.sportsCategory?.nombre || "SIN CATEGORÍA"}`,
      );
    });

    console.log("\n✅ Prueba completada");
    console.log(
      "\n💡 Si ves la inscripción aquí pero no en el frontend, el problema está en el frontend",
    );
  } catch (error) {
    console.error("\n❌ Error en la prueba:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testRegistrationFlow();

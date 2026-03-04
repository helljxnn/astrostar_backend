import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

async function testAvailableAthletes() {
  try {
    console.log("🔍 Probando funcionalidad de deportistas disponibles...\n");

    // Obtener eventos disponibles
    const events = await prisma.service.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        _count: {
          select: {
            participants: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });

    console.log("🎯 Eventos disponibles:");
    events.forEach((event) => {
      console.log(
        `   ${event.id}: ${event.name} (${event.status}) - ${event._count.participants} participantes`
      );
    });
    console.log("");

    // Probar con el evento de Clausura (ID 2)
    const eventId = 2;
    console.log(
      `🔍 Probando deportistas disponibles para evento ${eventId} (Clausura 2025)...\n`
    );

    // Consulta completa como en el repositorio
    const availableAthletes = await prisma.athlete.findMany({
      where: {
        status: "Active",
        currentInscriptionStatus: "Active",
        participants: {
          none: {
            serviceId: eventId,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            secondLastName: true,
            identification: true,
            email: true,
            phoneNumber: true,
            birthDate: true,
            age: true,
            documentType: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        inscriptions: {
          where: {
            status: "Active",
          },
          include: {
            sportsCategory: {
              select: {
                id: true,
                nombre: true,
                edadMinima: true,
                edadMaxima: true,
              },
            },
          },
          orderBy: {
            inscriptionDate: "desc",
          },
          take: 1,
        },
        guardian: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: [{ user: { firstName: "asc" } }, { user: { lastName: "asc" } }],
    });

    console.log(
      `📊 Total de deportistas disponibles: ${availableAthletes.length}\n`
    );

    // Agrupar por categoría
    const byCategory = {};
    availableAthletes.forEach((athlete) => {
      const currentInscription = athlete.inscriptions[0];
      const categoryName =
        currentInscription?.sportsCategory?.nombre || "Sin categoría";

      if (!byCategory[categoryName]) {
        byCategory[categoryName] = [];
      }
      byCategory[categoryName].push(athlete);
    });

    // Mostrar por categoría
    Object.keys(byCategory).forEach((categoryName) => {
      console.log(
        `🏆 Categoría ${categoryName} (${byCategory[categoryName].length} deportistas):`
      );

      byCategory[categoryName].forEach((athlete, index) => {
        const currentInscription = athlete.inscriptions[0];
        const fullName = `${athlete.user.firstName} ${
          athlete.user.middleName || ""
        } ${athlete.user.lastName} ${athlete.user.secondLastName || ""}`
          .replace(/\s+/g, " ")
          .trim();

        console.log(`   ${index + 1}. ${fullName}`);
        console.log(`      • ID: ${athlete.id}`);
        console.log(`      • Edad: ${athlete.user.age} años`);
        console.log(`      • Identificación: ${athlete.user.identification}`);
        console.log(`      • Email: ${athlete.user.email}`);
        console.log(`      • Estado: ${athlete.status}`);
        console.log(`      • Inscripción: ${athlete.currentInscriptionStatus}`);

        if (athlete.guardian) {
          console.log(
            `      • Acudiente: ${athlete.guardian.firstName} ${athlete.guardian.lastName}`
          );
        }
        console.log("");
      });
    });

    // Probar búsqueda por nombre
    console.log("🔍 Probando búsqueda por nombre 'Sofia'...\n");

    const searchResults = await prisma.athlete.findMany({
      where: {
        status: "Active",
        currentInscriptionStatus: "Active",
        user: {
          OR: [
            { firstName: { contains: "Sofia", mode: "insensitive" } },
            { lastName: { contains: "Sofia", mode: "insensitive" } },
          ],
        },
        participants: {
          none: {
            serviceId: eventId,
          },
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            age: true,
            identification: true,
          },
        },
        inscriptions: {
          where: { status: "Active" },
          include: {
            sportsCategory: {
              select: {
                nombre: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    console.log(
      `📊 Resultados de búsqueda 'Sofia': ${searchResults.length} deportistas`
    );
    searchResults.forEach((athlete, index) => {
      const currentInscription = athlete.inscriptions[0];
      console.log(
        `   ${index + 1}. ${athlete.user.firstName} ${athlete.user.lastName}`
      );
      console.log(`      • Edad: ${athlete.user.age} años`);
      console.log(
        `      • Categoría: ${
          currentInscription?.sportsCategory?.nombre || "N/A"
        }`
      );
    });

    console.log("\n✅ ¡Todas las pruebas completadas exitosamente!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testAvailableAthletes();

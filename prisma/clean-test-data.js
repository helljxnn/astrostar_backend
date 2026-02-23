/**
 * SCRIPT PARA LIMPIAR DATOS DE PRUEBA
 *
 * Este script elimina todos los datos de prueba creados por seed-complete.js
 * manteniendo los datos maestros del sistema (tipos de documento, roles, admin, etc.)
 */

import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Iniciando limpieza de datos de prueba...\n");

  try {
    // Eliminar en orden para respetar las relaciones de foreign keys

    console.log("📝 Eliminando inscripciones a eventos...");
    const deletedParticipants = await prisma.participant.deleteMany({
      where: {
        OR: [{ type: "Team" }, { type: "Individual" }],
      },
    });
    console.log(`   ✓ ${deletedParticipants.count} inscripciones eliminadas\n`);

    console.log("📅 Eliminando eventos de prueba...");
    const deletedEvents = await prisma.service.deleteMany({
      where: {
        name: {
          contains: "Astrostar 2024",
        },
      },
    });
    console.log(`   ✓ ${deletedEvents.count} eventos eliminados\n`);

    console.log("👥 Eliminando miembros de equipos...");
    const deletedTeamMembers = await prisma.teamMember.deleteMany({});
    console.log(`   ✓ ${deletedTeamMembers.count} miembros eliminados\n`);

    console.log("🏆 Eliminando equipos...");
    const deletedTeams = await prisma.team.deleteMany({
      where: {
        OR: [
          { name: { contains: "Astrostar" } },
          { name: { contains: "Visitantes" } },
          { name: { contains: "Invitados" } },
        ],
      },
    });
    console.log(`   ✓ ${deletedTeams.count} equipos eliminados\n`);

    console.log("👤 Eliminando personas temporales...");
    const deletedTempPersons = await prisma.temporaryPerson.deleteMany({
      where: {
        email: {
          contains: "@temp.com",
        },
      },
    });
    console.log(
      `   ✓ ${deletedTempPersons.count} personas temporales eliminadas\n`,
    );

    console.log("📋 Eliminando inscripciones deportivas...");
    const deletedInscriptions = await prisma.inscription.deleteMany({
      where: {
        concept: {
          contains: "Inscripción inicial",
        },
      },
    });
    console.log(
      `   ✓ ${deletedInscriptions.count} inscripciones deportivas eliminadas\n`,
    );

    console.log("📄 Eliminando matrículas...");
    const deletedEnrollments = await prisma.enrollment.deleteMany({});
    console.log(`   ✓ ${deletedEnrollments.count} matrículas eliminadas\n`);

    console.log("⚽ Eliminando deportistas de prueba...");
    const deletedAthletes = await prisma.athlete.deleteMany({
      where: {
        user: {
          identification: {
            startsWith: "100",
          },
        },
      },
    });
    console.log(`   ✓ ${deletedAthletes.count} deportistas eliminados\n`);

    console.log("👔 Eliminando empleados de prueba...");
    const deletedEmployees = await prisma.employee.deleteMany({
      where: {
        user: {
          email: {
            contains: "@astrostar.com",
          },
        },
      },
    });
    console.log(`   ✓ ${deletedEmployees.count} empleados eliminados\n`);

    console.log("👤 Eliminando usuarios de prueba...");
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        OR: [
          { identification: { startsWith: "100" } },
          { identification: { startsWith: "80" } },
          { identification: { startsWith: "52" } },
          { email: { contains: "@astrostar.com" } },
        ],
        NOT: {
          email: "astrostar.java@gmail.com", // Mantener admin
        },
      },
    });
    console.log(`   ✓ ${deletedUsers.count} usuarios eliminados\n`);

    console.log("👨‍👩‍👧‍👦 Eliminando acudientes de prueba...");
    const deletedGuardians = await prisma.guardian.deleteMany({
      where: {
        identification: {
          in: ["52123456", "80234567", "52345678", "80456789", "52567890"],
        },
      },
    });
    console.log(`   ✓ ${deletedGuardians.count} acudientes eliminados\n`);

    console.log("🎉 Limpieza completada exitosamente!\n");
    console.log("📊 Resumen:");
    console.log(`   • Inscripciones a eventos: ${deletedParticipants.count}`);
    console.log(`   • Eventos: ${deletedEvents.count}`);
    console.log(`   • Miembros de equipos: ${deletedTeamMembers.count}`);
    console.log(`   • Equipos: ${deletedTeams.count}`);
    console.log(`   • Personas temporales: ${deletedTempPersons.count}`);
    console.log(`   • Inscripciones deportivas: ${deletedInscriptions.count}`);
    console.log(`   • Matrículas: ${deletedEnrollments.count}`);
    console.log(`   • Deportistas: ${deletedAthletes.count}`);
    console.log(`   • Empleados: ${deletedEmployees.count}`);
    console.log(`   • Usuarios: ${deletedUsers.count}`);
    console.log(`   • Acudientes: ${deletedGuardians.count}`);
    console.log("\n💡 Los datos maestros del sistema se mantuvieron intactos.");
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Error en limpieza:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import prisma from "../src/config/database.js";

/**
 * Script para asignar un entrenador (Employee) a un equipo
 *
 * Uso:
 * 1. Modificar las variables teamId y employeeId abajo
 * 2. Ejecutar: node scripts/assign-coach-to-team.js
 */

// ============================================
// CONFIGURACIÓN - Modificar estos valores
// ============================================
const TEAM_ID = 1; // ID del equipo (ej: Astrostar Infantil = 1)
const EMPLOYEE_ID = 1; // ID del empleado que será entrenador

// ============================================

async function assignCoach() {
  try {
    console.log("\n🔍 Verificando datos...\n");

    // 1. Verificar que el equipo existe
    const team = await prisma.team.findUnique({
      where: { id: TEAM_ID },
    });

    if (!team) {
      console.error(`❌ Error: No existe equipo con ID ${TEAM_ID}`);
      return;
    }

    console.log(`✅ Equipo encontrado: ${team.name}`);

    // 2. Verificar que el empleado existe
    const employee = await prisma.employee.findUnique({
      where: { id: EMPLOYEE_ID },
      include: {
        user: true,
      },
    });

    if (!employee) {
      console.error(`❌ Error: No existe empleado con ID ${EMPLOYEE_ID}`);
      return;
    }

    console.log(
      `✅ Empleado encontrado: ${employee.user.firstName} ${employee.user.lastName}`,
    );
    console.log(`   Email: ${employee.user.email}`);

    // 3. Verificar si ya existe un entrenador asignado
    const existingCoach = await prisma.teamMember.findFirst({
      where: {
        teamId: TEAM_ID,
        employeeId: { not: null },
        isActive: true,
      },
      include: {
        employee: {
          include: { user: true },
        },
      },
    });

    if (existingCoach) {
      console.log(`\n⚠️  El equipo ya tiene un entrenador asignado:`);
      console.log(
        `   ${existingCoach.employee.user.firstName} ${existingCoach.employee.user.lastName}`,
      );
      console.log(
        `\n¿Deseas reemplazarlo? (Modifica el script para desactivar el anterior)`,
      );
      return;
    }

    // 4. Crear el TeamMember
    console.log(`\n🔄 Asignando entrenador al equipo...`);

    const teamMember = await prisma.teamMember.create({
      data: {
        teamId: TEAM_ID,
        employeeId: EMPLOYEE_ID,
        memberType: "Employee",
        position: "Entrenador",
        isActive: true,
      },
    });

    console.log(`\n✅ ¡Entrenador asignado exitosamente!`);
    console.log(`   Equipo: ${team.name}`);
    console.log(
      `   Entrenador: ${employee.user.firstName} ${employee.user.lastName}`,
    );
    console.log(`   Email: ${employee.user.email}`);
    console.log(
      `\n📧 Ahora este equipo podrá recibir emails RSVP cuando se inscriba a eventos.`,
    );
  } catch (error) {
    console.error("\n❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
assignCoach();

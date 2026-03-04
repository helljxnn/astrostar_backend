import prisma from "../src/config/database.js";

const teams = await prisma.team.findMany({
  where: { status: "Active" },
  include: {
    members: {
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        temporaryPerson: true,
      },
    },
  },
  take: 10,
});

console.log("\n📋 Análisis de Equipos y Entrenadores:\n");

teams.forEach((team) => {
  console.log(`\n🏆 Equipo: ${team.name}`);
  console.log(`   Total miembros: ${team.members.length}`);

  const coaches = team.members.filter((m) => m.employeeId);
  const temporalCoaches = team.members.filter(
    (m) => m.temporaryPersonId && !m.employeeId,
  );

  if (coaches.length > 0) {
    console.log(`   ✅ Entrenadores (Employee):`);
    coaches.forEach((c) => {
      console.log(
        `      - ${c.employee.user.firstName} ${c.employee.user.lastName} (${c.employee.user.email})`,
      );
    });
  } else {
    console.log(`   ❌ NO tiene entrenadores (Employee)`);
  }

  if (temporalCoaches.length > 0) {
    console.log(`   ⚠️  Entrenadores temporales (NO enviarán email):`);
    temporalCoaches.forEach((c) => {
      console.log(
        `      - ${c.temporaryPerson.firstName} ${c.temporaryPerson.lastName}`,
      );
    });
  }
});

console.log("\n\n📊 Resumen:");
const teamsWithCoach = teams.filter((t) => t.members.some((m) => m.employeeId));
const teamsWithoutCoach = teams.filter(
  (t) => !t.members.some((m) => m.employeeId),
);

console.log(
  `   ✅ Equipos con entrenador (Employee): ${teamsWithCoach.length}`,
);
console.log(
  `   ❌ Equipos SIN entrenador (Employee): ${teamsWithoutCoach.length}`,
);

if (teamsWithoutCoach.length > 0) {
  console.log("\n   Equipos que NO recibirán emails RSVP:");
  teamsWithoutCoach.forEach((t) => console.log(`      - ${t.name}`));
}

await prisma.$disconnect();

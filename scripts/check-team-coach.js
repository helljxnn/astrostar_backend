import prisma from "../src/config/database.js";

async function checkTeamCoach() {
  const team = await prisma.team.findUnique({
    where: { id: 1 },
    include: {
      members: {
        where: {
          employeeId: { not: null },
          isActive: true,
        },
        include: {
          employee: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  console.log("\n🔍 Equipo:", team.name);
  console.log("📋 Miembros con employeeId:", team.members.length);

  if (team.members.length > 0) {
    team.members.forEach((member) => {
      console.log(`\n✅ Entrenador encontrado:`);
      console.log(
        `   Nombre: ${member.employee.user.firstName} ${member.employee.user.lastName}`,
      );
      console.log(`   Email: ${member.employee.user.email}`);
      console.log(`   Employee ID: ${member.employeeId}`);
      console.log(`   Is Active: ${member.isActive}`);
    });
  } else {
    console.log("\n❌ NO tiene entrenador asignado (employeeId)");
  }

  await prisma.$disconnect();
}

checkTeamCoach();

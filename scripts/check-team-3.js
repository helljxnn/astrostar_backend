import prisma from "../src/config/database.js";

const team = await prisma.team.findUnique({
  where: { id: 3 },
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
console.log("📋 Entrenadores en BD:");
team.members.forEach((m) => {
  console.log(`   - ${m.employee.user.firstName} ${m.employee.user.lastName}`);
  console.log(`     Email: ${m.employee.user.email}`);
  console.log(`     Employee ID: ${m.employeeId}`);
  console.log(`     Is Active: ${m.isActive}`);
});

await prisma.$disconnect();

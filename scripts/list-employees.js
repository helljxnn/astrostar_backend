import prisma from "../src/config/database.js";

const employees = await prisma.employee.findMany({
  where: {
    status: "Activo",
  },
  include: {
    user: true,
  },
  take: 20,
});

console.log("\n👥 Empleados disponibles para asignar como entrenadores:\n");

employees.forEach((emp) => {
  console.log(`ID: ${emp.id} - ${emp.user.firstName} ${emp.user.lastName}`);
  console.log(`   Email: ${emp.user.email}`);
  console.log(`   Teléfono: ${emp.user.phoneNumber}`);
  console.log("");
});

console.log(`\n📊 Total: ${employees.length} empleados activos`);

await prisma.$disconnect();

import prisma from "../src/config/database.js";

async function list() {
  const teams = await prisma.team.findMany({
    where: { status: "Active" },
    take: 5,
  });

  const events = await prisma.service.findMany({
    where: { status: { not: "Finalizado" } },
    take: 5,
  });

  console.log("\n📋 Equipos disponibles:");
  teams.forEach((t) => console.log(`   ID:${t.id} - ${t.name}`));

  console.log("\n📅 Eventos disponibles:");
  events.forEach((e) => console.log(`   ID:${e.id} - ${e.name} (${e.status})`));

  await prisma.$disconnect();
}

list();

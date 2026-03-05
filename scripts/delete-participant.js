import prisma from "../src/config/database.js";

await prisma.participant.deleteMany({
  where: { serviceId: 1, teamId: 3 },
});

console.log("✅ Inscripción eliminada");
await prisma.$disconnect();

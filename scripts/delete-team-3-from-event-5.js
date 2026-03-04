import prisma from "../src/config/database.js";

await prisma.participant.deleteMany({
  where: { serviceId: 5, teamId: 3 },
});

console.log("✅ Inscripción eliminada (Equipo 3, Evento 5)");
await prisma.$disconnect();

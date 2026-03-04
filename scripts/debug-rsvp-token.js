import prisma from "../src/config/database.js";

// Token de la URL en la imagen
const token =
  "7608050af6462079b26e95b49bd71caa4c462bec7dd8befc245bcb1ef9e092e1";

console.log("\n🔍 Buscando invitación con token:", token);
console.log("Longitud del token:", token.length);

try {
  // Buscar invitación
  const invitation = await prisma.eventInvitation.findUnique({
    where: { token },
    include: {
      participant: {
        include: {
          service: true,
          athlete: { include: { user: true } },
          team: { include: { members: true } },
        },
      },
    },
  });

  if (!invitation) {
    console.log("\n❌ No se encontró invitación con ese token");

    // Buscar todas las invitaciones para comparar
    const allInvitations = await prisma.eventInvitation.findMany({
      select: {
        id: true,
        token: true,
        status: true,
        recipientEmail: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    console.log("\n📋 Últimas 5 invitaciones en la base de datos:");
    allInvitations.forEach((inv) => {
      console.log(`\nID: ${inv.id}`);
      console.log(`Token: ${inv.token}`);
      console.log(`Token length: ${inv.token.length}`);
      console.log(`Status: ${inv.status}`);
      console.log(`Email: ${inv.recipientEmail}`);
      console.log(`Creado: ${inv.createdAt}`);
    });
  } else {
    console.log("\n✅ Invitación encontrada:");
    console.log("ID:", invitation.id);
    console.log("Status:", invitation.status);
    console.log("Email:", invitation.recipientEmail);
    console.log("Nombre:", invitation.recipientName);
    console.log("Tipo:", invitation.invitationType);
    console.log("Expira:", invitation.expiresAt);
    console.log("Respondido:", invitation.respondedAt);

    if (invitation.participant) {
      console.log("\n📊 Participante:");
      console.log("Tipo:", invitation.participant.type);
      console.log("Evento:", invitation.participant.service?.name);
    }

    // Verificar si expiró
    const now = new Date();
    const expired = now > invitation.expiresAt;
    console.log("\n⏰ Estado de expiración:");
    console.log("Ahora:", now);
    console.log("Expira:", invitation.expiresAt);
    console.log("¿Expirado?:", expired ? "SÍ" : "NO");
  }
} catch (error) {
  console.error("\n❌ Error:", error);
} finally {
  await prisma.$disconnect();
}

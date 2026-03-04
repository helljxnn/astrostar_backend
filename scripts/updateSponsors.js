/**
 * Script para actualizar los patrocinadores en la base de datos
 * para que coincidan con los del frontend
 */

import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

async function updateSponsors() {
  console.log("🔄 Actualizando patrocinadores...\n");

  try {
    // Eliminar patrocinadores antiguos
    console.log("🗑️  Eliminando patrocinadores antiguos...");
    await prisma.sponsor.deleteMany({});
    console.log("   ✓ Patrocinadores antiguos eliminados\n");

    // Crear nuevos patrocinadores
    console.log("➕ Creando nuevos patrocinadores...");
    const sponsors = await prisma.sponsor.createMany({
      data: [
        {
          name: "Natipan",
          description: "Empresa de productos alimenticios",
          contactEmail: "contacto@natipan.com",
          phone: "+57 300 1234567",
          status: "Active"
        },
        {
          name: "Ponymalta",
          description: "Bebida maltada nutritiva",
          contactEmail: "patrocinios@ponymalta.com",
          phone: "+57 300 7654321",
          status: "Active"
        },
        {
          name: "NovaSport",
          description: "Marca de artículos deportivos",
          contactEmail: "marketing@novasport.com",
          phone: "+57 301 1112233",
          status: "Active"
        },
        {
          name: "Adidas",
          description: "Marca internacional de ropa y calzado deportivo",
          contactEmail: "ventas@adidas.com",
          phone: "+57 302 4445566",
          status: "Active"
        }
      ]
    });

    console.log(`   ✓ ${sponsors.count} patrocinadores creados\n`);

    // Mostrar patrocinadores actuales
    const allSponsors = await prisma.sponsor.findMany({
      orderBy: { name: 'asc' }
    });

    console.log("📋 Patrocinadores actuales:");
    allSponsors.forEach(sponsor => {
      console.log(`   • ${sponsor.name} - ${sponsor.description}`);
    });

    console.log("\n✅ Patrocinadores actualizados exitosamente");

  } catch (error) {
    console.error("❌ Error al actualizar patrocinadores:", error);
    throw error;
  }
}

updateSponsors()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

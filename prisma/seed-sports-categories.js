/**
 * SEED DE CATEGORÍAS DEPORTIVAS
 */

import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  console.log("⚽ Creando categorías deportivas...\n");

  const categories = [
    {
      nombre: "Infantil",
      edadMinima: 10,
      edadMaxima: 12,
      descripcion: "Categoría para niños de 10 a 12 años",
      estado: "Activo",
      publicar: true,
    },
    {
      nombre: "PreJuvenil",
      edadMinima: 13,
      edadMaxima: 15,
      descripcion: "Categoría para jóvenes de 13 a 15 años",
      estado: "Activo",
      publicar: true,
    },
    {
      nombre: "Juvenil",
      edadMinima: 16,
      edadMaxima: 18,
      descripcion: "Categoría para jóvenes de 16 a 18 años",
      estado: "Activo",
      publicar: true,
    },
  ];

  // Verificar si ya existen categorías
  const existingCategories = await prisma.sportsCategory.findMany();
  
  if (existingCategories.length === 0) {
    await prisma.sportsCategory.createMany({
      data: categories,
      skipDuplicates: true,
    });
    console.log(`   ✓ ${categories.length} categorías deportivas creadas\n`);
  } else {
    console.log(`   ℹ️  Ya existen ${existingCategories.length} categorías deportivas\n`);
  }

  console.log("🎉 Seed de categorías completado!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

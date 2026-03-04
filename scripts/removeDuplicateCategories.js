/**
 * Script para eliminar categorías deportivas duplicadas
 * Mantiene solo la primera ocurrencia de cada categoría
 */

import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

async function removeDuplicates() {
  console.log("🔍 Buscando categorías deportivas duplicadas...\n");

  try {
    // Obtener todas las categorías
    const allCategories = await prisma.sportsCategory.findMany({
      orderBy: { id: 'asc' }
    });

    console.log(`📊 Total de categorías encontradas: ${allCategories.length}`);

    // Agrupar por nombre
    const categoryGroups = {};
    allCategories.forEach(cat => {
      if (!categoryGroups[cat.nombre]) {
        categoryGroups[cat.nombre] = [];
      }
      categoryGroups[cat.nombre].push(cat);
    });

    // Identificar duplicados
    let duplicatesFound = 0;
    const idsToDelete = [];

    for (const [nombre, categories] of Object.entries(categoryGroups)) {
      if (categories.length > 1) {
        console.log(`\n⚠️  Categoría "${nombre}" tiene ${categories.length} duplicados:`);
        categories.forEach((cat, index) => {
          console.log(`   ${index + 1}. ID: ${cat.id} - Creado: ${cat.createdAt}`);
        });

        // Mantener el primero, eliminar el resto
        const toDelete = categories.slice(1);
        toDelete.forEach(cat => {
          idsToDelete.push(cat.id);
          duplicatesFound++;
        });
      }
    }

    if (idsToDelete.length === 0) {
      console.log("\n✅ No se encontraron categorías duplicadas");
      return;
    }

    console.log(`\n🗑️  Se eliminarán ${idsToDelete.length} categorías duplicadas...`);

    // Eliminar duplicados
    const result = await prisma.sportsCategory.deleteMany({
      where: {
        id: {
          in: idsToDelete
        }
      }
    });

    console.log(`\n✅ Se eliminaron ${result.count} categorías duplicadas exitosamente`);

    // Mostrar categorías restantes
    const remainingCategories = await prisma.sportsCategory.findMany({
      orderBy: { nombre: 'asc' }
    });

    console.log(`\n📋 Categorías deportivas actuales (${remainingCategories.length}):`);
    remainingCategories.forEach(cat => {
      console.log(`   • ${cat.nombre} (${cat.edadMinima}-${cat.edadMaxima} años) - ID: ${cat.id}`);
    });

  } catch (error) {
    console.error("❌ Error al eliminar duplicados:", error);
    throw error;
  }
}

removeDuplicates()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

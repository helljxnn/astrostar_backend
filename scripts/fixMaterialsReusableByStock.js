import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

async function fixMaterials() {
  try {
    console.log("🔄 Actualizando campo esReutilizable basado en stock...\n");

    // Obtener todos los materiales
    const materials = await prisma.material.findMany({
      select: {
        id: true,
        nombre: true,
        stockFundacion: true,
        stockEventos: true,
        esReutilizable: true,
      },
    });

    console.log(`📊 Total de materiales: ${materials.length}\n`);

    let updated = 0;

    for (const material of materials) {
      let shouldBeReusable = null;

      // Si tiene stock en Fundación, es reutilizable
      if (material.stockFundacion > 0) {
        shouldBeReusable = true;
      }
      // Si solo tiene stock en Eventos, es consumible
      else if (material.stockEventos > 0 && material.stockFundacion === 0) {
        shouldBeReusable = false;
      }
      // Si no tiene stock en ninguno, mantener el valor actual o null
      else {
        shouldBeReusable = material.esReutilizable;
      }

      // Solo actualizar si el valor cambió
      if (
        shouldBeReusable !== null &&
        shouldBeReusable !== material.esReutilizable
      ) {
        await prisma.material.update({
          where: { id: material.id },
          data: { esReutilizable: shouldBeReusable },
        });

        console.log(
          `✅ ${material.nombre}: ${material.esReutilizable} → ${shouldBeReusable} (Fundación: ${material.stockFundacion}, Eventos: ${material.stockEventos})`,
        );
        updated++;
      }
    }

    console.log(`\n📈 Resumen:`);
    console.log(`   - Materiales actualizados: ${updated}`);
    console.log(`   - Materiales sin cambios: ${materials.length - updated}`);

    // Verificar resultado final
    const reusableCount = await prisma.material.count({
      where: { esReutilizable: true },
    });

    const consumableCount = await prisma.material.count({
      where: { esReutilizable: false },
    });

    const nullCount = await prisma.material.count({
      where: { esReutilizable: null },
    });

    console.log(`\n📊 Estado final:`);
    console.log(`   - Reutilizables: ${reusableCount}`);
    console.log(`   - Consumibles: ${consumableCount}`);
    console.log(`   - Sin definir: ${nullCount}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixMaterials();

import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

async function updateMaterials() {
  try {
    console.log("🔄 Actualizando campo esReutilizable en materiales...\n");

    // Materiales REUTILIZABLES (a usar) - tienen stock en Fundación
    const reusableMaterials = [
      "Balón de Fútbol #5",
      "Balón de Fútbol #4",
      "Balón de Baloncesto",
      "Balón de Voleibol",
      "Balón Medicinal 3kg",
      "Conos de Entrenamiento",
      "Aros de Coordinación",
      "Red de Voleibol",
      "Arco de Fútbol Portátil",
      "Colchoneta de Gimnasia",
      "Cuerda para Saltar",
      "Pesas de 2kg",
      "Banda Elástica Resistencia",
      "Silla Plegable",
      "Mesa Plegable",
      "Carpa 3x3m",
      "Tarima Modular",
      "Valla de Seguridad",
      "Megáfono Portátil",
      "Cronómetro Digital",
      "Silbato Profesional",
      "Parlante Bluetooth",
      "Micrófono Inalámbrico",
      "Pizarra Táctica",
      "Planillero con Clip",
      "Botella Deportiva 1L",
      "Termo Deportivo 2L",
      "Cooler Portátil 20L",
    ];

    // Materiales CONSUMIBLES (a entregar) - se entregan y no se devuelven
    const consumableMaterials = [
      "Camiseta Deportiva Talla S",
      "Camiseta Deportiva Talla M",
      "Camiseta Deportiva Talla L",
      "Short Deportivo Talla M",
      "Medias Deportivas",
      "Peto de Entrenamiento",
      "Rodilleras",
      "Coderas",
      "Espinilleras",
      "Guantes de Arquero",
      "Casco Protector",
      "Marcadores Borrables",
      "Tarjetas Amarillas/Rojas",
      "Vasos Desechables",
    ];

    // Actualizar materiales reutilizables
    const resultReusable = await prisma.material.updateMany({
      where: {
        nombre: {
          in: reusableMaterials,
        },
      },
      data: {
        esReutilizable: true,
      },
    });

    console.log(
      `✅ Materiales REUTILIZABLES actualizados: ${resultReusable.count}`,
    );

    // Actualizar materiales consumibles
    const resultConsumable = await prisma.material.updateMany({
      where: {
        nombre: {
          in: consumableMaterials,
        },
      },
      data: {
        esReutilizable: false,
      },
    });

    console.log(
      `✅ Materiales CONSUMIBLES actualizados: ${resultConsumable.count}`,
    );

    // Verificar
    const reusableCount = await prisma.material.count({
      where: { esReutilizable: true },
    });

    const consumableCount = await prisma.material.count({
      where: { esReutilizable: false },
    });

    console.log(`\n📊 Resumen:`);
    console.log(`   - Materiales reutilizables: ${reusableCount}`);
    console.log(`   - Materiales consumibles: ${consumableCount}`);
    console.log(`   - Total: ${reusableCount + consumableCount}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateMaterials();

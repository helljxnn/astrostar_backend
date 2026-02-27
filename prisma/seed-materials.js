import { PrismaClient } from "../generated/prisma/index.js";
const prisma = new PrismaClient();

async function seedMaterials() {
  console.log("🌱 Iniciando seed de materiales...");

  try {
    // 1. Crear categorías de materiales
    console.log("📦 Creando categorías de materiales...");

    const categories = [
      {
        nombre: "Balones",
        descripcion: "Balones deportivos de diferentes disciplinas",
      },
      {
        nombre: "Equipamiento Deportivo",
        descripcion: "Equipos y accesorios para entrenamiento",
      },
      { nombre: "Uniformes", descripcion: "Uniformes y vestimenta deportiva" },
      { nombre: "Protección", descripcion: "Elementos de protección personal" },
      {
        nombre: "Mobiliario",
        descripcion: "Mobiliario para eventos y actividades",
      },
      {
        nombre: "Tecnología",
        descripcion: "Equipos tecnológicos y electrónicos",
      },
      {
        nombre: "Material Didáctico",
        descripcion: "Material educativo y de enseñanza",
      },
      { nombre: "Hidratación", descripcion: "Elementos para hidratación" },
    ];

    const createdCategories = [];
    for (const cat of categories) {
      const category = await prisma.materialCategory.upsert({
        where: { nombre: cat.nombre },
        update: {},
        create: cat,
      });
      createdCategories.push(category);
      console.log(`  ✓ Categoría creada: ${category.nombre}`);
    }

    // 2. Crear materiales por categoría
    console.log("\n🎯 Creando materiales...");

    const materials = [
      // Balones
      {
        nombre: "Balón de Fútbol #5",
        categoriaId: createdCategories[0].id,
        categoria: "Balones",
        descripcion: "Balón profesional de fútbol tamaño 5",
        unidadMedida: "unidad",
        stockFundacion: 25,
        stockEventos: 15,
      },
      {
        nombre: "Balón de Fútbol #4",
        categoriaId: createdCategories[0].id,
        categoria: "Balones",
        descripcion: "Balón de fútbol tamaño 4 para juveniles",
        unidadMedida: "unidad",
        stockFundacion: 20,
        stockEventos: 10,
      },
      {
        nombre: "Balón de Baloncesto",
        categoriaId: createdCategories[0].id,
        categoria: "Balones",
        descripcion: "Balón oficial de baloncesto",
        unidadMedida: "unidad",
        stockFundacion: 15,
        stockEventos: 8,
      },
      {
        nombre: "Balón de Voleibol",
        categoriaId: createdCategories[0].id,
        categoria: "Balones",
        descripcion: "Balón profesional de voleibol",
        unidadMedida: "unidad",
        stockFundacion: 12,
        stockEventos: 6,
      },
      {
        nombre: "Balón Medicinal 3kg",
        categoriaId: createdCategories[0].id,
        categoria: "Balones",
        descripcion: "Balón medicinal para entrenamiento",
        unidadMedida: "unidad",
        stockFundacion: 10,
        stockEventos: 5,
      },

      // Equipamiento Deportivo
      {
        nombre: "Conos de Entrenamiento",
        categoriaId: createdCategories[1].id,
        categoria: "Equipamiento Deportivo",
        descripcion: "Set de conos para marcación",
        unidadMedida: "set",
        stockFundacion: 30,
        stockEventos: 20,
      },
      {
        nombre: "Aros de Coordinación",
        categoriaId: createdCategories[1].id,
        categoria: "Equipamiento Deportivo",
        descripcion: "Aros para ejercicios de coordinación",
        unidadMedida: "set",
        stockFundacion: 15,
        stockEventos: 10,
      },
      {
        nombre: "Red de Voleibol",
        categoriaId: createdCategories[1].id,
        categoria: "Equipamiento Deportivo",
        descripcion: "Red profesional de voleibol",
        unidadMedida: "unidad",
        stockFundacion: 4,
        stockEventos: 2,
      },
      {
        nombre: "Arco de Fútbol Portátil",
        categoriaId: createdCategories[1].id,
        categoria: "Equipamiento Deportivo",
        descripcion: "Arco desmontable para entrenamiento",
        unidadMedida: "unidad",
        stockFundacion: 6,
        stockEventos: 4,
      },
      {
        nombre: "Colchoneta de Gimnasia",
        categoriaId: createdCategories[1].id,
        categoria: "Equipamiento Deportivo",
        descripcion: "Colchoneta acolchada para ejercicios",
        unidadMedida: "unidad",
        stockFundacion: 20,
        stockEventos: 10,
      },
      {
        nombre: "Cuerda para Saltar",
        categoriaId: createdCategories[1].id,
        categoria: "Equipamiento Deportivo",
        descripcion: "Cuerda ajustable para salto",
        unidadMedida: "unidad",
        stockFundacion: 40,
        stockEventos: 20,
      },
      {
        nombre: "Pesas de 2kg",
        categoriaId: createdCategories[1].id,
        categoria: "Equipamiento Deportivo",
        descripcion: "Par de pesas de 2kg",
        unidadMedida: "par",
        stockFundacion: 25,
        stockEventos: 10,
      },
      {
        nombre: "Banda Elástica Resistencia",
        categoriaId: createdCategories[1].id,
        categoria: "Equipamiento Deportivo",
        descripcion: "Banda elástica para entrenamiento",
        unidadMedida: "unidad",
        stockFundacion: 35,
        stockEventos: 15,
      },

      // Uniformes
      {
        nombre: "Camiseta Deportiva Talla S",
        categoriaId: createdCategories[2].id,
        categoria: "Uniformes",
        descripcion: "Camiseta deportiva talla S",
        unidadMedida: "unidad",
        stockFundacion: 30,
        stockEventos: 20,
      },
      {
        nombre: "Camiseta Deportiva Talla M",
        categoriaId: createdCategories[2].id,
        categoria: "Uniformes",
        descripcion: "Camiseta deportiva talla M",
        unidadMedida: "unidad",
        stockFundacion: 40,
        stockEventos: 25,
      },
      {
        nombre: "Camiseta Deportiva Talla L",
        categoriaId: createdCategories[2].id,
        categoria: "Uniformes",
        descripcion: "Camiseta deportiva talla L",
        unidadMedida: "unidad",
        stockFundacion: 35,
        stockEventos: 20,
      },
      {
        nombre: "Short Deportivo Talla M",
        categoriaId: createdCategories[2].id,
        categoria: "Uniformes",
        descripcion: "Short deportivo talla M",
        unidadMedida: "unidad",
        stockFundacion: 40,
        stockEventos: 25,
      },
      {
        nombre: "Medias Deportivas",
        categoriaId: createdCategories[2].id,
        categoria: "Uniformes",
        descripcion: "Par de medias deportivas",
        unidadMedida: "par",
        stockFundacion: 50,
        stockEventos: 30,
      },
      {
        nombre: "Peto de Entrenamiento",
        categoriaId: createdCategories[2].id,
        categoria: "Uniformes",
        descripcion: "Peto para identificación en entrenamientos",
        unidadMedida: "unidad",
        stockFundacion: 30,
        stockEventos: 20,
      },

      // Protección
      {
        nombre: "Rodilleras",
        categoriaId: createdCategories[3].id,
        categoria: "Protección",
        descripcion: "Par de rodilleras deportivas",
        unidadMedida: "par",
        stockFundacion: 25,
        stockEventos: 15,
      },
      {
        nombre: "Coderas",
        categoriaId: createdCategories[3].id,
        categoria: "Protección",
        descripcion: "Par de coderas protectoras",
        unidadMedida: "par",
        stockFundacion: 20,
        stockEventos: 10,
      },
      {
        nombre: "Espinilleras",
        categoriaId: createdCategories[3].id,
        categoria: "Protección",
        descripcion: "Par de espinilleras para fútbol",
        unidadMedida: "par",
        stockFundacion: 30,
        stockEventos: 20,
      },
      {
        nombre: "Guantes de Arquero",
        categoriaId: createdCategories[3].id,
        categoria: "Protección",
        descripcion: "Guantes profesionales de arquero",
        unidadMedida: "par",
        stockFundacion: 10,
        stockEventos: 5,
      },
      {
        nombre: "Casco Protector",
        categoriaId: createdCategories[3].id,
        categoria: "Protección",
        descripcion: "Casco para deportes de contacto",
        unidadMedida: "unidad",
        stockFundacion: 8,
        stockEventos: 4,
      },

      // Mobiliario
      {
        nombre: "Silla Plegable",
        categoriaId: createdCategories[4].id,
        categoria: "Mobiliario",
        descripcion: "Silla plegable para eventos",
        unidadMedida: "unidad",
        stockFundacion: 100,
        stockEventos: 80,
      },
      {
        nombre: "Mesa Plegable",
        categoriaId: createdCategories[4].id,
        categoria: "Mobiliario",
        descripcion: "Mesa plegable rectangular",
        unidadMedida: "unidad",
        stockFundacion: 20,
        stockEventos: 15,
      },
      {
        nombre: "Carpa 3x3m",
        categoriaId: createdCategories[4].id,
        categoria: "Mobiliario",
        descripcion: "Carpa desmontable 3x3 metros",
        unidadMedida: "unidad",
        stockFundacion: 8,
        stockEventos: 6,
      },
      {
        nombre: "Tarima Modular",
        categoriaId: createdCategories[4].id,
        categoria: "Mobiliario",
        descripcion: "Módulo de tarima para escenarios",
        unidadMedida: "unidad",
        stockFundacion: 12,
        stockEventos: 10,
      },
      {
        nombre: "Valla de Seguridad",
        categoriaId: createdCategories[4].id,
        categoria: "Mobiliario",
        descripcion: "Valla metálica para delimitación",
        unidadMedida: "unidad",
        stockFundacion: 40,
        stockEventos: 30,
      },

      // Tecnología
      {
        nombre: "Megáfono Portátil",
        categoriaId: createdCategories[5].id,
        categoria: "Tecnología",
        descripcion: "Megáfono con batería recargable",
        unidadMedida: "unidad",
        stockFundacion: 5,
        stockEventos: 3,
      },
      {
        nombre: "Cronómetro Digital",
        categoriaId: createdCategories[5].id,
        categoria: "Tecnología",
        descripcion: "Cronómetro deportivo digital",
        unidadMedida: "unidad",
        stockFundacion: 10,
        stockEventos: 6,
      },
      {
        nombre: "Silbato Profesional",
        categoriaId: createdCategories[5].id,
        categoria: "Tecnología",
        descripcion: "Silbato para árbitros",
        unidadMedida: "unidad",
        stockFundacion: 15,
        stockEventos: 10,
      },
      {
        nombre: "Parlante Bluetooth",
        categoriaId: createdCategories[5].id,
        categoria: "Tecnología",
        descripcion: "Parlante portátil para eventos",
        unidadMedida: "unidad",
        stockFundacion: 6,
        stockEventos: 4,
      },
      {
        nombre: "Micrófono Inalámbrico",
        categoriaId: createdCategories[5].id,
        categoria: "Tecnología",
        descripcion: "Micrófono inalámbrico con receptor",
        unidadMedida: "unidad",
        stockFundacion: 4,
        stockEventos: 3,
      },

      // Material Didáctico
      {
        nombre: "Pizarra Táctica",
        categoriaId: createdCategories[6].id,
        categoria: "Material Didáctico",
        descripcion: "Pizarra magnética para estrategias",
        unidadMedida: "unidad",
        stockFundacion: 8,
        stockEventos: 5,
      },
      {
        nombre: "Marcadores Borrables",
        categoriaId: createdCategories[6].id,
        categoria: "Material Didáctico",
        descripcion: "Set de marcadores para pizarra",
        unidadMedida: "set",
        stockFundacion: 20,
        stockEventos: 10,
      },
      {
        nombre: "Planillero con Clip",
        categoriaId: createdCategories[6].id,
        categoria: "Material Didáctico",
        descripcion: "Planillero para anotaciones",
        unidadMedida: "unidad",
        stockFundacion: 15,
        stockEventos: 10,
      },
      {
        nombre: "Tarjetas Amarillas/Rojas",
        categoriaId: createdCategories[6].id,
        categoria: "Material Didáctico",
        descripcion: "Set de tarjetas para árbitros",
        unidadMedida: "set",
        stockFundacion: 10,
        stockEventos: 8,
      },

      // Hidratación
      {
        nombre: "Botella Deportiva 1L",
        categoriaId: createdCategories[7].id,
        categoria: "Hidratación",
        descripcion: "Botella reutilizable de 1 litro",
        unidadMedida: "unidad",
        stockFundacion: 60,
        stockEventos: 40,
      },
      {
        nombre: "Termo Deportivo 2L",
        categoriaId: createdCategories[7].id,
        categoria: "Hidratación",
        descripcion: "Termo para bebidas frías/calientes",
        unidadMedida: "unidad",
        stockFundacion: 15,
        stockEventos: 10,
      },
      {
        nombre: "Cooler Portátil 20L",
        categoriaId: createdCategories[7].id,
        categoria: "Hidratación",
        descripcion: "Cooler para eventos",
        unidadMedida: "unidad",
        stockFundacion: 8,
        stockEventos: 6,
      },
      {
        nombre: "Vasos Desechables",
        categoriaId: createdCategories[7].id,
        categoria: "Hidratación",
        descripcion: "Paquete de vasos desechables",
        unidadMedida: "paquete",
        stockFundacion: 50,
        stockEventos: 30,
      },
    ];

    let createdCount = 0;
    for (const mat of materials) {
      try {
        const material = await prisma.material.upsert({
          where: {
            unique_material_per_category: {
              nombre: mat.nombre,
              categoriaId: mat.categoriaId,
            },
          },
          update: {},
          create: mat,
        });
        createdCount++;
        console.log(
          `  ✓ Material creado: ${material.nombre} (Stock Fundación: ${material.stockFundacion}, Stock Eventos: ${material.stockEventos})`,
        );
      } catch (error) {
        console.error(
          `  ✗ Error creando material ${mat.nombre}:`,
          error.message,
        );
      }
    }

    console.log(`\n✅ Seed completado exitosamente!`);
    console.log(`📊 Resumen:`);
    console.log(`   - Categorías creadas: ${createdCategories.length}`);
    console.log(`   - Materiales creados: ${createdCount}`);
    console.log(
      `\n💡 Los materiales están listos para ser asignados a eventos.`,
    );
  } catch (error) {
    console.error("❌ Error durante el seed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el seed
seedMaterials().catch((error) => {
  console.error("Error fatal:", error);
  process.exit(1);
});

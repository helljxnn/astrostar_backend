import prisma from "../config/database.js";

/**
 * Seeder para crear patrocinadores iniciales
 * Migra los patrocinadores hardcodeados del frontend a la base de datos
 */
async function seedSponsors() {
  try {
    console.log("🌱 Iniciando seeder de patrocinadores...");

    // Patrocinadores iniciales (los que estaban hardcodeados en el frontend)
    const sponsors = [];

    console.log(`📝 Creando ${sponsors.length} patrocinadores...`);

    for (const sponsorData of sponsors) {
      // Verificar si el patrocinador ya existe
      const existingSponsor = await prisma.sponsor.findFirst({
        where: {
          OR: [
            { name: sponsorData.name },
            { identification: sponsorData.identification },
          ],
        },
      });

      if (existingSponsor) {
        console.log(
          `⚠️  Patrocinador "${sponsorData.name}" ya existe, omitiendo...`
        );
        continue;
      }

      // Crear el patrocinador
      const createdSponsor = await prisma.sponsor.create({
        data: sponsorData,
      });

      console.log(
        `✅ Patrocinador "${createdSponsor.name}" creado exitosamente`
      );
    }

    console.log("🎉 Seeder de patrocinadores completado exitosamente!");
  } catch (error) {
    console.error("❌ Error en el seeder de patrocinadores:", error);
    throw error;
  }
}

/**
 * Función para ejecutar el seeder directamente
 */
async function runSeeder() {
  console.log("🚀 Iniciando ejecución del seeder...");
  try {
    await seedSponsors();
    console.log("✅ Seeder ejecutado exitosamente");
  } catch (error) {
    console.error("❌ Error ejecutando seeder:", error);
    process.exit(1);
  } finally {
    console.log("🔌 Desconectando Prisma...");
    await prisma.$disconnect();
    console.log("👋 Proceso terminado");
  }
}

// Ejecutar siempre (para testing)
console.log("📋 Archivo de seeder cargado");
runSeeder();

export { seedSponsors };


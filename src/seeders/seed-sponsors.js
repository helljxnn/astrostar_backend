import prisma from "../config/database.js";

/**
 * Seeder para crear patrocinadores iniciales
 * Migra los patrocinadores hardcodeados del frontend a la base de datos
 */
async function seedSponsors() {
  try {
    console.log("🌱 Iniciando seeder de patrocinadores...");

    // Patrocinadores iniciales (los que estaban hardcodeados en el frontend)
    const sponsors = [
      {
        name: "Natipan",
        type: "Sponsor",
        personType: "Juridica",
        documentType: "NIT",
        identification: "900123456-1",
        contactName: "Representante Natipan",
        city: "Bogotá",
        country: "Colombia",
        description: "Empresa de productos alimenticios",
        contactEmail: "contacto@natipan.com",
        phone: "+57 1 234 5678",
        address: "Calle 123 #45-67, Bogotá",
        status: "Active",
      },
      {
        name: "Ponymalta",
        type: "Sponsor",
        personType: "Juridica",
        documentType: "NIT",
        identification: "900234567-2",
        contactName: "Representante Ponymalta",
        city: "Medellín",
        country: "Colombia",
        description: "Empresa de bebidas y productos lácteos",
        contactEmail: "contacto@ponymalta.com",
        phone: "+57 4 234 5678",
        address: "Carrera 45 #67-89, Medellín",
        status: "Active",
      },
      {
        name: "NovaSport",
        type: "Sponsor",
        personType: "Juridica",
        documentType: "NIT",
        identification: "900345678-3",
        contactName: "Representante NovaSport",
        city: "Cali",
        country: "Colombia",
        description: "Tienda de artículos deportivos",
        contactEmail: "contacto@novasport.com",
        phone: "+57 2 234 5678",
        address: "Avenida 6 #12-34, Cali",
        status: "Active",
      },
      {
        name: "Adidas",
        type: "Sponsor",
        personType: "Juridica",
        documentType: "NIT",
        identification: "900456789-4",
        contactName: "Representante Adidas Colombia",
        city: "Bogotá",
        country: "Colombia",
        description: "Marca internacional de artículos deportivos",
        contactEmail: "contacto@adidas.com.co",
        phone: "+57 1 345 6789",
        address: "Centro Comercial Andino, Bogotá",
        status: "Active",
      },
    ];

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

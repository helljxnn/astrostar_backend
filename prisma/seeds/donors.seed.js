import { PrismaClient } from "../../generated/prisma/index.js";

const prisma = new PrismaClient();

const donors = [
  {
    name: "María González Pérez",
    description: "Donante recurrente, apoya programas deportivos juveniles",
    contactEmail: "maria.gonzalez@email.com",
    phone: "3001234567",
    status: "Active",
    type: "Donor",
    personType: "Natural",
    documentType: "CC",
    identification: "1234567890",
    contactName: "María González Pérez",
    address: "Calle 45 #23-12",
    city: "Bogotá",
    country: "Colombia",
  },
  {
    name: "Carlos Andrés Rodríguez",
    description: "Empresario local, donante de materiales deportivos",
    contactEmail: "carlos.rodriguez@email.com",
    phone: "3109876543",
    status: "Active",
    type: "Donor",
    personType: "Natural",
    documentType: "CC",
    identification: "9876543210",
    contactName: "Carlos Andrés Rodríguez",
    address: "Carrera 15 #78-34",
    city: "Medellín",
    country: "Colombia",
  },
  {
    name: "Fundación Deportes para Todos",
    description:
      "Organización sin ánimo de lucro dedicada al deporte comunitario",
    contactEmail: "contacto@deportesparatodos.org",
    phone: "6012345678",
    status: "Active",
    type: "Donor",
    personType: "Legal",
    documentType: "NIT",
    identification: "900123456-7",
    contactName: "Ana María López",
    address: "Avenida 68 #45-23",
    city: "Bogotá",
    country: "Colombia",
  },
  {
    name: "Laura Patricia Martínez",
    description: "Madre de familia, apoya programas de natación",
    contactEmail: "laura.martinez@email.com",
    phone: "3157654321",
    status: "Active",
    type: "Donor",
    personType: "Natural",
    documentType: "CC",
    identification: "5432167890",
    contactName: "Laura Patricia Martínez",
    address: "Calle 100 #15-45",
    city: "Cali",
    country: "Colombia",
  },
  {
    name: "Empresa Deportiva S.A.S.",
    description: "Empresa privada que apoya el deporte juvenil",
    contactEmail: "donaciones@empresadeportiva.com",
    phone: "6047654321",
    status: "Active",
    type: "Donor",
    personType: "Legal",
    documentType: "NIT",
    identification: "800987654-3",
    contactName: "Roberto Sánchez",
    address: "Carrera 43A #12-34",
    city: "Medellín",
    country: "Colombia",
  },
  {
    name: "Jorge Luis Ramírez",
    description: "Exatleta, donante de equipamiento deportivo",
    contactEmail: "jorge.ramirez@email.com",
    phone: "3201234567",
    status: "Active",
    type: "Donor",
    personType: "Natural",
    documentType: "CC",
    identification: "7890123456",
    contactName: "Jorge Luis Ramírez",
    address: "Calle 85 #30-15",
    city: "Barranquilla",
    country: "Colombia",
  },
  {
    name: "Corporación Vida Activa",
    description: "ONG enfocada en promover estilos de vida saludables",
    contactEmail: "info@vidaactiva.org",
    phone: "6023456789",
    status: "Active",
    type: "Donor",
    personType: "Legal",
    documentType: "NIT",
    identification: "900765432-1",
    contactName: "Diana Carolina Torres",
    address: "Transversal 23 #56-78",
    city: "Bogotá",
    country: "Colombia",
  },
  {
    name: "Anónimo",
    description: "Donante anónimo recurrente",
    contactEmail: null,
    phone: null,
    status: "Active",
    type: "Donor",
    personType: "Natural",
    documentType: "CC",
    identification: "0000000000",
    contactName: "Anónimo",
    address: null,
    city: null,
    country: "Colombia",
  },
  {
    name: "Patricia Gómez Silva",
    description: "Profesora de educación física, apoya programas escolares",
    contactEmail: "patricia.gomez@email.com",
    phone: "3189876543",
    status: "Active",
    type: "Donor",
    personType: "Natural",
    documentType: "CC",
    identification: "3456789012",
    contactName: "Patricia Gómez Silva",
    address: "Carrera 7 #45-67",
    city: "Bucaramanga",
    country: "Colombia",
  },
  {
    name: "Grupo Empresarial Deportivo",
    description: "Conglomerado de empresas con responsabilidad social",
    contactEmail: "rse@grupodeportivo.com",
    phone: "6018765432",
    status: "Active",
    type: "Donor",
    personType: "Legal",
    documentType: "NIT",
    identification: "890654321-9",
    contactName: "Fernando Álvarez",
    address: "Calle 72 #10-34",
    city: "Bogotá",
    country: "Colombia",
  },
];

async function seedDonors() {
  console.log("🌱 Iniciando seed de donantes...");

  try {
    // Verificar si ya existen donantes
    const existingCount = await prisma.sponsor.count({
      where: { type: "Donor" },
    });

    if (existingCount > 0) {
      console.log(
        `⚠️  Ya existen ${existingCount} donantes en la base de datos.`,
      );
      console.log("¿Deseas continuar? Esto creará donantes adicionales.");
    }

    let created = 0;
    let skipped = 0;

    for (const donor of donors) {
      try {
        // Verificar si el donante ya existe por identificación
        const existing = await prisma.sponsor.findUnique({
          where: { identification: donor.identification },
        });

        if (existing) {
          console.log(`⏭️  Donante ya existe: ${donor.name}`);
          skipped++;
          continue;
        }

        await prisma.sponsor.create({
          data: donor,
        });

        console.log(`✅ Donante creado: ${donor.name}`);
        created++;
      } catch (error) {
        console.error(`❌ Error creando donante ${donor.name}:`, error.message);
      }
    }

    console.log("\n📊 Resumen:");
    console.log(`   ✅ Creados: ${created}`);
    console.log(`   ⏭️  Omitidos: ${skipped}`);
    console.log(
      `   📝 Total en DB: ${await prisma.sponsor.count({ where: { type: "Donor" } })}`,
    );
    console.log("\n✨ Seed de donantes completado!\n");
  } catch (error) {
    console.error("❌ Error en seed de donantes:", error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDonors()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export default seedDonors;

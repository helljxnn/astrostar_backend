// Aqui es donde se cargan datos iniciales en esas tablas (por ejemplo, los tipos de documento por defecto).
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.documentType.createMany({
    data: [
      { name: 'Cédula de Ciudadanía', code: 'CC' },
      { name: 'Tarjeta de Identidad', code: 'TI' },
      { name: 'Permiso de Permanencia', code: 'PP' },
      { name: 'Tarjeta de Extranjería', code: 'TE' },
      { name: 'Cédula de Extranjería', code: 'CE' },
      { name: 'Número de Identificación Tributaria', code: 'NIT' },
      { name: 'Pasaporte', code: 'PA' },
      { name: 'Número de Identificación Extranjero', code: 'NIE' },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Document types seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

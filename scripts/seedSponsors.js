import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function seedSponsors() {
  try {
    console.log('🌱 Iniciando seed de patrocinadores...');

    const sponsors = [
      { name: 'Natipan', description: 'Panadería y productos de consumo' },
      { name: 'Ponymalta', description: 'Bebida energética' },
      { name: 'NovaSport', description: 'Equipamiento deportivo' },
      { name: 'Adidas', description: 'Marca deportiva internacional' }
    ];

    let createdCount = 0;
    let existingCount = 0;

    for (const sponsor of sponsors) {
      const existing = await prisma.sponsor.findUnique({
        where: { name: sponsor.name }
      });

      if (existing) {
        existingCount++;
        console.log(`⏭️  Ya existe: ${sponsor.name}`);
      } else {
        await prisma.sponsor.create({
          data: sponsor
        });
        createdCount++;
        console.log(`✅ Creado: ${sponsor.name}`);
      }
    }

    console.log('\n✨ Seed completado:');
    console.log(`   - Patrocinadores creados: ${createdCount}`);
    console.log(`   - Patrocinadores existentes: ${existingCount}`);
    console.log(`   - Total: ${sponsors.length}`);

  } catch (error) {
    console.error('❌ Error en el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedSponsors()
  .then(() => {
    console.log('\n🎉 Proceso completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });

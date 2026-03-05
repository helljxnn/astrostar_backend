import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function migrateEventCategories() {
  try {
    console.log('🔄 Iniciando asignación de categorías a eventos...');

    // 1. Obtener todos los eventos existentes
    const events = await prisma.service.findMany({
      include: {
        ServiceCategory: true,
      },
    });

    console.log(`📊 Encontrados ${events.length} eventos`);

    // 2. Obtener la primera categoría disponible como categoría por defecto
    const defaultCategory = await prisma.sportsCategory.findFirst({
      where: {
        estado: 'Activo',
      },
      orderBy: {
        id: 'asc',
      },
    });

    if (!defaultCategory) {
      console.error('❌ No se encontró ninguna categoría activa en el sistema');
      console.log('💡 Por favor, crea al menos una categoría deportiva antes de ejecutar este script');
      return;
    }

    console.log(`📌 Categoría por defecto: ${defaultCategory.nombre} (ID: ${defaultCategory.id})`);

    // 3. Asignar categoría por defecto a eventos sin categorías
    let assignedCount = 0;
    let skippedCount = 0;

    for (const event of events) {
      // Verificar si el evento ya tiene categorías asignadas
      if (event.ServiceCategory && event.ServiceCategory.length > 0) {
        skippedCount++;
        console.log(`⏭️  Ya tiene categorías: ${event.name}`);
        continue;
      }

      try {
        // Asignar la categoría por defecto
        await prisma.serviceCategory.create({
          data: {
            serviceId: event.id,
            categoryId: defaultCategory.id,
          },
        });
        assignedCount++;
        console.log(`✅ Asignada categoría a: ${event.name}`);
      } catch (error) {
        if (error.code === 'P2002') {
          // Ya existe la relación
          skippedCount++;
          console.log(`⏭️  Ya tiene categoría: ${event.name}`);
        } else {
          console.error(`❌ Error asignando categoría a ${event.name}:`, error.message);
        }
      }
    }

    console.log('\n✨ Proceso completado:');
    console.log(`   - Eventos con categoría asignada: ${assignedCount}`);
    console.log(`   - Eventos que ya tenían categoría: ${skippedCount}`);
    console.log(`   - Total procesados: ${events.length}`);
    console.log(`\n💡 Nota: Puedes editar cada evento para asignar las categorías correctas`);

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar migración
migrateEventCategories()
  .then(() => {
    console.log('\n🎉 Proceso completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });

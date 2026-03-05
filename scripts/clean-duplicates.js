import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function cleanDuplicates() {
  try {
    console.log('🧹 Limpiando tipos de eventos duplicados...');
    
    // Obtener todos los tipos
    const allTypes = await prisma.serviceType.findMany({
      orderBy: { id: 'asc' }
    });
    
    // Agrupar por nombre y mantener solo el primero
    const seen = new Set();
    const toDelete = [];
    
    for (const type of allTypes) {
      if (seen.has(type.name)) {
        toDelete.push(type.id);
      } else {
        seen.add(type.name);
      }
    }
    
    if (toDelete.length > 0) {
      console.log(`   Eliminando ${toDelete.length} duplicados...`);
      await prisma.serviceType.deleteMany({
        where: {
          id: { in: toDelete }
        }
      });
      console.log('   ✓ Duplicados eliminados');
    } else {
      console.log('   ℹ️  No hay duplicados');
    }
    
    // Mostrar tipos restantes
    const remaining = await prisma.serviceType.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log('\n📋 Tipos de eventos actuales:');
    remaining.forEach(t => console.log(`   • ${t.name} (ID: ${t.id})`));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDuplicates();

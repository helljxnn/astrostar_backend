import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkEventTypes() {
  console.log('🔍 Verificando tipos de eventos...\n');
  
  // Obtener todos los tipos de eventos
  const serviceTypes = await prisma.serviceType.findMany();
  console.log('📋 Tipos de eventos en la base de datos:');
  serviceTypes.forEach(type => {
    console.log(`   - ID: ${type.id}, Nombre: ${type.name}`);
  });
  
  console.log('\n🎯 Verificando eventos existentes...\n');
  
  // Obtener todos los eventos con su tipo
  const services = await prisma.service.findMany({
    include: {
      ServiceType: true
    }
  });
  
  console.log(`📊 Total de eventos: ${services.length}\n`);
  
  if (services.length > 0) {
    console.log('Eventos:');
    services.forEach(service => {
      console.log(`   - ${service.name}`);
      console.log(`     Tipo ID: ${service.typeId}`);
      console.log(`     Tipo: ${service.ServiceType ? service.ServiceType.name : '❌ SIN TIPO'}`);
      console.log('');
    });
  } else {
    console.log('⚠️  No hay eventos en la base de datos');
  }
  
  // Verificar eventos sin tipo
  const eventsWithoutType = services.filter(s => !s.ServiceType);
  if (eventsWithoutType.length > 0) {
    console.log(`\n⚠️  ${eventsWithoutType.length} eventos sin tipo asignado:`);
    eventsWithoutType.forEach(event => {
      console.log(`   - ${event.name} (ID: ${event.id}, typeId: ${event.typeId})`);
    });
  }
}

checkEventTypes()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

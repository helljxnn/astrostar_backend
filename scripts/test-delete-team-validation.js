import prisma from '../src/config/database.js';

async function testDeleteTeamValidation() {
  try {
    console.log('🧪 Probando validación de eliminación de equipos...\n');

    // 1. Buscar todos los equipos
    const teams = await prisma.team.findMany({
      include: {
        participants: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                status: true
              }
            }
          }
        }
      }
    });

    console.log(`📊 Total equipos encontrados: ${teams.length}\n`);

    // 2. Verificar cada equipo
    for (const team of teams) {
      const eventCount = team.participants.length;
      
      console.log(`\n📋 Equipo: ${team.name} (ID: ${team.id})`);
      console.log(`   Estado: ${team.status}`);
      console.log(`   Tipo: ${team.teamType}`);
      
      if (eventCount > 0) {
        console.log(`   ⚠️  ASIGNADO A ${eventCount} EVENTO(S):`);
        team.participants.forEach(p => {
          console.log(`      - ${p.service.name} (${p.service.status})`);
        });
        console.log(`   ❌ NO SE PUEDE ELIMINAR`);
      } else {
        console.log(`   ✅ NO está asignado a eventos`);
        console.log(`   ✅ SE PUEDE ELIMINAR`);
      }
    }

    console.log('\n\n📝 Resumen:');
    const teamsWithEvents = teams.filter(t => t.participants.length > 0);
    const teamsWithoutEvents = teams.filter(t => t.participants.length === 0);
    
    console.log(`   - Equipos que NO se pueden eliminar: ${teamsWithEvents.length}`);
    console.log(`   - Equipos que SÍ se pueden eliminar: ${teamsWithoutEvents.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDeleteTeamValidation();

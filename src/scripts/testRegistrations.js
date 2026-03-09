import prisma from '../config/database.js';

/**
 * Script de prueba para verificar que el módulo de inscripciones funciona correctamente
 */

async function testRegistrations() {
  console.log('🧪 Iniciando pruebas del módulo de inscripciones...\n');

  try {
    // 1. Verificar que existen equipos
    console.log('1️⃣ Verificando equipos...');
    const teams = await prisma.team.findMany({
      where: { status: 'Active' },
      include: {
        _count: {
          select: { members: true }
        }
      }
    });
    
    if (teams.length === 0) {
      console.log('   ❌ No hay equipos. Ejecuta: npm run seed:teams');
      return;
    }
    
    console.log(`   ✅ ${teams.length} equipos encontrados`);
    teams.forEach(team => {
      console.log(`      - ${team.name} (${team._count.members} miembros)`);
    });

    // 2. Verificar que existen deportistas
    console.log('\n2️⃣ Verificando deportistas...');
    const athletes = await prisma.athlete.findMany({
      where: { status: 'Active' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      take: 5
    });
    
    console.log(`   ✅ ${athletes.length} deportistas encontrados (mostrando primeros 5)`);
    athletes.forEach(athlete => {
      console.log(`      - ${athlete.user.firstName} ${athlete.user.lastName} (${athlete.user.email})`);
    });

    // 3. Verificar miembros de equipos
    console.log('\n3️⃣ Verificando miembros de equipos...');
    const teamMembers = await prisma.teamMember.findMany({
      where: { isActive: true },
      include: {
        team: {
          select: { name: true }
        },
        athlete: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      take: 5
    });
    
    console.log(`   ✅ ${teamMembers.length} miembros activos (mostrando primeros 5)`);
    teamMembers.forEach(member => {
      const athleteName = member.athlete 
        ? `${member.athlete.user.firstName} ${member.athlete.user.lastName}`
        : 'N/A';
      console.log(`      - ${member.team.name}: ${athleteName} (#${member.jerseyNumber} - ${member.position})`);
    });

    // 4. Verificar eventos disponibles
    console.log('\n4️⃣ Verificando eventos...');
    const events = await prisma.service.findMany({
      where: { 
        status: 'Programado',
        publish: true
      },
      include: {
        sportsCategory: {
          select: { nombre: true }
        },
        ServiceType: {
          select: { name: true }
        }
      },
      take: 5
    });
    
    if (events.length === 0) {
      console.log('   ⚠️  No hay eventos programados. Crea algunos eventos para probar inscripciones.');
    } else {
      console.log(`   ✅ ${events.length} eventos disponibles`);
      events.forEach(event => {
        console.log(`      - ${event.name} (${event.ServiceType.name})`);
        console.log(`        Fecha: ${event.startDate.toLocaleDateString()} - ${event.endDate.toLocaleDateString()}`);
      });
    }

    // 5. Verificar inscripciones existentes
    console.log('\n5️⃣ Verificando inscripciones existentes...');
    const registrations = await prisma.participant.findMany({
      where: { type: 'Team' },
      include: {
        team: {
          select: { name: true }
        },
        service: {
          select: { name: true }
        }
      }
    });
    
    if (registrations.length === 0) {
      console.log('   ℹ️  No hay inscripciones aún. Usa la API para crear algunas.');
    } else {
      console.log(`   ✅ ${registrations.length} inscripciones encontradas`);
      registrations.forEach(reg => {
        console.log(`      - ${reg.team.name} → ${reg.service.name} (${reg.status})`);
      });
    }

    // 6. Verificar categorías deportivas
    console.log('\n6️⃣ Verificando categorías deportivas...');
    const categories = await prisma.sportsCategory.findMany({
      where: { estado: 'Activo' }
    });
    
    console.log(`   ✅ ${categories.length} categorías activas`);
    categories.forEach(cat => {
      console.log(`      - ${cat.nombre} (${cat.edadMinima}-${cat.edadMaxima} años)`);
    });

    // 7. Resumen y recomendaciones
    console.log('\n📊 RESUMEN:');
    console.log('─────────────────────────────────────────────────');
    console.log(`   Equipos activos:           ${teams.length}`);
    console.log(`   Deportistas activos:       ${athletes.length}`);
    console.log(`   Miembros de equipos:       ${teamMembers.length}`);
    console.log(`   Eventos disponibles:       ${events.length}`);
    console.log(`   Inscripciones existentes:  ${registrations.length}`);
    console.log(`   Categorías deportivas:     ${categories.length}`);
    console.log('─────────────────────────────────────────────────');

    // 8. Sugerencias
    console.log('\n💡 SUGERENCIAS:');
    
    if (teams.length === 0) {
      console.log('   ⚠️  Ejecuta el seeder: npm run seed:teams');
    }
    
    if (events.length === 0) {
      console.log('   ⚠️  Crea algunos eventos para poder hacer inscripciones');
    }
    
    if (teams.length > 0 && events.length > 0 && registrations.length === 0) {
      console.log('   💡 Prueba inscribir un equipo:');
      console.log('      POST /api/events/1/registrations/team');
      console.log('      Body: { "teamId": 1, "sportsCategoryId": 1 }');
    }

    // 9. Ejemplo de inscripción
    if (teams.length > 0 && events.length > 0) {
      console.log('\n📝 EJEMPLO DE INSCRIPCIÓN:');
      console.log('─────────────────────────────────────────────────');
      console.log('   curl -X POST http://localhost:3000/api/events/1/registrations/team \\');
      console.log('     -H "Content-Type: application/json" \\');
      console.log('     -d \'{"teamId": 1, "sportsCategoryId": 1, "notes": "Inscripción de prueba"}\'');
      console.log('─────────────────────────────────────────────────');
    }

    console.log('\n✅ Pruebas completadas exitosamente!\n');

  } catch (error) {
    console.error('\n❌ Error durante las pruebas:', error.message);
    console.error('\nDetalles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar pruebas
testRegistrations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });

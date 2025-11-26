import prisma from '../src/config/database.js';

async function testActivateTeam() {
  try {
    console.log('🧪 Probando validación al activar equipo temporal...\n');

    // 1. Buscar el equipo inactivo "equipo temporal"
    const inactiveTeam = await prisma.team.findFirst({
      where: {
        name: 'equipo temporal',
        status: 'Inactive'
      },
      include: {
        members: {
          where: { isActive: true },
          include: {
            temporaryPerson: true
          }
        }
      }
    });

    if (!inactiveTeam) {
      console.log('❌ No se encontró el equipo "equipo temporal" inactivo');
      return;
    }

    console.log(`📋 Equipo encontrado: ${inactiveTeam.name} (ID: ${inactiveTeam.id})`);
    console.log(`   Estado actual: ${inactiveTeam.status}`);
    console.log(`   Miembros temporales:`);
    
    const temporalMembers = inactiveTeam.members.filter(m => m.temporaryPerson);
    temporalMembers.forEach(m => {
      const person = m.temporaryPerson;
      console.log(`   - ${person.firstName} ${person.lastName} (ID: ${person.id})`);
    });

    // 2. Verificar si algún miembro está en otro equipo activo
    console.log('\n🔍 Verificando si hay conflictos...\n');

    const temporalMemberIds = temporalMembers.map(m => m.temporaryPersonId);
    
    for (const memberId of temporalMemberIds) {
      const otherMembership = await prisma.teamMember.findFirst({
        where: {
          temporaryPersonId: memberId,
          isActive: true,
          team: {
            status: 'Active',
            id: { not: inactiveTeam.id }
          }
        },
        include: {
          team: true,
          temporaryPerson: true
        }
      });

      if (otherMembership) {
        const person = otherMembership.temporaryPerson;
        const team = otherMembership.team;
        console.log(`⚠️  CONFLICTO: ${person.firstName} ${person.lastName} ya está en "${team.name}" (Activo)`);
      } else {
        const person = temporalMembers.find(m => m.temporaryPersonId === memberId).temporaryPerson;
        console.log(`✅ ${person.firstName} ${person.lastName} está disponible`);
      }
    }

    console.log('\n📝 Resumen:');
    console.log('   Si hay conflictos (⚠️), el equipo NO se podrá activar');
    console.log('   Si todos están disponibles (✅), el equipo SÍ se puede activar');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testActivateTeam();

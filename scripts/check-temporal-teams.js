import prisma from '../src/config/database.js';

async function checkTemporalTeams() {
  try {
    console.log('🔍 Verificando equipos temporales y sus miembros...\n');

    const teams = await prisma.team.findMany({
      where: {
        teamType: 'Temporal',
        status: 'Active'
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

    console.log(`📊 Total equipos temporales activos: ${teams.length}\n`);

    teams.forEach((team, index) => {
      console.log(`\n${index + 1}. Equipo: ${team.name} (ID: ${team.id})`);
      console.log(`   Estado: ${team.status}`);
      console.log(`   Categoría: ${team.category || 'N/A'}`);
      console.log(`   Miembros:`);
      
      team.members.forEach(member => {
        if (member.temporaryPerson) {
          const person = member.temporaryPerson;
          console.log(`   - ${person.firstName} ${person.lastName} (ID: ${person.id}) - ${member.position || 'Deportista'}`);
        }
      });
    });

    console.log('\n\n🔍 Verificando personas temporales específicas...\n');

    const personIds = [1, 2, 3];
    
    for (const personId of personIds) {
      const person = await prisma.temporaryPerson.findUnique({
        where: { id: personId }
      });

      if (person) {
        console.log(`\n👤 ${person.firstName} ${person.lastName} (ID: ${personId})`);
        console.log(`   Tipo: ${person.personType}`);
        console.log(`   Estado: ${person.status}`);
        console.log(`   Equipo asignado: ${person.team || 'Ninguno'}`);
        console.log(`   Categoría: ${person.category || 'N/A'}`);

        const memberships = await prisma.teamMember.findMany({
          where: {
            temporaryPersonId: personId,
            isActive: true
          },
          include: {
            team: true
          }
        });

        if (memberships.length > 0) {
          console.log(`   ✅ Está en ${memberships.length} equipo(s):`);
          memberships.forEach(m => {
            console.log(`      - ${m.team.name} (${m.team.status})`);
          });
        } else {
          console.log(`   ❌ NO está en ningún equipo activo`);
        }
      } else {
        console.log(`\n❌ Persona con ID ${personId} no existe`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTemporalTeams();

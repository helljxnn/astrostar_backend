import prisma from './src/config/database.js';

async function debugTeams() {
  try {
    console.log('🔍 Verificando estado de equipos en la BD...\n');
    
    const allTeams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        teamType: true,
        createdAt: true
      },
      orderBy: { id: 'asc' }
    });
    
    console.log('📊 Todos los equipos en la BD:');
    console.table(allTeams);
    
    const activeTeams = await prisma.team.findMany({
      where: { status: 'Active' },
      select: {
        id: true,
        name: true,
        status: true,
        teamType: true
      }
    });
    
    console.log('\n✅ Equipos activos:');
    console.table(activeTeams);
    
    const inactiveTeams = await prisma.team.findMany({
      where: { status: 'Inactive' },
      select: {
        id: true,
        name: true,
        status: true,
        teamType: true
      }
    });
    
    console.log('\n❌ Equipos inactivos:');
    console.table(inactiveTeams);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTeams();
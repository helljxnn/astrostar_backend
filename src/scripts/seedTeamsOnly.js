import { seedTeamsAndAthletes } from '../seeders/teamsAndAthletes.seeder.js';
import prisma from '../config/database.js';

/**
 * Script para ejecutar solo el seeder de equipos y deportistas
 */
const runTeamsSeed = async () => {
  try {
    console.log('🚀 Ejecutando seeder de equipos y deportistas...\n');
    
    await seedTeamsAndAthletes();
    
    console.log('\n✅ Seeder completado exitosamente');
  } catch (error) {
    console.error('❌ Error ejecutando seeder:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
};

// Ejecutar seeder
runTeamsSeed();


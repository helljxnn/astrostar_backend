import { createDefaultRoles } from '../seeders/defaultRoles.js';
import { seedTeamsAndAthletes } from '../seeders/teamsAndAthletes.seeder.js';

/**
 * Script para ejecutar todos los seeders
 */
const runSeeders = async () => {
  try {
    console.log('🚀 Iniciando seeders...');
    
    // Ejecutar seeder de roles por defecto
    await createDefaultRoles();
    
    // Ejecutar seeder de equipos y deportistas
    await seedTeamsAndAthletes();
    
    console.log('✅ Todos los seeders ejecutados exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando seeders:', error);
    process.exit(1);
  }
};

// Ejecutar seeders
runSeeders();
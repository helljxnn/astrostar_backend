import { createDefaultRoles } from '../seeders/defaultRoles.js';

/**
 * Script para ejecutar todos los seeders
 */
const runSeeders = async () => {
  try {
    console.log('🚀 Iniciando seeders...');
    
    // Ejecutar seeder de roles por defecto
    await createDefaultRoles();
    
    console.log('✅ Todos los seeders ejecutados exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando seeders:', error);
    process.exit(1);
  }
};

// Ejecutar seeders
runSeeders();
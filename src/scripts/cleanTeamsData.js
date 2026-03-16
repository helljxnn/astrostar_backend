import prisma from '../config/database.js';

/**
 * Script para limpiar datos de equipos y deportistas
 */
async function cleanTeamsData() {
  console.log('🧹 Iniciando limpieza de datos de equipos y deportistas...\n');

  try {
    // 1. Eliminar miembros de equipos
    console.log('🗑️  Eliminando miembros de equipos...');
    const deletedMembers = await prisma.teamMember.deleteMany({});
    console.log(`✅ ${deletedMembers.count} miembros eliminados`);

    // 2. Eliminar inscripciones de equipos
    console.log('🗑️  Eliminando inscripciones de equipos...');
    const deletedParticipants = await prisma.participant.deleteMany({
      where: { type: 'Team' }
    });
    console.log(`✅ ${deletedParticipants.count} inscripciones eliminadas`);

    // 3. Eliminar equipos
    console.log('🗑️  Eliminando equipos...');
    const deletedTeams = await prisma.team.deleteMany({});
    console.log(`✅ ${deletedTeams.count} equipos eliminados`);

    // 4. Eliminar inscripciones de atletas
    console.log('🗑️  Eliminando inscripciones de atletas...');
    const deletedAthleteInscriptions = await prisma.inscription.deleteMany({});
    console.log(`✅ ${deletedAthleteInscriptions.count} inscripciones de atletas eliminadas`);

    // 5. Eliminar atletas
    console.log('🗑️  Eliminando atletas...');
    const deletedAthletes = await prisma.athlete.deleteMany({});
    console.log(`✅ ${deletedAthletes.count} atletas eliminados`);

    // 6. Eliminar personas temporales
    console.log('🗑️  Eliminando personas temporales...');
    const deletedTempPersons = await prisma.temporaryPerson.deleteMany({});
    console.log(`✅ ${deletedTempPersons.count} personas temporales eliminadas`);

    // 7. Eliminar tutores
    console.log('🗑️  Eliminando tutores...');
    const deletedGuardians = await prisma.guardian.deleteMany({});
    console.log(`✅ ${deletedGuardians.count} tutores eliminados`);

    console.log('\n✅ Limpieza completada exitosamente');
    console.log('📊 Resumen:');
    console.log(`   - Miembros de equipos: ${deletedMembers.count}`);
    console.log(`   - Inscripciones: ${deletedParticipants.count}`);
    console.log(`   - Equipos: ${deletedTeams.count}`);
    console.log(`   - Inscripciones de atletas: ${deletedAthleteInscriptions.count}`);
    console.log(`   - Atletas: ${deletedAthletes.count}`);
    console.log(`   - Personas temporales: ${deletedTempPersons.count}`);
    console.log(`   - Tutores: ${deletedGuardians.count}`);

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar limpieza
cleanTeamsData()
  .then(() => {
    console.log('\n🎉 Proceso completado. Ahora puedes ejecutar el seed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });


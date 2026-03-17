import prisma from '../config/database.js';
import bcrypt from 'bcrypt';

/**
 * Seeder para crear equipos y deportistas de prueba
 * Esto permite probar las inscripciones a eventos mientras se desarrollan los módulos completos
 */
export async function seedTeamsAndAthletes() {
  console.log('🏃 Iniciando seed de equipos y deportistas...');

  try {
    // 1. Obtener tipos de documento disponibles
    const documentTypes = await prisma.documentType.findMany({
      take: 2, // Tomamos los primeros 2 tipos disponibles
    });

    if (documentTypes.length === 0) {
      console.log('⚠️  No hay tipos de documento. Creando tipos básicos...');
      const ccType = await prisma.documentType.create({
        data: {
          name: 'CC',
          description: 'Cédula de Ciudadanía',
        },
      });
      const tiType = await prisma.documentType.create({
        data: {
          name: 'TI',
          description: 'Tarjeta de Identidad',
        },
      });
      documentTypes.push(ccType, tiType);
      console.log('✅ Tipos de documento creados');
    }

    // Usar los tipos de documento disponibles
    const ccType = documentTypes[0]; // Primer tipo para adultos/tutores
    const tiType = documentTypes.length > 1 ? documentTypes[1] : documentTypes[0]; // Segundo tipo para menores

    console.log(`✅ Usando tipos de documento: ${ccType.name} y ${tiType.name}`);

    // 2. Obtener rol de deportista
    let athleteRole = await prisma.role.findFirst({
      where: { name: 'Deportista' },
    });

    if (!athleteRole) {
      athleteRole = await prisma.role.create({
        data: {
          name: 'Deportista',
          description: 'Rol para deportistas de la fundación',
          status: 'Active',
          permissions: {},
        },
      });
      console.log('✅ Rol de Deportista creado');
    }

    // 3. Obtener categorías deportivas
    const categories = await prisma.sportsCategory.findMany({
      where: { estado: 'Activo' },
      take: 3,
    });

    if (categories.length === 0) {
      console.log('⚠️  No hay categorías deportivas activas. Creando una de prueba...');
      const testCategory = await prisma.sportsCategory.create({
        data: {
          nombre: 'Categoría Sub-15',
          edadMinima: 12,
          edadMaxima: 15,
          descripcion: 'Categoría de prueba para deportistas entre 12 y 15 años',
          estado: 'Activo',
          publicar: true,
        },
      });
      categories.push(testCategory);
    }

    // 4. Crear tutores
    console.log('👨‍👩‍👧 Creando tutores...');
    const guardians = [];
    
    for (let i = 1; i <= 5; i++) {
      const guardian = await prisma.guardian.upsert({
        where: { identification: `1000${i}00000` },
        update: {},
        create: {
          firstName: `Tutor${i}`,
          lastName: `Apellido${i}`,
          identification: `1000${i}00000`,
          email: `tutor${i}@test.com`,
          phone: `300${i}000000`,
          address: `Calle ${i} #${i}-${i}`,
          occupation: i % 2 === 0 ? 'Ingeniero' : 'Docente',
          documentTypeId: ccType.id,
        },
      });
      guardians.push(guardian);
    }
    console.log(`✅ ${guardians.length} tutores creados`);

    // 5. Crear usuarios deportistas
    console.log('🏃 Creando deportistas...');
    const athletes = [];
    const passwordHash = await bcrypt.hash('Deportista123!', 10);

    for (let i = 1; i <= 15; i++) {
      const birthYear = 2010 + (i % 5); // Edades variadas
      const birthDate = new Date(`${birthYear}-0${(i % 9) + 1}-15`);
      const age = new Date().getFullYear() - birthYear;
      const guardian = guardians[i % guardians.length];

      const user = await prisma.user.upsert({
        where: { identification: `TI${10000 + i}` },
        update: {},
        create: {
          firstName: `Deportista${i}`,
          middleName: i % 3 === 0 ? `Segundo${i}` : null,
          lastName: `Apellido${i}`,
          secondLastName: i % 2 === 0 ? `SegundoApellido${i}` : null,
          email: `deportista${i}@test.com`,
          passwordHash,
          phoneNumber: `310${i}000000`,
          address: `Carrera ${i} #${i}-${i}`,
          birthDate,
          identification: `TI${10000 + i}`,
          documentTypeId: tiType.id,
          roleId: athleteRole.id,
          age,
          status: 'Active',
        },
      });

      const athlete = await prisma.athlete.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          status: 'Active',
          guardianId: age < 18 ? guardian.id : null,
          relationship: age < 18 ? (i % 2 === 0 ? 'Mother' : 'Father') : null,
          currentInscriptionStatus: 'Active',
        },
      });

      athletes.push({ ...athlete, user });
    }
    console.log(`✅ ${athletes.length} deportistas creados`);

    // 6. Crear inscripciones para algunos deportistas
    console.log('📝 Creando inscripciones...');
    for (let i = 0; i < Math.min(athletes.length, 10); i++) {
      const athlete = athletes[i];
      const category = categories[i % categories.length];
      
      await prisma.inscription.upsert({
        where: { 
          athleteId_sportsCategoryId: {
            athleteId: athlete.id,
            sportsCategoryId: category.id,
          }
        },
        update: {},
        create: {
          athleteId: athlete.id,
          sportsCategoryId: category.id,
          type: 'initial_inscription',
          status: 'Active',
          inscriptionDate: new Date(),
          conceptDate: new Date(),
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
          concept: `Inscripción inicial - ${category.nombre}`,
          notes: 'Inscripción de prueba generada por seeder',
        },
      });
    }
    console.log('✅ Inscripciones creadas');

    // 7. Crear equipos de la Fundación
    console.log('⚽ Creando equipos de la Fundación...');
    const teams = [];
    const foundationTeamsData = [
      { name: 'Tigres FC', coach: 'Carlos Rodríguez' },
      { name: 'Águilas Doradas', coach: 'María González' },
      { name: 'Leones del Norte', coach: 'Juan Martínez' },
      { name: 'Halcones Azules', coach: 'Ana López' },
      { name: 'Pumas Rojos', coach: 'Pedro Sánchez' },
      { name: 'Dragones Verdes', coach: 'Laura Ramírez' },
      { name: 'Lobos Grises', coach: 'Miguel Torres' },
      { name: 'Cóndores Blancos', coach: 'Sofia Herrera' },
    ];

    for (let i = 0; i < foundationTeamsData.length; i++) {
      const category = categories[i % categories.length];
      const teamData = foundationTeamsData[i];
      const team = await prisma.team.upsert({
        where: { name: teamData.name },
        update: {},
        create: {
          name: teamData.name,
          description: `Equipo de ${category.nombre} - Fundación AstroStar`,
          coach: teamData.coach,
          category: category.nombre,
          status: 'Active',
          teamType: 'Fundacion',
        },
      });
      teams.push(team);
    }
    console.log(`✅ ${teams.length} equipos de la Fundación creados`);

    // 7b. Crear equipos temporales
    console.log('⚽ Creando equipos temporales...');
    const temporalTeamsData = [
      { name: 'Estrellas Temporales', coach: 'Roberto Díaz' },
      { name: 'Cometas Rápidos', coach: 'Patricia Moreno' },
      { name: 'Meteoros Unidos', coach: 'Fernando Castro' },
      { name: 'Galaxia FC', coach: 'Claudia Vargas' },
      { name: 'Nebulosa Team', coach: 'Andrés Ruiz' },
      { name: 'Satélites Azules', coach: 'Diana Jiménez' },
    ];

    for (let i = 0; i < temporalTeamsData.length; i++) {
      const category = categories[i % categories.length];
      const teamData = temporalTeamsData[i];
      const team = await prisma.team.upsert({
        where: { name: teamData.name },
        update: {},
        create: {
          name: teamData.name,
          description: `Equipo temporal para evento especial - ${category.nombre}`,
          coach: teamData.coach,
          category: category.nombre,
          status: 'Active',
          teamType: 'Temporal',
        },
      });
      teams.push(team);
    }
    console.log(`✅ ${temporalTeamsData.length} equipos temporales creados`);

    // 8. Asignar deportistas a equipos de la Fundación
    console.log('👥 Asignando deportistas a equipos de la Fundación...');
    let memberCount = 0;
    const foundationTeams = teams.filter(t => t.teamType === 'Fundacion');

    for (let i = 0; i < foundationTeams.length; i++) {
      const team = foundationTeams[i];
      // Asignar entre 5 y 15 miembros por equipo
      const membersPerTeam = Math.floor(Math.random() * 11) + 5; // Random entre 5 y 15
      const startIdx = (i * 15) % athletes.length;
      
      for (let j = 0; j < membersPerTeam && (startIdx + j) < athletes.length; j++) {
        const athlete = athletes[(startIdx + j) % athletes.length];
        const positions = ['Delantero', 'Defensa', 'Mediocampista', 'Portero'];
        
        await prisma.teamMember.upsert({
          where: {
            unique_jersey_per_team: {
              teamId: team.id,
              jerseyNumber: j + 1,
            },
          },
          update: {},
          create: {
            teamId: team.id,
            athleteId: athlete.id,
            memberType: 'Athlete',
            position: positions[j % positions.length],
            jerseyNumber: j + 1,
            isActive: true,
          },
        });
        memberCount++;
      }
    }
    console.log(`✅ ${memberCount} miembros asignados a equipos de la Fundación`);

    // 9. Crear personas temporales
    console.log('👤 Creando personas temporales...');
    const tempPersons = [];

    for (let i = 1; i <= 10; i++) {
      const birthDate = new Date(`200${i % 9}-0${(i % 9) + 1}-15`);
      const age = new Date().getFullYear() - birthDate.getFullYear();

      const tempPerson = await prisma.temporaryPerson.upsert({
        where: { identification: `TEMP${10000 + i}` },
        update: {},
        create: {
          firstName: `Temporal${i}`,
          middleName: null,
          lastName: `Apellido${i}`,
          secondLastName: null,
          identification: `TEMP${10000 + i}`,
          email: `temporal${i}@test.com`,
          phone: `320${i}000000`,
          birthDate,
          age,
          address: `Dirección temporal ${i}`,
          documentTypeId: ccType.id,
          personType: 'Deportista',
          status: 'Active',
        },
      });
      tempPersons.push(tempPerson);
    }
    console.log(`✅ ${tempPersons.length} personas temporales creadas`);

    // 10. Asignar personas temporales a equipos temporales
    console.log('👥 Asignando personas temporales a equipos temporales...');
    const temporalTeams = teams.filter(t => t.teamType === 'Temporal');
    let tempMemberCount = 0;

    for (let i = 0; i < temporalTeams.length && i < tempPersons.length; i++) {
      const team = temporalTeams[i];
      const startIdx = i * 2;
      const teamTempPersons = tempPersons.slice(startIdx, startIdx + 2); // 2 personas por equipo temporal

      for (let j = 0; j < teamTempPersons.length; j++) {
        const tempPerson = teamTempPersons[j];
        
        await prisma.teamMember.upsert({
          where: {
            unique_jersey_per_team: {
              teamId: team.id,
              jerseyNumber: j + 10, // Números del 10 en adelante para temporales
            },
          },
          update: {},
          create: {
            teamId: team.id,
            temporaryPersonId: tempPerson.id,
            memberType: 'TemporaryPerson',
            position: j === 0 ? 'Delantero' : 'Medio',
            jerseyNumber: j + 10,
            isActive: true,
          },
        });
        tempMemberCount++;
      }
    }
    console.log(`✅ ${tempMemberCount} personas temporales asignadas a equipos temporales`);

    // 11. Resumen
    const foundationTeamsCount = teams.filter(t => t.teamType === 'Fundacion').length;
    const temporalTeamsCount = teams.filter(t => t.teamType === 'Temporal').length;
    
    console.log('\n📊 Resumen del seed:');
    console.log(`   - Tutores: ${guardians.length}`);
    console.log(`   - Deportistas: ${athletes.length}`);
    console.log(`   - Equipos de la Fundación: ${foundationTeamsCount}`);
    console.log(`   - Equipos Temporales: ${temporalTeamsCount}`);
    console.log(`   - Total de equipos: ${teams.length}`);
    console.log(`   - Miembros en equipos de Fundación: ${memberCount}`);
    console.log(`   - Personas temporales: ${tempPersons.length}`);
    console.log(`   - Miembros en equipos temporales: ${tempMemberCount}`);
    console.log('\n✅ Seed de equipos y deportistas completado exitosamente!');

    return {
      guardians,
      athletes,
      teams,
      tempPersons,
      memberCount,
      tempMemberCount,
    };
  } catch (error) {
    console.error('❌ Error en seed de equipos y deportistas:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTeamsAndAthletes()
    .then(() => {
      console.log('✅ Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}


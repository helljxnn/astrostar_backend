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

    // 7. Crear equipos
    console.log('⚽ Creando equipos...');
    const teams = [];
    const teamNames = [
      'Tigres FC',
      'Águilas Doradas',
      'Leones del Norte',
      'Halcones Azules',
      'Pumas Rojos',
    ];

    for (let i = 0; i < teamNames.length; i++) {
      const category = categories[i % categories.length];
      const team = await prisma.team.upsert({
        where: { name: teamNames[i] },
        update: {},
        create: {
          name: teamNames[i],
          description: `Equipo de ${category.nombre} - Fundación AstroStar`,
          coach: `Entrenador ${i + 1}`,
          category: category.nombre,
          status: 'Active',
          teamType: 'Fundacion',
        },
      });
      teams.push(team);
    }
    console.log(`✅ ${teams.length} equipos creados`);

    // 8. Asignar deportistas a equipos
    console.log('👥 Asignando deportistas a equipos...');
    let memberCount = 0;

    for (let i = 0; i < teams.length; i++) {
      const team = teams[i];
      const teamAthletes = athletes.slice(i * 3, (i * 3) + 3); // 3 deportistas por equipo

      for (let j = 0; j < teamAthletes.length; j++) {
        const athlete = teamAthletes[j];
        
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
            position: j === 0 ? 'Delantero' : j === 1 ? 'Defensa' : 'Portero',
            jerseyNumber: j + 1,
            isActive: true,
          },
        });
        memberCount++;
      }
    }
    console.log(`✅ ${memberCount} miembros asignados a equipos`);

    // 9. Crear algunas personas temporales
    console.log('👤 Creando personas temporales...');
    const tempPersons = [];

    for (let i = 1; i <= 5; i++) {
      const birthDate = new Date(`200${i}-05-15`);
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

    // 10. Resumen
    console.log('\n📊 Resumen del seed:');
    console.log(`   - Tutores: ${guardians.length}`);
    console.log(`   - Deportistas: ${athletes.length}`);
    console.log(`   - Equipos: ${teams.length}`);
    console.log(`   - Miembros de equipos: ${memberCount}`);
    console.log(`   - Personas temporales: ${tempPersons.length}`);
    console.log('\n✅ Seed de equipos y deportistas completado exitosamente!');

    return {
      guardians,
      athletes,
      teams,
      tempPersons,
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

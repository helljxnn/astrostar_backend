/**
 * SEED COMPLETO DE DATOS DE PRUEBA PARA ASTROSTAR
 *
 * Este seed crea datos de prueba para:
 * - Acudientes/Guardianes
 * - Empleados
 * - Deportistas con inscripciones en categorías
 * - Equipos de la fundación
 * - Personas temporales
 * - Equipos temporales
 * - Eventos con categorías deportivas
 * - Inscripciones de equipos y deportistas a eventos
 */

import { PrismaClient } from "../generated/prisma/index.js";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Función auxiliar para calcular edad
function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// Función auxiliar para generar fecha de nacimiento según edad
function generateBirthDate(minAge, maxAge) {
  const age = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
  const today = new Date();
  const birthYear = today.getFullYear() - age;
  const birthMonth = Math.floor(Math.random() * 12);
  const birthDay = Math.floor(Math.random() * 28) + 1;
  return new Date(birthYear, birthMonth, birthDay);
}

async function main() {
  console.log("🌱 Iniciando seed completo de datos de prueba...\n");

  // Obtener datos necesarios
  const documentType = await prisma.documentType.findFirst({
    where: { name: "Cédula de Ciudadanía" },
  });

  const tiDocumentType = await prisma.documentType.findFirst({
    where: { name: "Tarjeta de Identidad" },
  });

  const athleteRole = await prisma.role.findFirst({
    where: { name: "Athlete" },
  });

  const employeeRole = await prisma.role.findFirst({
    where: { name: "Employee" },
  });

  // Si no existe el rol de empleado, crearlo
  let finalEmployeeRole = employeeRole;
  if (!employeeRole) {
    finalEmployeeRole = await prisma.role.create({
      data: {
        name: "Employee",
        description: "Rol de empleado de la fundación",
        status: "Active",
      },
    });
  }

  // Si no existe el rol de atleta, crearlo
  let finalAthleteRole = athleteRole;
  if (!athleteRole) {
    finalAthleteRole = await prisma.role.create({
      data: {
        name: "Athlete",
        description: "Rol de deportista",
        status: "Active",
      },
    });
  }

  const categories = await prisma.sportsCategory.findMany();
  const infantilCategory = categories.find((c) => c.nombre === "Infantil");
  const prejuvenilCategory = categories.find((c) => c.nombre === "PreJuvenil");
  const juvenilCategory = categories.find((c) => c.nombre === "Juvenil");

  // ============================================
  // 1. CREAR ACUDIENTES/GUARDIANES
  // ============================================
  console.log("👨‍👩‍👧‍👦 Creando acudientes...");

  const guardians = [];
  const guardianData = [
    {
      firstName: "María",
      lastName: "González",
      identification: "52123456",
      email: "maria.gonzalez@email.com",
      phone: "+57 300 1111111",
    },
    {
      firstName: "Carlos",
      lastName: "Rodríguez",
      identification: "80234567",
      email: "carlos.rodriguez@email.com",
      phone: "+57 300 2222222",
    },
    {
      firstName: "Ana",
      lastName: "Martínez",
      identification: "52345678",
      email: "ana.martinez@email.com",
      phone: "+57 300 3333333",
    },
    {
      firstName: "Luis",
      lastName: "Pérez",
      identification: "80456789",
      email: "luis.perez@email.com",
      phone: "+57 300 4444444",
    },
    {
      firstName: "Patricia",
      lastName: "López",
      identification: "52567890",
      email: "patricia.lopez@email.com",
      phone: "+57 300 5555555",
    },
  ];

  for (const data of guardianData) {
    const guardian = await prisma.guardian.upsert({
      where: { identification: data.identification },
      update: {},
      create: {
        ...data,
        documentTypeId: documentType.id,
        address: "Calle 123 #45-67",
        occupation: "Profesional",
        birthDate: new Date("1980-01-15"),
      },
    });
    guardians.push(guardian);
  }
  console.log(`   ✓ ${guardians.length} acudientes creados\n`);

  // ============================================
  // 2. CREAR EMPLEADOS
  // ============================================
  console.log("👔 Creando empleados...");

  const employees = [];
  const employeeData = [
    {
      firstName: "Roberto",
      lastName: "Sánchez",
      identification: "80111222",
      email: "roberto.sanchez@astrostar.com",
      phone: "+57 310 1111111",
      position: "Entrenador Principal",
    },
    {
      firstName: "Diana",
      lastName: "Torres",
      identification: "52222333",
      email: "diana.torres@astrostar.com",
      phone: "+57 310 2222222",
      position: "Entrenadora Asistente",
    },
    {
      firstName: "Miguel",
      lastName: "Ramírez",
      identification: "80333444",
      email: "miguel.ramirez@astrostar.com",
      phone: "+57 310 3333333",
      position: "Coordinador Deportivo",
    },
  ];

  const hashedPassword = await bcrypt.hash("Employee123", 10);

  for (const data of employeeData) {
    const existingUser = await prisma.user.findUnique({
      where: { identification: data.identification },
    });

    if (!existingUser) {
      const user = await prisma.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          identification: data.identification,
          email: data.email,
          phoneNumber: data.phone,
          passwordHash: hashedPassword,
          documentTypeId: documentType.id,
          roleId: finalEmployeeRole.id,
          address: "Sede Astrostar",
          birthDate: new Date("1985-06-15"),
          age: calculateAge(new Date("1985-06-15")),
          status: "Active",
        },
      });

      const employee = await prisma.employee.create({
        data: {
          userId: user.id,
          status: "Activo",
        },
      });
      employees.push(employee);
    }
  }
  console.log(`   ✓ ${employees.length} empleados creados\n`);

  // ============================================
  // 3. CREAR DEPORTISTAS CON INSCRIPCIONES
  // ============================================
  console.log("⚽ Creando deportistas...");

  const athletes = [];

  // Deportistas categoría Infantil (10-12 años)
  const infantilAthletes = [
    { firstName: "Sofía", lastName: "Hernández", identification: "1001001001" },
    { firstName: "Mateo", lastName: "García", identification: "1001001002" },
    { firstName: "Valentina", lastName: "Díaz", identification: "1001001003" },
    { firstName: "Santiago", lastName: "Moreno", identification: "1001001004" },
    { firstName: "Isabella", lastName: "Castro", identification: "1001001005" },
  ];

  for (let i = 0; i < infantilAthletes.length; i++) {
    const data = infantilAthletes[i];
    const birthDate = generateBirthDate(10, 12);
    const age = calculateAge(birthDate);
    const guardian = guardians[i % guardians.length];

    const existingUser = await prisma.user.findUnique({
      where: { identification: data.identification },
    });

    if (!existingUser) {
      const user = await prisma.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          identification: data.identification,
          email: `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@email.com`,
          phoneNumber: `+57 320 ${1000000 + i}`,
          passwordHash: await bcrypt.hash(data.identification, 10),
          documentTypeId: tiDocumentType.id,
          roleId: finalAthleteRole.id,
          address: "Barrio Los Pinos",
          birthDate: birthDate,
          age: age,
          status: "Active",
        },
      });

      const athlete = await prisma.athlete.create({
        data: {
          userId: user.id,
          guardianId: guardian.id,
          relationship: "Mother",
          status: "Active",
          currentInscriptionStatus: "Active",
        },
      });

      // Crear matrícula vigente
      await prisma.enrollment.create({
        data: {
          athleteId: athlete.id,
          fechaInicio: new Date(),
          fechaVencimiento: new Date(
            new Date().setFullYear(new Date().getFullYear() + 1),
          ),
          fechaMatricula: new Date(),
          estado: "Vigente",
        },
      });

      // Inscribir en categoría Infantil
      if (infantilCategory) {
        await prisma.inscription.create({
          data: {
            athleteId: athlete.id,
            sportsCategoryId: infantilCategory.id,
            type: "initial_inscription",
            status: "Active",
            inscriptionDate: new Date(),
            conceptDate: new Date(),
            expirationDate: new Date(
              new Date().setFullYear(new Date().getFullYear() + 1),
            ),
            concept: "Inscripción inicial categoría Infantil",
          },
        });
      }

      athletes.push(athlete);
    }
  }

  // Deportistas categoría PreJuvenil (13-15 años)
  const prejuvenilAthletes = [
    { firstName: "Camila", lastName: "Vargas", identification: "1002002001" },
    { firstName: "Andrés", lastName: "Ruiz", identification: "1002002002" },
    { firstName: "Daniela", lastName: "Jiménez", identification: "1002002003" },
    {
      firstName: "Sebastián",
      lastName: "Mendoza",
      identification: "1002002004",
    },
  ];

  for (let i = 0; i < prejuvenilAthletes.length; i++) {
    const data = prejuvenilAthletes[i];
    const birthDate = generateBirthDate(13, 15);
    const age = calculateAge(birthDate);
    const guardian = guardians[i % guardians.length];

    const existingUser = await prisma.user.findUnique({
      where: { identification: data.identification },
    });

    if (!existingUser) {
      const user = await prisma.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          identification: data.identification,
          email: `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@email.com`,
          phoneNumber: `+57 321 ${2000000 + i}`,
          passwordHash: await bcrypt.hash(data.identification, 10),
          documentTypeId: tiDocumentType.id,
          roleId: finalAthleteRole.id,
          address: "Barrio El Prado",
          birthDate: birthDate,
          age: age,
          status: "Active",
        },
      });

      const athlete = await prisma.athlete.create({
        data: {
          userId: user.id,
          guardianId: guardian.id,
          relationship: "Father",
          status: "Active",
          currentInscriptionStatus: "Active",
        },
      });

      await prisma.enrollment.create({
        data: {
          athleteId: athlete.id,
          fechaInicio: new Date(),
          fechaVencimiento: new Date(
            new Date().setFullYear(new Date().getFullYear() + 1),
          ),
          fechaMatricula: new Date(),
          estado: "Vigente",
        },
      });

      if (prejuvenilCategory) {
        await prisma.inscription.create({
          data: {
            athleteId: athlete.id,
            sportsCategoryId: prejuvenilCategory.id,
            type: "initial_inscription",
            status: "Active",
            inscriptionDate: new Date(),
            conceptDate: new Date(),
            expirationDate: new Date(
              new Date().setFullYear(new Date().getFullYear() + 1),
            ),
            concept: "Inscripción inicial categoría PreJuvenil",
          },
        });
      }

      athletes.push(athlete);
    }
  }

  // Deportistas categoría Juvenil (16-18 años)
  const juvenilAthletes = [
    { firstName: "Alejandro", lastName: "Ortiz", identification: "1003003001" },
    { firstName: "Mariana", lastName: "Silva", identification: "1003003002" },
    { firstName: "David", lastName: "Rojas", identification: "1003003003" },
  ];

  for (let i = 0; i < juvenilAthletes.length; i++) {
    const data = juvenilAthletes[i];
    const birthDate = generateBirthDate(16, 18);
    const age = calculateAge(birthDate);

    const existingUser = await prisma.user.findUnique({
      where: { identification: data.identification },
    });

    if (!existingUser) {
      const user = await prisma.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          identification: data.identification,
          email: `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@email.com`,
          phoneNumber: `+57 322 ${3000000 + i}`,
          passwordHash: await bcrypt.hash(data.identification, 10),
          documentTypeId: tiDocumentType.id,
          roleId: finalAthleteRole.id,
          address: "Barrio La Esperanza",
          birthDate: birthDate,
          age: age,
          status: "Active",
        },
      });

      const athlete = await prisma.athlete.create({
        data: {
          userId: user.id,
          guardianId: null, // Mayor de edad
          relationship: null,
          status: "Active",
          currentInscriptionStatus: "Active",
        },
      });

      await prisma.enrollment.create({
        data: {
          athleteId: athlete.id,
          fechaInicio: new Date(),
          fechaVencimiento: new Date(
            new Date().setFullYear(new Date().getFullYear() + 1),
          ),
          fechaMatricula: new Date(),
          estado: "Vigente",
        },
      });

      if (juvenilCategory) {
        await prisma.inscription.create({
          data: {
            athleteId: athlete.id,
            sportsCategoryId: juvenilCategory.id,
            type: "initial_inscription",
            status: "Active",
            inscriptionDate: new Date(),
            conceptDate: new Date(),
            expirationDate: new Date(
              new Date().setFullYear(new Date().getFullYear() + 1),
            ),
            concept: "Inscripción inicial categoría Juvenil",
          },
        });
      }

      athletes.push(athlete);
    }
  }

  console.log(
    `   ✓ ${athletes.length} deportistas creados con inscripciones\n`,
  );

  // ============================================
  // 4. CREAR EQUIPOS DE LA FUNDACIÓN
  // ============================================
  console.log("🏆 Creando equipos de la fundación...");

  const foundationTeams = [];
  const teamData = [
    {
      name: "Astrostar Infantil",
      category: "Infantil",
      coach: "Roberto Sánchez",
    },
    {
      name: "Astrostar PreJuvenil",
      category: "PreJuvenil",
      coach: "Diana Torres",
    },
    { name: "Astrostar Juvenil", category: "Juvenil", coach: "Miguel Ramírez" },
  ];

  for (const data of teamData) {
    const team = await prisma.team.upsert({
      where: { name: data.name },
      update: {},
      create: {
        name: data.name,
        description: `Equipo oficial de la fundación - Categoría ${data.category}`,
        coach: data.coach,
        category: data.category,
        teamType: "Fundacion",
        status: "Active",
      },
    });
    foundationTeams.push(team);

    // Agregar miembros al equipo según categoría
    const teamAthletes = athletes.filter((a) => {
      // Buscar inscripciones del atleta
      return true; // Simplificado para el seed
    });

    // Agregar los primeros 3 atletas de cada categoría al equipo correspondiente
    let athletesToAdd = [];
    if (data.category === "Infantil") {
      athletesToAdd = athletes.slice(0, 3);
    } else if (data.category === "PreJuvenil") {
      athletesToAdd = athletes.slice(5, 8);
    } else if (data.category === "Juvenil") {
      athletesToAdd = athletes.slice(9, 11);
    }

    for (const athlete of athletesToAdd) {
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          athleteId: athlete.id,
          memberType: "Athlete",
          position: "Jugador",
          isActive: true,
        },
      });
    }
  }

  console.log(`   ✓ ${foundationTeams.length} equipos de fundación creados\n`);

  // ============================================
  // 5. CREAR PERSONAS TEMPORALES
  // ============================================
  console.log("👥 Creando personas temporales...");

  const temporaryPersons = [];
  const tempPersonData = [
    {
      firstName: "Juan",
      lastName: "Gómez",
      identification: "1100100100",
      personType: "Deportista",
      category: "Infantil",
    },
    {
      firstName: "Laura",
      lastName: "Fernández",
      identification: "1100100101",
      personType: "Deportista",
      category: "PreJuvenil",
    },
    {
      firstName: "Pedro",
      lastName: "Navarro",
      identification: "1100100102",
      personType: "Entrenador",
      category: null,
    },
  ];

  for (const data of tempPersonData) {
    const tempPerson = await prisma.temporaryPerson.upsert({
      where: { identification: data.identification },
      update: {},
      create: {
        firstName: data.firstName,
        lastName: data.lastName,
        identification: data.identification,
        email: `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@temp.com`,
        phone: `+57 330 ${Math.floor(Math.random() * 9000000) + 1000000}`,
        address: "Dirección temporal",
        birthDate: generateBirthDate(15, 30),
        age: calculateAge(generateBirthDate(15, 30)),
        documentTypeId: documentType.id,
        personType: data.personType,
        category: data.category,
        status: "Active",
      },
    });
    temporaryPersons.push(tempPerson);
  }

  console.log(`   ✓ ${temporaryPersons.length} personas temporales creadas\n`);

  // ============================================
  // 6. CREAR EQUIPOS TEMPORALES
  // ============================================
  console.log("🎯 Creando equipos temporales...");

  const temporaryTeams = [];
  const tempTeamData = [
    {
      name: "Visitantes Infantil",
      category: "Infantil",
      coach: "Pedro Navarro",
    },
    {
      name: "Invitados PreJuvenil",
      category: "PreJuvenil",
      coach: "Coach Externo",
    },
  ];

  for (const data of tempTeamData) {
    const team = await prisma.team.upsert({
      where: { name: data.name },
      update: {},
      create: {
        name: data.name,
        description: `Equipo temporal invitado - Categoría ${data.category}`,
        coach: data.coach,
        category: data.category,
        teamType: "Temporal",
        status: "Active",
      },
    });
    temporaryTeams.push(team);

    // Agregar personas temporales al equipo
    const tempPersonsForTeam = temporaryPersons.filter(
      (tp) => tp.personType === "Deportista" && tp.category === data.category,
    );

    for (const tempPerson of tempPersonsForTeam) {
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          temporaryPersonId: tempPerson.id,
          memberType: "TemporaryPerson",
          position: "Jugador",
          isActive: true,
        },
      });
    }
  }

  console.log(`   ✓ ${temporaryTeams.length} equipos temporales creados\n`);

  // ============================================
  // 7. CREAR EVENTOS CON CATEGORÍAS
  // ============================================
  console.log("📅 Creando eventos...");

  const eventCategory = await prisma.eventCategory.findFirst({
    where: { name: "Deportivo" },
  });

  const torneoType = await prisma.serviceType.findFirst({
    where: { name: "Torneo" },
  });

  const festivalType = await prisma.serviceType.findFirst({
    where: { name: "Festival" },
  });

  const events = [];

  // Evento 1: Torneo Infantil
  const event1 = await prisma.service.create({
    data: {
      name: "Torneo Infantil Astrostar 2024",
      description: "Torneo de fútbol para categoría infantil",
      startDate: new Date("2024-12-15"),
      endDate: new Date("2024-12-15"),
      startTime: "08:00",
      endTime: "17:00",
      location: "Cancha Principal Astrostar",
      phone: "+57 300 1234567",
      status: "Programado",
      publish: true,
      categoryId: eventCategory?.id,
      typeId: torneoType.id,
    },
  });

  // Asociar categoría deportiva Infantil al evento
  if (infantilCategory) {
    await prisma.serviceSportsCategory.create({
      data: {
        serviceId: event1.id,
        sportsCategoryId: infantilCategory.id,
      },
    });
  }

  events.push(event1);

  // Evento 2: Festival PreJuvenil y Juvenil
  const event2 = await prisma.service.create({
    data: {
      name: "Festival Deportivo PreJuvenil-Juvenil",
      description: "Festival deportivo para categorías prejuvenil y juvenil",
      startDate: new Date("2024-12-20"),
      endDate: new Date("2024-12-20"),
      startTime: "09:00",
      endTime: "18:00",
      location: "Complejo Deportivo Astrostar",
      phone: "+57 300 7654321",
      status: "Programado",
      publish: true,
      categoryId: eventCategory?.id,
      typeId: festivalType.id,
    },
  });

  // Asociar categorías deportivas PreJuvenil y Juvenil al evento
  if (prejuvenilCategory) {
    await prisma.serviceSportsCategory.create({
      data: {
        serviceId: event2.id,
        sportsCategoryId: prejuvenilCategory.id,
      },
    });
  }

  if (juvenilCategory) {
    await prisma.serviceSportsCategory.create({
      data: {
        serviceId: event2.id,
        sportsCategoryId: juvenilCategory.id,
      },
    });
  }

  events.push(event2);

  console.log(`   ✓ ${events.length} eventos creados\n`);

  // ============================================
  // 8. INSCRIBIR EQUIPOS Y DEPORTISTAS A EVENTOS
  // ============================================
  console.log("📝 Inscribiendo participantes a eventos...");

  let registrationCount = 0;

  // Inscribir equipos al Torneo Infantil
  const infantilTeam = foundationTeams.find((t) => t.category === "Infantil");
  const tempInfantilTeam = temporaryTeams.find(
    (t) => t.category === "Infantil",
  );

  if (infantilTeam) {
    await prisma.participant.create({
      data: {
        type: "Team",
        serviceId: event1.id,
        teamId: infantilTeam.id,
        sportsCategoryId: infantilCategory?.id,
        status: "Registered",
        notes: "Equipo local",
      },
    });
    registrationCount++;
  }

  if (tempInfantilTeam) {
    await prisma.participant.create({
      data: {
        type: "Team",
        serviceId: event1.id,
        teamId: tempInfantilTeam.id,
        sportsCategoryId: infantilCategory?.id,
        status: "Registered",
        notes: "Equipo visitante",
      },
    });
    registrationCount++;
  }

  // Inscribir equipos al Festival PreJuvenil-Juvenil
  const prejuvenilTeam = foundationTeams.find(
    (t) => t.category === "PreJuvenil",
  );
  const juvenilTeam = foundationTeams.find((t) => t.category === "Juvenil");
  const tempPrejuvenilTeam = temporaryTeams.find(
    (t) => t.category === "PreJuvenil",
  );

  if (prejuvenilTeam) {
    await prisma.participant.create({
      data: {
        type: "Team",
        serviceId: event2.id,
        teamId: prejuvenilTeam.id,
        sportsCategoryId: prejuvenilCategory?.id,
        status: "Registered",
      },
    });
    registrationCount++;
  }

  if (juvenilTeam) {
    await prisma.participant.create({
      data: {
        type: "Team",
        serviceId: event2.id,
        teamId: juvenilTeam.id,
        sportsCategoryId: juvenilCategory?.id,
        status: "Registered",
      },
    });
    registrationCount++;
  }

  if (tempPrejuvenilTeam) {
    await prisma.participant.create({
      data: {
        type: "Team",
        serviceId: event2.id,
        teamId: tempPrejuvenilTeam.id,
        sportsCategoryId: prejuvenilCategory?.id,
        status: "Registered",
      },
    });
    registrationCount++;
  }

  // Inscribir algunos deportistas individuales
  const infantilAthletesForEvent = athletes.slice(0, 2);
  for (const athlete of infantilAthletesForEvent) {
    await prisma.participant.create({
      data: {
        type: "Individual",
        serviceId: event1.id,
        athleteId: athlete.id,
        sportsCategoryId: infantilCategory?.id,
        status: "Registered",
      },
    });
    registrationCount++;
  }

  console.log(`   ✓ ${registrationCount} inscripciones creadas\n`);

  // ============================================
  // RESUMEN FINAL
  // ============================================
  console.log("🎉 Seed completo finalizado exitosamente!\n");
  console.log("📊 Resumen de datos creados:");
  console.log(`   • Acudientes: ${guardians.length}`);
  console.log(`   • Empleados: ${employees.length}`);
  console.log(`   • Deportistas: ${athletes.length}`);
  console.log(`   • Equipos de fundación: ${foundationTeams.length}`);
  console.log(`   • Personas temporales: ${temporaryPersons.length}`);
  console.log(`   • Equipos temporales: ${temporaryTeams.length}`);
  console.log(`   • Eventos: ${events.length}`);
  console.log(`   • Inscripciones: ${registrationCount}`);
  console.log("\n💡 Datos de prueba listos para usar!");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed completo:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

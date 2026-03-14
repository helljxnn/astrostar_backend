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

  const categories = await prisma.sportsCategory.findMany({
    orderBy: { edadMinima: 'asc' }
  });

  if (categories.length === 0) {
    console.log("⚠️  No hay categorías deportivas. Ejecuta primero: node prisma/seed-sports-categories.js\n");
    return;
  }

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

  // Nombres femeninos (la fundación es exclusivamente de mujeres)
  const femaleNames = ["Sofía", "Valentina", "Isabella", "Camila", "Daniela", "Mariana", "Laura", "Gabriela", "Valeria", "Lucía", "María", "Paula"];
  const lastNames = ["Hernández", "García", "Díaz", "Moreno", "Castro", "Ruiz", "Vargas", "Jiménez", "López", "Martínez", "Rodríguez", "Pérez"];

  // Crear deportistas para cada categoría disponible
  for (let catIndex = 0; catIndex < categories.length; catIndex++) {
    const category = categories[catIndex];
    const numAthletes = 4; // 4 deportistas por categoría

    for (let i = 0; i < numAthletes; i++) {
      const athleteNumber = catIndex * 100 + i + 1;
      const identification = `100${catIndex}00${athleteNumber}`;
      const birthDate = generateBirthDate(category.edadMinima, category.edadMaxima);
      const age = calculateAge(birthDate);
      const guardian = guardians[i % guardians.length];

      const existingUser = await prisma.user.findUnique({
        where: { identification: identification },
      });

      if (!existingUser) {
        const firstName = femaleNames[(catIndex * numAthletes + i) % femaleNames.length];
        const lastName = lastNames[(catIndex * numAthletes + i) % lastNames.length];

        const user = await prisma.user.create({
          data: {
            firstName: firstName,
            lastName: lastName,
            identification: identification,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${athleteNumber}@email.com`,
            phoneNumber: `+57 320 ${1000000 + athleteNumber}`,
            passwordHash: await bcrypt.hash(identification, 10),
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
            guardianId: age < 18 ? guardian.id : null,
            relationship: age < 18 ? "Mother" : null,
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
            estado: "Vigente",
          },
        });

        // Inscribir en la categoría correspondiente
        await prisma.inscription.create({
          data: {
            athleteId: athlete.id,
            sportsCategoryId: category.id,
            type: "initial_inscription",
            status: "Active",
            inscriptionDate: new Date(),
            conceptDate: new Date(),
            expirationDate: new Date(
              new Date().setFullYear(new Date().getFullYear() + 1),
            ),
            concept: `Inscripción inicial categoría ${category.nombre}`,
          },
        });

        athletes.push(athlete);
      }
    }
  }

  console.log(
    `   ✓ ${athletes.length} deportistas creadas con inscripciones\n`,
  );

  // ============================================
  // 4. CREAR EQUIPOS DE LA FUNDACIÓN
  // ============================================
  console.log("🏆 Creando equipos de la fundación...");

  const foundationTeams = [];
  
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    const coach = employees[i % employees.length];
    const coachName = coach ? `${coach.user?.firstName || 'Entrenador'} ${coach.user?.lastName || ''}` : 'Entrenador Principal';

    const team = await prisma.team.upsert({
      where: { name: `Astrostar ${category.nombre}` },
      update: {},
      create: {
        name: `Astrostar ${category.nombre}`,
        description: `Equipo oficial de la fundación - Categoría ${category.nombre}`,
        coach: coachName,
        category: category.nombre,
        teamType: "Fundacion",
        status: "Active",
      },
    });
    foundationTeams.push(team);

    // Agregar deportistas al equipo (primeros 3 de cada categoría)
    const categoryAthletes = await prisma.athlete.findMany({
      where: {
        inscriptions: {
          some: {
            sportsCategoryId: category.id,
            status: "Active"
          }
        }
      },
      take: 3
    });

    for (const athlete of categoryAthletes) {
      const existingMember = await prisma.teamMember.findFirst({
        where: {
          teamId: team.id,
          athleteId: athlete.id
        }
      });

      if (!existingMember) {
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
    },
    {
      firstName: "Laura",
      lastName: "Fernández",
      identification: "1100100101",
      personType: "Deportista",
    },
    {
      firstName: "Pedro",
      lastName: "Navarro",
      identification: "1100100102",
      personType: "Entrenador",
    },
  ];

  for (const data of tempPersonData) {
    // Verificar si ya existe
    const existing = await prisma.temporaryPerson.findFirst({
      where: { identification: data.identification },
    });

    if (!existing) {
      const tempPerson = await prisma.temporaryPerson.create({
        data: {
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
          status: "Active",
        },
      });
      temporaryPersons.push(tempPerson);
    } else {
      temporaryPersons.push(existing);
    }
  }

  console.log(`   ✓ ${temporaryPersons.length} personas temporales creadas\n`);

  // ============================================
  // 6. CREAR EQUIPOS TEMPORALES
  // ============================================
  console.log("🎯 Creando equipos temporales...");

  const temporaryTeams = [];
  
  // Crear un equipo temporal por cada categoría
  for (let i = 0; i < Math.min(2, categories.length); i++) {
    const category = categories[i];
    
    const team = await prisma.team.upsert({
      where: { name: `Visitantes ${category.nombre}` },
      update: {},
      create: {
        name: `Visitantes ${category.nombre}`,
        description: `Equipo temporal invitado - Categoría ${category.nombre}`,
        coach: "Coach Externo",
        category: category.nombre,
        teamType: "Temporal",
        status: "Active",
      },
    });
    temporaryTeams.push(team);

    // Agregar personas temporales al equipo
    const tempPersonsForTeam = temporaryPersons.filter(
      (tp) => tp.personType === "Deportista",
    );

    for (const tempPerson of tempPersonsForTeam) {
      const existingMember = await prisma.teamMember.findFirst({
        where: {
          teamId: team.id,
          temporaryPersonId: tempPerson.id
        }
      });

      if (!existingMember) {
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

  // Crear un evento por cada categoría disponible
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    const eventType = i % 2 === 0 ? torneoType : festivalType;
    const eventTypeName = i % 2 === 0 ? "Torneo" : "Festival";

    const event = await prisma.service.create({
      data: {
        name: `${eventTypeName} ${category.nombre} Astrostar 2024`,
        description: `${eventTypeName} deportivo para categoría ${category.nombre}`,
        startDate: new Date("2024-12-15"),
        endDate: new Date("2024-12-15"),
        startTime: "08:00",
        endTime: "17:00",
        location: "Complejo Deportivo Astrostar",
        phone: "+57 300 1234567",
        status: "Programado",
        publish: true,
        categoryId: eventCategory?.id,
        typeId: eventType.id,
      },
    });

    // Asociar categoría deportiva al evento
    await prisma.serviceSportsCategory.create({
      data: {
        serviceId: event.id,
        sportsCategoryId: category.id,
      },
    });

    events.push(event);
  }

  console.log(`   ✓ ${events.length} eventos creados\n`);

  // ============================================
  // 8. INSCRIBIR EQUIPOS Y DEPORTISTAS A EVENTOS
  // ============================================
  console.log("📝 Inscribiendo participantes a eventos...");

  let registrationCount = 0;

  // Inscribir equipos a sus eventos correspondientes
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const category = categories[i];

    // Buscar equipos de esta categoría
    const foundationTeam = foundationTeams.find((t) => t.category === category.nombre);
    const temporaryTeam = temporaryTeams.find((t) => t.category === category.nombre);

    if (foundationTeam) {
      const existingParticipant = await prisma.participant.findFirst({
        where: {
          serviceId: event.id,
          teamId: foundationTeam.id
        }
      });

      if (!existingParticipant) {
        await prisma.participant.create({
          data: {
            type: "Team",
            serviceId: event.id,
            teamId: foundationTeam.id,
            sportsCategoryId: category.id,
            status: "Registered",
            notes: "Equipo local",
          },
        });
        registrationCount++;
      }
    }

    if (temporaryTeam) {
      const existingParticipant = await prisma.participant.findFirst({
        where: {
          serviceId: event.id,
          teamId: temporaryTeam.id
        }
      });

      if (!existingParticipant) {
        await prisma.participant.create({
          data: {
            type: "Team",
            serviceId: event.id,
            teamId: temporaryTeam.id,
            sportsCategoryId: category.id,
            status: "Registered",
            notes: "Equipo visitante",
          },
        });
        registrationCount++;
      }
    }

    // Inscribir algunos deportistas individuales (primeros 2 de cada categoría)
    const categoryAthletes = await prisma.athlete.findMany({
      where: {
        inscriptions: {
          some: {
            sportsCategoryId: category.id,
            status: "Active"
          }
        }
      },
      take: 2
    });

    for (const athlete of categoryAthletes) {
      const existingParticipant = await prisma.participant.findFirst({
        where: {
          serviceId: event.id,
          athleteId: athlete.id
        }
      });

      if (!existingParticipant) {
        await prisma.participant.create({
          data: {
            type: "Individual",
            serviceId: event.id,
            athleteId: athlete.id,
            sportsCategoryId: category.id,
            status: "Registered",
          },
        });
        registrationCount++;
      }
    }
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

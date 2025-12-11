import { PrismaClient } from "../../generated/prisma/index.js";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Deportistas mujeres organizadas por categoría
const femaleAthletesData = [
  // CATEGORÍA INFANTIL (10-12 años) - 8 deportistas
  {
    firstName: "Sofía",
    middleName: "Valentina",
    lastName: "García",
    secondLastName: "Rodríguez",
    identification: "1002001001",
    email: "sofia.garcia@email.com",
    phoneNumber: "+57 310 1001001",
    address: "Calle 45 #12-34, Bogotá",
    birthDate: new Date("2013-03-15"),
    age: 11,
  },
  {
    firstName: "Isabella",
    middleName: "María",
    lastName: "Martínez",
    secondLastName: "López",
    identification: "1002001002",
    email: "isabella.martinez@email.com",
    phoneNumber: "+57 311 1001002",
    address: "Carrera 20 #45-67, Medellín",
    birthDate: new Date("2012-08-22"),
    age: 12,
  },
  {
    firstName: "Valeria",
    middleName: "Andrea",
    lastName: "Hernández",
    secondLastName: "Gómez",
    identification: "1002001003",
    email: "valeria.hernandez@email.com",
    phoneNumber: "+57 312 1001003",
    address: "Avenida 6 #23-45, Cali",
    birthDate: new Date("2014-01-10"),
    age: 10,
  },
  {
    firstName: "Camila",
    middleName: "Alejandra",
    lastName: "Jiménez",
    secondLastName: "Torres",
    identification: "1002001004",
    email: "camila.jimenez@email.com",
    phoneNumber: "+57 313 1001004",
    address: "Calle 80 #34-56, Barranquilla",
    birthDate: new Date("2013-11-05"),
    age: 11,
  },
  {
    firstName: "Mariana",
    middleName: "Lucía",
    lastName: "Vargas",
    secondLastName: "Ruiz",
    identification: "1002001005",
    email: "mariana.vargas@email.com",
    phoneNumber: "+57 314 1001005",
    address: "Carrera 15 #67-89, Cartagena",
    birthDate: new Date("2012-06-18"),
    age: 12,
  },
  {
    firstName: "Daniela",
    middleName: "Natalia",
    lastName: "Morales",
    secondLastName: "Castro",
    identification: "1002001006",
    email: "daniela.morales@email.com",
    phoneNumber: "+57 315 1001006",
    address: "Calle 100 #12-34, Bucaramanga",
    birthDate: new Date("2013-09-12"),
    age: 11,
  },
  {
    firstName: "Gabriela",
    middleName: "Fernanda",
    lastName: "Sánchez",
    secondLastName: "Mendoza",
    identification: "1002001007",
    email: "gabriela.sanchez@email.com",
    phoneNumber: "+57 316 1001007",
    address: "Avenida 19 #45-67, Pereira",
    birthDate: new Date("2014-04-25"),
    age: 10,
  },
  {
    firstName: "Valentina",
    middleName: "Paola",
    lastName: "Ramírez",
    secondLastName: "Silva",
    identification: "1002001008",
    email: "valentina.ramirez@email.com",
    phoneNumber: "+57 317 1001008",
    address: "Calle 50 #78-90, Manizales",
    birthDate: new Date("2012-12-08"),
    age: 12,
  },

  // CATEGORÍA PREJUVENIL (13-15 años) - 10 deportistas
  {
    firstName: "María",
    middleName: "José",
    lastName: "González",
    secondLastName: "Pérez",
    identification: "1002002001",
    email: "maria.gonzalez@email.com",
    phoneNumber: "+57 318 2001001",
    address: "Carrera 30 #56-78, Bogotá",
    birthDate: new Date("2010-05-14"),
    age: 14,
  },
  {
    firstName: "Ana",
    middleName: "Sofía",
    lastName: "Rodríguez",
    secondLastName: "Vega",
    identification: "1002002002",
    email: "ana.rodriguez@email.com",
    phoneNumber: "+57 319 2001002",
    address: "Calle 70 #89-12, Medellín",
    birthDate: new Date("2009-10-20"),
    age: 15,
  },
  {
    firstName: "Laura",
    middleName: "Cristina",
    lastName: "Muñoz",
    secondLastName: "Ortiz",
    identification: "1002002003",
    email: "laura.munoz@email.com",
    phoneNumber: "+57 320 2001003",
    address: "Avenida 5 #34-56, Cali",
    birthDate: new Date("2011-02-28"),
    age: 13,
  },
  {
    firstName: "Alejandra",
    middleName: "Isabel",
    lastName: "Torres",
    secondLastName: "Moreno",
    identification: "1002002004",
    email: "alejandra.torres@email.com",
    phoneNumber: "+57 321 2001004",
    address: "Calle 25 #67-89, Barranquilla",
    birthDate: new Date("2010-07-16"),
    age: 14,
  },
  {
    firstName: "Carolina",
    middleName: "Beatriz",
    lastName: "Herrera",
    secondLastName: "Ramos",
    identification: "1002002005",
    email: "carolina.herrera@email.com",
    phoneNumber: "+57 322 2001005",
    address: "Carrera 40 #12-34, Cartagena",
    birthDate: new Date("2009-12-03"),
    age: 15,
  },
  {
    firstName: "Natalia",
    middleName: "Esperanza",
    lastName: "Díaz",
    secondLastName: "Aguilar",
    identification: "1002002006",
    email: "natalia.diaz@email.com",
    phoneNumber: "+57 323 2001006",
    address: "Calle 60 #45-67, Bucaramanga",
    birthDate: new Date("2011-08-11"),
    age: 13,
  },
  {
    firstName: "Andrea",
    middleName: "Milena",
    lastName: "Castillo",
    secondLastName: "Restrepo",
    identification: "1002002007",
    email: "andrea.castillo@email.com",
    phoneNumber: "+57 324 2001007",
    address: "Avenida 12 #78-90, Pereira",
    birthDate: new Date("2010-04-09"),
    age: 14,
  },
  {
    firstName: "Paola",
    middleName: "Marcela",
    lastName: "Ospina",
    secondLastName: "Giraldo",
    identification: "1002002008",
    email: "paola.ospina@email.com",
    phoneNumber: "+57 325 2001008",
    address: "Calle 35 #23-45, Manizales",
    birthDate: new Date("2009-09-27"),
    age: 15,
  },
  {
    firstName: "Juliana",
    middleName: "Rocío",
    lastName: "Parra",
    secondLastName: "Salazar",
    identification: "1002002009",
    email: "juliana.parra@email.com",
    phoneNumber: "+57 326 2001009",
    address: "Carrera 25 #56-78, Cúcuta",
    birthDate: new Date("2011-01-15"),
    age: 13,
  },
  {
    firstName: "Melissa",
    middleName: "Adriana",
    lastName: "Quintero",
    secondLastName: "Vargas",
    identification: "1002002010",
    email: "melissa.quintero@email.com",
    phoneNumber: "+57 327 2001010",
    address: "Calle 90 #34-56, Santa Marta",
    birthDate: new Date("2010-11-22"),
    age: 14,
  },

  // CATEGORÍA JUVENIL (16-18 años) - 12 deportistas
  {
    firstName: "Catalina",
    middleName: "Alejandra",
    lastName: "Mejía",
    secondLastName: "Cardona",
    identification: "1002003001",
    email: "catalina.mejia@email.com",
    phoneNumber: "+57 328 3001001",
    address: "Carrera 50 #67-89, Bogotá",
    birthDate: new Date("2007-03-12"),
    age: 17,
  },
  {
    firstName: "Stephanie",
    middleName: "Lorena",
    lastName: "Arbeláez",
    secondLastName: "Henao",
    identification: "1002003002",
    email: "stephanie.arbelaez@email.com",
    phoneNumber: "+57 329 3001002",
    address: "Calle 85 #12-34, Medellín",
    birthDate: new Date("2008-06-25"),
    age: 16,
  },
  {
    firstName: "Tatiana",
    middleName: "Vanessa",
    lastName: "Bedoya",
    secondLastName: "Montoya",
    identification: "1002003003",
    email: "tatiana.bedoya@email.com",
    phoneNumber: "+57 330 3001003",
    address: "Avenida 8 #45-67, Cali",
    birthDate: new Date("2007-09-18"),
    age: 17,
  },
  {
    firstName: "Lina",
    middleName: "María",
    lastName: "Correa",
    secondLastName: "Zapata",
    identification: "1002003004",
    email: "lina.correa@email.com",
    phoneNumber: "+57 331 3001004",
    address: "Calle 40 #78-90, Barranquilla",
    birthDate: new Date("2008-01-30"),
    age: 16,
  },
  {
    firstName: "Diana",
    middleName: "Carolina",
    lastName: "Escobar",
    secondLastName: "Ríos",
    identification: "1002003005",
    email: "diana.escobar@email.com",
    phoneNumber: "+57 332 3001005",
    address: "Carrera 60 #23-45, Cartagena",
    birthDate: new Date("2007-12-14"),
    age: 17,
  },
  {
    firstName: "Mónica",
    middleName: "Andrea",
    lastName: "Franco",
    secondLastName: "Duque",
    identification: "1002003006",
    email: "monica.franco@email.com",
    phoneNumber: "+57 333 3001006",
    address: "Calle 75 #56-78, Bucaramanga",
    birthDate: new Date("2008-04-07"),
    age: 16,
  },
  {
    firstName: "Viviana",
    middleName: "Julieth",
    lastName: "Galeano",
    secondLastName: "Murillo",
    identification: "1002003007",
    email: "viviana.galeano@email.com",
    phoneNumber: "+57 334 3001007",
    address: "Avenida 15 #89-12, Pereira",
    birthDate: new Date("2007-08-21"),
    age: 17,
  },
  {
    firstName: "Yuliana",
    middleName: "Tatiana",
    lastName: "Hurtado",
    secondLastName: "Castaño",
    identification: "1002003008",
    email: "yuliana.hurtado@email.com",
    phoneNumber: "+57 335 3001008",
    address: "Calle 55 #34-56, Manizales",
    birthDate: new Date("2008-11-03"),
    age: 16,
  },
  {
    firstName: "Alejandra",
    middleName: "Pilar",
    lastName: "Jaramillo",
    secondLastName: "Vélez",
    identification: "1002003009",
    email: "alejandra.jaramillo@email.com",
    phoneNumber: "+57 336 3001009",
    address: "Carrera 35 #67-89, Cúcuta",
    birthDate: new Date("2007-05-16"),
    age: 17,
  },
  {
    firstName: "Katherine",
    middleName: "Alejandra",
    lastName: "López",
    secondLastName: "Arango",
    identification: "1002003010",
    email: "katherine.lopez@email.com",
    phoneNumber: "+57 337 3001010",
    address: "Calle 95 #12-34, Santa Marta",
    birthDate: new Date("2008-02-28"),
    age: 16,
  },
  {
    firstName: "Leidy",
    middleName: "Johanna",
    lastName: "Marín",
    secondLastName: "Betancur",
    identification: "1002003011",
    email: "leidy.marin@email.com",
    phoneNumber: "+57 338 3001011",
    address: "Avenida 22 #45-67, Ibagué",
    birthDate: new Date("2007-10-12"),
    age: 17,
  },
  {
    firstName: "Erika",
    middleName: "Paola",
    lastName: "Noreña",
    secondLastName: "Suárez",
    identification: "1002003012",
    email: "erika.norena@email.com",
    phoneNumber: "+57 339 3001012",
    address: "Calle 65 #78-90, Pasto",
    birthDate: new Date("2008-07-05"),
    age: 16,
  },
];

// Datos de acudientes para las deportistas menores de edad
const guardiansData = [
  {
    firstName: "Carmen",
    lastName: "Rodríguez",
    identification: "52001001",
    email: "carmen.rodriguez@email.com",
    phone: "+57 300 1001001",
    address: "Calle 45 #12-34, Bogotá",
    occupation: "Enfermera",
    birthDate: new Date("1985-03-15"),
  },
  {
    firstName: "Patricia",
    lastName: "López",
    identification: "52001002",
    email: "patricia.lopez@email.com",
    phone: "+57 300 1001002",
    address: "Carrera 20 #45-67, Medellín",
    occupation: "Profesora",
    birthDate: new Date("1982-08-22"),
  },
  {
    firstName: "Gloria",
    lastName: "Gómez",
    identification: "52001003",
    email: "gloria.gomez@email.com",
    phone: "+57 300 1001003",
    address: "Avenida 6 #23-45, Cali",
    occupation: "Contadora",
    birthDate: new Date("1980-01-10"),
  },
  {
    firstName: "Luz",
    lastName: "Torres",
    identification: "52001004",
    email: "luz.torres@email.com",
    phone: "+57 300 1001004",
    address: "Calle 80 #34-56, Barranquilla",
    occupation: "Administradora",
    birthDate: new Date("1983-11-05"),
  },
  {
    firstName: "Esperanza",
    lastName: "Ruiz",
    identification: "52001005",
    email: "esperanza.ruiz@email.com",
    phone: "+57 300 1001005",
    address: "Carrera 15 #67-89, Cartagena",
    occupation: "Psicóloga",
    birthDate: new Date("1984-06-18"),
  },
  {
    firstName: "Marta",
    lastName: "Castro",
    identification: "52001006",
    email: "marta.castro@email.com",
    phone: "+57 300 1001006",
    address: "Calle 100 #12-34, Bucaramanga",
    occupation: "Médica",
    birthDate: new Date("1981-09-12"),
  },
  {
    firstName: "Rosa",
    lastName: "Mendoza",
    identification: "52001007",
    email: "rosa.mendoza@email.com",
    phone: "+57 300 1001007",
    address: "Avenida 19 #45-67, Pereira",
    occupation: "Ingeniera",
    birthDate: new Date("1986-04-25"),
  },
  {
    firstName: "Beatriz",
    lastName: "Silva",
    identification: "52001008",
    email: "beatriz.silva@email.com",
    phone: "+57 300 1001008",
    address: "Calle 50 #78-90, Manizales",
    occupation: "Abogada",
    birthDate: new Date("1979-12-08"),
  },
];

async function main() {
  console.log("👩‍🏃 Iniciando seed de deportistas mujeres...\n");

  // Verificar y crear tipos de documento necesarios
  console.log("📋 Verificando tipos de documento...");

  let cedulaType = await prisma.documentType.findFirst({
    where: { name: "Cédula de Ciudadanía" },
  });
  if (!cedulaType) {
    cedulaType = await prisma.documentType.create({
      data: {
        name: "Cédula de Ciudadanía",
        description: "Documento de identidad para mayores de 18 años",
      },
    });
  }

  let tarjetaType = await prisma.documentType.findFirst({
    where: { name: "Tarjeta de Identidad" },
  });
  if (!tarjetaType) {
    tarjetaType = await prisma.documentType.create({
      data: {
        name: "Tarjeta de Identidad",
        description: "Documento de identidad para menores de 18 años",
      },
    });
  }

  console.log("   ✓ Tipos de documento verificados\n");

  // Verificar y crear rol de deportista
  console.log("👤 Verificando rol de deportista...");
  let athleteRole = await prisma.role.findFirst({
    where: { name: "Deportista" },
  });
  if (!athleteRole) {
    athleteRole = await prisma.role.create({
      data: {
        name: "Deportista",
        description: "Rol para deportistas de la fundación",
        permissions: {
          dashboard: { Ver: true },
          athletesSection: { Ver: true },
        },
      },
    });
  }
  console.log("   ✓ Rol de deportista verificado\n");

  // Verificar y actualizar categorías deportivas
  console.log("🏆 Verificando categorías deportivas...");

  const categories = [
    {
      name: "Infantil",
      minAge: 10,
      maxAge: 12,
      description: "Categoría infantil para niñas de 10 a 12 años",
    },
    {
      name: "PreJuvenil",
      minAge: 13,
      maxAge: 15,
      description: "Categoría prejuvenil para adolescentes de 13 a 15 años",
    },
    {
      name: "Juvenil",
      minAge: 16,
      maxAge: 18,
      description: "Categoría juvenil para jóvenes de 16 a 18 años",
    },
  ];

  for (const cat of categories) {
    let category = await prisma.sportsCategory.findFirst({
      where: { nombre: cat.name },
    });
    if (!category) {
      category = await prisma.sportsCategory.create({
        data: {
          nombre: cat.name,
          edadMinima: cat.minAge,
          edadMaxima: cat.maxAge,
          descripcion: cat.description,
          estado: "Activo",
          publicar: true,
        },
      });
    } else {
      await prisma.sportsCategory.update({
        where: { id: category.id },
        data: {
          edadMinima: cat.minAge,
          edadMaxima: cat.maxAge,
          descripcion: cat.description,
          estado: "Activo",
          publicar: true,
        },
      });
    }
    console.log(`   ✓ ${cat.name} (${cat.minAge}-${cat.maxAge} años)`);
  }
  console.log("");

  // Limpiar deportistas de prueba existentes
  console.log("🧹 Limpiando deportistas de prueba anteriores...");
  const testEmails = femaleAthletesData.map((a) => a.email);
  const testGuardianEmails = guardiansData.map((g) => g.email);

  await prisma.inscription.deleteMany({
    where: {
      athlete: {
        user: {
          email: { in: testEmails },
        },
      },
    },
  });

  await prisma.athlete.deleteMany({
    where: {
      user: {
        email: { in: testEmails },
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      email: { in: testEmails },
    },
  });

  await prisma.guardian.deleteMany({
    where: {
      email: { in: testGuardianEmails },
    },
  });

  console.log("   ✓ Datos anteriores limpiados\n");

  // Crear acudientes para menores de edad
  console.log("👨‍👩‍👧 Creando acudientes...");
  const createdGuardians = [];

  for (const guardianData of guardiansData) {
    try {
      const guardian = await prisma.guardian.create({
        data: {
          ...guardianData,
          documentTypeId: cedulaType.id,
        },
      });
      createdGuardians.push(guardian);
      console.log(`   ✓ ${guardian.firstName} ${guardian.lastName}`);
    } catch (error) {
      console.error(`   ✗ Error creando acudiente: ${guardianData.firstName}`);
    }
  }
  console.log("");

  // Crear deportistas mujeres
  console.log("👩‍🏃 Creando deportistas mujeres...");
  const hashedPassword = await bcrypt.hash("Deportista123*", 10);
  let createdCount = 0;
  let guardianIndex = 0;

  for (const athleteData of femaleAthletesData) {
    try {
      // Determinar tipo de documento según la edad
      const documentType = athleteData.age >= 18 ? cedulaType : tarjetaType;

      // Asignar acudiente solo a menores de edad
      let guardianId = null;
      let relationship = null;

      if (athleteData.age < 18 && guardianIndex < createdGuardians.length) {
        guardianId = createdGuardians[guardianIndex].id;
        relationship = "Mother";
        guardianIndex++;
      }

      const user = await prisma.user.create({
        data: {
          ...athleteData,
          documentTypeId: documentType.id,
          passwordHash: hashedPassword,
          roleId: athleteRole.id,
          status: "Active",
          athlete: {
            create: {
              status: "Active",
              currentInscriptionStatus: "Active",
              guardianId: guardianId,
              relationship: relationship,
              statusAssignedAt: new Date(),
            },
          },
        },
      });

      createdCount++;
      console.log(
        `   ✓ ${athleteData.firstName} ${athleteData.lastName} (${athleteData.age} años)`
      );
    } catch (error) {
      console.error(
        `   ✗ Error creando deportista: ${athleteData.firstName} - ${error.message}`
      );
    }
  }
  console.log("");

  // Inscribir deportistas en categorías apropiadas
  console.log("📝 Inscribiendo deportistas en categorías...");
  const sportsCategories = await prisma.sportsCategory.findMany({
    where: { nombre: { in: ["Infantil", "PreJuvenil", "Juvenil"] } },
  });

  const athletes = await prisma.athlete.findMany({
    include: { user: true },
    where: {
      user: {
        email: { in: testEmails },
      },
    },
  });

  let inscriptionCount = 0;

  for (const athlete of athletes) {
    // Encontrar la categoría apropiada según la edad
    const appropriateCategory = sportsCategories.find(
      (cat) =>
        athlete.user.age >= cat.edadMinima && athlete.user.age <= cat.edadMaxima
    );

    if (appropriateCategory) {
      try {
        const expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);

        await prisma.inscription.create({
          data: {
            athleteId: athlete.id,
            sportsCategoryId: appropriateCategory.id,
            type: "initial_inscription",
            status: "Active",
            inscriptionDate: new Date(),
            conceptDate: new Date(),
            expirationDate: expirationDate,
            concept: `Inscripción inicial en categoría ${appropriateCategory.nombre}`,
          },
        });

        inscriptionCount++;
        console.log(
          `   ✓ ${athlete.user.firstName} ${athlete.user.lastName} → ${appropriateCategory.nombre}`
        );
      } catch (error) {
        console.error(`   ✗ Error inscribiendo: ${athlete.user.firstName}`);
      }
    }
  }

  // Estadísticas finales
  const finalStats = await Promise.all([
    prisma.athlete.count({
      where: {
        user: { email: { in: testEmails } },
        inscriptions: {
          some: {
            sportsCategory: { nombre: "Infantil" },
            status: "Active",
          },
        },
      },
    }),
    prisma.athlete.count({
      where: {
        user: { email: { in: testEmails } },
        inscriptions: {
          some: {
            sportsCategory: { nombre: "PreJuvenil" },
            status: "Active",
          },
        },
      },
    }),
    prisma.athlete.count({
      where: {
        user: { email: { in: testEmails } },
        inscriptions: {
          some: {
            sportsCategory: { nombre: "Juvenil" },
            status: "Active",
          },
        },
      },
    }),
  ]);

  console.log(`\n🎉 ¡Seed completado exitosamente!`);
  console.log(`\n📊 Resumen:`);
  console.log(`   • Acudientes creados: ${createdGuardians.length}`);
  console.log(
    `   • Deportistas mujeres creadas: ${createdCount}/${femaleAthletesData.length}`
  );
  console.log(`   • Inscripciones realizadas: ${inscriptionCount}`);
  console.log(`\n🏆 Distribución por categoría:`);
  console.log(`   • Infantil (10-12 años): ${finalStats[0]} deportistas`);
  console.log(`   • PreJuvenil (13-15 años): ${finalStats[1]} deportistas`);
  console.log(`   • Juvenil (16-18 años): ${finalStats[2]} deportistas`);
  console.log(`\n🔑 Credenciales de acceso:`);
  console.log(`   • Email: [nombre].[apellido]@email.com`);
  console.log(`   • Contraseña: Deportista123*`);
  console.log(`\n💡 Ejemplo: sofia.garcia@email.com / Deportista123*`);
}

main()
  .catch((error) => {
    console.error("❌ Error ejecutando el seed:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

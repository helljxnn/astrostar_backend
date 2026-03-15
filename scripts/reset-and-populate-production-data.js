#!/usr/bin/env node

/**
 * SCRIPT DE RESET Y POBLACIÓN CON DATOS DE PRODUCCIÓN
 * 
 * Este script:
 * 1. LIMPIA COMPLETAMENTE la base de datos
 * 2. Ejecuta el seed básico (admin + tipos de documento)
 * 3. Crea 23 deportistas con casos realistas de producción
 * 
 * CASOS CUBIERTOS:
 * - Deportistas nuevas (matrícula inicial pendiente)
 * - Deportistas activas (matrícula vigente)
 * - Deportistas con matrícula por vencer
 * - Deportistas con matrícula vencida
 * - Deportistas inactivas
 * - Menores con acudiente
 * - Mayores sin acudiente
 * - Historial completo de pagos y matrículas
 */

import { PrismaClient } from '../generated/prisma/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

console.log('🚀 INICIANDO RESET COMPLETO DE BASE DE DATOS');
console.log('=' .repeat(60));

// ============================================================================
// DATOS MAESTROS
// ============================================================================

const NOMBRES_FEMENINOS = [
  'María', 'Ana', 'Carmen', 'Isabel', 'Sofía', 'Valentina', 'Camila', 'Daniela',
  'Alejandra', 'Andrea', 'Natalia', 'Paola', 'Carolina', 'Juliana', 'Gabriela',
  'Fernanda', 'Mariana', 'Lucía', 'Victoria', 'Adriana', 'Catalina', 'Melissa',
  'Stephanie'
];

const APELLIDOS = [
  'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez',
  'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno',
  'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez', 'Navarro', 'Torres', 'Domínguez'
];

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];

const generateRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const calculateAge = (birthDate) => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const generatePhoneNumber = () => {
  const prefixes = ['300', '301', '302', '310', '311', '312', '313', '314', '315', '316', '317', '318', '319', '320'];
  const prefix = getRandomElement(prefixes);
  const number = Math.floor(1000000 + Math.random() * 9000000);
  return `+57 ${prefix} ${number}`;
};

const generateEmail = (firstName, lastName, uniqueId = null) => {
  const domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];
  const cleanFirst = firstName.toLowerCase().replace(/[áéíóú]/g, (match) => {
    const accents = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };
    return accents[match];
  });
  const cleanLast = lastName.toLowerCase().replace(/[áéíóú]/g, (match) => {
    const accents = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };
    return accents[match];
  });
  
  // Agregar un número único para evitar duplicados
  const randomNum = uniqueId || Math.floor(Math.random() * 999) + 1;
  return `${cleanFirst}.${cleanLast}${randomNum}@${getRandomElement(domains)}`;
};

const generateAddress = () => {
  const streets = ['Calle', 'Carrera', 'Avenida', 'Transversal', 'Diagonal'];
  const neighborhoods = [
    'Centro', 'Norte', 'Sur', 'Chapinero', 'Zona Rosa', 'La Candelaria',
    'Suba', 'Engativá', 'Kennedy', 'Bosa', 'Ciudad Bolívar', 'Usaquén'
  ];
  
  const streetType = getRandomElement(streets);
  const streetNumber = Math.floor(10 + Math.random() * 90);
  const houseNumber = Math.floor(10 + Math.random() * 200);
  const neighborhood = getRandomElement(neighborhoods);
  
  return `${streetType} ${streetNumber} # ${houseNumber}-${Math.floor(10 + Math.random() * 90)}, ${neighborhood}`;
};

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================
async function main() {
  try {
    // ========================================================================
    // PASO 1: LIMPIAR COMPLETAMENTE LA BASE DE DATOS
    // ========================================================================
    console.log('\n🧹 PASO 1: LIMPIANDO BASE DE DATOS COMPLETA...');
    
    // Eliminar en orden correcto (respetando foreign keys)
    // Primero eliminar datos dependientes
    await prisma.payment.deleteMany({});
    await prisma.paymentObligation.deleteMany({});
    await prisma.paymentSettings.deleteMany({});
    await prisma.enrollment.deleteMany({});
    await prisma.inscription.deleteMany({});
    await prisma.athlete.deleteMany({});
    await prisma.guardian.deleteMany({});
    
    // Eliminar datos de eventos y servicios
    await prisma.serviceSportsCategory.deleteMany({});
    await prisma.participant.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.serviceType.deleteMany({});
    await prisma.eventCategory.deleteMany({});
    
    // Eliminar usuarios y roles
    await prisma.user.deleteMany({});
    await prisma.role.deleteMany({});
    
    // Eliminar datos maestros
    await prisma.sportsCategory.deleteMany({});
    await prisma.documentType.deleteMany({});
    
    console.log('   ✅ Base de datos limpiada completamente');

    // ========================================================================
    // PASO 2: EJECUTAR SEED BÁSICO
    // ========================================================================
    console.log('\n🌱 PASO 2: EJECUTANDO SEED BÁSICO...');
    
    // Tipos de documento
    await prisma.documentType.createMany({
      data: [
        { name: 'Cédula de Ciudadanía', description: 'Documento de identidad para ciudadanos colombianos' },
        { name: 'Tarjeta de Identidad', description: 'Documento de identidad para menores de edad' },
        { name: 'Permiso de Permanencia', description: 'Documento para extranjeros con permiso de permanencia' },
        { name: 'Tarjeta de Extranjería', description: 'Documento de identidad para extranjeros' },
        { name: 'Cédula de Extranjería', description: 'Documento de identidad para extranjeros residentes' },
        { name: 'Número de Identificación Tributaria', description: 'Documento de identificación tributaria' },
        { name: 'Pasaporte', description: 'Documento de identidad internacional' },
        { name: 'Número de Identificación Extranjero', description: 'Documento de identificación para extranjeros' },
      ]
    });

    // Rol de Administrador
    const adminRole = await prisma.role.create({
      data: {
        name: "Administrador",
        description: "Acceso completo al sistema con todos los permisos. Este rol no puede ser eliminado.",
        permissions: {
          dashboard: { Ver: true, Crear: true, Editar: true, Eliminar: true },
          users: { Ver: true, Crear: true, Editar: true, Eliminar: true },
          roles: { Ver: true, Crear: true, Editar: true, Eliminar: true },
          materials: { Ver: true, Crear: true, Editar: true, Eliminar: true },
          materialCategories: { Ver: true, Crear: true, Editar: true, Eliminar: true },
          materialsRegistry: { Ver: true, Crear: true, Editar: true, Eliminar: true, Listar: true },
          employees: { Ver: true, Crear: true, Editar: true, Eliminar: true, Listar: true },
          employeesSchedule: { Ver: true, Crear: true, Editar: true, Eliminar: true, Listar: true },
          appointmentManagement: { Ver: true, Crear: true, Editar: true, Eliminar: true, Listar: true },
          sportsCategory: { Ver: true, Crear: true, Editar: true, Eliminar: true, Listar: true },
          athletesSection: { Ver: true, Crear: true, Editar: true, Eliminar: true, Listar: true },
          athletesAssistance: { Ver: true, Crear: true, Editar: true, Eliminar: true, Listar: true },
          donorsSponsors: { Ver: true, Crear: true, Editar: true, Eliminar: true, Listar: true },
          donationsManagement: { Ver: true, Crear: true, Editar: true, Eliminar: true, Listar: true },
          eventsManagement: { Ver: true, Crear: true, Editar: true, Eliminar: true, Listar: true },
          temporaryWorkers: { Ver: true, Crear: true, Editar: true, Eliminar: true, Listar: true },
          temporaryTeams: { Ver: true, Crear: true, Editar: true, Eliminar: true, Listar: true },
          providers: { Ver: true, Crear: true, Editar: true, Eliminar: true, Listar: true },
          purchasesManagement: { Ver: true, Crear: true, Editar: true, Eliminar: true, Listar: true },
        },
      },
    });

    // Rol de Deportista
    const athleteRole = await prisma.role.create({
      data: {
        name: "Deportista",
        description: "Rol de deportista con permisos básicos",
        permissions: {
          "Perfil": { "Ver": true, "Editar": true },
          "Pagos": { "Ver": true, "Crear": true },
          "Matriculas": { "Ver": true }
        }
      }
    });

    // Usuario Administrador
    const documentType = await prisma.documentType.findFirst({
      where: { name: "Cédula de Ciudadanía" }
    });

    const hashedPassword = await bcrypt.hash("Admin123*", 10);
    await prisma.user.create({
      data: {
        firstName: "Administrador",
        middleName: "del",
        lastName: "Sistema",
        secondLastName: "Astrostar",
        identification: "1000000000",
        documentTypeId: documentType.id,
        email: "astrostar.java@gmail.com",
        passwordHash: hashedPassword,
        phoneNumber: "+57 300 0000000",
        address: "Sede Principal Astrostar",
        birthDate: new Date("1990-01-01"),
        age: 34,
        roleId: adminRole.id,
        status: "Active",
      },
    });

    // Categorías deportivas
    await prisma.sportsCategory.createMany({
      data: [
        {
          nombre: "Infantil",
          edadMinima: 10,
          edadMaxima: 12,
          descripcion: "Categoría infantil para niños de 10 a 12 años",
          estado: "Activo",
          publicar: true,
        },
        {
          nombre: "PreJuvenil",
          edadMinima: 13,
          edadMaxima: 15,
          descripcion: "Categoría prejuvenil para adolescentes de 13 a 15 años",
          estado: "Activo",
          publicar: true,
        },
        {
          nombre: "Juvenil",
          edadMinima: 16,
          edadMaxima: 18,
          descripcion: "Categoría juvenil para jóvenes de 16 a 18 años",
          estado: "Activo",
          publicar: true,
        },
      ]
    });

    // Configuración de pagos
    await prisma.paymentSettings.create({
      data: {
        id: 1,
        monthlyAmount: 30000,
        enrollmentAmount: 40000,
        lateFeeDailyAmount: 2000
      }
    });

    console.log('   ✅ Seed básico completado');
    console.log('   👑 Admin: astrostar.java@gmail.com / Admin123*');

    // ========================================================================
    // PASO 3: CREAR 23 DEPORTISTAS CON CASOS REALISTAS
    // ========================================================================
    console.log('\n👥 PASO 3: CREANDO 23 DEPORTISTAS CON CASOS REALISTAS...');
    
    const cedulaType = await prisma.documentType.findFirst({ where: { name: "Cédula de Ciudadanía" } });
    const tarjetaType = await prisma.documentType.findFirst({ where: { name: "Tarjeta de Identidad" } });
    const infantilCategory = await prisma.sportsCategory.findFirst({ where: { nombre: "Infantil" } });
    const prejuvenilCategory = await prisma.sportsCategory.findFirst({ where: { nombre: "PreJuvenil" } });
    const juvenilCategory = await prisma.sportsCategory.findFirst({ where: { nombre: "Juvenil" } });

    const deportistas = [];
    let currentId = 1000000001;

    // ========================================================================
    // CASOS ESPECÍFICOS DE PRODUCCIÓN
    // ========================================================================
    
    // CASO 1-3: DEPORTISTAS NUEVAS (Matrícula inicial pendiente)
    for (let i = 0; i < 3; i++) {
      const firstName = getRandomElement(NOMBRES_FEMENINOS);
      const lastName = getRandomElement(APELLIDOS);
      const secondLastName = getRandomElement(APELLIDOS);
      const birthDate = generateRandomDate(new Date(2010, 0, 1), new Date(2014, 11, 31));
      const age = calculateAge(birthDate);
      const isMinor = age < 18;
      
      deportistas.push({
        caso: 'NUEVA_PENDIENTE',
        firstName,
        lastName,
        secondLastName,
        birthDate,
        age,
        isMinor,
        identification: currentId.toString(),
        documentTypeId: isMinor ? tarjetaType.id : cedulaType.id,
        email: generateEmail(firstName, lastName, currentId),
        phoneNumber: generatePhoneNumber(),
        address: generateAddress(),
        needsGuardian: isMinor,
        enrollmentStatus: 'Pending_Payment',
        athleteStatus: 'Active',
        category: age <= 12 ? infantilCategory : (age <= 15 ? prejuvenilCategory : juvenilCategory)
      });
      currentId++;
    }

    // CASO 4-8: DEPORTISTAS ACTIVAS (Matrícula vigente, diferentes antigüedades)
    for (let i = 0; i < 5; i++) {
      const firstName = getRandomElement(NOMBRES_FEMENINOS);
      const lastName = getRandomElement(APELLIDOS);
      const secondLastName = getRandomElement(APELLIDOS);
      const birthDate = generateRandomDate(new Date(2008, 0, 1), new Date(2012, 11, 31));
      const age = calculateAge(birthDate);
      const isMinor = age < 18;
      
      deportistas.push({
        caso: 'ACTIVA_VIGENTE',
        firstName,
        lastName,
        secondLastName,
        birthDate,
        age,
        isMinor,
        identification: currentId.toString(),
        documentTypeId: isMinor ? tarjetaType.id : cedulaType.id,
        email: generateEmail(firstName, lastName, currentId),
        phoneNumber: generatePhoneNumber(),
        address: generateAddress(),
        needsGuardian: isMinor,
        enrollmentStatus: 'Vigente',
        athleteStatus: 'Active',
        category: age <= 12 ? infantilCategory : (age <= 15 ? prejuvenilCategory : juvenilCategory),
        enrollmentStartDate: generateRandomDate(new Date(2023, 0, 1), new Date(2024, 5, 30)),
        hasMonthlyPayments: true
      });
      currentId++;
    }

    // CASO 9-12: DEPORTISTAS CON MATRÍCULA POR VENCER (próximos 30 días)
    for (let i = 0; i < 4; i++) {
      const firstName = getRandomElement(NOMBRES_FEMENINOS);
      const lastName = getRandomElement(APELLIDOS);
      const secondLastName = getRandomElement(APELLIDOS);
      const birthDate = generateRandomDate(new Date(2006, 0, 1), new Date(2010, 11, 31));
      const age = calculateAge(birthDate);
      const isMinor = age < 18;
      
      const enrollmentStart = new Date(2024, 2, 15); // Marzo 2024
      const enrollmentEnd = new Date(2025, 2, 15);   // Marzo 2025 (próximo a vencer)
      
      deportistas.push({
        caso: 'POR_VENCER',
        firstName,
        lastName,
        secondLastName,
        birthDate,
        age,
        isMinor,
        identification: currentId.toString(),
        documentTypeId: isMinor ? tarjetaType.id : cedulaType.id,
        email: generateEmail(firstName, lastName, currentId),
        phoneNumber: generatePhoneNumber(),
        address: generateAddress(),
        needsGuardian: isMinor,
        enrollmentStatus: 'Vigente',
        athleteStatus: 'Active',
        category: age <= 12 ? infantilCategory : (age <= 15 ? prejuvenilCategory : juvenilCategory),
        enrollmentStartDate: enrollmentStart,
        enrollmentEndDate: enrollmentEnd,
        hasMonthlyPayments: true,
        hasOverduePayments: Math.random() > 0.5
      });
      currentId++;
    }

    // CASO 13-16: DEPORTISTAS CON MATRÍCULA VENCIDA (necesitan renovación)
    for (let i = 0; i < 4; i++) {
      const firstName = getRandomElement(NOMBRES_FEMENINOS);
      const lastName = getRandomElement(APELLIDOS);
      const secondLastName = getRandomElement(APELLIDOS);
      const birthDate = generateRandomDate(new Date(2005, 0, 1), new Date(2009, 11, 31));
      const age = calculateAge(birthDate);
      const isMinor = age < 18;
      
      const enrollmentStart = new Date(2023, 1, 1);  // Febrero 2023
      const enrollmentEnd = new Date(2024, 1, 1);    // Febrero 2024 (ya vencida)
      
      deportistas.push({
        caso: 'VENCIDA',
        firstName,
        lastName,
        secondLastName,
        birthDate,
        age,
        isMinor,
        identification: currentId.toString(),
        documentTypeId: isMinor ? tarjetaType.id : cedulaType.id,
        email: generateEmail(firstName, lastName, currentId),
        phoneNumber: generatePhoneNumber(),
        address: generateAddress(),
        needsGuardian: isMinor,
        enrollmentStatus: 'Vencida',
        athleteStatus: 'Active',
        category: age <= 12 ? infantilCategory : (age <= 15 ? prejuvenilCategory : juvenilCategory),
        enrollmentStartDate: enrollmentStart,
        enrollmentEndDate: enrollmentEnd,
        needsRenewal: true
      });
      currentId++;
    }

    // CASO 17-19: DEPORTISTAS INACTIVAS (diferentes razones)
    for (let i = 0; i < 3; i++) {
      const firstName = getRandomElement(NOMBRES_FEMENINOS);
      const lastName = getRandomElement(APELLIDOS);
      const secondLastName = getRandomElement(APELLIDOS);
      const birthDate = generateRandomDate(new Date(2004, 0, 1), new Date(2008, 11, 31));
      const age = calculateAge(birthDate);
      const isMinor = age < 18;
      
      const inactivityReasons = [
        'Cambio de ciudad',
        'Problemas de salud',
        'Falta de tiempo por estudios'
      ];
      
      deportistas.push({
        caso: 'INACTIVA',
        firstName,
        lastName,
        secondLastName,
        birthDate,
        age,
        isMinor,
        identification: currentId.toString(),
        documentTypeId: isMinor ? tarjetaType.id : cedulaType.id,
        email: generateEmail(firstName, lastName, currentId),
        phoneNumber: generatePhoneNumber(),
        address: generateAddress(),
        needsGuardian: isMinor,
        enrollmentStatus: 'Vigente',
        athleteStatus: 'Inactive',
        category: age <= 12 ? infantilCategory : (age <= 15 ? prejuvenilCategory : juvenilCategory),
        inactivityReason: inactivityReasons[i],
        enrollmentStartDate: generateRandomDate(new Date(2023, 0, 1), new Date(2024, 0, 1))
      });
      currentId++;
    }

    // CASO 20-21: DEPORTISTAS MAYORES DE EDAD (sin acudiente)
    for (let i = 0; i < 2; i++) {
      const firstName = getRandomElement(NOMBRES_FEMENINOS);
      const lastName = getRandomElement(APELLIDOS);
      const secondLastName = getRandomElement(APELLIDOS);
      const birthDate = generateRandomDate(new Date(2000, 0, 1), new Date(2005, 11, 31));
      const age = calculateAge(birthDate);
      
      deportistas.push({
        caso: 'MAYOR_EDAD',
        firstName,
        lastName,
        secondLastName,
        birthDate,
        age,
        isMinor: false,
        identification: currentId.toString(),
        documentTypeId: cedulaType.id,
        email: generateEmail(firstName, lastName, currentId),
        phoneNumber: generatePhoneNumber(),
        address: generateAddress(),
        needsGuardian: false,
        enrollmentStatus: 'Vigente',
        athleteStatus: 'Active',
        category: juvenilCategory,
        enrollmentStartDate: generateRandomDate(new Date(2023, 6, 1), new Date(2024, 6, 1)),
        hasMonthlyPayments: true
      });
      currentId++;
    }

    // CASO 22-23: DEPORTISTAS CON HISTORIAL COMPLEJO (renovaciones múltiples)
    for (let i = 0; i < 2; i++) {
      const firstName = getRandomElement(NOMBRES_FEMENINOS);
      const lastName = getRandomElement(APELLIDOS);
      const secondLastName = getRandomElement(APELLIDOS);
      const birthDate = generateRandomDate(new Date(2007, 0, 1), new Date(2011, 11, 31));
      const age = calculateAge(birthDate);
      const isMinor = age < 18;
      
      deportistas.push({
        caso: 'HISTORIAL_COMPLEJO',
        firstName,
        lastName,
        secondLastName,
        birthDate,
        age,
        isMinor,
        identification: currentId.toString(),
        documentTypeId: isMinor ? tarjetaType.id : cedulaType.id,
        email: generateEmail(firstName, lastName, currentId),
        phoneNumber: generatePhoneNumber(),
        address: generateAddress(),
        needsGuardian: isMinor,
        enrollmentStatus: 'Vigente',
        athleteStatus: 'Active',
        category: age <= 12 ? infantilCategory : (age <= 15 ? prejuvenilCategory : juvenilCategory),
        hasMultipleEnrollments: true,
        hasComplexPaymentHistory: true
      });
      currentId++;
    }
    // ========================================================================
    // CREAR ACUDIENTES PARA MENORES
    // ========================================================================
    console.log('   👨‍👩‍👧 Creando acudientes para menores...');
    
    const guardians = [];
    let guardianId = 2000000001;
    
    for (const deportista of deportistas.filter(d => d.needsGuardian)) {
      const relationships = ['Mother', 'Father', 'Grandparent', 'Uncle_Aunt', 'Legal_Guardian'];
      const guardian = {
        firstName: getRandomElement(['María', 'Ana', 'Carmen', 'José', 'Carlos', 'Luis', 'Pedro', 'Juan']),
        lastName: deportista.lastName, // Mismo apellido que la deportista
        identification: guardianId.toString(),
        email: generateEmail('guardian' + guardianId, deportista.lastName, guardianId),
        phone: generatePhoneNumber(),
        address: deportista.address, // Misma dirección
        occupation: getRandomElement(['Empleada', 'Comerciante', 'Profesora', 'Enfermera', 'Secretaria', 'Independiente']),
        documentTypeId: cedulaType.id,
        birthDate: generateRandomDate(new Date(1970, 0, 1), new Date(1990, 11, 31)),
        relationship: getRandomElement(relationships)
      };
      
      guardians.push(guardian);
      deportista.guardian = guardian;
      guardianId++;
    }

    // Crear acudientes en la base de datos
    for (const guardian of guardians) {
      const createdGuardian = await prisma.guardian.create({
        data: {
          firstName: guardian.firstName,
          lastName: guardian.lastName,
          identification: guardian.identification,
          email: guardian.email,
          phone: guardian.phone,
          address: guardian.address,
          occupation: guardian.occupation,
          documentTypeId: guardian.documentTypeId,
          birthDate: guardian.birthDate
        }
      });
      guardian.id = createdGuardian.id;
    }

    console.log(`   ✅ ${guardians.length} acudientes creados`);

    // ========================================================================
    // CREAR DEPORTISTAS Y SUS DATOS COMPLETOS
    // ========================================================================
    console.log('   🏃‍♀️ Creando deportistas y sus datos...');
    
    for (let i = 0; i < deportistas.length; i++) {
      const deportista = deportistas[i];
      
      console.log(`   📝 Creando deportista ${i + 1}/23: ${deportista.firstName} ${deportista.lastName} (${deportista.caso})`);
      
      // Crear usuario
      const hashedPassword = await bcrypt.hash(deportista.identification, 10);
      const user = await prisma.user.create({
        data: {
          firstName: deportista.firstName,
          lastName: deportista.lastName,
          secondLastName: deportista.secondLastName,
          identification: deportista.identification,
          documentTypeId: deportista.documentTypeId,
          email: deportista.email,
          passwordHash: hashedPassword,
          phoneNumber: deportista.phoneNumber,
          address: deportista.address,
          birthDate: deportista.birthDate,
          age: deportista.age,
          roleId: athleteRole.id,
          status: "Active"
        }
      });

      // Crear atleta
      const athlete = await prisma.athlete.create({
        data: {
          userId: user.id,
          status: deportista.athleteStatus,
          guardianId: deportista.guardian?.id || null,
          relationship: deportista.guardian?.relationship || null,
          currentInscriptionStatus: deportista.athleteStatus === 'Active' ? 'Active' : 'Suspended',
          isScholarship: false,
          inactivityReason: deportista.inactivityReason || null
        }
      });

      // Crear inscripción en categoría deportiva
      await prisma.inscription.create({
        data: {
          athleteId: athlete.id,
          sportsCategoryId: deportista.category.id,
          type: "initial_inscription",
          status: deportista.athleteStatus === 'Active' ? "Active" : "Suspended",
          inscriptionDate: deportista.enrollmentStartDate || new Date(),
          conceptDate: deportista.enrollmentStartDate || new Date(),
          expirationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          concept: `Inscripción inicial en categoría ${deportista.category.nombre}`
        }
      });

      // ====================================================================
      // CREAR MATRÍCULAS SEGÚN EL CASO
      // ====================================================================
      
      if (deportista.caso === 'NUEVA_PENDIENTE') {
        // Matrícula pendiente de pago inicial
        const enrollment = await prisma.enrollment.create({
          data: {
            athleteId: athlete.id,
            estado: 'Pending_Payment',
            observaciones: 'Matrícula inicial pendiente de pago',
            fechaInicio: null,
            fechaVencimiento: null
          }
        });

        // Crear obligación de pago inicial
        await prisma.paymentObligation.create({
          data: {
            athleteId: athlete.id,
            type: 'ENROLLMENT_INITIAL',
            period: null,
            baseAmount: 40000,
            dueStart: new Date(),
            dueEnd: new Date(Date.now() + (5 * 24 * 60 * 60 * 1000)) // 5 días
          }
        });
        
      } else if (deportista.caso === 'HISTORIAL_COMPLEJO') {
        // Crear múltiples matrículas (historial)
        const enrollmentDates = [
          { start: new Date(2022, 0, 15), end: new Date(2023, 0, 15) },
          { start: new Date(2023, 0, 15), end: new Date(2024, 0, 15) },
          { start: new Date(2024, 0, 15), end: new Date(2025, 0, 15) }
        ];

        for (let j = 0; j < enrollmentDates.length; j++) {
          const dates = enrollmentDates[j];
          const isCurrentEnrollment = j === enrollmentDates.length - 1;
          
          const enrollment = await prisma.enrollment.create({
            data: {
              athleteId: athlete.id,
              estado: isCurrentEnrollment ? 'Vigente' : 'Vigente',
              observaciones: j === 0 ? 'Matrícula inicial' : `Renovación ${j}`,
              fechaInicio: dates.start,
              fechaVencimiento: dates.end
            }
          });

          // Crear obligaciones y pagos para cada matrícula
          const obligationType = j === 0 ? 'ENROLLMENT_INITIAL' : 'ENROLLMENT_RENEWAL';
          const obligation = await prisma.paymentObligation.create({
            data: {
              athleteId: athlete.id,
              type: obligationType,
              period: null,
              baseAmount: 40000,
              dueStart: new Date(dates.start.getTime() - (10 * 24 * 60 * 60 * 1000)),
              dueEnd: new Date(dates.start.getTime() - (5 * 24 * 60 * 60 * 1000))
            }
          });

          // Crear pago aprobado
          await prisma.payment.create({
            data: {
              obligationId: obligation.id,
              athleteId: athlete.id,
              receiptUrl: `https://res.cloudinary.com/demo/image/upload/sample_${j + 1}.jpg`,
              receiptName: `comprobante_matricula_${j + 1}.jpg`,
              status: 'APPROVED',
              uploadedAt: new Date(dates.start.getTime() - (3 * 24 * 60 * 60 * 1000)),
              reviewedAt: new Date(dates.start.getTime() - (1 * 24 * 60 * 60 * 1000)),
              reviewedBy: 1 // Admin user ID
            }
          });
        }
        
      } else {
        // Casos normales con una matrícula
        const enrollment = await prisma.enrollment.create({
          data: {
            athleteId: athlete.id,
            estado: deportista.enrollmentStatus,
            observaciones: deportista.caso === 'VENCIDA' ? 'Matrícula vencida - requiere renovación' : 
                          deportista.caso === 'INACTIVA' ? `Deportista inactiva: ${deportista.inactivityReason}` :
                          'Matrícula activa',
            fechaInicio: deportista.enrollmentStartDate || new Date(),
            fechaVencimiento: deportista.enrollmentEndDate || 
                            (deportista.enrollmentStartDate ? 
                             new Date(deportista.enrollmentStartDate.setFullYear(deportista.enrollmentStartDate.getFullYear() + 1)) :
                             new Date(new Date().setFullYear(new Date().getFullYear() + 1)))
          }
        });

        // Crear obligaciones según el estado
        if (deportista.enrollmentStatus === 'Vigente' || deportista.enrollmentStatus === 'Vencida') {
          // Crear obligación inicial (ya pagada)
          const initialObligation = await prisma.paymentObligation.create({
            data: {
              athleteId: athlete.id,
              type: 'ENROLLMENT_INITIAL',
              period: null,
              baseAmount: 40000,
              dueStart: new Date(deportista.enrollmentStartDate.getTime() - (10 * 24 * 60 * 60 * 1000)),
              dueEnd: new Date(deportista.enrollmentStartDate.getTime() - (5 * 24 * 60 * 60 * 1000))
            }
          });

          // Crear pago aprobado para la matrícula inicial
          await prisma.payment.create({
            data: {
              obligationId: initialObligation.id,
              athleteId: athlete.id,
              receiptUrl: `https://res.cloudinary.com/demo/image/upload/sample_initial_${athlete.id}.jpg`,
              receiptName: `comprobante_inicial_${athlete.id}.jpg`,
              status: 'APPROVED',
              uploadedAt: new Date(deportista.enrollmentStartDate.getTime() - (7 * 24 * 60 * 60 * 1000)),
              reviewedAt: new Date(deportista.enrollmentStartDate.getTime() - (5 * 24 * 60 * 60 * 1000)),
              reviewedBy: 1
            }
          });
        }

        // Si necesita renovación, crear obligación de renovación
        if (deportista.needsRenewal) {
          await prisma.paymentObligation.create({
            data: {
              athleteId: athlete.id,
              type: 'ENROLLMENT_RENEWAL',
              period: null,
              baseAmount: 40000,
              dueStart: deportista.enrollmentEndDate,
              dueEnd: new Date(deportista.enrollmentEndDate.getTime() + (5 * 24 * 60 * 60 * 1000))
            }
          });
        }
      }

      // ====================================================================
      // CREAR MENSUALIDADES Y PAGOS
      // ====================================================================
      
      if (deportista.hasMonthlyPayments && deportista.enrollmentStatus === 'Vigente') {
        const startDate = deportista.enrollmentStartDate || new Date(2024, 0, 1);
        const currentDate = new Date();
        
        // Generar mensualidades desde el inicio de la matrícula hasta ahora
        let monthDate = new Date(startDate);
        while (monthDate <= currentDate) {
          const period = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
          
          const obligation = await prisma.paymentObligation.create({
            data: {
              athleteId: athlete.id,
              type: 'MONTHLY',
              period: period,
              baseAmount: 30000,
              dueStart: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
              dueEnd: new Date(monthDate.getFullYear(), monthDate.getMonth(), 5)
            }
          });

          // Determinar si el pago está al día, atrasado o pendiente
          const isCurrentMonth = monthDate.getMonth() === currentDate.getMonth() && 
                                monthDate.getFullYear() === currentDate.getFullYear();
          const isOverdue = deportista.hasOverduePayments && Math.random() > 0.7;
          
          if (!isCurrentMonth && !isOverdue) {
            // Crear pago aprobado para meses anteriores
            await prisma.payment.create({
              data: {
                obligationId: obligation.id,
                athleteId: athlete.id,
                receiptUrl: `https://res.cloudinary.com/demo/image/upload/monthly_${athlete.id}_${period}.jpg`,
                receiptName: `mensualidad_${period}.jpg`,
                status: 'APPROVED',
                uploadedAt: new Date(monthDate.getFullYear(), monthDate.getMonth(), 3),
                reviewedAt: new Date(monthDate.getFullYear(), monthDate.getMonth(), 4),
                reviewedBy: 1
              }
            });
          } else if (isOverdue) {
            // Dejar sin pago (mora)
            console.log(`     💸 Mensualidad ${period} en mora`);
          }
          
          monthDate.setMonth(monthDate.getMonth() + 1);
        }
      }
    }

    console.log('   ✅ 23 deportistas creadas con casos completos');

    // ========================================================================
    // RESUMEN FINAL
    // ========================================================================
    console.log('\n📊 RESUMEN DE DATOS CREADOS:');
    console.log('=' .repeat(60));
    
    const summary = await prisma.$transaction([
      prisma.user.count(),
      prisma.athlete.count(),
      prisma.guardian.count(),
      prisma.enrollment.count(),
      prisma.paymentObligation.count(),
      prisma.payment.count(),
      prisma.inscription.count()
    ]);

    console.log(`👥 Usuarios totales: ${summary[0]} (1 admin + 23 deportistas)`);
    console.log(`🏃‍♀️ Deportistas: ${summary[1]}`);
    console.log(`👨‍👩‍👧 Acudientes: ${summary[2]}`);
    console.log(`📋 Matrículas: ${summary[3]}`);
    console.log(`💰 Obligaciones de pago: ${summary[4]}`);
    console.log(`💳 Pagos registrados: ${summary[5]}`);
    console.log(`🏆 Inscripciones deportivas: ${summary[6]}`);

    // Estadísticas por estado
    const enrollmentStats = await prisma.enrollment.groupBy({
      by: ['estado'],
      _count: { estado: true }
    });

    console.log('\n📈 ESTADÍSTICAS POR ESTADO:');
    enrollmentStats.forEach(stat => {
      console.log(`   ${stat.estado}: ${stat._count.estado} matrículas`);
    });

    const obligationStats = await prisma.paymentObligation.groupBy({
      by: ['type'],
      _count: { type: true }
    });

    console.log('\n💰 OBLIGACIONES POR TIPO:');
    obligationStats.forEach(stat => {
      console.log(`   ${stat.type}: ${stat._count.type} obligaciones`);
    });

    console.log('\n🎉 BASE DE DATOS POBLADA EXITOSAMENTE!');
    console.log('=' .repeat(60));
    console.log('🔑 CREDENCIALES DE ACCESO:');
    console.log('   👑 Admin: astrostar.java@gmail.com / Admin123*');
    console.log('   🏃‍♀️ Deportistas: [documento] / [documento]');
    console.log('\n💡 CASOS DE PRUEBA DISPONIBLES:');
    console.log('   • 3 deportistas nuevas (pago inicial pendiente)');
    console.log('   • 5 deportistas activas (matrícula vigente)');
    console.log('   • 4 deportistas con matrícula por vencer');
    console.log('   • 4 deportistas con matrícula vencida');
    console.log('   • 3 deportistas inactivas');
    console.log('   • 2 deportistas mayores de edad');
    console.log('   • 2 deportistas con historial complejo');
    console.log('\n🚀 ¡Sistema listo para pruebas de producción!');

  } catch (error) {
    console.error('❌ Error durante la población de datos:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Error fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
/**
 * SEED COMPLETO DE DATOS DE PRUEBA PARA ASTROSTAR
 *
 * Este seed crea datos de prueba para:
 * - Empleados
 * - Eventos con categorías deportivas
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

async function main() {
  console.log("🌱 Iniciando seed completo de datos de prueba...\n");

  // Obtener datos necesarios
  const documentType = await prisma.documentType.findFirst({
    where: { name: "Cédula de Ciudadanía" },
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

  // ============================================
  // 1. CREAR EMPLEADOS
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
  // 2. CREAR EVENTOS CON CATEGORÍAS
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

  if (torneoType) {
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
    events.push(event1);
  }

  if (festivalType) {
    // Evento 2: Festival Deportivo
    const event2 = await prisma.service.create({
      data: {
        name: "Festival Deportivo Astrostar",
        description: "Festival deportivo para todas las categorías",
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
    events.push(event2);
  }

  console.log(`   ✓ ${events.length} eventos creados\n`);

  // ============================================
  // RESUMEN FINAL
  // ============================================
  console.log("🎉 Seed completo finalizado exitosamente!\n");
  console.log("📊 Resumen de datos creados:");
  console.log(`   • Empleados: ${employees.length}`);
  console.log(`   • Eventos: ${events.length}`);
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
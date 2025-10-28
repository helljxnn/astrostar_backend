/**
 * SEED DE DATOS MAESTROS DEL SISTEMA ASTROSTAR
 *
 * Este archivo carga los datos esenciales que el sistema necesita para funcionar:
 * - Tipos de documento (obligatorios para usuarios)
 * - Tipos de empleado (categorías fijas del sistema)
 * - Rol de Administrador (crítico para acceso inicial)
 *
 * Estos datos son considerados "maestros" y no deben ser modificados por usuarios finales.
 * Se ejecuta automáticamente en la inicialización de la base de datos.
 */

import { PrismaClient } from "../generated/prisma/index.js";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de datos maestros del sistema...\n");
  // TIPOS DE DOCUMENTO VÁLIDOS EN COLOMBIA
  console.log("📄 Configurando tipos de documento...");
  await prisma.documentType.createMany({
    data: [
      {
        name: "Cédula de Ciudadanía",
        description: "Documento de identidad para ciudadanos colombianos",
      },
      {
        name: "Tarjeta de Identidad",
        description: "Documento de identidad para menores de edad",
      },
      {
        name: "Permiso de Permanencia",
        description: "Documento para extranjeros con permiso de permanencia",
      },
      {
        name: "Tarjeta de Extranjería",
        description: "Documento de identidad para extranjeros",
      },
      {
        name: "Cédula de Extranjería",
        description: "Documento de identidad para extranjeros residentes",
      },
      {
        name: "Número de Identificación Tributaria",
        description: "Documento de identificación tributaria",
      },
      {
        name: "Pasaporte",
        description: "Documento de identidad internacional",
      },
      {
        name: "Número de Identificación Extranjero",
        description: "Documento de identificación para extranjeros",
      },
    ],
    skipDuplicates: true,
  });

  // TIPOS DE EMPLEADO POR DEFECTO DEL SISTEMA
  // Estos son los únicos tipos permitidos y son obligatorios
  const defaultEmployeeTypes = [
    {
      name: "Fisioterapeuta",
      description: "Profesional en fisioterapia y rehabilitación deportiva",
    },
    {
      name: "Psicólogo",
      description: "Profesional en psicología deportiva y clínica",
    },
    {
      name: "Nutricionista",
      description: "Profesional en nutrición y dietética deportiva",
    },
    {
      name: "Entrenador",
      description: "Entrenador deportivo y técnico especializado",
    },
    {
      name: "Contador",
      description: "Profesional en contabilidad y gestión financiera",
    },
    {
      name: "Publicista",
      description: "Profesional en marketing, comunicaciones y publicidad",
    },
    {
      name: "Director Técnico",
      description: "Director técnico y coordinador deportivo principal",
    },
  ];

  console.log("🏷️ Configurando tipos de empleado por defecto...");

  for (const type of defaultEmployeeTypes) {
    const result = await prisma.employeeType.upsert({
      where: { name: type.name },
      update: {
        description: type.description,
        updatedAt: new Date(),
      },
      create: {
        name: type.name,
        description: type.description,
      },
    });
    console.log(`   ✓ ${result.name}`);
  }

  // ROL DE ADMINISTRADOR (CRÍTICO PARA EL SISTEMA)
  console.log("👑 Configurando rol de Administrador...");
  const adminRole = await prisma.role.upsert({
    where: { name: "Administrador" },
    update: {}, // No actualizar si ya existe
    create: {
      name: "Administrador",
      description:
        "Acceso completo al sistema con todos los permisos. Este rol no puede ser eliminado.",
      status: "Active",
      permissions: {
        // Permisos completos para todos los módulos
        dashboard: { Ver: true, Crear: true, Editar: true, Eliminar: true },
        users: { Ver: true, Crear: true, Editar: true, Eliminar: true },
        roles: { Ver: true, Crear: true, Editar: true, Eliminar: true },
        sportsEquipment: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
        },
        employees: { Ver: true, Crear: true, Editar: true, Eliminar: true },
        employeesSchedule: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
        },
        appointmentManagement: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
        },
        sportsCategory: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
        },
        athletesSection: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
        },
        athletesAssistance: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
        },
        donorsSponsors: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
        },
        donationsManagement: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
        },
        eventsManagement: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
        },
        temporaryWorkers: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
        },
        temporaryTeams: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
        },
        providers: { Ver: true, Crear: true, Editar: true, Eliminar: true },
        purchasesManagement: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
        },
      },
    },
  });

  console.log(`   ✓ ${adminRole.name} configurado correctamente\n`);

  console.log("🎉 Seed completado exitosamente!");
  console.log("📊 Resumen:");
  console.log("   • Tipos de documento: Configurados");
  console.log("   • Tipos de empleado: 7 tipos por defecto");
  console.log("   • Rol Administrador: Listo para usar");
  console.log(
    "\n💡 El sistema está listo para crear el primer usuario administrador."
  );
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

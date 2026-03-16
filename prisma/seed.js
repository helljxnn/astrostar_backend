/**
 * Master seed for client delivery.
 * This file is idempotent and only creates base data required by the system.
 */

import bcrypt from "bcrypt";
import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

const MODULES = [
  "dashboard",
  "users",
  "roles",
  "employees",
  "employeesSchedule",
  "appointmentManagement",
  "sportsCategory",
  "athletesSection",
  "athletesAssistance",
  "enrollments",
  "paymentsManagement",
  "myPayments",
  "eventsManagement",
  "temporaryWorkers",
  "temporaryTeams",
  "donorsSponsors",
  "donationsManagement",
  "materials",
  "materialCategories",
  "materialsRegistry",
  "providers",
  "purchasesManagement",
];

const ACTIONS = ["Ver", "Crear", "Editar", "Eliminar"];

const MODULE_ALLOWED_ACTIONS = {
  dashboard: ["Ver"],
  users: ["Ver"],
  roles: ["Crear", "Ver", "Editar", "Eliminar"],
  employees: ["Crear", "Ver", "Editar", "Eliminar"],
  employeesSchedule: ["Crear", "Ver", "Editar", "Eliminar"],
};

const DOCUMENT_TYPES = [
  {
    name: "Cedula de Ciudadania",
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
    name: "Tarjeta de Extranjeria",
    description: "Documento de identidad para extranjeros",
  },
  {
    name: "Cedula de Extranjeria",
    description: "Documento de identidad para extranjeros residentes",
  },
  {
    name: "Numero de Identificacion Tributaria",
    description: "Documento de identificacion tributaria",
  },
  {
    name: "Pasaporte",
    description: "Documento de identidad internacional",
  },
  {
    name: "Numero de Identificacion Extranjero",
    description: "Documento de identificacion para extranjeros",
  },
];

const EVENT_TYPES = [
  {
    name: "Clausura",
    description: "Evento de cierre o finalizacion",
  },
  {
    name: "Taller",
    description: "Actividad formativa practica",
  },
  {
    name: "Torneo",
    description: "Competencia deportiva con inscripcion por equipos",
  },
  {
    name: "Festival",
    description: "Evento festivo con multiples actividades",
  },
];

const BASE_ROLES = [
  {
    name: "Administrador",
    description:
      "Tiene acceso completo a todas las funcionalidades del aplicativo. Este rol es asignado a las personas encargadas de la administración de la fundación y permite gestionar todos los módulos del sistema, así como crear, editar, eliminar y ver detalle de la información registrada.",
    permissionFactory: buildAdminPermissions,
  },
  {
    name: "Entrenador",
    description:
      "Permite ver detalle y registrar novedad en el módulo de horario de empleado. También puede ver detalles en las categorías deportivas y en los deportistas. En el módulo de asistencia puede crear, editar y ver el historial de asistencia de las deportistas. Además, permite ver personas en temporales y ver detalle en los equipos.",
    permissionFactory: () =>
      buildRolePermissions([
        ["dashboard", ["Ver"]],
        ["employeesSchedule", ["Ver", "Editar"]],
        ["sportsCategory", ["Ver"]],
        ["athletesSection", ["Ver"]],
        ["athletesAssistance", ["Crear", "Ver", "Editar"]],
        ["temporaryWorkers", ["Ver"]],
        ["temporaryTeams", ["Ver"]],
      ]),
  },
  {
    name: "Profesional de la Salud",
    description:
      "Permite crear, ver detalle, editar, eliminar y registrar novedad en el módulo de horario de empleado. En el módulo de citas puede crear, ver detalle, editar, completar y cancelar citas. También permite ver detalles en las categorías deportivas y ver detalle en los deportistas. Este rol corresponde a profesionales como nutricionista, psicóloga y fisioterapeuta encargados del acompañamiento de las deportistas.",
    permissionFactory: () =>
      buildRolePermissions([
        ["dashboard", ["Ver"]],
        ["employeesSchedule", ["Crear", "Ver", "Editar", "Eliminar"]],
        ["appointmentManagement", ["Crear", "Ver", "Editar", "Eliminar"]],
        ["sportsCategory", ["Ver"]],
        ["athletesSection", ["Ver"]],
      ]),
  },
  {
    name: "Deportista",
    description:
      "Permite ver detalles y cancelar citas programadas. En el módulo de pagos permite ver detalle de los pagos realizados y subir comprobantes de pagos dentro del aplicativo.",
    permissionFactory: () =>
      buildRolePermissions([
        ["dashboard", ["Ver"]],
        ["appointmentManagement", ["Ver", "Editar"]],
        ["myPayments", ["Ver", "Crear", "Editar"]],
      ]),
  },
];

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function createPermissionSkeleton() {
  const permissions = {};
  for (const moduleKey of MODULES) {
    permissions[moduleKey] = {
      Ver: false,
      Crear: false,
      Editar: false,
      Eliminar: false,
    };
  }
  return permissions;
}

function getAllowedActions(moduleKey) {
  return MODULE_ALLOWED_ACTIONS[moduleKey] || ACTIONS;
}

function setModuleActions(permissions, moduleKey, actions = []) {
  if (!permissions[moduleKey]) return;
  const allowed = new Set(getAllowedActions(moduleKey));
  const requested = new Set(actions);
  for (const action of ACTIONS) {
    permissions[moduleKey][action] = allowed.has(action) && requested.has(action);
  }
}

function buildRolePermissions(moduleActions = []) {
  const permissions = createPermissionSkeleton();
  for (const [moduleKey, actions] of moduleActions) {
    setModuleActions(permissions, moduleKey, actions);
  }
  return permissions;
}

function buildAdminPermissions() {
  const permissions = createPermissionSkeleton();
  for (const moduleKey of MODULES) {
    setModuleActions(permissions, moduleKey, getAllowedActions(moduleKey));
  }
  return permissions;
}

async function upsertDocumentTypes() {
  const existing = await prisma.documentType.findMany({
    select: { id: true, name: true },
  });

  for (const item of DOCUMENT_TYPES) {
    const match = existing.find(
      (row) => normalizeText(row.name) === normalizeText(item.name),
    );

    if (match) {
      await prisma.documentType.update({
        where: { id: match.id },
        data: {
          name: item.name,
          description: item.description,
        },
      });
      continue;
    }

    await prisma.documentType.create({
      data: item,
    });
  }
}

async function upsertRoles() {
  for (const roleConfig of BASE_ROLES) {
    const permissions = roleConfig.permissionFactory();
    const existing = await prisma.role.findFirst({
      where: { name: { equals: roleConfig.name, mode: "insensitive" } },
      select: { id: true, name: true },
    });

    if (existing) {
      await prisma.role.update({
        where: { id: existing.id },
        data: {
          name: roleConfig.name,
          description: roleConfig.description,
          permissions,
          status: "Active",
        },
      });
      continue;
    }

    await prisma.role.create({
      data: {
        name: roleConfig.name,
        description: roleConfig.description,
        permissions,
        status: "Active",
      },
    });
  }
}

async function upsertEventTypes() {
  for (const eventType of EVENT_TYPES) {
    await prisma.serviceType.upsert({
      where: { name: eventType.name },
      update: { description: eventType.description },
      create: eventType,
    });
  }
}

async function upsertAdminUser() {
  const adminRole = await prisma.role.findFirst({
    where: { name: { equals: "Administrador", mode: "insensitive" } },
  });
  if (!adminRole) {
    throw new Error("No se pudo resolver el rol Administrador en el seed.");
  }

  const defaultDocumentType =
    (await prisma.documentType.findFirst({
      where: { name: { equals: "Cedula de Ciudadania", mode: "insensitive" } },
    })) || (await prisma.documentType.findFirst());

  if (!defaultDocumentType) {
    throw new Error("No hay tipos de documento para crear el admin.");
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "astrostar.java@gmail.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin123*";
  const adminHash = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true },
  });

  if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        roleId: adminRole.id,
        status: "Active",
      },
    });
    return { email: adminEmail, password: adminPassword, created: false };
  }

  await prisma.user.create({
    data: {
      firstName: "Administrador",
      middleName: "del",
      lastName: "Sistema",
      secondLastName: "Astrostar",
      identification: process.env.SEED_ADMIN_IDENTIFICATION || "1000000000",
      documentTypeId: defaultDocumentType.id,
      email: adminEmail,
      passwordHash: adminHash,
      phoneNumber: process.env.SEED_ADMIN_PHONE || "+57 300 0000000",
      address: process.env.SEED_ADMIN_ADDRESS || "Sede principal Astrostar",
      birthDate: new Date("1990-01-01"),
      age: 36,
      roleId: adminRole.id,
      status: "Active",
    },
  });

  return { email: adminEmail, password: adminPassword, created: true };
}

async function main() {
  console.log("Starting master seed...");

  await upsertDocumentTypes();
  console.log("Document types ready.");

  await upsertRoles();
  console.log("Base roles ready.");

  await upsertEventTypes();
  console.log("Event types ready (Clausura, Taller, Torneo, Festival).");

  const adminInfo = await upsertAdminUser();
  console.log(
    adminInfo.created
      ? `Admin user created: ${adminInfo.email}`
      : `Admin user already exists: ${adminInfo.email}`,
  );

  console.log("Master seed completed successfully.");
  console.log(`Login email: ${adminInfo.email}`);
  console.log(`Login password: ${adminInfo.password}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

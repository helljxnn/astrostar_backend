/**
 * Seed unico de produccion.
 * Crea datos base del sistema de forma idempotente.
 */

import bcrypt from "bcrypt";
import { PrismaClient } from "../generated/prisma/index.js";
import {
  ROLE_MODULES,
  MODULE_ALLOWED_ACTIONS,
  normalizeRolePermissions,
} from "../src/modules/Roles/config/permissions.config.js";

const prisma = new PrismaClient();

const FALLBACK_BASE_ACTIONS = ["Crear", "Ver", "Editar", "Eliminar"];

const DOCUMENT_TYPES = [
  {
    name: "Cédula de Ciudadanía",
    description: "Documento de identidad para ciudadanos colombianos.",
  },
  {
    name: "Tarjeta de Identidad",
    description: "Documento de identidad para menores de edad.",
  },
  {
    name: "Permiso de Permanencia",
    description: "Documento para extranjeros con permiso de permanencia.",
  },
  {
    name: "Tarjeta de Extranjería",
    description: "Documento de identidad para extranjeros.",
  },
  {
    name: "Cédula de Extranjería",
    description: "Documento de identidad para extranjeros residentes.",
  },
  {
    name: "Número de Identificación Tributaria",
    description: "Documento de identificación tributaria.",
  },
  {
    name: "Pasaporte",
    description: "Documento de identidad internacional.",
  },
  {
    name: "Número de Identificación Extranjero",
    description: "Documento de identificación para extranjeros.",
  },
];

const EVENT_TYPES = [
  {
    name: "Clausura",
    description: "Evento de cierre o finalización.",
  },
  {
    name: "Taller",
    description: "Actividad formativa práctica.",
  },
  {
    name: "Torneo",
    description: "Competencia deportiva con inscripción por equipos.",
  },
  {
    name: "Festival",
    description: "Evento festivo con múltiples actividades.",
  },
];

const HEALTH_SPECIALTIES = [
  {
    value: "nutricion",
    label: "Nutricionista",
    description: "Especialidad para acompañamiento nutricional.",
  },
  {
    value: "psicologia",
    label: "Psicóloga",
    description: "Especialidad para acompañamiento psicológico.",
  },
  {
    value: "fisioterapia",
    label: "Fisioterapeuta",
    description: "Especialidad para acompañamiento físico y funcional.",
  },
];

const BASE_ROLES = [
  {
    name: "Administrador",
    description:
      "Acceso completo a todas las funcionalidades del aplicativo. Gestiona todos los módulos del sistema.",
    permissionFactory: buildAdminPermissions,
  },
  {
    name: "Entrenador",
    description:
      "Gestiona horarios, categorías deportivas, deportistas y asistencia. Ve personas temporales y equipos.",
    permissionFactory: () =>
      buildRolePermissions([
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
      "Gestiona horarios y citas médicas. Ve categorías deportivas y deportistas. Nutricionista, psicóloga, fisioterapeuta.",
    permissionFactory: () =>
      buildRolePermissions([
        ["employeesSchedule", ["Crear", "Ver", "Editar", "Eliminar"]],
        ["appointmentManagement", ["Crear", "Ver", "Editar", "Cancelar"]],
        ["sportsCategory", ["Ver"]],
        ["athletesSection", ["Ver"]],
      ]),
  },
  {
    name: "Deportista",
    description:
      "Ve y cancela citas programadas. Gestiona pagos y sube comprobantes de pago.",
    permissionFactory: () =>
      buildRolePermissions([
        ["appointmentManagement", ["Ver", "Cancelar"]],
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

function getAllowedActions(moduleKey) {
  return MODULE_ALLOWED_ACTIONS[moduleKey] || FALLBACK_BASE_ACTIONS;
}

function createPermissionSkeleton() {
  const permissions = {};

  for (const moduleKey of ROLE_MODULES) {
    permissions[moduleKey] = {};
    for (const action of getAllowedActions(moduleKey)) {
      permissions[moduleKey][action] = false;
    }
  }

  return permissions;
}

function setModuleActions(permissions, moduleKey, actions = []) {
  if (!permissions[moduleKey]) return;
  const allowed = new Set(getAllowedActions(moduleKey));
  const requested = new Set(actions);

  for (const action of allowed) {
    permissions[moduleKey][action] = requested.has(action);
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
  for (const moduleKey of ROLE_MODULES) {
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
    const rolePermissions = normalizeRolePermissions(
      roleConfig.permissionFactory(),
    );
    const existing = await prisma.role.findFirst({
      where: { name: { equals: roleConfig.name, mode: "insensitive" } },
      select: { id: true },
    });

    if (existing) {
      await prisma.role.update({
        where: { id: existing.id },
        data: {
          name: roleConfig.name,
          description: roleConfig.description,
          permissions: rolePermissions,
          status: "Active",
        },
      });
      continue;
    }

    await prisma.role.create({
      data: {
        name: roleConfig.name,
        description: roleConfig.description,
        permissions: rolePermissions,
        status: "Active",
      },
    });
  }
}

async function upsertPermissionsAndPrivileges() {
  for (const moduleKey of ROLE_MODULES) {
    const permissionRecord = await prisma.permission.upsert({
      where: { name: `role:${moduleKey}` },
      update: {
        description: `Permisos del módulo ${moduleKey}.`,
      },
      create: {
        name: `role:${moduleKey}`,
        description: `Permisos del módulo ${moduleKey}.`,
      },
    });

    const allowedActions = getAllowedActions(moduleKey);
    const existingPrivileges = await prisma.privilege.findMany({
      where: { permissionId: permissionRecord.id },
      select: { name: true, id: true },
    });
    const existingByName = new Map(
      existingPrivileges.map((privilege) => [privilege.name, privilege.id]),
    );

    for (const action of allowedActions) {
      const description = `Acción ${action} para el módulo ${moduleKey}.`;
      const existingPrivilegeId = existingByName.get(action);

      if (existingPrivilegeId) {
        await prisma.privilege.update({
          where: { id: existingPrivilegeId },
          data: { description },
        });
      } else {
        await prisma.privilege.create({
          data: {
            name: action,
            description,
            permissionId: permissionRecord.id,
          },
        });
      }
    }
  }
}

async function upsertHealthSpecialties() {
  const specialtiesPermission = await prisma.permission.upsert({
    where: { name: "employees:health-specialties" },
    update: {
      description:
        "Catálogo de especialidades para empleados con rol Profesional de la Salud.",
    },
    create: {
      name: "employees:health-specialties",
      description:
        "Catálogo de especialidades para empleados con rol Profesional de la Salud.",
    },
  });

  const existingPrivileges = await prisma.privilege.findMany({
    where: { permissionId: specialtiesPermission.id },
    select: { id: true, name: true },
  });
  const existingByName = new Map(
    existingPrivileges.map((privilege) => [privilege.name, privilege.id]),
  );

  for (const specialty of HEALTH_SPECIALTIES) {
    const existingId = existingByName.get(specialty.value);
    if (existingId) {
      await prisma.privilege.update({
        where: { id: existingId },
        data: { description: specialty.description },
      });
    } else {
      await prisma.privilege.create({
        data: {
          name: specialty.value,
          description: specialty.description,
          permissionId: specialtiesPermission.id,
        },
      });
    }
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

async function upsertAnonymousDonor() {
  await prisma.sponsor.upsert({
    where: { identification: "0000000000" },
    update: {
      name: "Anonimo",
      description:
        "Donante anonimo por defecto para registrar donaciones anónimas.",
      type: "Donor",
      personType: "Natural",
      status: "Active",
      documentType: "CC",
      contactName: "Anonimo",
      contactEmail: null,
      phone: null,
      address: null,
      city: null,
      country: "Colombia",
    },
    create: {
      name: "Anonimo",
      description:
        "Donante anonimo por defecto para registrar donaciones anónimas.",
      type: "Donor",
      personType: "Natural",
      status: "Active",
      documentType: "CC",
      identification: "0000000000",
      contactName: "Anonimo",
      contactEmail: null,
      phone: null,
      address: null,
      city: null,
      country: "Colombia",
    },
  });
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
      where: {
        name: {
          equals: "Cédula de Ciudadanía",
          mode: "insensitive",
        },
      },
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

  const ensureAdminEmployee = async (userId) => {
    await prisma.employee.upsert({
      where: { userId },
      update: {
        status: "Activo",
      },
      create: {
        userId,
        status: "Activo",
      },
    });
  };

  if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        roleId: adminRole.id,
        documentTypeId: defaultDocumentType.id,
        status: "Active",
      },
    });
    await ensureAdminEmployee(existingAdmin.id);
    return { email: adminEmail, password: adminPassword, created: false };
  }

  const createdAdmin = await prisma.user.create({
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
  await ensureAdminEmployee(createdAdmin.id);

  return { email: adminEmail, password: adminPassword, created: true };
}

async function main() {
  console.log("Iniciando seed unico de producción...");

  await upsertDocumentTypes();
  console.log("Tipos de documento listos.");

  await upsertRoles();
  console.log("Roles base listos.");

  await upsertPermissionsAndPrivileges();
  console.log("Permisos y privilegios listos.");

  await upsertHealthSpecialties();
  console.log("Especialidades de salud listas.");

  await upsertEventTypes();
  console.log("Tipos de evento listos.");

  await upsertAnonymousDonor();
  console.log("Donante anonimo por defecto listo.");

  const adminInfo = await upsertAdminUser();
  console.log(
    adminInfo.created
      ? `Usuario admin creado: ${adminInfo.email}`
      : `Usuario admin existente: ${adminInfo.email}`,
  );

  console.log("Seed completado correctamente.");
  console.log(`Login email: ${adminInfo.email}`);
  console.log(`Login password: ${adminInfo.password}`);
}

main()
  .catch((error) => {
    console.error("Seed falló:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

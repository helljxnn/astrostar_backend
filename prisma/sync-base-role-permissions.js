import { PrismaClient } from "../generated/prisma/index.js";
import { normalizeRolePermissions } from "../src/modules/Roles/config/permissions.config.js";

const prisma = new PrismaClient();

const normalizeKey = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const BASE_ROLE_MATRIX = {
  entrenador: {
    description:
      "Ver horario y registrar novedad, ver categorías/deportistas, gestionar asistencia (crear/ver/editar) y ver personas temporales/equipos.",
    permissions: {
      dashboard: { Ver: true },
      employeesSchedule: { Ver: true, Editar: true },
      sportsCategory: { Ver: true },
      athletesSection: { Ver: true },
      athletesAssistance: { Crear: true, Ver: true, Editar: true },
      temporaryWorkers: { Ver: true },
      temporaryTeams: { Ver: true },
    },
  },
  profesionaldelasalud: {
    description:
      "CRUD en horario de empleados y citas (crear/ver/editar/cancelar), con acceso de lectura a categorías deportivas y deportistas.",
    permissions: {
      dashboard: { Ver: true },
      employeesSchedule: { Crear: true, Ver: true, Editar: true, Eliminar: true },
      appointmentManagement: { Crear: true, Ver: true, Editar: true, Cancelar: true },
      sportsCategory: { Ver: true },
      athletesSection: { Ver: true },
    },
  },
  deportista: {
    description:
      "Ver y cancelar citas programadas, y acceso a pagos propios según reglas de estado financiero.",
    permissions: {
      dashboard: { Ver: true },
      appointmentManagement: { Ver: true, Cancelar: true },
      myPayments: { Ver: true, Crear: true, Editar: true },
    },
  },
};

async function syncBaseRoles() {
  const roles = await prisma.role.findMany({
    select: { id: true, name: true, description: true },
  });

  let updated = 0;

  for (const role of roles) {
    const key = normalizeKey(role.name);
    const baseConfig = BASE_ROLE_MATRIX[key];
    if (!baseConfig) continue;

    await prisma.role.update({
      where: { id: role.id },
      data: {
        description: baseConfig.description,
        permissions: normalizeRolePermissions(baseConfig.permissions),
        status: "Active",
      },
    });
    updated += 1;
  }

  return updated;
}

async function main() {
  const totalUpdated = await syncBaseRoles();
  console.log(`Roles base sincronizados: ${totalUpdated}`);
}

main()
  .catch((error) => {
    console.error("Error sincronizando roles base:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

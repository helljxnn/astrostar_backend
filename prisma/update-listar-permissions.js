import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

const isAdminRole = (roleName) =>
  roleName === "Administrador" || roleName === "admin";

const ensureListar = (permissions, isAdmin) => {
  const base =
    permissions && typeof permissions === "object" && !Array.isArray(permissions)
      ? { ...permissions }
      : {};
  const moduleKeys = new Set([...Object.keys(base), "sportsCategory"]);

  for (const moduleKey of moduleKeys) {
    const raw = base[moduleKey];

    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const modulePerms = { ...raw };
      if (modulePerms.Listar === undefined) {
        modulePerms.Listar = isAdmin;
      }
      base[moduleKey] = modulePerms;
      continue;
    }

    if (raw === undefined || raw === null) {
      base[moduleKey] = { Listar: isAdmin };
    }
  }

  return base;
};

async function main() {
  const roles = await prisma.role.findMany({
    select: { id: true, name: true, permissions: true },
  });

  let updated = 0;

  for (const role of roles) {
    const current = role.permissions ?? {};
    const next = ensureListar(current, isAdminRole(role.name));

    if (JSON.stringify(current) !== JSON.stringify(next)) {
      await prisma.role.update({
        where: { id: role.id },
        data: { permissions: next },
      });
      updated += 1;
    }
  }

  console.log(`Actualizacion completada. Roles actualizados: ${updated}`);
}

main()
  .catch((error) => {
    console.error("Error actualizando permisos Listar:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

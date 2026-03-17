import { PrismaClient } from "../generated/prisma/index.js";
import { normalizeRolePermissions } from "../src/modules/Roles/config/permissions.config.js";

const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany({
    select: { id: true, name: true, permissions: true },
  });

  let updated = 0;

  for (const role of roles) {
    const current = role.permissions ?? {};
    const next = normalizeRolePermissions(current);

    if (JSON.stringify(current) !== JSON.stringify(next)) {
      await prisma.role.update({
        where: { id: role.id },
        data: { permissions: next },
      });
      updated += 1;
    }
  }

  console.log(`Actualizacion completada. Roles normalizados: ${updated}`);
}

main()
  .catch((error) => {
    console.error("Error normalizando permisos de roles:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

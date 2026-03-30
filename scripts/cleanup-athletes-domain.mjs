import process from "node:process";
import prisma from "../src/config/database.js";

const parseArgs = (argv) => ({
  execute: argv.includes("--execute"),
  includePreRegistrations: argv.includes("--include-pre-registrations"),
});

const isAdminRole = (roleName) => {
  const normalized = String(roleName || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

  return normalized === "admin" || normalized === "administrador";
};

const summarizeScope = async (includePreRegistrations = false) => {
  const athleteRecords = await prisma.athlete.findMany({
    select: {
      id: true,
      userId: true,
      guardianId: true,
      user: {
        select: {
          email: true,
          identification: true,
          role: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const deletableAthletes = athleteRecords.filter(
    (athlete) => !isAdminRole(athlete.user?.role?.name),
  );
  const preservedAdminLinkedAthletes = athleteRecords.filter((athlete) =>
    isAdminRole(athlete.user?.role?.name),
  );

  const athleteIds = deletableAthletes.map((athlete) => athlete.id);
  const athleteUserIds = [...new Set(deletableAthletes.map((athlete) => athlete.userId))];

  const countForAthletes = async (delegate, whereBuilder) => {
    if (athleteIds.length === 0) return 0;
    return delegate.count({ where: whereBuilder(athleteIds) });
  };

  const [
    enrollments,
    inscriptions,
    paymentObligations,
    payments,
    attendances,
    appointments,
    groupMemberships,
    participants,
    teamMembers,
    guardians,
    preRegistrations,
    sportsCategories,
    adminUsers,
  ] = await Promise.all([
    countForAthletes(prisma.enrollment, (ids) => ({ athleteId: { in: ids } })),
    countForAthletes(prisma.inscription, (ids) => ({ athleteId: { in: ids } })),
    countForAthletes(prisma.paymentObligation, (ids) => ({ athleteId: { in: ids } })),
    countForAthletes(prisma.payment, (ids) => ({ athleteId: { in: ids } })),
    countForAthletes(prisma.athleteAttendance, (ids) => ({ athleteId: { in: ids } })),
    countForAthletes(prisma.appointment, (ids) => ({ athleteId: { in: ids } })),
    countForAthletes(prisma.groupMembership, (ids) => ({ athleteId: { in: ids } })),
    countForAthletes(prisma.participant, (ids) => ({ athleteId: { in: ids } })),
    countForAthletes(prisma.teamMember, (ids) => ({ athleteId: { in: ids } })),
    prisma.guardian.count(),
    includePreRegistrations ? prisma.preRegistration.count() : Promise.resolve(0),
    prisma.sportsCategory.count(),
    prisma.user.count({
      where: {
        role: {
          name: {
            in: ["Administrador", "administrador", "Admin", "admin"],
          },
        },
      },
    }),
  ]);

  return {
    athleteRecords,
    deletableAthletes,
    preservedAdminLinkedAthletes,
    athleteIds,
    athleteUserIds,
    counts: {
      athletes: deletableAthletes.length,
      athleteUsers: athleteUserIds.length,
      enrollments,
      inscriptions,
      paymentObligations,
      payments,
      attendances,
      appointments,
      groupMemberships,
      participants,
      teamMembers,
      guardians,
      preRegistrations,
      sportsCategories,
      adminUsers,
    },
  };
};

const printSummary = (label, summary, includePreRegistrations = false) => {
  console.log(`\n=== ${label} ===`);
  console.log(`Atletas a eliminar: ${summary.counts.athletes}`);
  console.log(`Usuarios de atletas a eliminar: ${summary.counts.athleteUsers}`);
  console.log(`Matriculas: ${summary.counts.enrollments}`);
  console.log(`Inscripciones: ${summary.counts.inscriptions}`);
  console.log(`Obligaciones de pago: ${summary.counts.paymentObligations}`);
  console.log(`Pagos: ${summary.counts.payments}`);
  console.log(`Asistencias: ${summary.counts.attendances}`);
  console.log(`Citas: ${summary.counts.appointments}`);
  console.log(`Membresias de grupos: ${summary.counts.groupMemberships}`);
  console.log(`Participaciones en eventos: ${summary.counts.participants}`);
  console.log(`Miembros de equipos: ${summary.counts.teamMembers}`);
  console.log(`Acudientes: ${summary.counts.guardians}`);

  if (includePreRegistrations) {
    console.log(`Preinscripciones: ${summary.counts.preRegistrations}`);
  }

  console.log(`Categorias deportivas conservadas: ${summary.counts.sportsCategories}`);
  console.log(`Administradores conservados: ${summary.counts.adminUsers}`);

  if (summary.preservedAdminLinkedAthletes.length > 0) {
    console.log(
      `Atletas omitidos por estar asociados a rol administrador: ${summary.preservedAdminLinkedAthletes.length}`,
    );
  }
};

const executeCleanup = async (includePreRegistrations = false) => {
  const before = await summarizeScope(includePreRegistrations);
  printSummary("Previo a limpieza", before, includePreRegistrations);

  if (before.counts.athletes === 0 && before.counts.guardians === 0) {
    console.log("\nNo hay datos de deportistas para limpiar.");
    return;
  }

  const deleted = await prisma.$transaction(async (tx) => {
    const result = {
      athleteUsers: 0,
      guardians: 0,
      preRegistrations: 0,
    };

    if (before.athleteUserIds.length > 0) {
      const deletedUsers = await tx.user.deleteMany({
        where: {
          id: { in: before.athleteUserIds },
        },
      });
      result.athleteUsers = deletedUsers.count;
    }

    const deletedGuardians = await tx.guardian.deleteMany({
      where: {
        athletes: {
          none: {},
        },
      },
    });
    result.guardians = deletedGuardians.count;

    if (includePreRegistrations) {
      const deletedPreRegistrations = await tx.preRegistration.deleteMany({});
      result.preRegistrations = deletedPreRegistrations.count;
    }

    return result;
  });

  const after = await summarizeScope(includePreRegistrations);

  console.log("\n=== Resultado de limpieza ===");
  console.log(`Usuarios de atletas eliminados: ${deleted.athleteUsers}`);
  console.log(`Acudientes eliminados: ${deleted.guardians}`);

  if (includePreRegistrations) {
    console.log(`Preinscripciones eliminadas: ${deleted.preRegistrations}`);
  }

  printSummary("Estado final", after, includePreRegistrations);
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));

  if (!args.execute) {
    console.log("Modo seguro: no se eliminara nada sin --execute.");
    const preview = await summarizeScope(args.includePreRegistrations);
    printSummary("Preview", preview, args.includePreRegistrations);
    console.log("\nPara ejecutar la limpieza real:");
    console.log("  node scripts/cleanup-athletes-domain.mjs --execute");
    console.log(
      "  node scripts/cleanup-athletes-domain.mjs --execute --include-pre-registrations",
    );
    return;
  }

  await executeCleanup(args.includePreRegistrations);
};

main()
  .catch((error) => {
    console.error("\nError durante la limpieza del dominio de deportistas:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import prisma from "../src/config/database.js";
import { legacyEnrollmentImportService } from "../src/modules/Enrollments/services/legacyEnrollmentImport.service.js";

const parseArgs = (argv) => {
  const args = {
    file: null,
    dryRun: false,
    continueOnError: false,
    performedBy: "script:legacy-import",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (token === "--continue-on-error") {
      args.continueOnError = true;
      continue;
    }

    if (token.startsWith("--file=")) {
      args.file = token.slice("--file=".length);
      continue;
    }

    if (token === "--file") {
      args.file = argv[index + 1] || null;
      index += 1;
      continue;
    }

    if (token.startsWith("--performed-by=")) {
      args.performedBy = token.slice("--performed-by=".length) || args.performedBy;
      continue;
    }

    if (token === "--performed-by") {
      args.performedBy = argv[index + 1] || args.performedBy;
      index += 1;
      continue;
    }
  }

  return args;
};

const printUsage = () => {
  console.log("Uso:");
  console.log("  npm run legacy:import -- --file ./ruta/archivo.json --dry-run");
  console.log("  npm run legacy:import -- --file ./ruta/archivo.json");
  console.log("Opciones:");
  console.log("  --dry-run            Ejecuta preview sin escribir en base de datos");
  console.log("  --continue-on-error  Continua con el siguiente registro si uno falla");
  console.log("  --performed-by       Identificador de auditoria del operador");
};

const loadRecords = async (filePath) => {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const raw = await fs.readFile(absolutePath, "utf8");
  const parsed = JSON.parse(raw);

  if (Array.isArray(parsed)) {
    return { absolutePath, records: parsed };
  }

  if (Array.isArray(parsed.records)) {
    return { absolutePath, records: parsed.records };
  }

  throw new Error(
    "El archivo debe contener un arreglo JSON o un objeto con la propiedad records."
  );
};

const buildRecordLabel = (record, index) => {
  const athlete = record?.athlete || {};
  const fullName = [
    athlete.firstName,
    athlete.middleName,
    athlete.lastName,
    athlete.secondLastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || athlete.identification || `registro-${index + 1}`;
};

const run = async () => {
  const args = parseArgs(process.argv.slice(2));

  if (!args.file) {
    printUsage();
    throw new Error("Debes indicar --file con el JSON de importacion.");
  }

  const { absolutePath, records } = await loadRecords(args.file);

  if (records.length === 0) {
    throw new Error("El archivo no contiene registros para importar.");
  }

  console.log(`[LEGACY IMPORT] Archivo: ${absolutePath}`);
  console.log(
    `[LEGACY IMPORT] Modo: ${args.dryRun ? "DRY RUN / PREVIEW" : "IMPORTACION REAL"}`
  );
  console.log(`[LEGACY IMPORT] Registros: ${records.length}`);

  const summary = {
    processed: 0,
    succeeded: 0,
    failed: 0,
  };

  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    const label = buildRecordLabel(record, index);

    console.log(`\n[${index + 1}/${records.length}] ${label}`);

    try {
      if (args.dryRun) {
        const result = await legacyEnrollmentImportService.preview(record, {
          performedBy: args.performedBy,
        });

        console.log("  Preview OK");
        console.log(
          `  Estado matricula: ${result.plan.enrollment.estado} | Deudas mensuales: ${result.plan.financial.monthlyDebtCount}`
        );
      } else {
        const result = await legacyEnrollmentImportService.create(record, {
          performedBy: args.performedBy,
        });

        console.log(
          `  Importacion OK | athleteId=${result.athlete.id} enrollmentId=${result.enrollment.id} obligaciones=${result.createdObligations.length}`
        );
      }

      summary.succeeded += 1;
    } catch (error) {
      summary.failed += 1;
      console.error(`  ERROR: ${error.message}`);

      if (!args.continueOnError) {
        throw error;
      }
    } finally {
      summary.processed += 1;
    }
  }

  console.log("\n[LEGACY IMPORT] Resumen final");
  console.log(`  Procesados: ${summary.processed}`);
  console.log(`  Exitosos: ${summary.succeeded}`);
  console.log(`  Fallidos: ${summary.failed}`);

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
};

run()
  .catch((error) => {
    console.error(`[LEGACY IMPORT] Fallo: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prismaCliPath = path.resolve(
  __dirname,
  "../node_modules/prisma/build/index.js",
);
const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");

function runPrismaMigrateDeploy() {
  return new Promise((resolve, reject) => {
    const migrateProcess = spawn(
      process.execPath,
      [prismaCliPath, "migrate", "deploy", "--schema", schemaPath],
      {
        stdio: "inherit",
        env: process.env,
      },
    );

    migrateProcess.on("error", reject);
    migrateProcess.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `Prisma migrate deploy failed with code ${code ?? "unknown"}.`,
        ),
      );
    });
  });
}

async function startServer() {
  try {
    await runPrismaMigrateDeploy();
    await import("./index.js");
  } catch (error) {
    console.error("Backend bootstrap failed:", error);
    process.exit(1);
  }
}

startServer();

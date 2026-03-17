import "dotenv/config";
import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

const steps = [
  {
    name: "employee_schedules: restore status columns",
    sql: `ALTER TABLE "employee_schedules"
ADD COLUMN IF NOT EXISTS "status" "ScheduleStatus" NOT NULL DEFAULT 'Programado',
ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT;`,
  },
  {
    name: "athletes: add isScholarship",
    sql: `ALTER TABLE "athletes"
ADD COLUMN IF NOT EXISTS "isScholarship" BOOLEAN NOT NULL DEFAULT false;`,
  },
  {
    name: "pre_registrations: rename legacy columns",
    sql: `DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pre_registrations' AND column_name='nombres') THEN
    EXECUTE 'ALTER TABLE "pre_registrations" RENAME COLUMN "nombres" TO "first_name"';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pre_registrations' AND column_name='apellidos') THEN
    EXECUTE 'ALTER TABLE "pre_registrations" RENAME COLUMN "apellidos" TO "last_name"';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pre_registrations' AND column_name='fechaNacimiento') THEN
    EXECUTE 'ALTER TABLE "pre_registrations" RENAME COLUMN "fechaNacimiento" TO "birth_date"';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pre_registrations' AND column_name='telefono') THEN
    EXECUTE 'ALTER TABLE "pre_registrations" RENAME COLUMN "telefono" TO "phone_number"';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pre_registrations' AND column_name='correo') THEN
    EXECUTE 'ALTER TABLE "pre_registrations" RENAME COLUMN "correo" TO "email"';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pre_registrations' AND column_name='estado') THEN
    EXECUTE 'ALTER TABLE "pre_registrations" RENAME COLUMN "estado" TO "status"';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pre_registrations' AND column_name='numeroDocumento') THEN
    EXECUTE 'ALTER TABLE "pre_registrations" RENAME COLUMN "numeroDocumento" TO "identification"';
  END IF;
END
$$;`,
  },
  {
    name: "pre_registrations: add optional name columns",
    sql: `ALTER TABLE "pre_registrations"
ADD COLUMN IF NOT EXISTS "middle_name" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "second_last_name" VARCHAR(100);`,
  },
  {
    name: "payments: create enums and core tables",
    sql: [`DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentType') THEN
    CREATE TYPE "PaymentType" AS ENUM ('MONTHLY', 'ENROLLMENT_INITIAL', 'ENROLLMENT_RENEWAL');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
  END IF;
END
$$;
`,
`CREATE TABLE IF NOT EXISTS public.payment_obligations (
  id SERIAL PRIMARY KEY,
  "athleteId" integer NOT NULL,
  type "PaymentType" NOT NULL,
  period text,
  "baseAmount" integer NOT NULL,
  "dueStart" timestamp(3) NOT NULL,
  "dueEnd" timestamp(3) NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_obligations_athleteId_fkey"
    FOREIGN KEY ("athleteId") REFERENCES public.athletes(id) ON DELETE CASCADE ON UPDATE CASCADE
);`,
`CREATE UNIQUE INDEX IF NOT EXISTS "unique_obligation_per_athlete_period"
  ON public.payment_obligations("athleteId", type, period);`,
`CREATE INDEX IF NOT EXISTS "payment_obligations_athleteId_idx"
  ON public.payment_obligations("athleteId");`,
`CREATE INDEX IF NOT EXISTS "payment_obligations_type_idx"
  ON public.payment_obligations(type);`,
`CREATE INDEX IF NOT EXISTS "payment_obligations_period_idx"
  ON public.payment_obligations(period);`,
`CREATE INDEX IF NOT EXISTS "payment_obligations_dueEnd_idx"
  ON public.payment_obligations("dueEnd");`,
`CREATE TABLE IF NOT EXISTS public.payments (
  id SERIAL PRIMARY KEY,
  "obligationId" integer NOT NULL,
  "athleteId" integer NOT NULL,
  "receiptUrl" text NOT NULL,
  "receiptName" text,
  status "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "uploadedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" timestamp(3),
  "reviewedBy" integer,
  "rejectionReason" text,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payments_obligationId_fkey"
    FOREIGN KEY ("obligationId") REFERENCES public.payment_obligations(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "payments_athleteId_fkey"
    FOREIGN KEY ("athleteId") REFERENCES public.athletes(id) ON DELETE CASCADE ON UPDATE CASCADE
);`,
`CREATE INDEX IF NOT EXISTS "payments_obligationId_idx"
  ON public.payments("obligationId");`,
`CREATE INDEX IF NOT EXISTS "payments_athleteId_idx"
  ON public.payments("athleteId");`,
`CREATE INDEX IF NOT EXISTS "payments_status_idx"
  ON public.payments(status);`,
`CREATE INDEX IF NOT EXISTS "payments_uploadedAt_idx"
  ON public.payments("uploadedAt");`],
  },
  {
    name: "payment_settings: create table and default row",
    sql: [`CREATE TABLE IF NOT EXISTS public.payment_settings (
  id integer PRIMARY KEY DEFAULT 1,
  "monthlyAmount" integer NOT NULL,
  "enrollmentAmount" integer NOT NULL,
  "lateFeeDailyAmount" integer NOT NULL DEFAULT 2000,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);`,
`INSERT INTO public.payment_settings
  (id, "monthlyAmount", "enrollmentAmount", "lateFeeDailyAmount")
VALUES
  (1, 30000, 40000, 2000)
ON CONFLICT (id) DO NOTHING;`],
  },
  {
    name: "athlete_attendances: create table and indexes",
    sql: [`CREATE TABLE IF NOT EXISTS public.athlete_attendances (
  id SERIAL PRIMARY KEY,
  "athleteId" integer NOT NULL,
  date timestamp(3) NOT NULL,
  asistencia boolean NOT NULL DEFAULT false,
  observacion varchar(500),
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "athlete_attendances_athleteId_fkey"
    FOREIGN KEY ("athleteId") REFERENCES public.athletes(id) ON DELETE CASCADE ON UPDATE CASCADE
);`,
`CREATE UNIQUE INDEX IF NOT EXISTS "athlete_attendances_athleteId_date_key"
  ON public.athlete_attendances("athleteId", date);`,
`CREATE INDEX IF NOT EXISTS "athlete_attendances_date_idx"
  ON public.athlete_attendances(date);`],
  },
];

async function main() {
  for (const step of steps) {
    if (Array.isArray(step.sql)) {
      for (const statement of step.sql) {
        await prisma.$executeRawUnsafe(statement);
      }
    } else {
      await prisma.$executeRawUnsafe(step.sql);
    }
    console.log(`OK: ${step.name}`);
  }

  console.log("Schema drift fix completed successfully.");
}

main()
  .catch((error) => {
    console.error("Schema drift fix failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

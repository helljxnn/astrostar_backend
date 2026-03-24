ALTER TABLE "employee_schedules"
ADD COLUMN IF NOT EXISTS "status" "ScheduleStatus" NOT NULL DEFAULT 'Programado',
ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT;

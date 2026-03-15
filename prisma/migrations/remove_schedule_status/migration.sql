-- AlterTable: Eliminar campos status y cancellationReason de employee_schedules
ALTER TABLE "employee_schedules" DROP COLUMN IF EXISTS "status";
ALTER TABLE "employee_schedules" DROP COLUMN IF EXISTS "cancellationReason";

-- DropEnum: Eliminar el enum ScheduleStatus si existe
DROP TYPE IF EXISTS "ScheduleStatus";

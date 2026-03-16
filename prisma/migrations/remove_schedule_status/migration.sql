-- AlterTable: Eliminar campos status y cancellationReason de employee_schedules
ALTER TABLE "employee_schedules" DROP COLUMN IF EXISTS "status";
ALTER TABLE "employee_schedules" DROP COLUMN IF EXISTS "cancellationReason";

-- AlterTable: Eliminar campo status de appointments
ALTER TABLE "appointments" DROP COLUMN IF EXISTS "status";
ALTER TABLE "appointments" DROP COLUMN IF EXISTS "cancelReason";

-- DropEnum: Eliminar el enum ScheduleStatus con CASCADE
DROP TYPE IF EXISTS "ScheduleStatus" CASCADE;

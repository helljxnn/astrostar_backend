-- AlterTable: Eliminar campos status y cancellationReason de employee_schedules
ALTER TABLE "employee_schedules" DROP COLUMN IF EXISTS "status";
ALTER TABLE "employee_schedules" DROP COLUMN IF EXISTS "cancellationReason";

-- DropEnum: No se elimina ScheduleStatus porque aún lo usa la tabla appointments

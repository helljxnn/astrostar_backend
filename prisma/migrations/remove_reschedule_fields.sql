-- Eliminar campos de reprogramación de la tabla appointments

-- Eliminar índice único de rescheduleToken
DROP INDEX IF EXISTS "appointments_rescheduleToken_key";

-- Eliminar columnas de reschedule
ALTER TABLE "appointments" 
DROP COLUMN IF EXISTS "needsReschedule",
DROP COLUMN IF EXISTS "rescheduleProposedDate",
DROP COLUMN IF EXISTS "rescheduleProposedStart",
DROP COLUMN IF EXISTS "rescheduleProposedEnd",
DROP COLUMN IF EXISTS "rescheduleStatus",
DROP COLUMN IF EXISTS "rescheduleToken";

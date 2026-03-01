-- Agregar campos de reprogramación a la tabla appointments
ALTER TABLE "appointments" 
ADD COLUMN IF NOT EXISTS "needsReschedule" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "rescheduleProposedDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "rescheduleProposedStart" TEXT,
ADD COLUMN IF NOT EXISTS "rescheduleProposedEnd" TEXT,
ADD COLUMN IF NOT EXISTS "rescheduleStatus" TEXT,
ADD COLUMN IF NOT EXISTS "rescheduleToken" TEXT;

-- Crear índice único para rescheduleToken
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'appointments_rescheduleToken_key') THEN
    CREATE UNIQUE INDEX "appointments_rescheduleToken_key" ON "appointments"("rescheduleToken");
  END IF;
END $$;

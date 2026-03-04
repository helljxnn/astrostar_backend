-- AlterTable
ALTER TABLE "appointments" 
ADD COLUMN IF NOT EXISTS "needsReschedule" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "rescheduleProposedDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "rescheduleProposedStart" TEXT,
ADD COLUMN IF NOT EXISTS "rescheduleProposedEnd" TEXT,
ADD COLUMN IF NOT EXISTS "rescheduleStatus" TEXT,
ADD COLUMN IF NOT EXISTS "rescheduleToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "appointments_rescheduleToken_key" ON "appointments"("rescheduleToken");

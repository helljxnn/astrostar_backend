-- AlterTable
ALTER TABLE "payment_settings" ALTER COLUMN "lateFeeDailyAmount" SET DEFAULT 2000;

-- CreateIndex
CREATE INDEX "enrollments_createdAt_idx" ON "enrollments"("createdAt");

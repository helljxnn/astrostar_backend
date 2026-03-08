-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('MONTHLY', 'ENROLLMENT_RENEWAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "payment_obligations" (
    "id" SERIAL NOT NULL,
    "athleteId" INTEGER NOT NULL,
    "type" "PaymentType" NOT NULL,
    "period" TEXT,
    "baseAmount" INTEGER NOT NULL,
    "dueStart" TIMESTAMP(3) NOT NULL,
    "dueEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_obligations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "obligationId" INTEGER NOT NULL,
    "athleteId" INTEGER NOT NULL,
    "receiptUrl" TEXT NOT NULL,
    "receiptName" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" INTEGER,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_obligations_athleteId_idx" ON "payment_obligations"("athleteId");

-- CreateIndex
CREATE INDEX "payment_obligations_type_idx" ON "payment_obligations"("type");

-- CreateIndex
CREATE INDEX "payment_obligations_period_idx" ON "payment_obligations"("period");

-- CreateIndex
CREATE INDEX "payment_obligations_dueEnd_idx" ON "payment_obligations"("dueEnd");

-- CreateIndex
CREATE UNIQUE INDEX "unique_obligation_per_athlete_period" ON "payment_obligations"("athleteId", "type", "period");

-- CreateIndex
CREATE INDEX "payments_obligationId_idx" ON "payments"("obligationId");

-- CreateIndex
CREATE INDEX "payments_athleteId_idx" ON "payments"("athleteId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_uploadedAt_idx" ON "payments"("uploadedAt");

-- AddForeignKey
ALTER TABLE "payment_obligations" ADD CONSTRAINT "payment_obligations_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "payment_obligations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
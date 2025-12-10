-- CreateEnum
CREATE TYPE "DonationType" AS ENUM ('ECONOMICA', 'ESPECIE', 'ALIMENTOS');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('Recibida', 'EnProceso', 'Verificada', 'Ejecutada', 'Anulada');

-- CreateEnum
CREATE TYPE "DonationFileType" AS ENUM ('comprobante', 'soporte', 'factura', 'evidencia');

-- CreateTable
CREATE TABLE "Donation" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "donorSponsorId" INTEGER,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "type" "DonationType" NOT NULL,
    "status" "DonationStatus" NOT NULL DEFAULT 'Recibida',
    "program" TEXT,
    "donationAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "cancelReason" TEXT,
    "cancelAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationDetail" (
    "id" SERIAL NOT NULL,
    "donationId" INTEGER NOT NULL,
    "kind" "DonationType" NOT NULL,
    "recordType" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(10,2),
    "amount" DECIMAL(12,2),
    "channel" TEXT,
    "classification" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonationDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationTransaction" (
    "id" SERIAL NOT NULL,
    "donationId" INTEGER NOT NULL,
    "fromStatus" "DonationStatus",
    "toStatus" "DonationStatus" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DonationTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationFile" (
    "id" SERIAL NOT NULL,
    "donationId" INTEGER NOT NULL,
    "detailId" INTEGER,
    "fileType" "DonationFileType" NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "originalName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DonationFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Donation_code_key" ON "Donation"("code");

-- CreateIndex
CREATE INDEX "Donation_status_type_donationAt_idx" ON "Donation"("status", "type", "donationAt");

-- CreateIndex
CREATE INDEX "Donation_donorSponsorId_idx" ON "Donation"("donorSponsorId");

-- CreateIndex
CREATE INDEX "DonationTransaction_donationId_createdAt_idx" ON "DonationTransaction"("donationId", "createdAt");

-- CreateIndex
CREATE INDEX "DonationFile_donationId_idx" ON "DonationFile"("donationId");

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_donorSponsorId_fkey" FOREIGN KEY ("donorSponsorId") REFERENCES "Sponsor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationDetail" ADD CONSTRAINT "DonationDetail_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationTransaction" ADD CONSTRAINT "DonationTransaction_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationFile" ADD CONSTRAINT "DonationFile_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationFile" ADD CONSTRAINT "DonationFile_detailId_fkey" FOREIGN KEY ("detailId") REFERENCES "DonationDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migration to extend Sponsor with donor/patron fields

-- New enums
CREATE TYPE "DonorSponsorType" AS ENUM ('Donor', 'Sponsor');
CREATE TYPE "DonorSponsorPersonType" AS ENUM ('Natural', 'Juridica');

-- Add columns (defaults allow existing rows)
ALTER TABLE "Sponsor"
  ADD COLUMN "type" "DonorSponsorType" NOT NULL DEFAULT 'Donor',
  ADD COLUMN "personType" "DonorSponsorPersonType" NOT NULL DEFAULT 'Natural',
  ADD COLUMN "documentType" VARCHAR(50),
  ADD COLUMN "identification" VARCHAR(100),
  ADD COLUMN "contactName" VARCHAR(150),
  ADD COLUMN "address" VARCHAR(200);

-- Align existing columns with Prisma lengths
ALTER TABLE "Sponsor"
  ALTER COLUMN "contactEmail" TYPE VARCHAR(150),
  ALTER COLUMN "phone" TYPE VARCHAR(30);

-- Backfill identification for existing rows to satisfy NOT NULL + UNIQUE
UPDATE "Sponsor"
SET "identification" = CONCAT('SP-', id)
WHERE "identification" IS NULL;

-- Enforce NOT NULL and uniqueness
ALTER TABLE "Sponsor"
  ALTER COLUMN "identification" SET NOT NULL;

CREATE UNIQUE INDEX "Sponsor_identification_key" ON "Sponsor"("identification");
CREATE INDEX "Sponsor_status_idx" ON "Sponsor"("status");
CREATE INDEX "Sponsor_type_idx" ON "Sponsor"("type");

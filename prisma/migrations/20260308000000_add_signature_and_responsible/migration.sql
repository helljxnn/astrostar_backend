-- Rename signature fields in employees table
ALTER TABLE "employees" RENAME COLUMN "firma_url" TO "signature_url";
ALTER TABLE "employees" RENAME COLUMN "firma_public_id" TO "signature_public_id";

-- Rename responsible field in donations table
ALTER TABLE "donations" RENAME COLUMN "responsable_id" TO "responsible_id";

-- Update index name
DROP INDEX IF EXISTS "idx_donations_responsable_id";
CREATE INDEX "idx_donations_responsible_id" ON "donations"("responsible_id");

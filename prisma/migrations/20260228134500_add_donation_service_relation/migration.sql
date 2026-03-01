-- Add optional event relation to donations
ALTER TABLE "Donation" ADD COLUMN "serviceId" INTEGER;

CREATE INDEX "Donation_serviceId_idx" ON "Donation"("serviceId");

ALTER TABLE "Donation"
  ADD CONSTRAINT "Donation_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Add city and country fields for donors/sponsors localization
ALTER TABLE "Sponsor"
  ADD COLUMN "city" VARCHAR(120),
  ADD COLUMN "country" VARCHAR(120);

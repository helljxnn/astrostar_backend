-- Add employee specialty to support health professionals with one shared role.
ALTER TABLE "employees"
ADD COLUMN "specialty" VARCHAR(30);

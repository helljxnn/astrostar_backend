-- Agregar campos middle_name y second_last_name a pre_registrations
ALTER TABLE "pre_registrations" ADD COLUMN "middle_name" VARCHAR(100);
ALTER TABLE "pre_registrations" ADD COLUMN "second_last_name" VARCHAR(100);

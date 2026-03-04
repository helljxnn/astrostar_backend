-- Renombrar campos del modelo PreRegistration de español a inglés
ALTER TABLE "pre_registrations" RENAME COLUMN "nombres" TO "first_name";
ALTER TABLE "pre_registrations" RENAME COLUMN "apellidos" TO "last_name";
ALTER TABLE "pre_registrations" RENAME COLUMN "fechaNacimiento" TO "birth_date";
ALTER TABLE "pre_registrations" RENAME COLUMN "telefono" TO "phone_number";
ALTER TABLE "pre_registrations" RENAME COLUMN "correo" TO "email";
ALTER TABLE "pre_registrations" RENAME COLUMN "estado" TO "status";
ALTER TABLE "pre_registrations" RENAME COLUMN "numeroDocumento" TO "identification";

-- Renombrar índices
DROP INDEX IF EXISTS "pre_registrations_correo_idx";
DROP INDEX IF EXISTS "pre_registrations_estado_idx";
DROP INDEX IF EXISTS "pre_registrations_numeroDocumento_idx";

CREATE INDEX "pre_registrations_email_idx" ON "pre_registrations"("email");
CREATE INDEX "pre_registrations_status_idx" ON "pre_registrations"("status");
CREATE INDEX "pre_registrations_identification_idx" ON "pre_registrations"("identification");

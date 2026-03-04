-- Migración manual para actualizar campos de PreRegistration
-- Esta migración renombra los campos de español a inglés

BEGIN;

-- Renombrar columnas
ALTER TABLE "pre_registrations" RENAME COLUMN "primerNombre" TO "firstName";
ALTER TABLE "pre_registrations" RENAME COLUMN "segundoNombre" TO "middleName";
ALTER TABLE "pre_registrations" RENAME COLUMN "primerApellido" TO "lastName";
ALTER TABLE "pre_registrations" RENAME COLUMN "segundoApellido" TO "secondLastName";
ALTER TABLE "pre_registrations" RENAME COLUMN "numeroDocumento" TO "identification";
ALTER TABLE "pre_registrations" RENAME COLUMN "fechaNacimiento" TO "birthDate";
ALTER TABLE "pre_registrations" RENAME COLUMN "telefono" TO "phoneNumber";
ALTER TABLE "pre_registrations" RENAME COLUMN "correo" TO "email";
ALTER TABLE "pre_registrations" RENAME COLUMN "estado" TO "status";

-- Hacer firstName NOT NULL (ya que primerNombre era nullable pero debería ser requerido)
ALTER TABLE "pre_registrations" ALTER COLUMN "firstName" SET NOT NULL;

-- Hacer lastName NOT NULL (ya que primerApellido era nullable pero debería ser requerido)
ALTER TABLE "pre_registrations" ALTER COLUMN "lastName" SET NOT NULL;

-- Agregar constraint UNIQUE a identification
ALTER TABLE "pre_registrations" ADD CONSTRAINT "pre_registrations_identification_key" UNIQUE ("identification");

-- Actualizar índices
DROP INDEX IF EXISTS "pre_registrations_correo_idx";
DROP INDEX IF EXISTS "pre_registrations_numeroDocumento_idx";
DROP INDEX IF EXISTS "pre_registrations_estado_idx";

CREATE INDEX "pre_registrations_email_idx" ON "pre_registrations"("email");
CREATE INDEX "pre_registrations_identification_idx" ON "pre_registrations"("identification");
CREATE INDEX "pre_registrations_status_idx" ON "pre_registrations"("status");

COMMIT;

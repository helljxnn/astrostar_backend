-- Agregar restricciones únicas a email e identification en pre_registrations
ALTER TABLE "pre_registrations" ADD CONSTRAINT "pre_registrations_email_key" UNIQUE ("email");
ALTER TABLE "pre_registrations" ADD CONSTRAINT "pre_registrations_identification_key" UNIQUE ("identification");

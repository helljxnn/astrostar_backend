-- Agregar campos de rate limiting a PasswordResetToken
ALTER TABLE "password_reset_tokens" ADD COLUMN IF NOT EXISTS "ip_address" VARCHAR(45);
ALTER TABLE "password_reset_tokens" ADD COLUMN IF NOT EXISTS "user_agent" TEXT;
ALTER TABLE "password_reset_tokens" ADD COLUMN IF NOT EXISTS "attempts" INTEGER DEFAULT 0;

-- Crear tabla para tracking de intentos de recuperación de contraseña
CREATE TABLE IF NOT EXISTS "password_reset_attempts" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR(255) NOT NULL,
  "ip_address" VARCHAR(45) NOT NULL,
  "user_agent" TEXT,
  "success" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "blocked_until" TIMESTAMP(3)
);

-- Índices para mejorar performance de consultas de rate limiting
CREATE INDEX IF NOT EXISTS "password_reset_attempts_email_idx" ON "password_reset_attempts"("email");
CREATE INDEX IF NOT EXISTS "password_reset_attempts_ip_address_idx" ON "password_reset_attempts"("ip_address");
CREATE INDEX IF NOT EXISTS "password_reset_attempts_created_at_idx" ON "password_reset_attempts"("created_at");
CREATE INDEX IF NOT EXISTS "password_reset_attempts_blocked_until_idx" ON "password_reset_attempts"("blocked_until");

-- Agregar campos de rate limiting a EmailVerificationToken
ALTER TABLE "email_verification_tokens" ADD COLUMN IF NOT EXISTS "ip_address" VARCHAR(45);
ALTER TABLE "email_verification_tokens" ADD COLUMN IF NOT EXISTS "user_agent" TEXT;
ALTER TABLE "email_verification_tokens" ADD COLUMN IF NOT EXISTS "attempts" INTEGER DEFAULT 0;

-- Crear tabla para tracking de intentos de verificación de email
CREATE TABLE IF NOT EXISTS "email_verification_attempts" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR(255) NOT NULL,
  "ip_address" VARCHAR(45) NOT NULL,
  "user_agent" TEXT,
  "success" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "blocked_until" TIMESTAMP(3)
);

-- Índices para email verification attempts
CREATE INDEX IF NOT EXISTS "email_verification_attempts_email_idx" ON "email_verification_attempts"("email");
CREATE INDEX IF NOT EXISTS "email_verification_attempts_ip_address_idx" ON "email_verification_attempts"("ip_address");
CREATE INDEX IF NOT EXISTS "email_verification_attempts_created_at_idx" ON "email_verification_attempts"("created_at");
CREATE INDEX IF NOT EXISTS "email_verification_attempts_blocked_until_idx" ON "email_verification_attempts"("blocked_until");

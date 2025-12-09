-- Agregar columna avatarColorIndex a la tabla users
ALTER TABLE users ADD COLUMN IF NOT EXISTS "avatarColorIndex" INTEGER DEFAULT 0;

-- Actualizar usuarios existentes con colores aleatorios (0-5)
UPDATE users 
SET "avatarColorIndex" = FLOOR(RANDOM() * 6)::INTEGER 
WHERE "avatarColorIndex" IS NULL;

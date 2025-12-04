-- Agregar columna birthDate a la tabla guardians
ALTER TABLE guardians ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMP(3);

-- Comentario: Esta columna es opcional (nullable) para no romper datos existentes

-- Eliminar columna 'existe' de event_materials si existe
ALTER TABLE "event_materials" DROP COLUMN IF EXISTS "existe";

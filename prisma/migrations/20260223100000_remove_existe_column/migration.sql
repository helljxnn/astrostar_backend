-- Eliminar columna 'existe' si existe en material_movements
ALTER TABLE "material_movements" DROP COLUMN IF EXISTS "existe";

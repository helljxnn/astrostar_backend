-- Eliminar el campo origen que no se necesita
ALTER TABLE "material_movements" DROP COLUMN IF EXISTS "origen";

-- Eliminar el ENUM MovementOrigin si existe
DROP TYPE IF EXISTS "MovementOrigin";

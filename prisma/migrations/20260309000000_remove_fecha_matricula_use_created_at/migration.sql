-- AlterTable: Eliminar fechaMatricula (usar createdAt como fecha de creación)
-- El índice asociado se elimina automáticamente con la columna
ALTER TABLE "enrollments" DROP COLUMN IF EXISTS "fechaMatricula";

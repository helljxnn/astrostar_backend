-- Remove esReutilizable column from materials table
-- Stock determines reusability: stockFundacion > 0 = reusable, stockEventos > 0 = consumable
ALTER TABLE "materials" DROP COLUMN IF EXISTS "es_reutilizable";

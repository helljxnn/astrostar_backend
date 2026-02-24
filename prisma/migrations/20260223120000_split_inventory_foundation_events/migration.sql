-- ============================================
-- MIGRATION: Split Inventory into Foundation and Events
-- Date: 2026-02-23
-- Description: 
--   - Replace single 'stock' column with 'stock_fundacion' and 'stock_eventos'
--   - Simplify material_movements structure
--   - Remove unnecessary virtual reservation complexity
--   - Add inventory transfer support
-- ============================================

-- STEP 1: Add new inventory columns
ALTER TABLE "materials" 
  ADD COLUMN IF NOT EXISTS "stock_fundacion" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "stock_eventos" INTEGER DEFAULT 0;

-- STEP 2: Migrate existing data
-- Move all current stock to foundation inventory
UPDATE "materials" 
SET "stock_fundacion" = COALESCE("stock", 0),
    "stock_eventos" = 0
WHERE "stock_fundacion" = 0 AND "stock_eventos" = 0;

-- STEP 3: Make new columns NOT NULL
ALTER TABLE "materials" 
  ALTER COLUMN "stock_fundacion" SET NOT NULL,
  ALTER COLUMN "stock_eventos" SET NOT NULL;

-- STEP 4: Add constraints for positive stock
ALTER TABLE "materials" 
  DROP CONSTRAINT IF EXISTS "chk_stock_positivo",
  ADD CONSTRAINT "chk_stock_fundacion_non_negative" CHECK ("stock_fundacion" >= 0),
  ADD CONSTRAINT "chk_stock_eventos_non_negative" CHECK ("stock_eventos" >= 0);

-- STEP 5: Drop old stock column
ALTER TABLE "materials" 
  DROP COLUMN IF EXISTS "stock";

-- STEP 6: Add inventory type columns to material_movements
ALTER TABLE "material_movements" 
  ADD COLUMN IF NOT EXISTS "inventario_origen" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "inventario_destino" VARCHAR(20);

-- STEP 7: Create index for inventory columns
CREATE INDEX IF NOT EXISTS "materials_stock_fundacion_idx" ON "materials"("stock_fundacion");
CREATE INDEX IF NOT EXISTS "materials_stock_eventos_idx" ON "materials"("stock_eventos");
CREATE INDEX IF NOT EXISTS "material_movements_inventario_origen_idx" ON "material_movements"("inventario_origen");
CREATE INDEX IF NOT EXISTS "material_movements_inventario_destino_idx" ON "material_movements"("inventario_destino");

-- STEP 8: Simplify event_material_assignments
-- Remove unnecessary columns for virtual reservations
ALTER TABLE "event_material_assignments" 
  DROP COLUMN IF EXISTS "cantidad_usada",
  DROP COLUMN IF EXISTS "cantidad_devuelta",
  DROP COLUMN IF EXISTS "estado",
  DROP COLUMN IF EXISTS "fecha_finalizacion";

-- Rename to simpler name
ALTER TABLE "event_material_assignments" 
  RENAME TO "event_materials";

-- STEP 9: Update movement types enum
-- Add TRANSFERENCIA type if not exists
DO $$ BEGIN
  ALTER TYPE "MovementType" ADD VALUE IF NOT EXISTS 'TRANSFERENCIA';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- STEP 10: Add comments for documentation
COMMENT ON COLUMN "materials"."stock_fundacion" IS 'Stock for foundation daily use';
COMMENT ON COLUMN "materials"."stock_eventos" IS 'Stock allocated for events (exits immediately when assigned)';
COMMENT ON COLUMN "material_movements"."inventario_origen" IS 'Source inventory: FUNDACION or EVENTOS';
COMMENT ON COLUMN "material_movements"."inventario_destino" IS 'Destination inventory: FUNDACION or EVENTOS (for transfers)';
COMMENT ON TABLE "event_materials" IS 'Materials assigned to events (stock already deducted)';

-- ============================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================
-- To rollback this migration:
-- 1. ALTER TABLE materials ADD COLUMN stock INTEGER;
-- 2. UPDATE materials SET stock = stock_fundacion + stock_eventos;
-- 3. ALTER TABLE materials DROP COLUMN stock_fundacion, DROP COLUMN stock_eventos;

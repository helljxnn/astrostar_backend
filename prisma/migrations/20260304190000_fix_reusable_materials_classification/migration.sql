-- Migration: Fix reusable materials classification
-- Mark materials with stock in fundacion as reusable

-- All materials with stock in fundacion should be reusable
-- (they can also have stock in eventos for donations/consumables)
UPDATE materials
SET es_reutilizable = true
WHERE stock_fundacion > 0;

-- Materials with ONLY stock in eventos remain consumable
UPDATE materials
SET es_reutilizable = false
WHERE stock_fundacion = 0 
  AND stock_eventos > 0;

-- Materials with NO stock remain consumable (default)
UPDATE materials
SET es_reutilizable = false
WHERE stock_fundacion = 0 
  AND stock_eventos = 0;

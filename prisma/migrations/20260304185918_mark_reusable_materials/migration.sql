-- Migration: Mark existing materials as reusable or consumable
-- This migration sets the esReutilizable flag based on material characteristics

-- Strategy:
-- 1. Materials with stock ONLY in fundacion (stockFundacion > 0 AND stockEventos = 0) -> REUSABLE
-- 2. Materials with stock ONLY in eventos (stockEventos > 0 AND stockFundacion = 0) -> CONSUMABLE
-- 3. Materials with stock in BOTH -> Keep as CONSUMABLE (default, safer)
-- 4. Materials with NO stock -> Keep as CONSUMABLE (default)

-- Mark materials with stock ONLY in fundacion as REUSABLE
UPDATE materials
SET es_reutilizable = true
WHERE stock_fundacion > 0 
  AND stock_eventos = 0;

-- Ensure materials with stock in eventos remain CONSUMABLE (already default false)
UPDATE materials
SET es_reutilizable = false
WHERE stock_eventos > 0;

-- Log the changes
-- Materials marked as REUSABLE: those with stock_fundacion > 0 AND stock_eventos = 0
-- Materials marked as CONSUMABLE: all others (default)

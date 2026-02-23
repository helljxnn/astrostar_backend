-- Migración para eliminar el módulo de Purchases
-- Fecha: 2026-02-12

-- Eliminar tabla purchase_notes (tiene foreign keys)
DROP TABLE IF EXISTS "purchase_notes" CASCADE;

-- Eliminar tabla purchases
DROP TABLE IF EXISTS "purchases" CASCADE;

-- Nota: La tabla providers se mantiene intacta

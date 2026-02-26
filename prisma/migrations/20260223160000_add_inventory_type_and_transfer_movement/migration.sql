-- Create InventoryType enum
CREATE TYPE "InventoryType" AS ENUM ('FUNDACION', 'EVENTOS');

-- Add TRANSFERENCIA to MovementType enum
ALTER TYPE "MovementType" ADD VALUE IF NOT EXISTS 'TRANSFERENCIA';
ALTER TYPE "MovementType" ADD VALUE IF NOT EXISTS 'SALIDA_EVENTO';
ALTER TYPE "MovementType" ADD VALUE IF NOT EXISTS 'REVERSO_SALIDA_EVENTO';

-- Add comment
COMMENT ON TYPE "InventoryType" IS 'Type of inventory: FUNDACION (internal use) or EVENTOS (for events)';

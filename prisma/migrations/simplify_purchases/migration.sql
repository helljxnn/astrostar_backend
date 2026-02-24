-- Migración manual para simplificar el esquema de compras
-- Elimina la tabla purchase_items y modifica purchases

-- 1. Eliminar la tabla purchase_items
DROP TABLE IF EXISTS "purchase_items" CASCADE;

-- 2. Eliminar el enum PurchaseStatus
DROP TYPE IF EXISTS "PurchaseStatus" CASCADE;

-- 3. Modificar la tabla purchases
ALTER TABLE "purchases" DROP COLUMN IF EXISTS "deliveryDate";
ALTER TABLE "purchases" DROP COLUMN IF EXISTS "status";

-- 4. Agregar nuevas columnas a purchases
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "concept" VARCHAR(500);
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "paymentMethod" VARCHAR(100);
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "invoiceUrl" VARCHAR(500);
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "invoiceName" VARCHAR(255);

-- 5. Eliminar índice de status si existe
DROP INDEX IF EXISTS "purchases_status_idx";

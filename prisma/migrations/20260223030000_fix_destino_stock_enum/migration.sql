-- Corregir enum DestinoStock para usar valores sin espacios

-- 1. Eliminar el enum existente (primero eliminar la columna que lo usa)
ALTER TABLE material_movements DROP COLUMN IF EXISTS destino_stock;

-- 2. Eliminar el enum antiguo
DROP TYPE IF EXISTS "DestinoStock";

-- 3. Crear el enum correcto
CREATE TYPE "DestinoStock" AS ENUM ('USO_INTERNO', 'EVENTOS');

-- 4. Agregar la columna de nuevo
ALTER TABLE material_movements 
ADD COLUMN destino_stock "DestinoStock";

-- 5. Actualizar registros existentes de tipo 'Entrada' con valor por defecto
UPDATE material_movements 
SET destino_stock = 'USO_INTERNO' 
WHERE tipo_movimiento = 'Entrada' AND destino_stock IS NULL;

-- 6. Agregar índice
CREATE INDEX IF NOT EXISTS "material_movements_destino_stock_idx" ON "material_movements"("destino_stock");

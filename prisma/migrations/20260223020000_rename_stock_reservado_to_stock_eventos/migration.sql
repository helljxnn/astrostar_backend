-- Migración: Renombrar stock_reservado a stock_eventos y agregar campo destino_stock

-- 1. Renombrar columna en tabla materials
ALTER TABLE materials 
RENAME COLUMN stock_reservado TO stock_eventos;

-- 2. Crear enum para destino de stock (sin mapeo, valores directos)
CREATE TYPE "DestinoStock" AS ENUM ('USO_INTERNO', 'EVENTOS');

-- 3. Agregar columna destino_stock en material_movements
ALTER TABLE material_movements 
ADD COLUMN destino_stock "DestinoStock";

-- 4. Actualizar registros existentes de tipo 'Entrada' con valor por defecto
UPDATE material_movements 
SET destino_stock = 'USO_INTERNO' 
WHERE tipo_movimiento = 'Entrada' AND destino_stock IS NULL;

-- 5. Agregar índice para mejorar consultas
CREATE INDEX "material_movements_destino_stock_idx" ON "material_movements"("destino_stock");

-- 6. Comentarios para documentación
COMMENT ON COLUMN materials.stock_eventos IS 'Stock destinado exclusivamente para eventos';
COMMENT ON COLUMN materials.stock_disponible IS 'Stock disponible para uso interno de la fundación';
COMMENT ON COLUMN material_movements.destino_stock IS 'Destino del ingreso o origen de la baja: USO_INTERNO o EVENTOS';

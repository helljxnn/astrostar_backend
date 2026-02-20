-- Agregar campo stockActual a materials (temporal hasta implementar movimientos)
ALTER TABLE "materials" ADD COLUMN "stock_actual" INTEGER NOT NULL DEFAULT 0;

-- Crear índice para búsquedas por stock
CREATE INDEX "materials_stock_actual_idx" ON "materials"("stock_actual");

-- Add stock_eventos_reservado column for reservation system
ALTER TABLE materials 
ADD COLUMN stock_eventos_reservado INTEGER NOT NULL DEFAULT 0;

-- Add constraint to ensure reserved stock is not negative
ALTER TABLE materials 
ADD CONSTRAINT chk_stock_eventos_reservado_positive 
CHECK (stock_eventos_reservado >= 0);

-- Add constraint to ensure reserved stock doesn't exceed available stock
ALTER TABLE materials 
ADD CONSTRAINT chk_reservado_no_mayor_que_stock 
CHECK (stock_eventos_reservado <= stock_eventos);

-- Create index for performance
CREATE INDEX idx_materials_stock_eventos_reservado ON materials(stock_eventos_reservado);

-- Add comment
COMMENT ON COLUMN materials.stock_eventos_reservado IS 'Stock reserved for scheduled events (not yet deducted)';

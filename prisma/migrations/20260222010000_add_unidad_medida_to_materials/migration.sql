-- Agregar campo unidad_medida a la tabla materials
-- Fecha: 2026-02-22

-- 1. Agregar columna unidad_medida con valor por defecto
ALTER TABLE "materials" 
ADD COLUMN "unidad_medida" VARCHAR(20) NOT NULL DEFAULT 'unidad';

-- 2. Crear índice para búsquedas
CREATE INDEX "materials_unidad_medida_idx" ON "materials"("unidad_medida");

-- 3. Comentario para documentación
COMMENT ON COLUMN "materials"."unidad_medida" IS 'Unidad de medida del material (unidad, caja, paquete, par, kit, bolsa, etc.)';

-- Agregar campos para Ingresos y Bajas de Materiales
-- Fecha: 2026-02-21

-- 1. Agregar campo fechaIngreso para registrar fecha de entrada de material
ALTER TABLE "material_movements" 
ADD COLUMN "fecha_ingreso" DATE;

-- 2. Agregar campo proveedor_id para relacionar con proveedores (opcional)
ALTER TABLE "material_movements" 
ADD COLUMN "proveedor_id" INTEGER;

-- 3. Agregar campo tipo_baja para categorizar bajas de material
CREATE TYPE "TipoBaja" AS ENUM ('Daño o Deterioro', 'Pérdida o Robo', 'Otro');

ALTER TABLE "material_movements" 
ADD COLUMN "tipo_baja" "TipoBaja";

-- 4. Agregar foreign key para proveedor_id (opcional, puede ser null)
ALTER TABLE "material_movements"
ADD CONSTRAINT "material_movements_proveedor_id_fkey" 
FOREIGN KEY ("proveedor_id") REFERENCES "providers"("id") ON DELETE SET NULL;

-- Índices para mejorar performance
CREATE INDEX "material_movements_fecha_ingreso_idx" ON "material_movements"("fecha_ingreso");
CREATE INDEX "material_movements_proveedor_id_idx" ON "material_movements"("proveedor_id");
CREATE INDEX "material_movements_tipo_baja_idx" ON "material_movements"("tipo_baja");

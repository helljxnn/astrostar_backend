-- ============================================
-- MIGRACIÓN: Reestructuración del Módulo de Materiales
-- Fecha: 2026-02-16
-- Descripción: Separación completa de módulos y mejoras
-- ============================================

-- PASO 1: Renombrar tabla categories a material_categories
ALTER TABLE "categories" RENAME TO "material_categories";

-- PASO 2: Agregar campos de auditoría a material_categories
ALTER TABLE "material_categories" 
  ADD COLUMN "descripcion" TEXT,
  ADD COLUMN "created_by" INTEGER,
  ADD COLUMN "updated_by" INTEGER;

ALTER TABLE "material_categories" 
  RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "material_categories" 
  RENAME COLUMN "updatedAt" TO "updated_at";

-- PASO 3: Eliminar columna stockActual de materials si existe
ALTER TABLE "materials" DROP COLUMN IF EXISTS "stockActual";

-- PASO 4: Renombrar columnas en materials
ALTER TABLE "materials" RENAME COLUMN "categoriaId" TO "categoria_id";
ALTER TABLE "materials" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "materials" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "materials" RENAME COLUMN "createdBy" TO "created_by";
ALTER TABLE "materials" RENAME COLUMN "updatedBy" TO "updated_by";

-- PASO 5: Crear ENUMs para movimientos
CREATE TYPE "TipoMovimiento" AS ENUM ('Entrada', 'Salida');
CREATE TYPE "OrigenMovimiento" AS ENUM ('Compra', 'Donacion', 'AjustePositivo', 'AjusteNegativo', 'UsoEvento', 'Dano', 'Perdida', 'Entrega', 'ConsumoInterno');
CREATE TYPE "DestinoMovimiento" AS ENUM ('Evento', 'ConsumoInterno', 'Dano', 'Perdida', 'Entrega');

-- PASO 6: Renombrar columnas en material_movements
ALTER TABLE "material_movements" RENAME COLUMN "materialId" TO "material_id";
ALTER TABLE "material_movements" RENAME COLUMN "materialNombre" TO "material_nombre";
ALTER TABLE "material_movements" RENAME COLUMN "tipoMovimiento" TO "tipo_movimiento";
ALTER TABLE "material_movements" RENAME COLUMN "stockAnterior" TO "stock_anterior";
ALTER TABLE "material_movements" RENAME COLUMN "stockNuevo" TO "stock_nuevo";
ALTER TABLE "material_movements" RENAME COLUMN "referenceId" TO "reference_id";
ALTER TABLE "material_movements" RENAME COLUMN "referenceType" TO "reference_type";
ALTER TABLE "material_movements" RENAME COLUMN "createdBy" TO "created_by";
ALTER TABLE "material_movements" RENAME COLUMN "createdByName" TO "created_by_name";

-- PASO 7: Agregar nuevas columnas a material_movements
ALTER TABLE "material_movements" ADD COLUMN "destino" "DestinoMovimiento";
ALTER TABLE "material_movements" ADD COLUMN "evento_id" INTEGER;

-- PASO 8: Agregar índices adicionales
CREATE INDEX "material_movements_origen_idx" ON "material_movements"("origen");
CREATE INDEX "material_movements_evento_id_idx" ON "material_movements"("evento_id");
CREATE INDEX "materials_categoria_id_idx" ON "materials"("categoria_id");
CREATE INDEX "material_movements_material_id_idx" ON "material_movements"("material_id");
CREATE INDEX "material_movements_tipo_movimiento_idx" ON "material_movements"("tipo_movimiento");

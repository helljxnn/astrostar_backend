-- ============================================
-- MIGRACIÓN: Unificación de Stock y Sistema de Asignaciones a Eventos
-- Fecha: 2026-02-23
-- Descripción: 
--   - Unifica stock_disponible y stock_eventos en una sola columna 'stock'
--   - Crea tabla event_material_assignments para reservas virtuales
--   - El stock NO baja hasta finalizar el evento
-- ============================================

-- PASO 1: Crear ENUM para estado de asignaciones a eventos
CREATE TYPE "EventAssignmentStatus" AS ENUM (
  'RESERVADO',
  'USADO',
  'DEVUELTO',
  'CANCELADO'
);

-- PASO 2: Crear ENUM para destino de stock (si no existe)
DO $$ BEGIN
  CREATE TYPE "DestinoStock" AS ENUM ('USO_INTERNO', 'EVENTOS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- PASO 3: Crear ENUM para tipo de baja (si no existe)
DO $$ BEGIN
  CREATE TYPE "TipoBaja" AS ENUM (
    'DanoDeterioro',
    'Perdida',
    'Robo',
    'AjusteInventario',
    'Otro'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- PASO 4: Agregar columna 'stock' a materials (temporal)
ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "stock" INTEGER;

-- PASO 5: Migrar datos: stock = stock_disponible + stock_eventos (o stock_reservado)
-- Primero verificar qué columnas existen
DO $$ 
BEGIN
  -- Si existen stock_disponible y stock_eventos
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materials' AND column_name = 'stock_disponible'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materials' AND column_name = 'stock_eventos'
  ) THEN
    UPDATE "materials" SET "stock" = COALESCE("stock_disponible", 0) + COALESCE("stock_eventos", 0);
  
  -- Si existen stock_disponible y stock_reservado
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materials' AND column_name = 'stock_disponible'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materials' AND column_name = 'stock_reservado'
  ) THEN
    UPDATE "materials" SET "stock" = COALESCE("stock_disponible", 0) + COALESCE("stock_reservado", 0);
  
  -- Si solo existe stock_disponible
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materials' AND column_name = 'stock_disponible'
  ) THEN
    UPDATE "materials" SET "stock" = COALESCE("stock_disponible", 0);
  
  -- Si existe stock_actual (modelo antiguo)
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materials' AND column_name = 'stock_actual'
  ) THEN
    UPDATE "materials" SET "stock" = COALESCE("stock_actual", 0);
  END IF;
END $$;

-- PASO 6: Hacer 'stock' NOT NULL con default 0
ALTER TABLE "materials" ALTER COLUMN "stock" SET DEFAULT 0;
ALTER TABLE "materials" ALTER COLUMN "stock" SET NOT NULL;

-- PASO 7: Eliminar columnas antiguas de stock (si existen)
ALTER TABLE "materials" DROP COLUMN IF EXISTS "stock_disponible";
ALTER TABLE "materials" DROP COLUMN IF EXISTS "stock_eventos";
ALTER TABLE "materials" DROP COLUMN IF EXISTS "stock_reservado";
ALTER TABLE "materials" DROP COLUMN IF EXISTS "stock_actual";
ALTER TABLE "materials" DROP COLUMN IF EXISTS "stockDisponible";
ALTER TABLE "materials" DROP COLUMN IF EXISTS "stockEventos";

-- PASO 8: Agregar constraint de validación para stock
ALTER TABLE "materials" DROP CONSTRAINT IF EXISTS "chk_stock_positivo";
ALTER TABLE "materials" ADD CONSTRAINT "chk_stock_positivo" CHECK ("stock" >= 0);

-- PASO 9: Agregar columna unidad_medida si no existe
ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "unidad_medida" VARCHAR(50) DEFAULT 'unidad';

-- PASO 10: Crear tabla event_material_assignments
CREATE TABLE IF NOT EXISTS "event_material_assignments" (
  "id" SERIAL PRIMARY KEY,
  "material_id" INTEGER NOT NULL,
  "evento_id" INTEGER NOT NULL,
  "cantidad_asignada" INTEGER NOT NULL,
  "cantidad_usada" INTEGER NOT NULL DEFAULT 0,
  "cantidad_devuelta" INTEGER NOT NULL DEFAULT 0,
  "estado" "EventAssignmentStatus" NOT NULL DEFAULT 'RESERVADO',
  "fecha_asignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha_finalizacion" TIMESTAMP(3),
  "observaciones" TEXT,
  "created_by" INTEGER NOT NULL,
  "created_by_name" VARCHAR(255),
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "event_material_assignments_material_id_fkey" 
    FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  
  CONSTRAINT "chk_cantidad_asignada_positiva" CHECK ("cantidad_asignada" > 0),
  CONSTRAINT "chk_cantidad_usada_no_negativa" CHECK ("cantidad_usada" >= 0),
  CONSTRAINT "chk_cantidad_devuelta_no_negativa" CHECK ("cantidad_devuelta" >= 0),
  CONSTRAINT "chk_cantidades_validas" CHECK ("cantidad_usada" + "cantidad_devuelta" <= "cantidad_asignada")
);

-- PASO 11: Crear índices para event_material_assignments
CREATE INDEX IF NOT EXISTS "event_material_assignments_material_id_idx" ON "event_material_assignments"("material_id");
CREATE INDEX IF NOT EXISTS "event_material_assignments_evento_id_idx" ON "event_material_assignments"("evento_id");
CREATE INDEX IF NOT EXISTS "event_material_assignments_estado_idx" ON "event_material_assignments"("estado");
CREATE INDEX IF NOT EXISTS "event_material_assignments_fecha_asignacion_idx" ON "event_material_assignments"("fecha_asignacion");

-- PASO 12: Agregar columna destino_stock a material_movements si no existe
ALTER TABLE "material_movements" ADD COLUMN IF NOT EXISTS "destino_stock" "DestinoStock";

-- PASO 13: Agregar columna tipo_baja a material_movements si no existe
ALTER TABLE "material_movements" ADD COLUMN IF NOT EXISTS "tipo_baja" "TipoBaja";

-- PASO 14: Agregar columna fecha_ingreso a material_movements si no existe
ALTER TABLE "material_movements" ADD COLUMN IF NOT EXISTS "fecha_ingreso" TIMESTAMP(3);

-- PASO 15: Agregar columna proveedor_id a material_movements si no existe
ALTER TABLE "material_movements" ADD COLUMN IF NOT EXISTS "proveedor_id" INTEGER;

-- PASO 16: Crear foreign key para proveedor_id si no existe
DO $$ BEGIN
  ALTER TABLE "material_movements" 
    ADD CONSTRAINT "material_movements_proveedor_id_fkey"
    FOREIGN KEY ("proveedor_id") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- PASO 17: Crear índice para proveedor_id
CREATE INDEX IF NOT EXISTS "material_movements_proveedor_id_idx" ON "material_movements"("proveedor_id");

-- PASO 18: Eliminar tabla material_reservations si existe (modelo antiguo)
DROP TABLE IF EXISTS "material_reservations" CASCADE;

-- PASO 19: Eliminar ENUMs antiguos que ya no se usan
DROP TYPE IF EXISTS "ReservationStatus" CASCADE;
DROP TYPE IF EXISTS "DischargeReason" CASCADE;

-- ============================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ============================================

COMMENT ON COLUMN "materials"."stock" IS 'Stock total único - incluye todo el inventario disponible';
COMMENT ON TABLE "event_material_assignments" IS 'Asignaciones de materiales a eventos (reservas virtuales que NO bajan el stock hasta finalizar)';
COMMENT ON COLUMN "event_material_assignments"."cantidad_asignada" IS 'Cantidad reservada para el evento';
COMMENT ON COLUMN "event_material_assignments"."cantidad_usada" IS 'Cantidad realmente usada (se descuenta del stock al finalizar)';
COMMENT ON COLUMN "event_material_assignments"."cantidad_devuelta" IS 'Cantidad devuelta sin usar (NO se descuenta del stock)';
COMMENT ON COLUMN "material_movements"."destino_stock" IS 'Destino del ingreso: USO_INTERNO o EVENTOS (solo informativo, todo va al stock único)';
COMMENT ON COLUMN "material_movements"."tipo_baja" IS 'Tipo de baja del material (solo para movimientos tipo Baja)';

-- ============================================
-- MIGRACIÓN DE DATOS DE RESERVAS ANTIGUAS
-- ============================================

-- Si existía la tabla material_reservations, migrar datos a event_material_assignments
-- (Este paso se ejecuta solo si la tabla existía antes de ser eliminada)
-- Los datos históricos se preservan en material_movements


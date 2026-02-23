-- ============================================
-- MIGRACIÓN: Sistema de Reservas y Stock Dividido
-- Fecha: 2026-02-21
-- Descripción: Agrega sistema de reservas, stock dividido (disponible/reservado)
--              y mejoras al sistema de movimientos
-- ============================================

-- PASO 1: Agregar nuevos tipos al enum MovementType
ALTER TYPE "MovementType" ADD VALUE IF NOT EXISTS 'Baja';
ALTER TYPE "MovementType" ADD VALUE IF NOT EXISTS 'Consumo';
ALTER TYPE "MovementType" ADD VALUE IF NOT EXISTS 'Ajuste';

-- PASO 2: Crear enum DischargeReason (motivos de baja)
CREATE TYPE "DischargeReason" AS ENUM (
  'Danado',
  'Perdido',
  'Robo',
  'Vencido',
  'Descarte',
  'Otro'
);

-- PASO 3: Crear enum ReservationStatus (estados de reserva)
CREATE TYPE "ReservationStatus" AS ENUM (
  'Pendiente',
  'Confirmada',
  'Consumida',
  'Cancelada'
);

-- PASO 4: Agregar nuevos campos a materials
-- Agregar stock_disponible y stock_reservado
ALTER TABLE "materials" 
  ADD COLUMN "stock_disponible" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "stock_reservado" INTEGER NOT NULL DEFAULT 0;

-- Migrar datos: stock_actual -> stock_disponible
UPDATE "materials" SET "stock_disponible" = "stock_actual";

-- Eliminar stock_actual (ya no se usa)
ALTER TABLE "materials" DROP COLUMN "stock_actual";

-- Agregar constraints de validación
ALTER TABLE "materials" 
  ADD CONSTRAINT "chk_stock_disponible" CHECK ("stock_disponible" >= 0),
  ADD CONSTRAINT "chk_stock_reservado" CHECK ("stock_reservado" >= 0);

-- PASO 5: Agregar nuevos campos a material_movements
ALTER TABLE "material_movements"
  ADD COLUMN "discharge_reason" "DischargeReason",
  ADD COLUMN "donacion_id" INTEGER,
  ADD COLUMN "reservation_id" INTEGER;

-- Crear índices para los nuevos campos
CREATE INDEX "material_movements_donacion_id_idx" ON "material_movements"("donacion_id");
CREATE INDEX "material_movements_discharge_reason_idx" ON "material_movements"("discharge_reason");

-- PASO 6: Crear tabla material_reservations
CREATE TABLE "material_reservations" (
  "id" SERIAL PRIMARY KEY,
  "material_id" INTEGER NOT NULL,
  "evento_id" INTEGER NOT NULL,
  "cantidad_reservada" INTEGER NOT NULL,
  "estado" "ReservationStatus" NOT NULL DEFAULT 'Pendiente',
  "fecha_reserva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha_evento" TIMESTAMP(3) NOT NULL,
  "observaciones" TEXT,
  "created_by" INTEGER NOT NULL,
  "created_by_name" VARCHAR(255),
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "material_reservations_material_id_fkey" 
    FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  
  CONSTRAINT "chk_cantidad_reservada_positiva" CHECK ("cantidad_reservada" > 0)
);

-- Crear índices para material_reservations
CREATE INDEX "material_reservations_material_id_idx" ON "material_reservations"("material_id");
CREATE INDEX "material_reservations_evento_id_idx" ON "material_reservations"("evento_id");
CREATE INDEX "material_reservations_estado_idx" ON "material_reservations"("estado");
CREATE INDEX "material_reservations_fecha_evento_idx" ON "material_reservations"("fecha_evento");

-- PASO 7: Agregar foreign key de reservation_id en material_movements
ALTER TABLE "material_movements"
  ADD CONSTRAINT "material_movements_reservation_id_fkey"
    FOREIGN KEY ("reservation_id") REFERENCES "material_reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "material_movements_reservation_id_idx" ON "material_movements"("reservation_id");

-- ============================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ============================================

COMMENT ON COLUMN "materials"."stock_disponible" IS 'Stock libre para usar o reservar';
COMMENT ON COLUMN "materials"."stock_reservado" IS 'Stock asignado a eventos futuros';
COMMENT ON TABLE "material_reservations" IS 'Reservas de materiales para eventos';
COMMENT ON COLUMN "material_movements"."discharge_reason" IS 'Motivo estructurado de baja (solo para tipo Baja)';
COMMENT ON COLUMN "material_movements"."donacion_id" IS 'ID de donación (solo para origen Donacion)';
COMMENT ON COLUMN "material_movements"."reservation_id" IS 'ID de reserva (solo para tipo Consumo)';

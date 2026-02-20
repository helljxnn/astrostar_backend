-- ============================================
-- MIGRACIÓN: Reestructuración del Módulo de Materiales
-- Fecha: 2026-02-16
-- Descripción: Separación completa de módulos y mejoras
-- ============================================

-- PASO 1: Renombrar tabla categories a material_categories
ALTER TABLE `categories` RENAME TO `material_categories`;

-- PASO 2: Agregar campos de auditoría a material_categories
ALTER TABLE `material_categories` 
  ADD COLUMN `descripcion` TEXT NULL AFTER `nombre`,
  ADD COLUMN `created_by` INTEGER NULL AFTER `updatedAt`,
  ADD COLUMN `updated_by` INTEGER NULL AFTER `created_by`,
  CHANGE COLUMN `createdAt` `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CHANGE COLUMN `updatedAt` `updated_at` DATETIME(3) NOT NULL;

-- PASO 3: Eliminar columna stockActual de materials
ALTER TABLE `materials` DROP COLUMN `stockActual`;

-- PASO 4: Agregar campos de auditoría a materials
ALTER TABLE `materials`
  CHANGE COLUMN `categoriaId` `categoria_id` INTEGER NOT NULL,
  CHANGE COLUMN `createdAt` `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CHANGE COLUMN `updatedAt` `updated_at` DATETIME(3) NOT NULL,
  CHANGE COLUMN `createdBy` `created_by` INTEGER NULL,
  CHANGE COLUMN `updatedBy` `updated_by` INTEGER NULL;

-- PASO 5: Crear nuevos ENUMs para movimientos
ALTER TABLE `material_movements` 
  MODIFY COLUMN `tipoMovimiento` ENUM('Entrada', 'Salida') NOT NULL;

-- PASO 6: Agregar nuevas columnas a material_movements
ALTER TABLE `material_movements`
  ADD COLUMN `destino` ENUM('Evento', 'ConsumoInterno', 'Dano', 'Perdida', 'Entrega') NULL AFTER `origen`,
  ADD COLUMN `evento_id` INTEGER NULL AFTER `destino`,
  CHANGE COLUMN `materialId` `material_id` INTEGER NOT NULL,
  CHANGE COLUMN `materialNombre` `material_nombre` VARCHAR(255) NOT NULL,
  CHANGE COLUMN `tipoMovimiento` `tipo_movimiento` ENUM('Entrada', 'Salida') NOT NULL,
  CHANGE COLUMN `stockAnterior` `stock_anterior` INTEGER NOT NULL,
  CHANGE COLUMN `stockNuevo` `stock_nuevo` INTEGER NOT NULL,
  CHANGE COLUMN `referenceId` `reference_id` INTEGER NULL,
  CHANGE COLUMN `referenceType` `reference_type` VARCHAR(50) NULL,
  CHANGE COLUMN `createdBy` `created_by` INTEGER NOT NULL,
  CHANGE COLUMN `createdByName` `created_by_name` VARCHAR(255) NULL;

-- PASO 7: Cambiar tipo de columna origen a ENUM
ALTER TABLE `material_movements`
  MODIFY COLUMN `origen` ENUM('Compra', 'Donacion', 'AjustePositivo', 'AjusteNegativo', 'UsoEvento', 'Dano', 'Perdida', 'Entrega', 'ConsumoInterno') NOT NULL;

-- PASO 8: Agregar índices adicionales
CREATE INDEX `material_movements_origen_idx` ON `material_movements`(`origen`);
CREATE INDEX `material_movements_evento_id_idx` ON `material_movements`(`evento_id`);

-- PASO 9: Actualizar foreign keys
ALTER TABLE `materials` 
  DROP FOREIGN KEY IF EXISTS `materials_categoriaId_fkey`,
  ADD CONSTRAINT `materials_categoria_id_fkey` 
    FOREIGN KEY (`categoria_id`) REFERENCES `material_categories`(`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `material_movements`
  DROP FOREIGN KEY IF EXISTS `material_movements_materialId_fkey`,
  ADD CONSTRAINT `material_movements_material_id_fkey`
    FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- PASO 10: Actualizar índices
DROP INDEX IF EXISTS `materials_categoriaId_idx` ON `materials`;
CREATE INDEX `materials_categoria_id_idx` ON `materials`(`categoria_id`);

DROP INDEX IF EXISTS `material_movements_materialId_idx` ON `material_movements`;
CREATE INDEX `material_movements_material_id_idx` ON `material_movements`(`material_id`);

DROP INDEX IF EXISTS `material_movements_tipoMovimiento_idx` ON `material_movements`;
CREATE INDEX `material_movements_tipo_movimiento_idx` ON `material_movements`(`tipo_movimiento`);

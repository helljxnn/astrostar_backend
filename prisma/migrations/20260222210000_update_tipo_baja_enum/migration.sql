-- Actualizar enum TipoBaja para separar Pérdida y Robo, y agregar Ajuste de Inventario

-- Primero, crear el nuevo enum con todos los valores
CREATE TYPE "TipoBaja_new" AS ENUM ('DanoDeterioro', 'Perdida', 'Robo', 'AjusteInventario', 'Otro');

-- Actualizar la columna para usar el nuevo enum, convirtiendo los valores antiguos
ALTER TABLE material_movements 
  ALTER COLUMN tipo_baja TYPE "TipoBaja_new" 
  USING (
    CASE 
      WHEN tipo_baja::text = 'PerdidaRobo' THEN 'Perdida'::"TipoBaja_new"
      WHEN tipo_baja::text = 'DanoDeterioro' THEN 'DanoDeterioro'::"TipoBaja_new"
      WHEN tipo_baja::text = 'Otro' THEN 'Otro'::"TipoBaja_new"
      ELSE 'Otro'::"TipoBaja_new"
    END
  );

-- Eliminar el enum antiguo
DROP TYPE "TipoBaja";

-- Renombrar el nuevo enum
ALTER TYPE "TipoBaja_new" RENAME TO "TipoBaja";

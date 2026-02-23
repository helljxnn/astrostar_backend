-- Eliminar el mapeo del enum TipoBaja para que los valores sean consistentes

-- 1. Crear nuevo enum sin mapeo
CREATE TYPE "TipoBaja_new" AS ENUM ('DanoDeterioro', 'Perdida', 'Robo', 'AjusteInventario', 'Otro');

-- 2. Actualizar la columna para usar el nuevo enum
ALTER TABLE material_movements 
  ALTER COLUMN tipo_baja TYPE "TipoBaja_new" 
  USING (
    CASE 
      WHEN tipo_baja::text = 'Daño o Deterioro' THEN 'DanoDeterioro'::"TipoBaja_new"
      WHEN tipo_baja::text = 'Pérdida' THEN 'Perdida'::"TipoBaja_new"
      WHEN tipo_baja::text = 'Robo' THEN 'Robo'::"TipoBaja_new"
      WHEN tipo_baja::text = 'Ajuste de Inventario' THEN 'AjusteInventario'::"TipoBaja_new"
      ELSE 'Otro'::"TipoBaja_new"
    END
  );

-- 3. Eliminar el enum antiguo
DROP TYPE "TipoBaja";

-- 4. Renombrar el nuevo enum
ALTER TYPE "TipoBaja_new" RENAME TO "TipoBaja";

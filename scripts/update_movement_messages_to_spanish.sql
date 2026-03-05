-- Script para actualizar mensajes de movimientos de inglés a español
-- Ejecutar en PostgreSQL

-- 1. Actualizar movimientos de REVERSIÓN con nombre del evento
UPDATE material_movements mm
SET observaciones = CONCAT('Reversión de asignación al evento "', s.name, '"')
FROM services s
WHERE mm.evento_id = s.id
  AND (
    mm.observaciones LIKE '%Reverted assignment from event%'
    OR mm.observaciones LIKE '%[REVERSION]%'
  );

-- 2. Actualizar movimientos de ASIGNACIÓN con nombre del evento
UPDATE material_movements mm
SET observaciones = CONCAT('Asignado al evento "', s.name, '"')
FROM services s
WHERE mm.evento_id = s.id
  AND mm.observaciones LIKE '%Assigned to event (ID:%';

-- 3. Verificar los cambios
SELECT 
  id,
  material_nombre,
  observaciones,
  fecha,
  evento_id
FROM material_movements
WHERE observaciones LIKE '%evento%'
ORDER BY fecha DESC
LIMIT 20;

-- 4. Contar movimientos actualizados
SELECT 
  'Movimientos actualizados' as tipo,
  COUNT(*) as total
FROM material_movements
WHERE observaciones LIKE '%Reversión de asignación al evento%'
   OR observaciones LIKE '%Asignado al evento%';

-- Script para corregir donaciones con valores muy grandes
-- Ejecutar este script en tu base de datos PostgreSQL

-- Ver donaciones con valores muy grandes (mayores a 1 mil millones)
SELECT 
  dd.id,
  d.code,
  d.type,
  dd."recordType",
  dd.amount as "monto_actual",
  dd.amount / 1000000 as "monto_corregido"
FROM donation_detail dd
INNER JOIN donation d ON d.id = dd."donationId"
WHERE dd.amount > 1000000000
ORDER BY dd.amount DESC;

-- OPCIÓN 1: Dividir por 1,000,000 (si guardaste $1,000,000,000,000 en lugar de $1,000,000)
-- Descomenta la siguiente línea para aplicar:
-- UPDATE donation_detail SET amount = amount / 1000000 WHERE amount > 1000000000;

-- OPCIÓN 2: Establecer un valor razonable de prueba ($100,000)
-- Descomenta la siguiente línea para aplicar:
-- UPDATE donation_detail SET amount = 100000 WHERE amount > 1000000000;

-- OPCIÓN 3: Eliminar las donaciones de prueba con valores muy grandes
-- Descomenta las siguientes líneas para aplicar:
-- DELETE FROM donation_detail WHERE amount > 1000000000;
-- DELETE FROM donation WHERE id NOT IN (SELECT DISTINCT "donationId" FROM donation_detail);

-- Después de ejecutar, verifica los resultados:
SELECT 
  d.type,
  COUNT(*) as cantidad,
  SUM(dd.amount) as total,
  AVG(dd.amount) as promedio,
  MIN(dd.amount) as minimo,
  MAX(dd.amount) as maximo
FROM donation d
INNER JOIN donation_detail dd ON dd."donationId" = d.id
WHERE d.status != 'Anulada'
  AND dd."recordType" = 'payment'
GROUP BY d.type;

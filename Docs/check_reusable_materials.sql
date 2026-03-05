-- Query para verificar materiales reutilizables
-- Ejecutar en Prisma Studio o pgAdmin

-- 1. Ver todos los materiales y su clasificación
SELECT 
  id,
  nombre,
  categoria,
  stock_fundacion,
  stock_eventos,
  es_reutilizable,
  estado
FROM materials
ORDER BY es_reutilizable DESC, nombre;

-- 2. Contar materiales por tipo
SELECT 
  es_reutilizable,
  COUNT(*) as total,
  SUM(CASE WHEN stock_fundacion > 0 THEN 1 ELSE 0 END) as con_stock_fundacion,
  SUM(CASE WHEN stock_eventos > 0 THEN 1 ELSE 0 END) as con_stock_eventos
FROM materials
GROUP BY es_reutilizable;

-- 3. Ver materiales reutilizables con stock
SELECT 
  id,
  nombre,
  categoria,
  stock_fundacion,
  es_reutilizable,
  estado
FROM materials
WHERE es_reutilizable = true 
  AND stock_fundacion > 0
  AND estado = 'Activo'
ORDER BY nombre;

-- 4. Ver materiales consumibles con stock
SELECT 
  id,
  nombre,
  categoria,
  stock_eventos,
  es_reutilizable,
  estado
FROM materials
WHERE es_reutilizable = false 
  AND stock_eventos > 0
  AND estado = 'Activo'
ORDER BY nombre;

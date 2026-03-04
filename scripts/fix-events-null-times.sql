-- Script para identificar y corregir eventos con fechas/horas incompletas
-- Ejecutar en PostgreSQL

-- ========================================
-- 1. IDENTIFICAR EVENTOS PROBLEMÁTICOS
-- ========================================

-- Ver eventos con fechas/horas NULL
SELECT 
  id, 
  name, 
  startDate, 
  startTime, 
  endDate, 
  endTime, 
  status,
  "createdAt"
FROM "Service"
WHERE 
  startTime IS NULL 
  OR endTime IS NULL 
  OR startDate IS NULL 
  OR endDate IS NULL
ORDER BY "createdAt" DESC;

-- Contar cuántos eventos tienen problemas
SELECT 
  COUNT(*) as total_eventos_problematicos,
  COUNT(CASE WHEN startTime IS NULL THEN 1 END) as sin_hora_inicio,
  COUNT(CASE WHEN endTime IS NULL THEN 1 END) as sin_hora_fin,
  COUNT(CASE WHEN startDate IS NULL THEN 1 END) as sin_fecha_inicio,
  COUNT(CASE WHEN endDate IS NULL THEN 1 END) as sin_fecha_fin
FROM "Service"
WHERE 
  startTime IS NULL 
  OR endTime IS NULL 
  OR startDate IS NULL 
  OR endDate IS NULL;

-- ========================================
-- 2. OPCIONES DE CORRECCIÓN
-- ========================================

-- OPCIÓN A: Eliminar eventos con datos incompletos
-- ⚠️ CUIDADO: Esto eliminará permanentemente los eventos
-- Descomenta las siguientes líneas para ejecutar:

-- DELETE FROM "Service"
-- WHERE 
--   startTime IS NULL 
--   OR endTime IS NULL 
--   OR startDate IS NULL 
--   OR endDate IS NULL;

-- ========================================

-- OPCIÓN B: Actualizar con valores por defecto
-- Esto asigna valores por defecto a los campos NULL

-- Actualizar horas NULL con valores por defecto
UPDATE "Service"
SET 
  startTime = COALESCE(startTime, '09:00'),
  endTime = COALESCE(endTime, '17:00')
WHERE 
  startTime IS NULL 
  OR endTime IS NULL;

-- Actualizar fechas NULL con la fecha de creación
UPDATE "Service"
SET 
  startDate = COALESCE(startDate, DATE("createdAt")),
  endDate = COALESCE(endDate, DATE("createdAt"))
WHERE 
  startDate IS NULL 
  OR endDate IS NULL;

-- ========================================
-- 3. VERIFICACIÓN FINAL
-- ========================================

-- Verificar que no queden eventos con datos NULL
SELECT 
  COUNT(*) as eventos_con_problemas
FROM "Service"
WHERE 
  startTime IS NULL 
  OR endTime IS NULL 
  OR startDate IS NULL 
  OR endDate IS NULL;

-- Si el resultado es 0, todos los eventos están corregidos ✅

-- Ver todos los eventos después de la corrección
SELECT 
  id, 
  name, 
  startDate, 
  startTime, 
  endDate, 
  endTime, 
  status
FROM "Service"
ORDER BY startDate DESC, startTime DESC
LIMIT 10;

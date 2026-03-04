-- ═══════════════════════════════════════════════════════════════
-- Script para Crear Usuario de Base de Datos con Permisos Limitados
-- AstroStar Backend
-- ═══════════════════════════════════════════════════════════════
--
-- INSTRUCCIONES:
-- 1. Conectar como usuario postgres:
--    psql -U postgres
--
-- 2. Ejecutar este script:
--    \i scripts/setup-database-user.sql
--
-- 3. Actualizar .env con el nuevo usuario:
--    DATABASE_URL="postgresql://astrostar_app:TU_CONTRASEÑA_SEGURA@localhost:5432/astrostar?schema=public"
--
-- 4. Reiniciar el servidor backend
--
-- ═══════════════════════════════════════════════════════════════

-- Paso 1: Crear usuario (cambiar contraseña)
CREATE USER astrostar_app WITH PASSWORD 'CAMBIAR_ESTA_CONTRASEÑA_POR_UNA_SEGURA';

-- Paso 2: Dar permisos de conexión a la base de datos
GRANT CONNECT ON DATABASE astrostar TO astrostar_app;

-- Paso 3: Dar permisos en el schema public
GRANT USAGE ON SCHEMA public TO astrostar_app;

-- Paso 4: Dar permisos en tablas existentes
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO astrostar_app;

-- Paso 5: Dar permisos en secuencias (para IDs auto-incrementales)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO astrostar_app;

-- Paso 6: Dar permisos para tablas futuras (importante para migraciones)
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO astrostar_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT USAGE, SELECT ON SEQUENCES TO astrostar_app;

-- Paso 7: Verificar permisos
\du astrostar_app

-- ═══════════════════════════════════════════════════════════════
-- NOTAS DE SEGURIDAD:
-- ═══════════════════════════════════════════════════════════════
--
-- 1. Este usuario NO tiene permisos para:
--    - Crear/eliminar bases de datos
--    - Crear/eliminar usuarios
--    - Modificar estructura de tablas (DDL)
--    - Acceder a otras bases de datos
--
-- 2. Solo tiene permisos para:
--    - Leer datos (SELECT)
--    - Insertar datos (INSERT)
--    - Actualizar datos (UPDATE)
--    - Eliminar datos (DELETE)
--
-- 3. Para migraciones de Prisma, temporalmente necesitarás:
--    - Conectar como postgres
--    - O dar permisos CREATE TABLE temporalmente
--
-- 4. Cambiar contraseña periódicamente:
--    ALTER USER astrostar_app WITH PASSWORD 'nueva_contraseña';
--
-- ═══════════════════════════════════════════════════════════════

-- OPCIONAL: Revocar permisos del usuario postgres en producción
-- (Solo si no necesitas hacer migraciones frecuentes)
-- REVOKE ALL ON DATABASE astrostar FROM PUBLIC;

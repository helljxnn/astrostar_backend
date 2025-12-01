-- Script para insertar datos de prueba para el módulo de inscripciones
-- Ejecutar este script solo en ambiente de desarrollo

-- ============================================
-- 1. VERIFICAR DATOS EXISTENTES
-- ============================================

-- Verificar eventos existentes
SELECT id, name, status FROM services WHERE status = 'Programado' LIMIT 5;

-- Verificar equipos existentes
SELECT id, name, status FROM teams WHERE status = 'Active' LIMIT 5;

-- ============================================
-- 2. INSERTAR EVENTOS DE PRUEBA (si no existen)
-- ============================================

-- Insertar categorías de eventos si no existen
INSERT INTO event_categories (name, description, created_at, updated_at)
VALUES 
  ('Deportivo', 'Eventos relacionados con deportes', NOW(), NOW()),
  ('Recreativo', 'Eventos recreativos y de integración', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insertar tipos de eventos si no existen
INSERT INTO service_types (name, description, created_at, updated_at)
VALUES 
  ('Torneo', 'Competencia deportiva', NOW(), NOW()),
  ('Festival', 'Festival deportivo con múltiples actividades', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insertar eventos de prueba
INSERT INTO services (
  name, 
  description, 
  start_date, 
  end_date, 
  start_time, 
  end_time, 
  location, 
  phone, 
  status, 
  publish, 
  category_id, 
  type_id,
  created_at,
  updated_at
)
VALUES 
  (
    'Torneo de Fútbol Juvenil 2025',
    'Torneo de fútbol para categorías juveniles',
    '2025-12-01',
    '2025-12-15',
    '08:00',
    '18:00',
    'Estadio Municipal',
    '+57 300 1234567',
    'Programado',
    true,
    (SELECT id FROM event_categories WHERE name = 'Deportivo' LIMIT 1),
    (SELECT id FROM service_types WHERE name = 'Torneo' LIMIT 1),
    NOW(),
    NOW()
  ),
  (
    'Festival Deportivo Astrostar 2025',
    'Festival anual con múltiples disciplinas deportivas',
    '2025-12-20',
    '2025-12-22',
    '09:00',
    '19:00',
    'Complejo Deportivo Central',
    '+57 300 7654321',
    'Programado',
    true,
    (SELECT id FROM event_categories WHERE name = 'Deportivo' LIMIT 1),
    (SELECT id FROM service_types WHERE name = 'Festival' LIMIT 1),
    NOW(),
    NOW()
  ),
  (
    'Copa Navideña 2025',
    'Torneo especial de fin de año',
    '2025-12-26',
    '2025-12-30',
    '10:00',
    '17:00',
    'Polideportivo Norte',
    '+57 300 9876543',
    'Programado',
    true,
    (SELECT id FROM event_categories WHERE name = 'Deportivo' LIMIT 1),
    (SELECT id FROM service_types WHERE name = 'Torneo' LIMIT 1),
    NOW(),
    NOW()
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. INSERTAR EQUIPOS DE PRUEBA (si no existen)
-- ============================================

INSERT INTO teams (
  name,
  description,
  coach,
  category,
  phone,
  status,
  team_type,
  created_at,
  updated_at
)
VALUES
  (
    'Tigres FC',
    'Equipo de fútbol juvenil categoría sub-17',
    'Carlos Rodríguez',
    'Sub-17',
    '+57 300 1111111',
    'Active',
    'Fundacion',
    NOW(),
    NOW()
  ),
  (
    'Águilas Doradas',
    'Equipo de fútbol categoría sub-15',
    'María González',
    'Sub-15',
    '+57 300 2222222',
    'Active',
    'Fundacion',
    NOW(),
    NOW()
  ),
  (
    'Leones del Norte',
    'Equipo de fútbol categoría sub-19',
    'Juan Pérez',
    'Sub-19',
    '+57 300 3333333',
    'Active',
    'Fundacion',
    NOW(),
    NOW()
  ),
  (
    'Halcones FC',
    'Equipo de fútbol categoría sub-13',
    'Ana Martínez',
    'Sub-13',
    '+57 300 4444444',
    'Active',
    'Fundacion',
    NOW(),
    NOW()
  ),
  (
    'Pumas Astrostar',
    'Equipo de fútbol categoría sub-17',
    'Luis Hernández',
    'Sub-17',
    '+57 300 5555555',
    'Active',
    'Fundacion',
    NOW(),
    NOW()
  )
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 4. VERIFICAR DATOS INSERTADOS
-- ============================================

-- Ver eventos creados
SELECT 
  s.id,
  s.name,
  s.status,
  s.start_date,
  s.end_date,
  ec.name as category,
  st.name as type
FROM services s
JOIN event_categories ec ON s.category_id = ec.id
JOIN service_types st ON s.type_id = st.id
WHERE s.status = 'Programado'
ORDER BY s.start_date;

-- Ver equipos creados
SELECT 
  id,
  name,
  coach,
  category,
  status,
  team_type
FROM teams
WHERE status = 'Active'
ORDER BY name;

-- ============================================
-- 5. EJEMPLOS DE INSCRIPCIONES MANUALES
-- ============================================

-- Inscribir equipos a eventos (descomentar para ejecutar)
/*
INSERT INTO participants (
  type,
  service_id,
  team_id,
  status,
  registration_date,
  notes,
  created_at,
  updated_at
)
VALUES
  (
    'Team',
    (SELECT id FROM services WHERE name = 'Torneo de Fútbol Juvenil 2025' LIMIT 1),
    (SELECT id FROM teams WHERE name = 'Tigres FC' LIMIT 1),
    'Registered',
    NOW(),
    'Equipo inscrito para categoría sub-17',
    NOW(),
    NOW()
  ),
  (
    'Team',
    (SELECT id FROM services WHERE name = 'Torneo de Fútbol Juvenil 2025' LIMIT 1),
    (SELECT id FROM teams WHERE name = 'Pumas Astrostar' LIMIT 1),
    'Registered',
    NOW(),
    'Equipo inscrito para categoría sub-17',
    NOW(),
    NOW()
  ),
  (
    'Team',
    (SELECT id FROM services WHERE name = 'Festival Deportivo Astrostar 2025' LIMIT 1),
    (SELECT id FROM teams WHERE name = 'Águilas Doradas' LIMIT 1),
    'Confirmed',
    NOW(),
    'Equipo confirmado para el festival',
    NOW(),
    NOW()
  );
*/

-- ============================================
-- 6. CONSULTAS ÚTILES PARA VERIFICAR
-- ============================================

-- Ver todas las inscripciones
SELECT 
  p.id,
  p.type,
  p.status,
  p.registration_date,
  s.name as event_name,
  t.name as team_name,
  p.notes
FROM participants p
JOIN services s ON p.service_id = s.id
LEFT JOIN teams t ON p.team_id = t.id
WHERE p.type = 'Team'
ORDER BY p.registration_date DESC;

-- Contar inscripciones por evento
SELECT 
  s.name as event_name,
  COUNT(p.id) as total_teams
FROM services s
LEFT JOIN participants p ON s.id = p.service_id AND p.type = 'Team'
GROUP BY s.id, s.name
ORDER BY total_teams DESC;

-- Contar inscripciones por equipo
SELECT 
  t.name as team_name,
  COUNT(p.id) as total_events
FROM teams t
LEFT JOIN participants p ON t.id = p.team_id AND p.type = 'Team'
GROUP BY t.id, t.name
ORDER BY total_events DESC;

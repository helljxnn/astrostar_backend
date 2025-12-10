-- =====================================================
-- MÓDULO DE CLASES - ASTROSTAR
-- =====================================================
-- Este archivo contiene las consultas SQL para el módulo de clases
-- Las clases son creadas por profesores (empleados) y las deportistas
-- pueden confirmar su asistencia

-- =====================================================
-- TABLAS PRINCIPALES
-- =====================================================

-- Tabla: classes
-- Descripción: Almacena la información de las clases creadas por los profesores
-- Relaciones:
--   - employeeId -> employees (Un profesor puede tener muchas clases)

-- Tabla: class_athletes
-- Descripción: Tabla intermedia para la relación muchos a muchos entre clases y deportistas
-- Relaciones:
--   - classId -> classes (Una clase puede tener muchas deportistas)
--   - athleteId -> athletes (Una deportista puede estar en muchas clases)

-- =====================================================
-- ENUMS
-- =====================================================

-- ClassStatus: Estado de la clase
--   - Programada: Clase programada pero no iniciada
--   - En_curso: Clase en progreso
--   - Finalizada: Clase completada
--   - Cancelada: Clase cancelada

-- ClassAttendanceStatus: Estado de asistencia de la deportista
--   - Pendiente: Asistencia no confirmada
--   - Confirmada: Deportista confirmó asistencia
--   - Asistio: Deportista asistió a la clase
--   - No_asistio: Deportista no asistió
--   - Cancelada: Deportista canceló su asistencia

-- =====================================================
-- CONSULTAS BÁSICAS
-- =====================================================

-- Obtener todas las clases con información del profesor
SELECT 
    c.id,
    c.title,
    c.description,
    c.classDate,
    c.startTime,
    c.endTime,
    c.location,
    c.maxCapacity,
    c.status,
    u.firstName || ' ' || u.lastName as professorName,
    u.email as professorEmail
FROM classes c
INNER JOIN employees e ON c.employeeId = e.id
INNER JOIN users u ON e.userId = u.id
ORDER BY c.classDate DESC, c.startTime;

-- Obtener clases de un profesor específico
SELECT 
    c.*,
    COUNT(ca.id) as totalAthletes,
    COUNT(CASE WHEN ca.attendanceStatus = 'Confirmada' THEN 1 END) as confirmedAthletes
FROM classes c
LEFT JOIN class_athletes ca ON c.id = ca.classId
WHERE c.employeeId = :employeeId
GROUP BY c.id
ORDER BY c.classDate DESC;

-- Obtener deportistas inscritas en una clase específica
SELECT 
    ca.id,
    ca.attendanceStatus,
    ca.confirmedAt,
    ca.notes,
    u.firstName,
    u.lastName,
    u.email,
    u.phoneNumber
FROM class_athletes ca
INNER JOIN athletes a ON ca.athleteId = a.id
INNER JOIN users u ON a.userId = u.id
WHERE ca.classId = :classId
ORDER BY u.firstName, u.lastName;

-- Obtener clases de una deportista específica
SELECT 
    c.id,
    c.title,
    c.description,
    c.classDate,
    c.startTime,
    c.endTime,
    c.location,
    c.status,
    ca.attendanceStatus,
    ca.confirmedAt,
    u.firstName || ' ' || u.lastName as professorName
FROM class_athletes ca
INNER JOIN classes c ON ca.classId = c.id
INNER JOIN employees e ON c.employeeId = e.id
INNER JOIN users u ON e.userId = u.id
WHERE ca.athleteId = :athleteId
ORDER BY c.classDate DESC;

-- =====================================================
-- CONSULTAS PARA CALENDARIO
-- =====================================================

-- Obtener clases por rango de fechas (para vista de calendario)
SELECT 
    c.id,
    c.title,
    c.classDate,
    c.startTime,
    c.endTime,
    c.location,
    c.status,
    c.maxCapacity,
    COUNT(ca.id) as totalAthletes,
    u.firstName || ' ' || u.lastName as professorName
FROM classes c
INNER JOIN employees e ON c.employeeId = e.id
INNER JOIN users u ON e.userId = u.id
LEFT JOIN class_athletes ca ON c.id = ca.classId
WHERE c.classDate BETWEEN :startDate AND :endDate
GROUP BY c.id, u.firstName, u.lastName
ORDER BY c.classDate, c.startTime;

-- =====================================================
-- CONSULTAS DE ESTADÍSTICAS
-- =====================================================

-- Estadísticas de asistencia por clase
SELECT 
    c.id,
    c.title,
    c.classDate,
    COUNT(ca.id) as totalInscribed,
    COUNT(CASE WHEN ca.attendanceStatus = 'Confirmada' THEN 1 END) as confirmed,
    COUNT(CASE WHEN ca.attendanceStatus = 'Asistio' THEN 1 END) as attended,
    COUNT(CASE WHEN ca.attendanceStatus = 'No_asistio' THEN 1 END) as notAttended,
    COUNT(CASE WHEN ca.attendanceStatus = 'Cancelada' THEN 1 END) as cancelled
FROM classes c
LEFT JOIN class_athletes ca ON c.id = ca.classId
WHERE c.id = :classId
GROUP BY c.id;

-- Estadísticas de asistencia de una deportista
SELECT 
    a.id,
    u.firstName || ' ' || u.lastName as athleteName,
    COUNT(ca.id) as totalClasses,
    COUNT(CASE WHEN ca.attendanceStatus = 'Asistio' THEN 1 END) as attended,
    COUNT(CASE WHEN ca.attendanceStatus = 'No_asistio' THEN 1 END) as notAttended,
    ROUND(
        (COUNT(CASE WHEN ca.attendanceStatus = 'Asistio' THEN 1 END)::numeric / 
         NULLIF(COUNT(ca.id), 0) * 100), 2
    ) as attendancePercentage
FROM athletes a
INNER JOIN users u ON a.userId = u.id
LEFT JOIN class_athletes ca ON a.id = ca.athleteId
WHERE a.id = :athleteId
GROUP BY a.id, u.firstName, u.lastName;

-- =====================================================
-- OPERACIONES CRUD
-- =====================================================

-- Crear una nueva clase
INSERT INTO classes (
    title, description, classDate, startTime, endTime, 
    location, maxCapacity, status, employeeId
) VALUES (
    :title, :description, :classDate, :startTime, :endTime,
    :location, :maxCapacity, 'Programada', :employeeId
);

-- Asignar deportista a una clase
INSERT INTO class_athletes (classId, athleteId, attendanceStatus)
VALUES (:classId, :athleteId, 'Pendiente');

-- Confirmar asistencia de deportista
UPDATE class_athletes
SET attendanceStatus = 'Confirmada',
    confirmedAt = NOW()
WHERE classId = :classId AND athleteId = :athleteId;

-- Marcar asistencia real
UPDATE class_athletes
SET attendanceStatus = :status
WHERE classId = :classId AND athleteId = :athleteId;

-- Actualizar estado de clase
UPDATE classes
SET status = :status
WHERE id = :classId;

-- Eliminar deportista de una clase
DELETE FROM class_athletes
WHERE classId = :classId AND athleteId = :athleteId;

-- =====================================================
-- CONSULTAS AVANZADAS
-- =====================================================

-- Clases próximas (siguientes 7 días)
SELECT 
    c.*,
    u.firstName || ' ' || u.lastName as professorName,
    COUNT(ca.id) as totalAthletes
FROM classes c
INNER JOIN employees e ON c.employeeId = e.id
INNER JOIN users u ON e.userId = u.id
LEFT JOIN class_athletes ca ON c.id = ca.classId
WHERE c.classDate BETWEEN NOW() AND NOW() + INTERVAL '7 days'
    AND c.status = 'Programada'
GROUP BY c.id, u.firstName, u.lastName
ORDER BY c.classDate, c.startTime;

-- Deportistas que no han confirmado asistencia
SELECT 
    c.id as classId,
    c.title,
    c.classDate,
    u.firstName || ' ' || u.lastName as athleteName,
    u.email,
    u.phoneNumber
FROM class_athletes ca
INNER JOIN classes c ON ca.classId = c.id
INNER JOIN athletes a ON ca.athleteId = a.id
INNER JOIN users u ON a.userId = u.id
WHERE ca.attendanceStatus = 'Pendiente'
    AND c.classDate >= NOW()
    AND c.status = 'Programada'
ORDER BY c.classDate, u.firstName;

-- Clases con cupos disponibles
SELECT 
    c.id,
    c.title,
    c.classDate,
    c.startTime,
    c.maxCapacity,
    COUNT(ca.id) as currentAthletes,
    c.maxCapacity - COUNT(ca.id) as availableSpots
FROM classes c
LEFT JOIN class_athletes ca ON c.id = ca.classId
WHERE c.status = 'Programada'
    AND c.classDate >= NOW()
    AND c.maxCapacity IS NOT NULL
GROUP BY c.id
HAVING COUNT(ca.id) < c.maxCapacity
ORDER BY c.classDate;

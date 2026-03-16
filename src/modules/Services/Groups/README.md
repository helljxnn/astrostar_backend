# Módulo de Grupos - FASE 1

## Descripción

Módulo para gestionar grupos de inglés dentro del sistema de Servicios. Los grupos son entidades estables que agrupan deportistas por nivel de inglés y profesor asignado.

## Características Principales

### Grupos

- Gestión completa de grupos (CRUD)
- Niveles: A1, A2, B1, B2, C1, C2
- Asignación de profesor
- Control de cupo máximo
- Estados: ACTIVE, ARCHIVED

### Membresías

- Agregar/remover deportistas de grupos
- Historial de membresías por deportista
- Control de fechas de inicio y fin
- Estados: ACTIVE, INACTIVE

## Reglas de Negocio

### Grupos

1. ✅ No permitir superar cupo máximo
2. ✅ Validar existencia del profesor asignado
3. ✅ No permitir reducir cupo si hay más miembros activos
4. ✅ Archivado lógico (no eliminación física)

### Membresías

1. ✅ Una deportista no puede estar en dos grupos activos simultáneamente
2. ✅ Validar cupo disponible antes de agregar miembro
3. ✅ Validar existencia de grupo y deportista
4. ✅ Cambio de estado con fecha efectiva

## Endpoints

### Grupos

#### GET /api/groups

Obtener todos los grupos con filtros y paginación

- Query params: `page`, `limit`, `search`, `status`, `level`
- Respuesta: Lista de grupos con información del profesor y conteo de miembros

#### GET /api/groups/stats

Obtener estadísticas de grupos

- Respuesta: Total, activos, archivados, distribución por nivel

#### GET /api/groups/:id

Obtener grupo por ID

- Respuesta: Grupo con detalles completos, profesor y lista de miembros

#### POST /api/groups

Crear nuevo grupo

- Body: `name`, `level`, `teacherId`, `maxCapacity`, `status` (opcional)
- Validaciones: Profesor existe, cupo >= 1

#### PUT /api/groups/:id

Actualizar grupo

- Body: `name`, `level`, `teacherId`, `maxCapacity`, `status`
- Validaciones: No reducir cupo por debajo de miembros activos

#### PATCH /api/groups/:id/status

Actualizar solo el estado del grupo

- Body: `status` (ACTIVE | ARCHIVED)

#### DELETE /api/groups/:id

Archivar grupo (soft delete)

- Cambia estado a ARCHIVED

### Membresías

#### POST /api/groups/:id/members

Agregar miembro a un grupo

- Body: `athleteId`, `startDate` (opcional)
- Validaciones: Cupo disponible, deportista no en otro grupo activo

#### GET /api/groups/:id/members

Obtener miembros de un grupo

- Query params: `status` (opcional)
- Respuesta: Lista de miembros con información de deportista

#### GET /api/athletes/:athleteId/groups

Obtener historial de grupos de una deportista

- Respuesta: Lista de membresías con información de grupos

#### PATCH /api/memberships/:id

Actualizar membresía

- Body: `status`, `endDate`
- Uso: Cambiar estado o establecer fecha de fin

#### DELETE /api/memberships/:id

Remover miembro del grupo

- Cambia estado a INACTIVE y establece endDate

## Estructura de Archivos

```
Groups/
├── controllers/
│   ├── groups.controller.js
│   └── memberships.controller.js
├── services/
│   ├── groups.service.js
│   └── memberships.service.js
├── repository/
│   ├── groups.repository.js
│   └── memberships.repository.js
├── validators/
│   ├── groups.validator.js
│   └── memberships.validator.js
├── routes/
│   ├── groups.routes.js
│   └── memberships.routes.js
└── README.md
```

## Modelos de Base de Datos

### Group

```prisma
model Group {
  id          Int
  name        String
  level       GroupLevel (A1, A2, B1, B2, C1, C2)
  teacherId   Int
  maxCapacity Int
  status      GroupStatus (ACTIVE, ARCHIVED)
  createdAt   DateTime
  updatedAt   DateTime
  teacher     Employee
  memberships GroupMembership[]
}
```

### GroupMembership

```prisma
model GroupMembership {
  id        Int
  groupId   Int
  athleteId Int
  startDate DateTime
  endDate   DateTime?
  status    MembershipStatus (ACTIVE, INACTIVE)
  createdAt DateTime
  updatedAt DateTime
  group     Group
  athlete   Athlete
}
```

## Ejemplos de Uso

### Crear un grupo

```bash
POST /api/groups
{
  "name": "Grupo A1 - Principiantes",
  "level": "A1",
  "teacherId": 5,
  "maxCapacity": 15
}
```

### Agregar deportista a grupo

```bash
POST /api/groups/1/members
{
  "athleteId": 23,
  "startDate": "2024-02-16"
}
```

### Listar grupos activos de nivel A1

```bash
GET /api/groups?status=ACTIVE&level=A1&page=1&limit=10
```

### Obtener historial de grupos de una deportista

```bash
GET /api/athletes/23/groups
```

## Próximos Pasos (FASE 2)

- Integración con calendario genérico reutilizable
- Reportes y estadísticas avanzadas

## Notas Importantes

- Las deportistas NO se inscriben a clases directamente
- El administrador/profesor gestiona todo
- Los grupos son estructuras estables
- Separación clara de responsabilidades entre Grupos y Clases


# API de Personas Temporales (TemporaryWorkers)

## Descripción General

El módulo de Personas Temporales permite gestionar deportistas, entrenadores y participantes que no están registrados como usuarios permanentes en el sistema. Este módulo es útil para eventos, competencias o actividades donde se requiere registrar personas de forma temporal.

## Características Principales

- **CRUD Completo**: Crear, leer, actualizar y eliminar personas temporales
- **Tipos de Personas**: Deportista, Entrenador, Participante
- **Validación de Datos**: Validación completa de campos obligatorios y formatos
- **Búsqueda y Filtrado**: Búsqueda por nombre, identificación, email, etc.
- **Paginación**: Soporte para paginación de resultados
- **Estadísticas**: Obtener estadísticas del módulo
- **Verificación de Disponibilidad**: Verificar si identificación o email están disponibles

## Endpoints Disponibles

### 1. Obtener Todas las Personas Temporales
```
GET /api/temporary-workers
```

**Parámetros de consulta:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 10, máximo: 100)
- `search` (opcional): Búsqueda por nombre, apellido, email o identificación
- `status` (opcional): Filtrar por estado (Active, Inactive)
- `personType` (opcional): Filtrar por tipo (Deportista, Entrenador, Participante)

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "firstName": "Juan",
      "lastName": "Pérez",
      "identification": "12345678",
      "email": "juan.perez@email.com",
      "phone": "3001234567",
      "birthDate": "1990-05-15",
      "age": 33,
      "address": "Calle 123 #45-67",
      "organization": "Club Deportivo ABC",
      "status": "Active",
      "personType": "Deportista",
      "documentType": {
        "id": 1,
        "name": "Cédula de Ciudadanía"
      },
      "createdAt": "2023-01-15T10:30:00Z",
      "updatedAt": "2023-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "message": "Se encontraron 25 personas temporales."
}
```

### 2. Obtener Persona Temporal por ID
```
GET /api/temporary-workers/{id}
```

### 3. Crear Nueva Persona Temporal
```
POST /api/temporary-workers
```

**Campos obligatorios:**
- `firstName`: Nombre (2-100 caracteres)
- `personType`: Tipo de persona (Deportista, Entrenador, Participante)

**Campos opcionales:**
- `lastName`: Apellido
- `identification`: Número de identificación (6-50 caracteres)
- `email`: Correo electrónico
- `phone`: Teléfono (7-15 dígitos)
- `birthDate`: Fecha de nacimiento
- `age`: Edad (0-120)
- `address`: Dirección
- `organization`: Organización
- `status`: Estado (Active, Inactive)
- `documentTypeId`: ID del tipo de documento

### 4. Actualizar Persona Temporal
```
PUT /api/temporary-workers/{id}
```

### 5. Eliminar Persona Temporal
```
DELETE /api/temporary-workers/{id}
```
*Nota: Esta operación realiza un "soft delete", cambiando el estado a "Inactive"*

### 6. Obtener Estadísticas
```
GET /api/temporary-workers/stats
```

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": {
    "total": 25,
    "active": 20,
    "inactive": 5,
    "deportista": 10,
    "entrenador": 8,
    "participante": 7
  },
  "message": "Estadísticas obtenidas exitosamente."
}
```

### 7. Obtener Datos de Referencia
```
GET /api/temporary-workers/reference-data
```

### 8. Verificar Disponibilidad de Identificación
```
GET /api/temporary-workers/check-identification?identification=12345678
```

### 9. Verificar Disponibilidad de Email
```
GET /api/temporary-workers/check-email?email=test@email.com
```

## Validaciones

### Campos de Texto
- **firstName**: Obligatorio, 2-100 caracteres, solo letras y espacios
- **lastName**: Opcional, máximo 100 caracteres, solo letras y espacios
- **identification**: Opcional, 6-50 caracteres, alfanumérico con puntos y guiones
- **email**: Opcional, formato de email válido
- **phone**: Opcional, 7-15 dígitos numéricos
- **address**: Opcional, máximo 200 caracteres
- **organization**: Opcional, máximo 200 caracteres

### Campos Especiales
- **birthDate**: Formato ISO 8601 (YYYY-MM-DD), edad resultante entre 0-120 años
- **age**: Entero entre 0-120
- **status**: "Active" o "Inactive"
- **personType**: "Deportista", "Entrenador" o "Participante"
- **documentTypeId**: Entero positivo válido

## Códigos de Respuesta

- **200**: Operación exitosa
- **201**: Recurso creado exitosamente
- **400**: Error de validación o solicitud incorrecta
- **404**: Recurso no encontrado
- **500**: Error interno del servidor

## Ejemplos de Uso

### Crear una persona temporal
```bash
curl -X POST http://localhost:4000/api/temporary-workers \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "María",
    "lastName": "González",
    "identification": "87654321",
    "email": "maria.gonzalez@email.com",
    "phone": "3009876543",
    "personType": "Entrenador",
    "organization": "Academia Deportiva XYZ"
  }'
```

### Buscar personas temporales
```bash
curl "http://localhost:4000/api/temporary-workers?search=María&personType=Entrenador&page=1&limit=5"
```

### Verificar disponibilidad de email
```bash
curl "http://localhost:4000/api/temporary-workers/check-email?email=nuevo@email.com"
```

## Notas Importantes

1. **Unicidad**: La identificación y el email deben ser únicos en el sistema
2. **Soft Delete**: Las eliminaciones no borran físicamente los registros
3. **Cálculo de Edad**: Si se proporciona `birthDate`, la edad se calcula automáticamente
4. **Búsqueda**: La búsqueda es insensible a mayúsculas y minúsculas
5. **Paginación**: Siempre se devuelve información de paginación en las consultas de listado

## Integración con Swagger

La documentación completa está disponible en Swagger UI en:
```
http://localhost:4000/api-docs
```

Busca la sección "TemporaryWorkers" para ver todos los endpoints con ejemplos interactivos.
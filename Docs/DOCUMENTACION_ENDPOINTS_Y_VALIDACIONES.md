# DOCUMENTACIÓN - ENDPOINTS Y VALIDACIONES

## ENDPOINTS DEL BACKEND

### Base URL
```
http://localhost:4000/api
```

### Autenticación
Todos los endpoints requieren token JWT:
```
Authorization: Bearer <token>
```

---

## MÓDULO: ATHLETES

### GET /athletes
Obtener lista de deportistas con paginación y filtros.

**Query Parameters:**
| Parámetro | Tipo | Descripción | Requerido | Default |
|-----------|------|-------------|-----------|---------|
| page | Int | Número de página | No | 1 |
| limit | Int | Registros por página | No | 10 |
| search | String | Búsqueda por nombre/documento | No | "" |
| status | String | Filtrar por estado | No | "Activo" |
| categoria | String | Filtrar por categoría | No | - |
| estadoInscripcion | String | Filtrar por estado inscripción | No | - |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 10,
      "status": "Active",
      "user": {
        "firstName": "María",
        "lastName": "González",
        "email": "maria@example.com",
        "identification": "1234567890",
        "age": 15
      },
      "guardian": {
        "id": 5,
        "firstName": "Pedro",
        "lastName": "González"
      }
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### GET /athletes/:id
Obtener deportista por ID.

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| id | Int | ID de la deportista |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 10,
    "status": "Active",
    "guardianId": 5,
    "relationship": "Mother",
    "user": {
      "firstName": "María",
      "middleName": "José",
      "lastName": "González",
      "secondLastName": "Pérez",
      "email": "maria@example.com",
      "phoneNumber": "3001234567",
      "address": "Calle 123",
      "birthDate": "2010-05-15",
      "identification": "1234567890",
      "age": 15,
      "documentType": {
        "id": 1,
        "name": "Tarjeta de Identidad"
      }
    },
    "guardian": {
      "id": 5,
      "firstName": "Pedro",
      "lastName": "González",
      "phone": "3009876543",
      "email": "pedro@example.com"
    },
    "enrollments": [
      {
        "id": 1,
        "fechaMatricula": "2026-01-15",
        "fechaVencimiento": "2027-01-15",
        "estado": "Vigente"
      }
    ]
  }
}
```

**Response 404:**
```json
{
  "success": false,
  "message": "Deportista no encontrada"
}
```

---

### POST /athletes
Crear nueva deportista.

**Request Body:**
```json
{
  "firstName": "María",
  "middleName": "José",
  "lastName": "González",
  "secondLastName": "Pérez",
  "documentTypeId": 1,
  "identification": "1234567890",
  "email": "maria@example.com",
  "phoneNumber": "3001234567",
  "address": "Calle 123",
  "birthDate": "2010-05-15",
  "categoria": "PreJuvenil",
  "estado": "Activo",
  "acudiente": 5,
  "parentesco": "Mother"
}
```

**Campos Requeridos:**
- firstName (min 2 caracteres)
- lastName (min 2 caracteres)
- documentTypeId
- identification (min 6 caracteres, único)
- email (único)
- phoneNumber
- address
- birthDate
- categoria

**Campos Opcionales:**
- middleName
- secondLastName
- acudiente (obligatorio si < 18 años)
- parentesco (obligatorio si tiene acudiente)
- estado (default: "Activo")

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 10,
    "status": "Active"
  },
  "temporaryPassword": "1234567890",
  "emailSent": true,
  "message": "Deportista creada exitosamente"
}
```

**Response 400:**
```json
{
  "success": false,
  "message": "El correo electrónico ya está registrado"
}
```

---

### PUT /athletes/:id
Actualizar deportista existente.

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| id | Int | ID de la deportista |

**Request Body:** (Todos los campos opcionales)
```json
{
  "firstName": "María",
  "email": "nuevo@example.com",
  "phoneNumber": "3009999999",
  "address": "Nueva dirección",
  "acudiente": 6,
  "parentesco": "Father"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 10
  },
  "message": "Deportista actualizada exitosamente"
}
```

---

### DELETE /athletes/:id
Eliminar deportista (soft delete).

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| id | Int | ID de la deportista |

**Response 200:**
```json
{
  "success": true,
  "message": "Deportista eliminada exitosamente"
}
```

---

### GET /athletes/reference-data
Obtener datos de referencia (tipos de documento, categorías, etc.).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "documentTypes": [
      { "id": 1, "name": "Tarjeta de Identidad" },
      { "id": 2, "name": "Cédula de Ciudadanía" }
    ],
    "sportsCategories": [
      { "id": 1, "nombre": "Infantil", "edadMinima": 5, "edadMaxima": 12 },
      { "id": 2, "nombre": "PreJuvenil", "edadMinima": 13, "edadMaxima": 15 }
    ]
  }
}
```

---

### GET /athletes/check-email
Verificar disponibilidad de email.

**Query Parameters:**
| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| email | String | Email a verificar | Sí |
| excludeUserId | Int | ID de usuario a excluir | No |

**Response 200:**
```json
{
  "success": true,
  "available": true,
  "message": "Email disponible"
}
```

---

### GET /athletes/check-identification
Verificar disponibilidad de documento.

**Query Parameters:**
| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| identification | String | Documento a verificar | Sí |
| excludeUserId | Int | ID de usuario a excluir | No |

**Response 200:**
```json
{
  "success": true,
  "available": false,
  "message": "El documento ya está registrado"
}
```

---

## MÓDULO: ENROLLMENTS

### POST /enrollments
Crear nueva matrícula (crea deportista + matrícula).

**Request Body:**
```json
{
  "preRegistrationId": 5,
  "athlete": {
    "firstName": "María",
    "middleName": "José",
    "lastName": "González",
    "secondLastName": "Pérez",
    "documentTypeId": "1",
    "identification": "1234567890",
    "email": "maria@example.com",
    "phoneNumber": "3001234567",
    "address": "Calle 123",
    "birthDate": "2010-05-15T00:00:00.000Z",
    "categoria": "PreJuvenil",
    "estado": "Activo",
    "acudiente": 5,
    "parentesco": "Mother"
  },
  "enrollment": {
    "fechaMatricula": "2026-03-01",
    "observaciones": "Primera matrícula",
    "comprobantePago": "https://..."
  }
}
```

**Campos Requeridos en athlete:**
- firstName
- lastName
- documentTypeId
- identification
- email
- phoneNumber
- birthDate

**Campos Opcionales:**
- preRegistrationId (para vincular con pre-inscripción)
- enrollment.fechaMatricula (default: hoy)
- enrollment.observaciones
- enrollment.comprobantePago

**Response 201:**
```json
{
  "success": true,
  "message": "Deportista matriculada exitosamente. Credenciales enviadas por email.",
  "data": {
    "athlete": {
      "id": 1,
      "userId": 10
    },
    "enrollment": {
      "id": 1,
      "fechaMatricula": "2026-03-01",
      "fechaVencimiento": "2027-03-01",
      "estado": "Vigente"
    },
    "temporaryPassword": "1234567890",
    "emailSent": true
  }
}
```

**Response 400:**
```json
{
  "success": false,
  "message": "Ya existe una deportista con ese documento"
}
```

---

### GET /enrollments
Obtener lista de matrículas.

**Query Parameters:**
| Parámetro | Tipo | Descripción | Requerido | Default |
|-----------|------|-------------|-----------|---------|
| page | Int | Número de página | No | 1 |
| limit | Int | Registros por página | No | 10 |
| estado | String | Filtrar por estado | No | - |
| athleteId | Int | Filtrar por deportista | No | - |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "athleteId": 1,
      "fechaMatricula": "2026-03-01",
      "fechaVencimiento": "2027-03-01",
      "estado": "Vigente",
      "athlete": {
        "user": {
          "firstName": "María",
          "lastName": "González"
        }
      }
    }
  ],
  "pagination": {
    "total": 20,
    "page": 1,
    "limit": 10
  }
}
```

---

### GET /enrollments/:id
Obtener matrícula por ID.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "athleteId": 1,
    "fechaMatricula": "2026-03-01",
    "fechaInicio": "2026-03-01",
    "fechaVencimiento": "2027-03-01",
    "estado": "Vigente",
    "observaciones": "Primera matrícula",
    "athlete": {
      "user": {
        "firstName": "María",
        "lastName": "González",
        "email": "maria@example.com"
      }
    }
  }
}
```

---

### PUT /enrollments/:id
Actualizar matrícula.

**Request Body:**
```json
{
  "estado": "Suspendida",
  "observaciones": "Suspendida por motivos personales"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Matrícula actualizada",
  "data": {
    "id": 1,
    "estado": "Suspendida"
  }
}
```

---

### POST /enrollments/process-expired
Procesar matrículas vencidas (job manual).

**Response 200:**
```json
{
  "success": true,
  "message": "Procesadas 5 matrículas vencidas",
  "data": {
    "processed": 5,
    "errors": 0,
    "details": [
      {
        "enrollmentId": 1,
        "athleteId": 1,
        "athleteName": "María González",
        "fechaVencimiento": "2026-02-01",
        "status": "processed"
      }
    ]
  }
}
```

---

### POST /enrollments/renew/:athleteId
Renovar matrícula de una deportista.

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| athleteId | Int | ID de la deportista |

**Request Body:**
```json
{
  "fechaInicio": "2026-03-01",
  "observaciones": "Renovación anual",
  "comprobantePago": "https://..."
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Matrícula renovada exitosamente. Deportista reactivado.",
  "data": {
    "enrollment": {
      "id": 2,
      "fechaInicio": "2026-03-01",
      "fechaVencimiento": "2027-03-01",
      "estado": "Vigente"
    },
    "athlete": {
      "id": 1,
      "status": "Active"
    }
  }
}
```

---

## MÓDULO: PRE-REGISTRATIONS

### GET /pre-registrations
Obtener lista de pre-inscripciones.

**Query Parameters:**
| Parámetro | Tipo | Descripción | Default |
|-----------|------|-------------|---------|
| page | Int | Número de página | 1 |
| limit | Int | Registros por página | 10 |
| status | String | Filtrar por estado | - |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "firstName": "María",
      "lastName": "González",
      "email": "maria@example.com",
      "identification": "1234567890",
      "birthDate": "2010-05-15",
      "status": "Pending",
      "createdAt": "2026-02-15"
    }
  ]
}
```

---

### POST /pre-registrations
Crear nueva pre-inscripción.

**Request Body:**
```json
{
  "firstName": "María",
  "middleName": "José",
  "lastName": "González",
  "secondLastName": "Pérez",
  "identification": "1234567890",
  "birthDate": "2010-05-15",
  "phoneNumber": "3001234567",
  "email": "maria@example.com"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Pre-inscripción creada exitosamente",
  "data": {
    "id": 1,
    "status": "Pending"
  }
}
```

---

## VALIDACIONES

### Validaciones de Deportista

#### Campos de Texto
- **firstName:** Mínimo 2 caracteres, requerido
- **lastName:** Mínimo 2 caracteres, requerido
- **middleName:** Opcional
- **secondLastName:** Opcional

#### Documento
- **identification:** 
  - Mínimo 6 caracteres
  - Único en el sistema
  - Requerido
  - Solo números

#### Email
- **email:**
  - Formato válido (regex)
  - Único en el sistema
  - Requerido
  - Se normaliza a minúsculas

#### Teléfono
- **phoneNumber:**
  - Requerido
  - Formato: 10 dígitos
  - Solo números

#### Fecha de Nacimiento
- **birthDate:**
  - Requerido
  - Formato ISO 8601
  - No puede ser futura
  - Se calcula edad automáticamente

#### Dirección
- **address:**
  - Requerida
  - Mínimo 5 caracteres

#### Categoría
- **categoria:**
  - Debe existir en SportsCategory
  - Debe estar activa
  - Edad debe estar en rango (excepto si viene de matrícula)

#### Acudiente
- **acudiente (guardianId):**
  - Obligatorio si edad < 18
  - Debe existir en Guardian
  - Debe ser un ID válido

#### Parentesco
- **parentesco (relationship):**
  - Obligatorio si tiene acudiente
  - Debe ser un valor del enum GuardianRelationship

---

### Validaciones de Matrícula

#### Datos de Deportista
- Todas las validaciones de deportista aplican
- Se valida que no exista documento duplicado
- Se valida que no exista email duplicado

#### Datos de Matrícula
- **estado:** Debe ser un valor válido del enum EnrollmentStatus
- **fechaMatricula:** Opcional, default: hoy
- **observaciones:** Opcional
- **comprobantePago:** Opcional, URL válida

---

### Validaciones de Acudiente

#### Campos Requeridos
- **firstName:** Mínimo 2 caracteres
- **lastName:** Mínimo 2 caracteres
- **identification:** Único, mínimo 6 caracteres
- **email:** Único, formato válido
- **phone:** Requerido, 10 dígitos
- **documentTypeId:** Debe existir

#### Campos Opcionales
- **address**
- **occupation**
- **birthDate**

---

## CÓDIGOS DE ERROR

### 400 - Bad Request
- Datos de entrada inválidos
- Validación fallida
- Email o documento duplicado
- Acudiente faltante para menor de edad

### 401 - Unauthorized
- Token JWT inválido o expirado
- Sin token de autenticación

### 403 - Forbidden
- Sin permisos para la operación
- Intento de eliminar matrícula

### 404 - Not Found
- Deportista no encontrada
- Matrícula no encontrada
- Acudiente no encontrado

### 500 - Internal Server Error
- Error en base de datos
- Error al enviar email
- Error inesperado del servidor

---

## MENSAJES DE ERROR COMUNES

```json
{
  "success": false,
  "message": "Ya existe una deportista con ese documento"
}
```

```json
{
  "success": false,
  "message": "El acudiente es obligatorio para menores de 18 años"
}
```

```json
{
  "success": false,
  "message": "No se puede crear: la edad 8 es menor al rango de la categoría PreJuvenil (13-15 años)"
}
```

```json
{
  "success": false,
  "message": "Acudiente no encontrado"
}
```

```json
{
  "success": false,
  "message": "Las matrículas no pueden ser eliminadas"
}
```

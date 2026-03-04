# 📚 DOCUMENTACIÓN COMPLETA - MÓDULO DE DEPORTISTAS, MATRÍCULAS E INSCRIPCIONES

## 📋 ÍNDICE

1. [Arquitectura General](#arquitectura-general)
2. [Modelos de Base de Datos (Prisma)](#modelos-de-base-de-datos)
3. [Backend - API Endpoints](#backend-api-endpoints)
4. [Validaciones](#validaciones)
5. [Reglas de Negocio](#reglas-de-negocio)
6. [Flujos Completos](#flujos-completos)
7. [Frontend - Componentes](#frontend-componentes)
8. [Hooks Personalizados](#hooks-personalizados)
9. [Servicios](#servicios)
10. [Jobs Automáticos](#jobs-automáticos)

---

## 🏗️ ARQUITECTURA GENERAL

### Estructura del Sistema

```
Sistema de Gestión Deportiva
│
├── Pre-Inscripciones (Landing Page)
│   └── Estado: Pendiente → Procesada
│
├── Deportistas (Athletes)
│   ├── Usuario (User)
│   ├── Acudiente (Guardian) - Opcional
│   └── Estado: Active/Inactive
│
├── Matrículas (Enrollments)
│   ├── Estado: Vigente/Vencida/Suspendida/Cancelada
│   ├── Fecha Inicio
│   ├── Fecha Vencimiento (1 año)
│   └── Vinculada a Deportista
│
└── Categorías Deportivas (Sports Categories)
    ├── Rango de Edad
    └── Estado: Activo/Inactivo
```

---

## 🗄️ MODELOS DE BASE DE DATOS

### 1. PreRegistration (Pre-Inscripciones)

**Tabla:** `pre_registrations`

```prisma
model PreRegistration {
  id             Int                   @id @default(autoincrement())
  firstName      String                @map("first_name")
  middleName     String?               @map("middle_name")
  lastName       String                @map("last_name")
  secondLastName String?               @map("second_last_name")
  birthDate      DateTime              @map("birth_date")
  phoneNumber    String                @map("phone_number")
  email          String                @unique
  status         PreRegistrationStatus @default(Pendiente)
  identification String?               @unique
  createdAt      DateTime              @default(now())
  updatedAt      DateTime              @updatedAt
}
```

**Estados:**
- `Pendiente`: Inscripción recibida, esperando procesamiento
- `Procesada`: Convertida en matrícula
- `Rechazada`: Rechazada por el administrador

---

### 2. User (Usuarios)

**Tabla:** `users`

```prisma
model User {
  id                Int          @id @default(autoincrement())
  firstName         String
  middleName        String?
  lastName          String
  secondLastName    String?
  email             String       @unique
  passwordHash      String
  phoneNumber       String
  address           String
  birthDate         DateTime
  identification    String       @unique
  status            UserStatus   @default(Active)
  documentTypeId    Int
  roleId            Int
  age               Int?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  
  athlete           Athlete?
  documentType      DocumentType @relation(...)
  role              Role         @relation(...)
}
```

**Estados:**
- `Active`: Usuario activo
- `Inactive`: Usuario inactivo
- `Suspended`: Usuario suspendido

**Contraseña Inicial:** El documento de identidad

---

### 3. Athlete (Deportistas)

**Tabla:** `athletes`

```prisma
model Athlete {
  id                       Int                @id @default(autoincrement())
  userId                   Int                @unique
  status                   AthleteStatus      @default(Active)
  guardianId               Int?
  relationship             GuardianRelationship?
  currentInscriptionStatus InscriptionStatus?
  inactivityReason         String?
  createdAt                DateTime           @default(now())
  updatedAt                DateTime           @updatedAt
  
  user                     User               @relation(...)
  guardian                 Guardian?          @relation(...)
  enrollments              Enrollment[]
}
```

**Estados:**
- `Active`: Deportista activo
- `Inactive`: Deportista inactivo

---

### 4. Enrollment (Matrículas)

**Tabla:** `enrollments`

```prisma
model Enrollment {
  id               Int              @id @default(autoincrement())
  athleteId        Int
  fechaMatricula   DateTime         @default(now())
  fechaInicio      DateTime         @default(now())
  fechaVencimiento DateTime
  estado           EnrollmentStatus @default(Vigente)
  observaciones    String?
  comprobantePago  String?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  
  athlete          Athlete          @relation(...)
}
```

**Estados:**
- `Vigente`: Matrícula activa
- `Vencida`: Matrícula expirada
- `Suspendida`: Matrícula suspendida temporalmente
- `Cancelada`: Matrícula cancelada

**Duración:** 1 año desde `fechaInicio`

---

### 5. Guardian (Acudientes)

**Tabla:** `guardians`

```prisma
model Guardian {
  id             Int          @id @default(autoincrement())
  firstName      String
  lastName       String
  identification String       @unique
  email          String       @unique
  phone          String
  address        String?
  documentTypeId Int
  birthDate      DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  
  athletes       Athlete[]
  documentType   DocumentType @relation(...)
}
```

---

### 6. SportsCategory (Categorías Deportivas)

**Tabla:** `sports_categories`

```prisma
model SportsCategory {
  id          Int                  @id @default(autoincrement())
  nombre      String
  edadMinima  Int
  edadMaxima  Int
  descripcion String?
  estado      SportsCategoryStatus @default(Activo)
  publicar    Boolean              @default(false)
  createdAt   DateTime             @default(now())
  updatedAt   DateTime             @updatedAt
}
```

**Estados:**
- `Activo`: Categoría disponible
- `Inactivo`: Categoría no disponible

---

## 🔌 BACKEND - API ENDPOINTS

### Pre-Inscripciones

#### `POST /api/pre-registrations`
Crear pre-inscripción desde el landing

**Body:**
```json
{
  "firstName": "Sara",
  "middleName": "María",
  "lastName": "Montoya",
  "secondLastName": "Salazar",
  "identification": "1018292918",
  "birthDate": "2000-02-02",
  "phoneNumber": "3135920318",
  "email": "sara@example.com"
}
```

**Validaciones:**
- firstName: mínimo 2 caracteres
- lastName: mínimo 2 caracteres
- identification: mínimo 6 caracteres, único
- email: formato válido, único
- birthDate: fecha válida

**Respuesta:**
```json
{
  "success": true,
  "message": "Pre-inscripción creada exitosamente",
  "data": { ... }
}
```

**Acciones:**
1. Valida datos
2. Verifica que no exista inscripción pendiente con mismo email/documento
3. Crea registro en BD
4. Envía email de confirmación

---

#### `GET /api/pre-registrations`
Listar pre-inscripciones (requiere autenticación)

**Query Params:**
- `status`: Pendiente | Procesada | Rechazada
- `page`: número de página (default: 1)
- `limit`: registros por página (default: 10, max: 100)
- `search`: término de búsqueda

**Respuesta:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

#### `GET /api/pre-registrations/check-document/:identification`
Verificar si un documento ya está registrado

**Respuesta:**
```json
{
  "success": true,
  "exists": true,
  "message": "Este documento ya está matriculado en el sistema",
  "location": "user"
}
```

**Locations:**
- `user`: Documento ya matriculado
- `preRegistration`: Documento con inscripción pendiente
- `null`: Documento disponible

---

### Matrículas (Enrollments)

#### `POST /api/enrollments`
Crear matrícula (convertir inscripción o crear nueva)

**Body:**
```json
{
  "preRegistrationId": 123,
  "athlete": {
    "firstName": "Sara",
    "middleName": "María",
    "lastName": "Montoya",
    "secondLastName": "Salazar",
    "documentTypeId": 1,
    "identification": "1018292918",
    "email": "sara@example.com",
    "phoneNumber": "3135920318",
    "birthDate": "2000-02-02",
    "address": "Calle 123",
    "categoria": "Juvenil",
    "acudiente": 5,
    "parentesco": "Madre"
  },
  "enrollment": {
    "fechaMatricula": "2026-02-25",
    "observaciones": "Primera matrícula",
    "comprobantePago": "url_comprobante"
  }
}
```

**Validaciones:**
- Documento único (no puede existir otro usuario con mismo documento)
- Email único
- Acudiente obligatorio si menor de 18 años
- Categoría debe coincidir con edad del deportista

**Proceso:**
1. Valida que documento no exista
2. Calcula edad del deportista
3. Valida acudiente si es menor de 18
4. Crea usuario con rol "Athlete"
5. Crea deportista (siempre `Active`)
6. Crea matrícula (siempre `Vigente`, vence en 1 año)
7. Marca pre-inscripción como `Procesada` (si existe)
8. Envía email con credenciales

**Respuesta:**
```json
{
  "success": true,
  "message": "Deportista matriculada exitosamente",
  "data": {
    "athlete": { ... },
    "enrollment": { ... },
    "emailSent": true,
    "temporaryPassword": "1018292918"
  }
}
```

---


#### `GET /api/enrollments`
Listar matrículas

**Query Params:**
- `estado`: Vigente | Vencida | Suspendida | Cancelada
- `athleteId`: filtrar por deportista
- `page`: número de página
- `limit`: registros por página

---

#### `GET /api/enrollments/:id`
Obtener matrícula por ID

---

#### `PUT /api/enrollments/:id`
Actualizar matrícula

**Body:**
```json
{
  "estado": "Suspendida",
  "observaciones": "Suspendida por falta de pago"
}
```

---

#### `DELETE /api/enrollments/:id`
Eliminar matrícula

**Validaciones:**
- ❌ No se puede eliminar si estado es `Vigente`
- ❌ No se puede eliminar si tiene menos de 1 año desde `fechaMatricula`
- ✅ Solo se puede eliminar después de 1 año y si NO está vigente

**Respuesta de error:**
```json
{
  "success": false,
  "message": "No se puede eliminar una matrícula reciente. Debe esperar 8 mes(es) desde la fecha de matrícula (25/02/2026). Podrá eliminarla después del 25/02/2027."
}
```

---

#### `POST /api/enrollments/process-expired`
Procesar matrículas vencidas (Job manual)

**Proceso:**
1. Busca matrículas con estado `Vigente` y `fechaVencimiento` pasada
2. Actualiza estado a `Vencida`
3. Actualiza deportista a `Inactive` con razón "Inactiva por vencimiento de matrícula"

**Respuesta:**
```json
{
  "success": true,
  "message": "Procesadas 5 matrículas vencidas",
  "data": {
    "processed": 5,
    "errors": 0,
    "details": [...]
  }
}
```

---

#### `POST /api/enrollments/renew/:athleteId`
Renovar matrícula de un deportista

**Body:**
```json
{
  "fechaInicio": "2026-02-25",
  "observaciones": "Renovación anual",
  "comprobantePago": "url"
}
```

**Proceso:**
1. Verifica que deportista existe
2. Crea nueva matrícula (vigente por 1 año)
3. Reactiva deportista (estado `Active`)

---

### Deportistas (Athletes)

#### `GET /api/athletes`
Listar deportistas

**Query Params:**
- `status`: Active | Inactive
- `page`: número de página
- `limit`: registros por página
- `search`: buscar por nombre, documento, email

---

#### `GET /api/athletes/:id`
Obtener deportista por ID

**Incluye:**
- Datos del usuario
- Acudiente (si tiene)
- Matrículas
- Tipo de documento

---

#### `PUT /api/athletes/:id`
Actualizar deportista

**Body:**
```json
{
  "firstName": "Sara",
  "lastName": "Montoya",
  "email": "sara@example.com",
  "phoneNumber": "3135920318",
  "address": "Nueva dirección"
}
```

---

#### `DELETE /api/athletes/:id`
Eliminar deportista

**Validaciones:**
- ❌ No se puede eliminar si tiene matrícula vigente
- ❌ No se puede eliminar si la matrícula tiene menos de 1 año
- ❌ No se puede eliminar si está en equipos activos
- ❌ No se puede eliminar si está inscrito en eventos

---

#### `GET /api/users/check-email`
Verificar disponibilidad de email

**Query Params:**
- `email`: email a verificar
- `excludeUserId`: ID de usuario a excluir (para edición)

**Respuesta:**
```json
{
  "success": true,
  "available": true,
  "message": "Email disponible"
}
```

---

#### `GET /api/users/check-document`
Verificar disponibilidad de documento

**Query Params:**
- `identification`: documento a verificar
- `excludeUserId`: ID de usuario a excluir

---

### Acudientes (Guardians)

#### `GET /api/guardians`
Listar acudientes

**Query Params:**
- `search`: buscar por nombre, documento, email
- `page`: número de página
- `limit`: registros por página

---

#### `POST /api/guardians`
Crear acudiente

**Body:**
```json
{
  "firstName": "María",
  "lastName": "Pérez",
  "identification": "43123456",
  "email": "maria@example.com",
  "phone": "3001234567",
  "address": "Calle 123",
  "documentTypeId": 1,
  "birthDate": "1980-05-15"
}
```

---

#### `PUT /api/guardians/:id`
Actualizar acudiente

---

#### `DELETE /api/guardians/:id`
Eliminar acudiente

**Validación:**
- ❌ No se puede eliminar si tiene deportistas asociados

---

### Categorías Deportivas

#### `GET /api/sports-categories`
Listar categorías

**Query Params:**
- `status`: Activo | Inactivo (opcional, acepta string vacío)
- `page`: número de página
- `limit`: registros por página (max: 100)
- `search`: buscar por nombre

**Validaciones:**
- `status` es opcional, acepta valores vacíos
- `limit` máximo 100

---

#### `POST /api/sports-categories`
Crear categoría

**Body:**
```json
{
  "name": "Juvenil",
  "description": "Categoría juvenil",
  "minAge": 15,
  "maxAge": 17,
  "status": "Activo",
  "publicar": true
}
```

**Validaciones:**
- `name`: 3-100 caracteres, único
- `minAge`: 4-79 años
- `maxAge`: 5-80 años, debe ser mayor que `minAge`

---

#### `PUT /api/sports-categories/:id`
Actualizar categoría

---

#### `DELETE /api/sports-categories/:id`
Eliminar categoría

**Validación:**
- ❌ No se puede eliminar si tiene deportistas asociados

---

#### `GET /api/sports-categories/check-name`
Verificar disponibilidad de nombre

**Query Params:**
- `name`: nombre a verificar
- `excludeId`: ID a excluir (para edición)

---

## ✅ VALIDACIONES

### Validaciones de Documento

**Frontend:**
- Mínimo 6 caracteres
- Solo números
- Validación en tiempo real (debounce 400ms)
- Verifica contra:
  - Usuarios existentes (deportistas matriculados)
  - Pre-inscripciones pendientes

**Backend:**
- Documento único en tabla `users`
- Documento único en tabla `pre_registrations` (si está pendiente)

**Mensajes:**
- ✅ "Documento disponible"
- ❌ "Este número de documento ya está matriculado"
- ❌ "Este número de documento ya tiene una inscripción pendiente"

---

### Validaciones de Email

**Frontend:**
- Formato válido (regex)
- Validación en tiempo real (debounce 400ms)
- Verifica contra usuarios existentes

**Backend:**
- Email único en tabla `users`
- Email único en tabla `pre_registrations`

**Mensajes:**
- ✅ "Email disponible"
- ❌ "Este email ya está registrado"

---

### Validaciones de Acudiente

**Regla de Negocio:**
- **Menor de 18 años:** Acudiente OBLIGATORIO
- **Mayor de 18 años:** Acudiente OPCIONAL

**Validaciones:**
- Si es menor de 18 y no tiene acudiente → Error
- Si tiene acudiente, debe existir en BD
- El ID del acudiente debe ser un número entero positivo

---

### Validaciones de Categoría

**Regla de Negocio:**
- La edad del deportista debe estar dentro del rango de la categoría

**Validaciones:**
- Edad calculada a partir de `birthDate`
- `edad >= edadMinima` AND `edad <= edadMaxima`

**Mensaje de error:**
```
La edad del deportista (18 años) no está dentro del rango de la categoría Juvenil (15-17 años)
```

---

### Validaciones de Eliminación

#### Deportistas

**No se puede eliminar si:**
1. Tiene matrícula vigente
2. La matrícula fue creada hace menos de 1 año
3. Está en equipos activos
4. Está inscrito en eventos

**Mensaje:**
```
No se puede eliminar esta deportista porque tiene una matrícula vigente hasta el 25/02/2027
```

#### Matrículas

**No se puede eliminar si:**
1. Estado es `Vigente`
2. Fue creada hace menos de 1 año desde `fechaMatricula`

**Mensaje:**
```
No se puede eliminar una matrícula reciente. Debe esperar 8 mes(es) desde la fecha de matrícula (25/02/2026)
```

---

## 📋 REGLAS DE NEGOCIO

### 1. Contraseña Inicial

**Regla:** La contraseña inicial de un deportista es su número de documento de identidad

**Implementación:**
```javascript
const tempPassword = athlete.identification?.trim();
const passwordHash = await bcrypt.hash(tempPassword, 10);
```

**Email enviado:**
- Usuario: email del deportista
- Contraseña: documento de identidad
- Recomendación: Cambiar contraseña en primer inicio de sesión

---

### 2. Duración de Matrícula

**Regla:** Toda matrícula tiene una duración de 1 año desde `fechaInicio`

**Implementación:**
```javascript
const fechaInicio = new Date();
const fechaVencimiento = new Date(fechaInicio);
fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1);
```

---

### 3. Estado Inicial

**Al crear matrícula:**
- Deportista: `Active`
- Matrícula: `Vigente`
- Usuario: `Active`

**Al vencer matrícula:**
- Deportista: `Inactive`
- Matrícula: `Vencida`
- Razón: "Inactiva por vencimiento de matrícula"

---

### 4. Procesamiento de Inscripciones

**Regla:** Al crear matrícula desde inscripción, la inscripción se marca como `Procesada`

**Búsqueda:**
1. Si viene `preRegistrationId` → Buscar por ID
2. Si no viene ID → Buscar por email
3. Si no encuentra por email → Buscar por documento

**Implementación:**
```javascript
// Buscar por email
let preRegistration = await tx.preRegistration.findFirst({
  where: { email: cleanEmail, status: "Pendiente" }
});

// Si no encuentra, buscar por documento
if (!preRegistration) {
  preRegistration = await tx.preRegistration.findFirst({
    where: { identification: athlete.identification, status: "Pendiente" }
  });
}

// Marcar como procesada
if (preRegistration) {
  await tx.preRegistration.update({
    where: { id: preRegistration.id },
    data: { status: "Procesada" }
  });
}
```

---

### 5. Eliminación de Inscripciones de la Tabla

**Regla:** Al matricular, la inscripción desaparece INMEDIATAMENTE de la tabla

**Implementación (Frontend):**
```javascript
// 1. Eliminar del estado local ANTES de llamar al backend
setInscriptions(prev => prev.filter(i => i.id !== preRegistrationId));

// 2. Llamar al backend
await EnrollmentsService.create(enrollmentData);

// 3. Recargar datos
await fetchData();
```

**Filtro adicional:**
```javascript
// Filtrar inscripciones que ya tienen deportista matriculado
const enrolledDocuments = athletes.map(a => a.user.identification);
const pendingInscriptions = inscriptions.filter(i => 
  i.status === "Pendiente" && 
  !enrolledDocuments.includes(i.identification)
);
```

---

### 6. Validación de Edad para Categorías

**Regla:** La edad se calcula en el momento de la matrícula y debe coincidir con la categoría

**Cálculo de edad:**
```javascript
const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};
```

---

## 🔄 FLUJOS COMPLETOS

### Flujo 1: Inscripción desde Landing

```
1. Usuario llena formulario en landing
   ↓
2. Frontend valida datos
   ↓
3. POST /api/pre-registrations
   ↓
4. Backend:
   - Valida datos
   - Verifica documento/email únicos
   - Crea registro con status="Pendiente"
   - Envía email de confirmación
   ↓
5. Administrador ve inscripción en dashboard
   ↓
6. Administrador hace clic en "Matricular"
   ↓
7. Modal se abre con datos pre-cargados
   ↓
8. Administrador completa datos faltantes
   ↓
9. Frontend valida:
   - Documento disponible
   - Email disponible
   - Categoría válida para edad
   - Acudiente (si es menor)
   ↓
10. POST /api/enrollments con preRegistrationId
   ↓
11. Backend:
   - Crea usuario
   - Crea deportista
   - Crea matrícula
   - Marca inscripción como "Procesada"
   - Envía email con credenciales
   ↓
12. Frontend:
   - Elimina inscripción del estado local
   - Recarga datos
   - Muestra mensaje de éxito
   ↓
13. Inscripción desaparece de la tabla
14. Deportista aparece en lista de deportistas
```

---

### Flujo 2: Matrícula Directa (sin inscripción previa)

```
1. Administrador hace clic en "Nueva Matrícula"
   ↓
2. Modal se abre vacío
   ↓
3. Administrador llena todos los datos
   ↓
4. Frontend valida en tiempo real:
   - Documento (debounce 400ms)
   - Email (debounce 400ms)
   ↓
5. Al hacer clic en "Guardar":
   - Valida todos los campos
   - Valida categoría por edad
   - Valida acudiente si es menor
   ↓
6. POST /api/enrollments sin preRegistrationId
   ↓
7. Backend:
   - Crea usuario
   - Crea deportista
   - Crea matrícula
   - Busca inscripción pendiente por email/documento
   - Si encuentra, marca como "Procesada"
   - Envía email con credenciales
   ↓
8. Frontend:
   - Recarga datos
   - Muestra mensaje de éxito
   ↓
9. Deportista aparece en lista
```

---

### Flujo 3: Vencimiento de Matrícula

```
1. Job automático se ejecuta diariamente (00:00)
   ↓
2. Backend busca matrículas:
   - estado = "Vigente"
   - fechaVencimiento <= hoy
   ↓
3. Para cada matrícula vencida:
   - Actualiza estado a "Vencida"
   - Actualiza deportista a "Inactive"
   - Establece razón: "Inactiva por vencimiento de matrícula"
   ↓
4. Retorna resumen:
   - Procesadas: X
   - Errores: Y
   - Detalles: [...]
```

---

### Flujo 4: Renovación de Matrícula

```
1. Administrador ve deportista inactiva
   ↓
2. Hace clic en "Renovar Matrícula"
   ↓
3. Modal se abre con datos del deportista
   ↓
4. Administrador ingresa:
   - Fecha de inicio (opcional, default: hoy)
   - Observaciones
   - Comprobante de pago
   ↓
5. POST /api/enrollments/renew/:athleteId
   ↓
6. Backend:
   - Crea nueva matrícula (vigente por 1 año)
   - Reactiva deportista (status="Active")
   ↓
7. Frontend:
   - Recarga datos
   - Muestra mensaje de éxito
   ↓
8. Deportista vuelve a estado "Active"
```

---


## 🎨 FRONTEND - COMPONENTES

### 1. Enrollments.jsx

**Ubicación:** `src/features/dashboard/pages/Admin/pages/Athletes/Enrollments/Enrollments.jsx`

**Responsabilidad:** Componente principal que gestiona matrículas e inscripciones

**Estado:**
```javascript
const {
  athletes,              // Lista de deportistas matriculados
  inscriptions,          // Lista de inscripciones pendientes
  loading,               // Estado de carga
  error,                 // Errores
  pagination,            // Paginación
  createEnrollment,      // Función para crear matrícula
  updateEnrollment,      // Función para actualizar
  deleteEnrollment,      // Función para eliminar
  rejectInscription,     // Función para rechazar inscripción
  fetchData              // Recargar datos
} = useEnrollments();
```

**Funcionalidades:**
- Listar deportistas matriculados
- Listar inscripciones pendientes
- Crear matrícula desde inscripción
- Crear matrícula directa
- Renovar matrícula vencida
- Eliminar matrícula (con validaciones)
- Rechazar inscripción

**Tabs:**
1. **Deportistas:** Lista de deportistas matriculados
2. **Inscripciones:** Lista de inscripciones pendientes del landing

---

### 2. AthleteModal.jsx

**Ubicación:** `src/features/dashboard/pages/Admin/pages/Athletes/components/AthleteModal.jsx`

**Responsabilidad:** Modal para crear/editar deportista y matrícula

**Props:**
```javascript
{
  isOpen: boolean,
  onClose: function,
  onSave: function,
  athleteToEdit: object | null,
  isEnrollmentMode: boolean,  // true = crear matrícula
  isEditing: boolean,          // true = editar deportista
  documentTypes: array,
  sportsCategories: array
}
```

**Modos:**
1. **Crear Matrícula:** `isEnrollmentMode=true, isEditing=false`
2. **Editar Deportista:** `isEnrollmentMode=false, isEditing=true`
3. **Ver Deportista:** `isEnrollmentMode=false, isEditing=false`

**Validaciones en Tiempo Real:**
- Documento (debounce 400ms)
- Email (debounce 400ms)
- Teléfono (formato)
- Categoría por edad

**Campos:**
```javascript
{
  // Datos personales
  firstName: string,
  middleName: string,
  lastName: string,
  secondLastName: string,
  documentTypeId: number,
  identification: string,
  email: string,
  phoneNumber: string,
  birthDate: date,
  address: string,
  
  // Categoría
  categoria: string,
  
  // Acudiente (opcional si mayor de 18)
  acudiente: number | null,
  parentesco: string | null,
  
  // Matrícula (solo en modo enrollment)
  fechaMatricula: date,
  observaciones: string,
  comprobantePago: string
}
```

---

### 3. RenewEnrollmentModal.jsx

**Ubicación:** `src/features/dashboard/pages/Admin/pages/Athletes/Enrollments/components/RenewEnrollmentModal.jsx`

**Responsabilidad:** Modal para renovar matrícula vencida

**Props:**
```javascript
{
  isOpen: boolean,
  onClose: function,
  athlete: object,
  onRenew: function
}
```

**Campos:**
```javascript
{
  fechaInicio: date,        // Default: hoy
  observaciones: string,
  comprobantePago: string
}
```

---

### 4. Athletes.jsx

**Ubicación:** `src/features/dashboard/pages/Admin/pages/Athletes/Athletes.jsx`

**Responsabilidad:** Lista completa de deportistas (sin inscripciones)

**Funcionalidades:**
- Listar todos los deportistas
- Filtrar por estado (Active/Inactive)
- Buscar por nombre, documento, email
- Editar deportista
- Eliminar deportista (con validaciones)
- Ver detalles

---

## 🪝 HOOKS PERSONALIZADOS

### 1. useEnrollments.js

**Ubicación:** `src/features/dashboard/pages/Admin/pages/Athletes/Enrollments/hooks/useEnrollments.js`

**Responsabilidad:** Lógica de negocio para matrículas e inscripciones

**Estado:**
```javascript
{
  athletes: [],           // Deportistas matriculados
  inscriptions: [],       // Inscripciones pendientes
  loading: boolean,
  error: string | null,
  pagination: object,
  guardians: [],          // Lista de acudientes
  sportsCategories: []    // Lista de categorías
}
```

**Funciones:**

#### `fetchData()`
Carga deportistas e inscripciones

**Proceso:**
1. Llama a `EnrollmentsService.getAll()`
2. Llama a `InscriptionsService.getAll()`
3. Filtra inscripciones pendientes
4. Elimina inscripciones de deportistas ya matriculados

#### `createEnrollment(enrollmentData)`
Crea nueva matrícula

**Proceso:**
1. Elimina inscripción del estado local INMEDIATAMENTE
2. Llama a `EnrollmentsService.create()`
3. Recarga datos
4. Muestra mensaje de éxito

#### `updateEnrollment(id, data)`
Actualiza matrícula existente

#### `deleteEnrollment(id)`
Elimina matrícula (con validaciones del backend)

#### `rejectInscription(id, reason)`
Rechaza inscripción pendiente

#### `searchGuardians(term)`
Busca acudientes por nombre/documento

#### `processExpiredEnrollments()`
Ejecuta job de vencimiento de matrículas

---

### 2. useDocumentValidation.js

**Ubicación:** `src/features/dashboard/hooks/useDocumentValidation.js`

**Responsabilidad:** Validación de documento en tiempo real

**Parámetros:**
```javascript
{
  identification: string,
  minLength: number,
  excludeUserId: number | null,
  skipInscriptionCheck: boolean
}
```

**Retorna:**
```javascript
{
  isChecking: boolean,
  documentExists: boolean,
  validationMessage: string
}
```

**Proceso:**
1. Debounce de 400ms
2. Verifica en cache
3. Llama a `AthletesService.checkDocumentAvailability()`
4. Si no skipInscriptionCheck, llama a `InscriptionsService.checkDocumentExists()`
5. Prioriza mensaje de matriculado sobre inscrito
6. Guarda en cache (10 segundos)

**Mensajes:**
- ✅ "" (vacío si disponible)
- ❌ "Este número de documento ya está matriculado"
- ❌ "Este número de documento ya tiene una inscripción pendiente"

---

### 3. useSportsCategories.js

**Ubicación:** `src/features/dashboard/pages/Admin/pages/Athletes/SportsCategory/hooks/useSportsCategories.js`

**Responsabilidad:** Gestión de categorías deportivas

**Estado:**
```javascript
{
  categories: [],
  loading: boolean,
  error: string | null,
  pagination: object
}
```

**Funciones:**
- `fetchSportsCategories()`: Cargar categorías
- `createCategory()`: Crear categoría
- `updateCategory()`: Actualizar categoría
- `deleteCategory()`: Eliminar categoría
- `checkNameAvailability()`: Verificar nombre único

---

## 🔧 SERVICIOS

### 1. EnrollmentsService.js

**Ubicación:** `src/features/dashboard/services/EnrollmentsService.js`

**Métodos:**

#### `getAll(filters)`
```javascript
const filters = {
  estado: "Vigente",
  page: 1,
  limit: 10,
  search: "Sara"
};
const result = await EnrollmentsService.getAll(filters);
```

#### `create(enrollmentData)`
```javascript
const data = {
  preRegistrationId: 123,  // Opcional
  athlete: { ... },
  enrollment: { ... }
};
const result = await EnrollmentsService.create(data);
```

#### `update(id, data)`
```javascript
await EnrollmentsService.update(5, {
  estado: "Suspendida",
  observaciones: "Suspendida por falta de pago"
});
```

#### `delete(id)`
```javascript
await EnrollmentsService.delete(5);
```

#### `processExpiredEnrollments()`
```javascript
const result = await EnrollmentsService.processExpiredEnrollments();
// { processed: 5, errors: 0, details: [...] }
```

#### `renewEnrollment(athleteId, data)`
```javascript
await EnrollmentsService.renewEnrollment(10, {
  fechaInicio: "2026-02-25",
  observaciones: "Renovación anual"
});
```

---

### 2. InscriptionsService.js

**Ubicación:** `src/features/dashboard/services/InscriptionsService.js`

**Métodos:**

#### `getAll(filters)`
```javascript
const filters = {
  status: "Pendiente",
  page: 1,
  limit: 10,
  search: "Sara"
};
const result = await InscriptionsService.getAll(filters);
```

#### `create(data)`
```javascript
const data = {
  firstName: "Sara",
  lastName: "Montoya",
  identification: "1018292918",
  email: "sara@example.com",
  birthDate: "2000-02-02",
  phoneNumber: "3135920318"
};
await InscriptionsService.create(data);
```

#### `updateStatus(id, status)`
```javascript
await InscriptionsService.updateStatus(5, "Rechazada");
```

#### `checkDocumentExists(identification)`
```javascript
const result = await InscriptionsService.checkDocumentExists("1018292918");
// { exists: true, message: "...", location: "user" }
```

---

### 3. AthletesService.js

**Ubicación:** `src/features/dashboard/services/AthletesService.js`

**Métodos:**

#### `getAll(filters)`
```javascript
const filters = {
  status: "Active",
  page: 1,
  limit: 10,
  search: "Sara"
};
const result = await AthletesService.getAll(filters);
```

#### `getById(id)`
```javascript
const athlete = await AthletesService.getById(5);
```

#### `update(id, data)`
```javascript
await AthletesService.update(5, {
  firstName: "Sara María",
  email: "sara.nueva@example.com"
});
```

#### `delete(id)`
```javascript
await AthletesService.delete(5);
```

#### `checkDocumentAvailability(identification, excludeUserId)`
```javascript
const result = await AthletesService.checkDocumentAvailability(
  "1018292918",
  null
);
// { available: true, message: "..." }
```

#### `checkEmailAvailability(email, excludeUserId)`
```javascript
const result = await AthletesService.checkEmailAvailability(
  "sara@example.com",
  null
);
```

---

### 4. GuardiansService.js

**Ubicación:** `src/features/dashboard/services/GuardiansService.js`

**Métodos:**

#### `getAll(filters)`
```javascript
const filters = {
  search: "María",
  page: 1,
  limit: 10
};
const result = await GuardiansService.getAll(filters);
```

#### `create(data)`
```javascript
const data = {
  firstName: "María",
  lastName: "Pérez",
  identification: "43123456",
  email: "maria@example.com",
  phone: "3001234567",
  documentTypeId: 1
};
await GuardiansService.create(data);
```

#### `update(id, data)`
```javascript
await GuardiansService.update(5, {
  phone: "3009876543"
});
```

#### `delete(id)`
```javascript
await GuardiansService.delete(5);
```

---

## ⏰ JOBS AUTOMÁTICOS

### 1. Job de Vencimiento de Matrículas

**Archivo:** `src/jobs/enrollmentExpirationJob.js`

**Frecuencia:** Diario a las 00:00

**Proceso:**
```javascript
import cron from 'node-cron';
import { enrollmentsService } from '../modules/Enrollments/services/enrollments.service.js';

// Ejecutar diariamente a las 00:00
cron.schedule('0 0 * * *', async () => {
  console.log('🔄 Ejecutando job de vencimiento de matrículas...');
  
  try {
    const result = await enrollmentsService.processExpiredEnrollments();
    console.log(`✅ Job completado: ${result.processed} matrículas procesadas`);
  } catch (error) {
    console.error('❌ Error en job de vencimiento:', error);
  }
});
```

**Acciones:**
1. Busca matrículas con `estado="Vigente"` y `fechaVencimiento <= hoy`
2. Para cada matrícula:
   - Actualiza `estado` a `"Vencida"`
   - Actualiza deportista `status` a `"Inactive"`
   - Establece `inactivityReason`: "Inactiva por vencimiento de matrícula"

**Logs:**
```
🔄 Ejecutando job de vencimiento de matrículas...
🔍 Encontradas 5 matrículas vencidas
✅ Job completado: 5 matrículas procesadas
```

---

### 2. Job Manual desde Frontend

**Trigger:** Botón "Procesar Matrículas Vencidas" en el dashboard

**Código:**
```javascript
const handleProcessExpired = async () => {
  try {
    const result = await EnrollmentsService.processExpiredEnrollments();
    showAlert('success', `Procesadas ${result.processed} matrículas vencidas`);
    await fetchData();
  } catch (error) {
    showAlert('error', 'Error procesando matrículas');
  }
};
```

---

## 🔐 SEGURIDAD Y PERMISOS

### Endpoints Públicos (sin autenticación)

- `POST /api/pre-registrations` - Crear inscripción desde landing
- `POST /api/pre-registrations/resend-email` - Reenviar email
- `GET /api/pre-registrations/check-document/:id` - Verificar documento

### Endpoints Protegidos (requieren autenticación)

Todos los demás endpoints requieren token JWT válido:

```javascript
headers: {
  'Authorization': `Bearer ${token}`
}
```

### Permisos por Rol

**Athlete (Deportista):**
- Ver su propia información
- Actualizar su perfil
- Ver sus matrículas

**Admin:**
- Acceso completo a todos los endpoints
- Crear/editar/eliminar deportistas
- Crear/editar/eliminar matrículas
- Gestionar inscripciones
- Gestionar categorías

---

## 📧 EMAILS AUTOMÁTICOS

### 1. Email de Pre-Inscripción

**Trigger:** Al crear pre-inscripción desde landing

**Contenido:**
- Bienvenida
- Datos registrados
- Próximos pasos
- Documentos requeridos:
  - Documento de identidad (copia)
  - Documento de identidad del acudiente (si es menor)
  - Copia del registro civil
- Información de contacto

**Template:** `src/services/emailService.js` → `generatePreRegistrationTemplate()`

---

### 2. Email de Credenciales

**Trigger:** Al crear matrícula

**Contenido:**
- Bienvenida al sistema
- Usuario: email del deportista
- Contraseña: documento de identidad
- Enlace al sistema
- Recomendación de cambiar contraseña

**Template:** `src/services/emailService.js` → `generateAthleteWelcomeEmailTemplate()`

---

## 🐛 DEBUGGING Y LOGS

### Logs del Backend

**Crear Matrícula:**
```
📥 [ENROLLMENT CONTROLLER] CREANDO MATRÍCULA
📥 [ENROLLMENT CONTROLLER] preRegistrationId: 123
✅ [ENROLLMENT CONTROLLER] Validación exitosa
```

**Procesar Vencimientos:**
```
🔍 Encontradas 5 matrículas vencidas
✅ Matrícula 10 procesada: Sara Montoya
```

### Logs del Frontend

**Validación de Documento:**
```
🔍 [useDocumentValidation] Validando documento: 1018292918
✅ [useDocumentValidation] Documento DISPONIBLE
💾 [useDocumentValidation] Guardando en cache
```

**Crear Matrícula:**
```
💾 [handleSaveEnrollment] Guardando matrícula...
💾 [handleSaveEnrollment] preRegistrationId: 123
📝 [createEnrollment] Iniciando creación...
🗑️ [createEnrollment] Eliminando inscripción del estado local
✅ [createEnrollment] Inscripciones restantes: 1
✅ [createEnrollment] Matrícula creada exitosamente
```

**Filtrado de Inscripciones:**
```
📋 [useEnrollments] Todas las inscripciones: 5
🔍 [useEnrollments] Deportista matriculada: Sara Documento: 1018292918
📋 [useEnrollments] Documentos matriculados: [1018292918, 1029282922]
📋 [useEnrollments] Inscripción Sara: estado="Pendiente", isAlreadyEnrolled=true, mostrar=false
📋 [useEnrollments] Inscripciones pendientes filtradas: 3
```

---

## 🚨 ERRORES COMUNES Y SOLUCIONES

### Error: "Ya existe una deportista con ese documento"

**Causa:** Intentando crear matrícula con documento ya registrado

**Solución:** Verificar que el documento no exista antes de enviar

---

### Error: "El acudiente es obligatorio para menores de 18 años"

**Causa:** Deportista menor de 18 sin acudiente

**Solución:** Seleccionar o crear acudiente antes de guardar

---

### Error: "La edad del deportista no está dentro del rango de la categoría"

**Causa:** Categoría seleccionada no coincide con edad

**Solución:** Seleccionar categoría correcta según edad

---

### Error: "No se puede eliminar una matrícula vigente"

**Causa:** Intentando eliminar matrícula con estado "Vigente"

**Solución:** Cambiar estado a "Vencida" o "Cancelada" primero

---

### Error: "No se puede eliminar una matrícula reciente"

**Causa:** Matrícula tiene menos de 1 año desde creación

**Solución:** Esperar hasta que cumpla 1 año

---

### Error: "El estado debe ser 'Activo' o 'Inactivo'"

**Causa:** Validador del backend rechazando string vacío en `status`

**Solución:** Ya corregido con `optional({ values: 'falsy' })`

---

### Error: "El límite debe estar entre 1 y 100"

**Causa:** Frontend enviando `limit=1000`

**Solución:** Ya corregido, máximo 100

---

## ✅ CHECKLIST DE DESPLIEGUE

### Backend

- [ ] Aplicar migraciones: `npx prisma migrate deploy`
- [ ] Regenerar cliente: `npx prisma generate`
- [ ] Verificar variables de entorno
- [ ] Configurar job de vencimiento (cron)
- [ ] Verificar configuración de email
- [ ] Reiniciar servidor

### Frontend

- [ ] Actualizar URL del backend en `.env`
- [ ] Build de producción: `npm run build`
- [ ] Verificar que no haya errores de consola
- [ ] Probar flujo completo de inscripción
- [ ] Probar flujo completo de matrícula
- [ ] Verificar emails se envían correctamente

---

## 📝 NOTAS FINALES

### Cambios Recientes (Febrero 2026)

1. ✅ Corregido validador de categorías para aceptar `status=""` vacío
2. ✅ Agregado búsqueda por documento al marcar inscripción como procesada
3. ✅ Implementado eliminación inmediata de inscripciones del estado local
4. ✅ Agregadas validaciones de eliminación de matrículas (1 año mínimo)
5. ✅ Corregidos nombres de campos en PreRegistration (inglés)
6. ✅ Agregados campos `middleName` y `secondLastName` a PreRegistration
7. ✅ Mejorado filtro de inscripciones pendientes

### Mejoras Futuras

- [ ] Notificaciones push cuando matrícula está por vencer
- [ ] Dashboard con estadísticas de matrículas
- [ ] Exportar reportes en PDF/Excel
- [ ] Historial de cambios de estado
- [ ] Firma digital de comprobantes
- [ ] Integración con pasarela de pagos

---

**Última actualización:** 25 de Febrero de 2026  
**Versión:** 2.0  
**Autor:** Sistema AstroStar

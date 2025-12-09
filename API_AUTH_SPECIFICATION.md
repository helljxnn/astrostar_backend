# Especificación de API - Autenticación y Recuperación de Contraseña
## AstroStar Backend - Para Implementación en App Móvil

---

## 📋 Información General

**Base URL:** `http://localhost:4000/api`  
**Producción:** `TU_URL_DE_PRODUCCION/api`

**Headers Comunes:**
```json
{
  "Content-Type": "application/json"
}
```

**Headers para Rutas Protegidas:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {accessToken}"
}
```

---

## 🔐 Endpoints de Autenticación

### 1. Login (Iniciar Sesión)

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Validaciones:**
- `email`: Requerido, debe ser un email válido
- `password`: Requerido, mínimo 1 carácter

**Response Exitoso (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "firstName": "Juan",
      "middleName": "Carlos",
      "lastName": "Pérez",
      "secondLastName": "García",
      "email": "juan@ejemplo.com",
      "phoneNumber": "3001234567",
      "address": "Calle 123",
      "birthDate": "1990-01-15T00:00:00.000Z",
      "age": 33,
      "identification": "1234567890",
      "status": "Active",
      "documentType": {
        "id": 1,
        "name": "Cédula de Ciudadanía",
        "description": "CC"
      },
      "role": {
        "id": 1,
        "name": "Admin",
        "description": "Administrador del sistema",
        "permissions": ["all"]
      },
      "employee": {
        "id": 1,
        "status": "Active",
        "statusAssignedAt": "2024-01-01T00:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      },
      "athlete": null
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login exitoso"
}
```

**Nota Importante:** El backend también establece una cookie HttpOnly llamada `refreshToken` que dura 7 días. En tu app móvil, deberás manejar esto con un interceptor HTTP que guarde las cookies.

**Errores Posibles:**

**400 - Bad Request:**
```json
{
  "success": false,
  "message": "El email es obligatorio.",
  "field": "email",
  "value": "",
  "errors": [...]
}
```

**401 - Credenciales Inválidas:**
```json
{
  "success": false,
  "message": "Credenciales inválidas"
}
```

**401 - Usuario Inactivo:**
```json
{
  "success": false,
  "message": "Usuario inactivo. Contacte al administrador."
}
```

---

### 2. Obtener Usuario Autenticado

**Endpoint:** `GET /auth/me`

**Headers:**
```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Response Exitoso (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "Juan",
    "middleName": "Carlos",
    "lastName": "Pérez",
    "secondLastName": "García",
    "email": "juan@ejemplo.com",
    "phoneNumber": "3001234567",
    "address": "Calle 123",
    "birthDate": "1990-01-15T00:00:00.000Z",
    "age": 33,
    "identification": "1234567890",
    "status": "Active",
    "documentType": {
      "id": 1,
      "name": "Cédula de Ciudadanía",
      "description": "CC"
    },
    "role": {
      "id": 1,
      "name": "Admin",
      "description": "Administrador del sistema",
      "permissions": ["all"]
    },
    "employee": {...},
    "athlete": null
  },
  "message": "Usuario autenticado"
}
```

**Errores:**
- **401:** Token inválido o expirado

---

### 3. Refrescar Token

**Endpoint:** `POST /auth/refresh`

**Descripción:** Este endpoint usa la cookie HttpOnly `refreshToken` automáticamente. En Flutter, asegúrate de que tu cliente HTTP maneje cookies.

**Response Exitoso (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Token refrescado exitosamente"
}
```

**Errores:**

**401 - Sin Refresh Token:**
```json
{
  "success": false,
  "message": "Refresh token no encontrado"
}
```

**401 - Token Inválido:**
```json
{
  "success": false,
  "message": "Refresh token inválido o expirado"
}
```

---

### 4. Cerrar Sesión

**Endpoint:** `POST /auth/logout`

**Descripción:** Invalida el refresh token actual (de la cookie).

**Response Exitoso (200):**
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

---

### 5. Cerrar Todas las Sesiones

**Endpoint:** `POST /auth/logout-all`

**Headers:**
```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Descripción:** Invalida todos los refresh tokens del usuario.

**Response Exitoso (200):**
```json
{
  "success": true,
  "message": "Todas las sesiones cerradas exitosamente"
}
```

---

## 🔑 Recuperación de Contraseña (3 Pasos)

### Paso 1: Solicitar Código de Recuperación

**Endpoint:** `POST /auth/forgot-password`

**Request Body:**
```json
{
  "email": "usuario@ejemplo.com"
}
```

**Validaciones:**
- `email`: Requerido, debe ser un email válido

**Response Exitoso (200):**
```json
{
  "success": true,
  "message": "Si el correo existe, recibirás instrucciones para restablecer tu contraseña"
}
```

**⚠️ Importante:** Por seguridad, el backend siempre devuelve el mismo mensaje, exista o no el email. El código se envía por correo electrónico.

**Formato del Código:**
- **6 dígitos numéricos** (ejemplo: `123456`)
- **Válido por 15 minutos**
- Se envía al correo electrónico del usuario

**Errores:**

**400 - Validación:**
```json
{
  "success": false,
  "message": "El email es obligatorio.",
  "field": "email"
}
```

**403 - Usuario Protegido:**
```json
{
  "success": false,
  "message": "No se puede recuperar la contraseña del usuario por defecto del sistema. Contacte al administrador."
}
```

---

### Paso 2: Verificar Código

**Endpoint:** `POST /auth/verify-reset-token`

**Request Body:**
```json
{
  "token": "123456"
}
```

**Validaciones:**
- `token`: Requerido, debe ser exactamente 6 dígitos numéricos

**Response Exitoso (200):**
```json
{
  "success": true,
  "data": {
    "email": "usuario@ejemplo.com",
    "tokenId": 5
  },
  "message": "Código verificado exitosamente"
}
```

**Errores:**

**400 - Validación:**
```json
{
  "success": false,
  "message": "El código debe tener 6 dígitos.",
  "field": "token"
}
```

**400 - Código Inválido:**
```json
{
  "success": false,
  "message": "Código inválido o expirado"
}
```

---

### Paso 3: Restablecer Contraseña

**Endpoint:** `POST /auth/reset-password`

**Request Body:**
```json
{
  "token": "123456",
  "newPassword": "nuevaContraseña123"
}
```

**Validaciones:**
- `token`: Requerido, 6 dígitos numéricos
- `newPassword`: Requerido, mínimo 6 caracteres

**Response Exitoso (200):**
```json
{
  "success": true,
  "message": "Contraseña restablecida exitosamente"
}
```

**Errores:**

**400 - Validación:**
```json
{
  "success": false,
  "message": "La nueva contraseña debe tener al menos 6 caracteres."
}
```

**400 - Código Inválido:**
```json
{
  "success": false,
  "message": "Código inválido o expirado"
}
```

**403 - Usuario Protegido:**
```json
{
  "success": false,
  "message": "No se puede restablecer la contraseña del usuario por defecto del sistema"
}
```

---

## 🔄 Cambiar Contraseña (Usuario Autenticado)

**Endpoint:** `POST /auth/change-password`

**Headers:**
```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Request Body:**
```json
{
  "currentPassword": "contraseñaActual123",
  "newPassword": "nuevaContraseña456"
}
```

**Validaciones:**
- `currentPassword`: Requerido
- `newPassword`: Requerido, mínimo 6 caracteres, debe contener:
  - Al menos 1 letra minúscula
  - Al menos 1 letra mayúscula
  - Al menos 1 número

**Response Exitoso (200):**
```json
{
  "success": true,
  "message": "Contraseña cambiada exitosamente"
}
```

**Errores:**

**400 - Validación:**
```json
{
  "success": false,
  "message": "La nueva contraseña debe contener al menos: 1 minúscula, 1 mayúscula y 1 número.",
  "field": "newPassword"
}
```

**401 - Contraseña Incorrecta:**
```json
{
  "success": false,
  "message": "Contraseña actual incorrecta"
}
```

**403 - Usuario Protegido:**
```json
{
  "success": false,
  "message": "No se puede cambiar la contraseña del usuario por defecto del sistema"
}
```

---

## 📧 Cambio de Email (2 Pasos)

### Paso 1: Solicitar Cambio de Email

**Endpoint:** `POST /auth/request-email-change`

**Headers:**
```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Request Body:**
```json
{
  "newEmail": "nuevo@ejemplo.com"
}
```

**Response Exitoso (200):**
```json
{
  "success": true,
  "message": "Código de verificación enviado al nuevo correo electrónico"
}
```

**Formato del Código:**
- **6 dígitos numéricos**
- **Válido por 15 minutos**
- Se envía al **nuevo** correo electrónico

**Errores:**

**400 - Email Igual:**
```json
{
  "success": false,
  "message": "El nuevo correo es igual al actual"
}
```

**400 - Email en Uso:**
```json
{
  "success": false,
  "message": "El correo electrónico ya está en uso"
}
```

---

### Paso 2: Verificar y Actualizar Email

**Endpoint:** `POST /auth/verify-email-change`

**Headers:**
```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Request Body:**
```json
{
  "token": "123456"
}
```

**Response Exitoso (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "Juan",
    "email": "nuevo@ejemplo.com",
    ...
  },
  "message": "Correo electrónico actualizado exitosamente"
}
```

**Errores:**

**400 - Código Inválido:**
```json
{
  "success": false,
  "message": "Código inválido o expirado"
}
```

---

## 👤 Actualizar Perfil

**Endpoint:** `PUT /auth/profile`

**Headers:**
```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Request Body:**
```json
{
  "phoneNumber": "3001234567",
  "address": "Nueva Calle 456"
}
```

**Nota:** Solo se pueden actualizar `phoneNumber` y `address`. Para cambiar el email, usar el flujo de cambio de email.

**Response Exitoso (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "Juan",
    "phoneNumber": "3001234567",
    "address": "Nueva Calle 456",
    ...
  },
  "message": "Perfil actualizado exitosamente"
}
```

---

## 🎯 Flujo Recomendado para App Móvil

### Flujo de Recuperación de Contraseña:

```
1. Usuario ingresa email
   ↓
2. POST /auth/forgot-password
   ↓
3. Mostrar pantalla de ingreso de código (6 dígitos)
   ↓
4. POST /auth/verify-reset-token
   ↓
5. Si es válido, mostrar pantalla de nueva contraseña
   ↓
6. POST /auth/reset-password
   ↓
7. Redirigir a login
```

### Manejo de Tokens:

1. **Access Token:**
   - Guardar en memoria (variable de estado)
   - Duración: 15 minutos
   - Usar en header `Authorization: Bearer {token}`

2. **Refresh Token:**
   - Viene en cookie HttpOnly
   - Duración: 7 días
   - Tu cliente HTTP debe manejar cookies automáticamente
   - Usar endpoint `/auth/refresh` cuando el access token expire

3. **Interceptor Recomendado:**
```dart
// Pseudo-código
if (response.statusCode == 401) {
  // Intentar refrescar token
  final newToken = await refreshToken();
  if (newToken != null) {
    // Reintentar request original
    return retry(originalRequest);
  } else {
    // Redirigir a login
    navigateToLogin();
  }
}
```

---

## 🔒 Seguridad

### Protecciones Implementadas:

1. **Usuario por Defecto:** El usuario `astrostar.java@gmail.com` no puede:
   - Cambiar contraseña
   - Recuperar contraseña
   - Ser modificado

2. **Tokens de Recuperación:**
   - Expiran en 15 minutos
   - Solo se pueden usar una vez
   - Se eliminan automáticamente los tokens antiguos

3. **Refresh Tokens:**
   - Almacenados en base de datos
   - Se invalidan al hacer logout
   - Expiran en 7 días

4. **Validaciones:**
   - Emails siempre en minúsculas
   - Contraseñas hasheadas con bcrypt
   - Validación de formato en todos los endpoints

---

## 📱 Consideraciones para Flutter

### 1. Manejo de Cookies:

Usa el paquete `dio` con `cookie_jar`:

```dart
import 'package:dio/dio.dart';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';

final dio = Dio();
final cookieJar = CookieJar();
dio.interceptors.add(CookieManager(cookieJar));
```

### 2. Validación de Códigos:

```dart
// Validar que sea exactamente 6 dígitos
bool isValidCode(String code) {
  return RegExp(r'^\d{6}$').hasMatch(code);
}
```

### 3. Manejo de Errores:

```dart
try {
  final response = await dio.post('/auth/forgot-password', data: {...});
  // Manejar éxito
} on DioException catch (e) {
  if (e.response?.statusCode == 400) {
    // Mostrar mensaje de validación
    final message = e.response?.data['message'];
  } else if (e.response?.statusCode == 401) {
    // Credenciales inválidas
  }
}
```

---

## 🧪 Testing

### Endpoints para Probar:

1. **Login:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ejemplo.com","password":"password123"}'
```

2. **Forgot Password:**
```bash
curl -X POST http://localhost:4000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ejemplo.com"}'
```

3. **Verify Token:**
```bash
curl -X POST http://localhost:4000/api/auth/verify-reset-token \
  -H "Content-Type: application/json" \
  -d '{"token":"123456"}'
```

4. **Reset Password:**
```bash
curl -X POST http://localhost:4000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"123456","newPassword":"newPass123"}'
```

---

## 📝 Notas Adicionales

1. **Formato de Fechas:** Todas las fechas están en formato ISO 8601 (UTC)

2. **Códigos de Estado HTTP:**
   - `200`: Éxito
   - `400`: Error de validación o datos incorrectos
   - `401`: No autorizado (credenciales inválidas o token expirado)
   - `403`: Prohibido (usuario protegido)
   - `404`: No encontrado
   - `500`: Error interno del servidor

3. **Estructura de Respuesta:** Todas las respuestas tienen la estructura:
```json
{
  "success": boolean,
  "data": object (opcional),
  "message": string
}
```

4. **Email Service:** El backend usa Gmail SMTP. Si no está configurado, simula el envío pero devuelve éxito.

---

## ✅ Checklist de Implementación

- [ ] Implementar servicio de autenticación en Flutter
- [ ] Configurar manejo de cookies (dio + cookie_jar)
- [ ] Implementar interceptor para refresh token
- [ ] Crear pantallas:
  - [ ] Login
  - [ ] Forgot Password (ingreso de email)
  - [ ] Verify Code (ingreso de código de 6 dígitos)
  - [ ] Reset Password (nueva contraseña)
- [ ] Implementar validaciones de formularios
- [ ] Manejar errores y mostrar mensajes apropiados
- [ ] Implementar almacenamiento seguro de tokens
- [ ] Probar flujo completo de recuperación
- [ ] Implementar logout y logout-all
- [ ] Probar refresh token automático

---

**Última actualización:** Diciembre 2024  
**Versión del Backend:** 1.0  
**Contacto:** astrostar.java@gmail.com

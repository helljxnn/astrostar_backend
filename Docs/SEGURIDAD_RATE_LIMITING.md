# 🔒 Sistema de Rate Limiting y Seguridad - AstroStar

## 📋 Resumen

Sistema de protección contra ataques de fuerza bruta y abuso en recuperación de contraseñas y verificación de emails.

---

## 🛡️ Medidas de Seguridad Implementadas

### 1. Rate Limiting por Email

**Recuperación de Contraseña**:

- ✅ Máximo 3 intentos por hora por email
- ✅ Bloqueo de 60 minutos después de exceder el límite
- ✅ Contador se reinicia después del período de bloqueo

**Verificación de Email**:

- ✅ Máximo 5 intentos por hora por email
- ✅ Bloqueo de 30 minutos después de exceder el límite

### 2. Rate Limiting por IP

**Recuperación de Contraseña**:

- ✅ Máximo 5 intentos por hora por dirección IP
- ✅ Bloqueo de 60 minutos después de exceder el límite
- ✅ Protege contra ataques distribuidos desde una misma ubicación

**Verificación de Email**:

- ✅ Máximo 10 intentos por hora por IP
- ✅ Bloqueo de 30 minutos después de exceder el límite

### 3. Límite de Intentos de Verificación de Token

- ✅ Máximo 5 intentos para verificar un código de 6 dígitos
- ✅ Después de 5 intentos fallidos, el código se invalida
- ✅ El usuario debe solicitar un nuevo código

### 4. Tracking de Intentos

- ✅ Registro de cada intento (exitoso o fallido)
- ✅ Almacenamiento de IP, User Agent y timestamp
- ✅ Permite auditoría y detección de patrones sospechosos

### 5. Limpieza Automática

- ✅ Job automático que se ejecuta diariamente a las 3:00 AM
- ✅ Elimina registros de intentos mayores a 7 días
- ✅ Mantiene la base de datos optimizada

---

## 📊 Configuración de Límites

### Archivo: `src/services/rateLimitService.js`

```javascript
config = {
  passwordReset: {
    maxAttemptsPerEmail: 3, // Máximo 3 intentos por email por hora
    maxAttemptsPerIP: 5, // Máximo 5 intentos por IP por hora
    windowMinutes: 60, // Ventana de tiempo: 1 hora
    blockDurationMinutes: 60, // Duración del bloqueo: 1 hora
  },
  emailVerification: {
    maxAttemptsPerEmail: 5, // Máximo 5 intentos por email por hora
    maxAttemptsPerIP: 10, // Máximo 10 intentos por IP por hora
    windowMinutes: 60, // Ventana de tiempo: 1 hora
    blockDurationMinutes: 30, // Duración del bloqueo: 30 minutos
  },
  tokenVerification: {
    maxAttempts: 5, // Máximo 5 intentos de verificar un token
    blockDurationMinutes: 15, // Bloqueo de 15 minutos después de 5 intentos fallidos
  },
};
```

---

## 🗄️ Estructura de Base de Datos

### Tabla: `password_reset_attempts`

```sql
CREATE TABLE "password_reset_attempts" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR(255) NOT NULL,
  "ip_address" VARCHAR(45) NOT NULL,
  "user_agent" TEXT,
  "success" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "blocked_until" TIMESTAMP(3)
);
```

**Índices**:

- `email` - Para búsquedas rápidas por email
- `ip_address` - Para búsquedas rápidas por IP
- `created_at` - Para filtrar por ventana de tiempo
- `blocked_until` - Para verificar bloqueos activos

### Tabla: `email_verification_attempts`

Similar a `password_reset_attempts`, para tracking de verificación de emails.

### Campos Adicionales en Tokens

**`password_reset_tokens`**:

- `ip_address` - IP desde donde se solicitó el token
- `user_agent` - Navegador/dispositivo del usuario
- `attempts` - Contador de intentos de verificación

**`email_verification_tokens`**:

- `ip_address` - IP desde donde se solicitó el token
- `user_agent` - Navegador/dispositivo del usuario
- `attempts` - Contador de intentos de verificación

---

## 🔄 Flujo de Recuperación de Contraseña con Rate Limiting

### 1. Solicitar Recuperación

```
Usuario solicita recuperación
         ↓
Verificar rate limit por email
         ↓
¿Excede límite? → SÍ → Bloquear 60 min
         ↓ NO
Verificar rate limit por IP
         ↓
¿Excede límite? → SÍ → Bloquear 60 min
         ↓ NO
Generar código de 6 dígitos
         ↓
Guardar token con IP y User Agent
         ↓
Enviar email
         ↓
Registrar intento exitoso
```

### 2. Verificar Código

```
Usuario ingresa código
         ↓
Buscar token válido
         ↓
¿Existe? → NO → Incrementar intentos fallidos
         ↓ SÍ
Verificar intentos de verificación
         ↓
¿Excede 5 intentos? → SÍ → Invalidar token
         ↓ NO
Verificar código
         ↓
¿Correcto? → NO → Incrementar intentos
         ↓ SÍ
Permitir cambio de contraseña
```

---

## 📝 Mensajes de Error

### Bloqueo por Email

```json
{
  "success": false,
  "statusCode": 429,
  "message": "Has excedido el límite de 3 intentos por hora. Por favor espera 60 minutos.",
  "reason": "email_limit_exceeded",
  "attemptsUsed": 3,
  "maxAttempts": 3,
  "blockedUntil": "2026-03-01T15:30:00.000Z"
}
```

### Bloqueo por IP

```json
{
  "success": false,
  "statusCode": 429,
  "message": "Demasiados intentos desde esta ubicación. Por favor espera 60 minutos.",
  "reason": "ip_limit_exceeded",
  "attemptsUsed": 5,
  "maxAttempts": 5,
  "blockedUntil": "2026-03-01T15:30:00.000Z"
}
```

### Bloqueo Activo

```json
{
  "success": false,
  "statusCode": 429,
  "message": "Demasiados intentos. Por favor espera 45 minuto(s) antes de intentar nuevamente.",
  "reason": "blocked",
  "blockedUntil": "2026-03-01T15:30:00.000Z",
  "minutesRemaining": 45
}
```

### Máximo de Intentos de Verificación

```json
{
  "success": false,
  "statusCode": 429,
  "message": "Has excedido el número máximo de intentos para verificar este código. Por favor solicita uno nuevo.",
  "reason": "max_attempts_exceeded",
  "attemptsUsed": 5,
  "maxAttempts": 5
}
```

---

## 🔧 API del Servicio de Rate Limiting

### Verificar Rate Limit para Recuperación de Contraseña

```javascript
import rateLimitService from "../services/rateLimitService.js";

const check = await rateLimitService.checkPasswordResetRateLimit(
  email,
  ipAddress,
);

if (!check.allowed) {
  // Bloquear solicitud
  return res.status(429).json({
    message: check.message,
    reason: check.reason,
  });
}

// Continuar con el proceso
```

### Registrar Intento

```javascript
await rateLimitService.recordPasswordResetAttempt(
  email,
  ipAddress,
  userAgent,
  success, // true si fue exitoso, false si falló
);
```

### Verificar Intentos de Token

```javascript
const check = await rateLimitService.checkTokenVerificationAttempts(
  tokenId,
  "password_reset", // o 'email_verification'
);

if (!check.allowed) {
  // Token bloqueado por demasiados intentos
}
```

### Incrementar Intentos de Token

```javascript
await rateLimitService.incrementTokenAttempts(
  tokenId,
  "password_reset", // o 'email_verification'
);
```

---

## 🧹 Limpieza Automática

### Job Programado

**Archivo**: `src/jobs/rateLimitCleanupJob.js`

**Frecuencia**: Diario a las 3:00 AM (hora de Colombia)

**Función**:

- Elimina registros de intentos mayores a 7 días
- Mantiene la base de datos optimizada
- Registra estadísticas de limpieza

### Ejecutar Manualmente

```javascript
import { cleanupOldAttempts } from "./src/jobs/rateLimitCleanupJob.js";

await cleanupOldAttempts();
```

---

## 📈 Monitoreo y Auditoría

### Consultar Intentos Recientes

```sql
-- Intentos de recuperación de contraseña en la última hora
SELECT email, ip_address, success, created_at
FROM password_reset_attempts
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Detectar Patrones Sospechosos

```sql
-- IPs con más intentos fallidos
SELECT ip_address, COUNT(*) as attempts
FROM password_reset_attempts
WHERE success = false
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY ip_address
HAVING COUNT(*) > 10
ORDER BY attempts DESC;
```

### Emails Más Atacados

```sql
-- Emails con más intentos de recuperación
SELECT email, COUNT(*) as attempts
FROM password_reset_attempts
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY email
HAVING COUNT(*) > 5
ORDER BY attempts DESC;
```

---

## 🚀 Migración

### Aplicar Migración

```bash
# Generar cliente de Prisma con nuevos modelos
npx prisma generate

# Aplicar migración a la base de datos
npx prisma migrate deploy
```

### Verificar Migración

```bash
# Ver estado de migraciones
npx prisma migrate status

# Ver tablas creadas
psql -d astrostar_db -c "\dt password_reset_attempts"
psql -d astrostar_db -c "\dt email_verification_attempts"
```

---

## ⚙️ Configuración Recomendada

### Producción

```javascript
config = {
  passwordReset: {
    maxAttemptsPerEmail: 3,
    maxAttemptsPerIP: 5,
    windowMinutes: 60,
    blockDurationMinutes: 60,
  },
  tokenVerification: {
    maxAttempts: 5,
  },
};
```

### Desarrollo (más permisivo)

```javascript
config = {
  passwordReset: {
    maxAttemptsPerEmail: 10,
    maxAttemptsPerIP: 20,
    windowMinutes: 60,
    blockDurationMinutes: 15,
  },
  tokenVerification: {
    maxAttempts: 10,
  },
};
```

---

## 🔐 Mejores Prácticas Implementadas

1. ✅ **Rate Limiting Dual**: Por email Y por IP
2. ✅ **Ventanas de Tiempo**: Límites por hora, no acumulativos
3. ✅ **Bloqueos Temporales**: No permanentes, se levantan automáticamente
4. ✅ **Tracking Completo**: IP, User Agent, timestamp
5. ✅ **Mensajes Genéricos**: No revelar si el email existe
6. ✅ **Códigos de Corta Duración**: 15 minutos de expiración
7. ✅ **Límite de Intentos por Token**: Máximo 5 intentos
8. ✅ **Limpieza Automática**: Elimina datos antiguos
9. ✅ **Auditoría**: Todos los intentos quedan registrados
10. ✅ **Protección del Usuario Admin**: No permite recuperación

---

## 📊 Estadísticas de Seguridad

El sistema registra:

- Total de intentos de recuperación
- Intentos exitosos vs fallidos
- IPs bloqueadas
- Emails bloqueados
- Patrones de ataque detectados

---

## ✅ Checklist de Seguridad

- [x] Rate limiting por email implementado
- [x] Rate limiting por IP implementado
- [x] Límite de intentos de verificación de token
- [x] Tracking de intentos con IP y User Agent
- [x] Bloqueos temporales automáticos
- [x] Limpieza automática de datos antiguos
- [x] Mensajes de error informativos pero seguros
- [x] Protección del usuario administrador
- [x] Códigos de corta duración (15 minutos)
- [x] Job de limpieza programado
- [x] Índices de base de datos para performance
- [x] Auditoría completa de intentos

---

**Última Actualización**: ${new Date().toLocaleDateString('es-CO')}  
**Estado**: ✅ IMPLEMENTADO Y ACTIVO

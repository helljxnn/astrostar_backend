# Sistema de Rate Limiting Híbrido - AstroStar

## 📋 Descripción General

El sistema de rate limiting híbrido implementa una estrategia de seguridad de dos niveles que protege contra ataques de fuerza bruta mientras mantiene una buena experiencia de usuario para usuarios legítimos en redes compartidas.

## 🎯 Objetivos

1. **Proteger cuentas individuales**: Limitar intentos por email específico
2. **Detectar atacantes**: Identificar comportamiento sospechoso (múltiples emails desde una IP)
3. **No afectar usuarios legítimos**: Permitir que diferentes usuarios en la misma red (oficina, café, universidad) puedan usar el sistema
4. **Prevenir ataques distribuidos**: Mantener límite total por IP

## ⚙️ Configuración

```javascript
config = {
  passwordReset: {
    maxAttemptsPerEmail: 3, // Máximo 3 intentos por email por hora
    maxAttemptsPerIP: 15, // Máximo 15 intentos totales por IP por hora
    maxDifferentEmailsPerIP: 5, // Máximo 5 emails diferentes desde una IP
    windowMinutes: 60, // Ventana de tiempo: 1 hora
    blockDurationMinutes: 60, // Duración del bloqueo: 1 hora
  },
};
```

## 🔒 Niveles de Protección

### Nivel 1: Protección por Email (Estricto)

- **Límite**: 3 intentos por hora por email
- **Bloqueo**: Solo el email específico
- **Duración**: 60 minutos
- **Mensaje**: "Has excedido el límite de 3 intentos por hora para este correo"

**Ejemplo**: Si `usuario1@example.com` intenta 3 veces, solo ese email queda bloqueado. `usuario2@example.com` desde la misma IP puede seguir intentando.

### Nivel 2: Detección de Actividad Sospechosa (Inteligente)

- **Límite**: 5 emails diferentes desde la misma IP
- **Bloqueo**: La IP completa
- **Duración**: 60 minutos
- **Mensaje**: "Actividad sospechosa detectada"

**Ejemplo**: Si desde una IP se intentan recuperar contraseñas de 5 emails diferentes en poco tiempo, se bloquea la IP completa (comportamiento de atacante).

### Nivel 3: Protección por IP Total (Permisivo)

- **Límite**: 15 intentos totales por IP
- **Bloqueo**: La IP completa
- **Duración**: 60 minutos
- **Mensaje**: "Demasiados intentos desde esta ubicación"

**Ejemplo**: Si desde una IP se hacen 15 intentos totales (aunque sean emails diferentes), se bloquea la IP.

## 🔄 Flujo de Validación

```
1. ¿El EMAIL está bloqueado?
   ├─ SÍ → Rechazar (mensaje específico del email)
   └─ NO → Continuar

2. ¿La IP está bloqueada por actividad sospechosa?
   ├─ SÍ → Rechazar (mensaje de actividad sospechosa)
   └─ NO → Continuar

3. ¿El email ha excedido 3 intentos?
   ├─ SÍ → Bloquear EMAIL y rechazar
   └─ NO → Continuar

4. ¿La IP ha excedido 15 intentos totales?
   ├─ SÍ → Bloquear IP y rechazar
   └─ NO → Continuar

5. ¿Se han intentado 5+ emails diferentes desde la IP?
   ├─ SÍ → Bloquear IP (actividad sospechosa) y rechazar
   └─ NO → PERMITIR
```

## 📊 Casos de Uso

### Caso 1: Usuario Legítimo Olvidó su Contraseña

```
Usuario: juan@example.com
IP: 192.168.1.100

Intento 1: ✅ Permitido (2 restantes)
Intento 2: ✅ Permitido (1 restante)
Intento 3: ✅ Permitido (0 restantes)
Intento 4: ❌ Bloqueado por 60 minutos

Otro usuario (maria@example.com) desde la misma IP: ✅ Puede intentar
```

### Caso 2: Oficina con Múltiples Usuarios

```
IP: 192.168.1.100 (oficina)

Usuario 1 (juan@example.com): 3 intentos → Bloqueado
Usuario 2 (maria@example.com): 3 intentos → Bloqueado
Usuario 3 (pedro@example.com): 3 intentos → Bloqueado
Usuario 4 (ana@example.com): 3 intentos → Bloqueado
Usuario 5 (luis@example.com): 3 intentos → Bloqueado

Total: 15 intentos desde la IP
Usuario 6: ❌ Bloqueado (límite de IP alcanzado)
```

### Caso 3: Atacante Intentando Múltiples Cuentas

```
IP: 203.0.113.50 (atacante)

Intento 1: victim1@example.com → ✅ Permitido
Intento 2: victim2@example.com → ✅ Permitido
Intento 3: victim3@example.com → ✅ Permitido
Intento 4: victim4@example.com → ✅ Permitido
Intento 5: victim5@example.com → ✅ Permitido
Intento 6: victim6@example.com → ❌ Bloqueado (actividad sospechosa)

Razón: 5+ emails diferentes desde la misma IP = comportamiento de atacante
```

## 🧪 Pruebas

Ejecutar el script de prueba:

```bash
node src/scripts/test-rate-limiting.js
```

El script verifica:

1. ✅ Rate limiting por email funciona
2. ✅ Otros emails desde la misma IP pueden intentar
3. ✅ Detección de actividad sospechosa funciona
4. ✅ Rate limiting por IP total funciona
5. ✅ Sistema de bloqueo funciona
6. ✅ Validación de tokens funciona

## 🔧 Mantenimiento

### Limpieza Automática

El sistema ejecuta un job diario (3:00 AM) que elimina registros antiguos (>7 días):

```javascript
// src/jobs/rateLimitCleanupJob.js
cron.schedule("0 3 * * *", cleanupOldAttempts);
```

### Limpieza Manual

```sql
-- Limpiar intentos de recuperación de contraseña
DELETE FROM password_reset_attempts
WHERE created_at < NOW() - INTERVAL '7 days';

-- Limpiar intentos de verificación de email
DELETE FROM email_verification_attempts
WHERE created_at < NOW() - INTERVAL '7 days';
```

## 📈 Monitoreo

### Logs de Seguridad

El sistema registra:

- Bloqueos por email
- Bloqueos por IP
- Detección de actividad sospechosa
- Intentos exitosos y fallidos

### Consultas Útiles

```sql
-- Ver intentos recientes por IP
SELECT ip_address, COUNT(*) as attempts,
       COUNT(DISTINCT email) as different_emails
FROM password_reset_attempts
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
ORDER BY attempts DESC;

-- Ver emails bloqueados actualmente
SELECT email, blocked_until,
       EXTRACT(MINUTE FROM (blocked_until - NOW())) as minutes_remaining
FROM password_reset_attempts
WHERE blocked_until > NOW()
ORDER BY blocked_until DESC;

-- Ver IPs sospechosas (múltiples emails)
SELECT ip_address, COUNT(DISTINCT email) as different_emails,
       COUNT(*) as total_attempts
FROM password_reset_attempts
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(DISTINCT email) >= 5
ORDER BY different_emails DESC;
```

## 🎨 Mensajes de Usuario

### Email Bloqueado

```
"Has excedido el límite de 3 intentos por hora para este correo.
Por favor espera X minuto(s) antes de intentar nuevamente."
```

### IP Bloqueada (Actividad Sospechosa)

```
"Actividad sospechosa detectada. Por favor espera X minuto(s)
antes de intentar nuevamente o contacta al administrador."
```

### IP Bloqueada (Límite Total)

```
"Demasiados intentos desde esta ubicación.
Por favor espera X minuto(s) antes de intentar nuevamente."
```

## 🔐 Ventajas de Seguridad

1. **Protege cuentas individuales**: Cada email tiene su propio límite
2. **Detecta atacantes**: Identifica patrones de ataque (múltiples emails)
3. **Previene ataques distribuidos**: Límite total por IP
4. **No afecta usuarios legítimos**: Usuarios en redes compartidas no se bloquean entre sí
5. **Balance perfecto**: Seguridad sin sacrificar experiencia de usuario

## 📝 Notas Importantes

- Los bloqueos son temporales (60 minutos por defecto)
- Los intentos exitosos no cuentan para el límite
- El sistema distingue entre usuarios legítimos y atacantes
- Los registros se limpian automáticamente después de 7 días
- En desarrollo, los límites son más permisivos para facilitar pruebas

## 🚀 Mejoras Futuras

1. **Notificaciones**: Alertar al usuario por email cuando su cuenta es bloqueada
2. **Dashboard**: Panel de administración para ver intentos y bloqueos
3. **Whitelist**: Permitir IPs confiables sin límites
4. **Análisis de patrones**: Machine learning para detectar comportamientos anómalos
5. **Captcha**: Agregar captcha después de X intentos fallidos

# Cambios en el Sistema de Rate Limiting

## 🔄 Resumen de Cambios

Se implementó un sistema de rate limiting híbrido que mejora la seguridad sin afectar a usuarios legítimos en redes compartidas.

## ❌ Problema Anterior

### Sistema Antiguo (OR - Email O IP)

```javascript
// Bloqueaba si EMAIL o IP estaban bloqueados
OR: [{ email }, { ipAddress }];
```

**Problema**: Si un usuario excedía el límite, TODOS los usuarios desde la misma IP quedaban bloqueados.

### Escenario Problemático

```
Oficina con IP: 192.168.1.100

Usuario A (juan@example.com):
- Intento 1: ✅ Permitido
- Intento 2: ✅ Permitido
- Intento 3: ✅ Permitido
- Intento 4: ❌ Bloqueado (email bloqueado)

Usuario B (maria@example.com) desde la misma IP:
- Intento 1: ❌ BLOQUEADO ← PROBLEMA!
  Mensaje: "Demasiados intentos. Por favor espera..."
```

**Resultado**: Usuario B no puede usar el sistema aunque no haya hecho nada malo.

## ✅ Solución Implementada

### Sistema Nuevo (Híbrido - Tres Niveles)

#### Nivel 1: Bloqueo por Email (Estricto)

```javascript
// Solo bloquea el email específico
email: email.toLowerCase();
```

#### Nivel 2: Detección de Actividad Sospechosa

```javascript
// Bloquea IP si se intentan 5+ emails diferentes
maxDifferentEmailsPerIP: 5;
```

#### Nivel 3: Límite Total por IP (Permisivo)

```javascript
// Bloquea IP después de 15 intentos totales
maxAttemptsPerIP: 15; // Antes era 5
```

### Escenario Mejorado

```
Oficina con IP: 192.168.1.100

Usuario A (juan@example.com):
- Intento 1: ✅ Permitido (2 restantes para este email)
- Intento 2: ✅ Permitido (1 restante para este email)
- Intento 3: ✅ Permitido (0 restantes para este email)
- Intento 4: ❌ Bloqueado (solo juan@example.com)

Usuario B (maria@example.com) desde la misma IP:
- Intento 1: ✅ PERMITIDO ← SOLUCIONADO!
- Intento 2: ✅ Permitido
- Intento 3: ✅ Permitido
- Intento 4: ❌ Bloqueado (solo maria@example.com)

Usuario C, D, E... pueden seguir intentando con sus emails
```

## 📊 Comparación

| Aspecto                        | Sistema Anterior        | Sistema Nuevo                |
| ------------------------------ | ----------------------- | ---------------------------- |
| **Límite por email**           | 3 intentos/hora         | 3 intentos/hora              |
| **Límite por IP**              | 5 intentos/hora         | 15 intentos/hora             |
| **Bloqueo de email**           | Bloquea email + IP      | Solo bloquea email           |
| **Detección de atacantes**     | ❌ No                   | ✅ Sí (5+ emails diferentes) |
| **Usuarios en red compartida** | ❌ Se bloquean entre sí | ✅ Independientes            |
| **Protección contra ataques**  | ⚠️ Básica               | ✅ Avanzada                  |

## 🎯 Casos de Uso

### Caso 1: Oficina Corporativa

**Antes**:

- Usuario 1 excede límite → Todos bloqueados ❌

**Ahora**:

- Usuario 1 excede límite → Solo Usuario 1 bloqueado ✅
- Usuarios 2, 3, 4... pueden seguir usando el sistema ✅

### Caso 2: Café Público

**Antes**:

- 5 intentos totales desde la IP → Todos bloqueados ❌

**Ahora**:

- 15 intentos totales permitidos ✅
- Cada usuario tiene su propio límite de 3 ✅

### Caso 3: Atacante

**Antes**:

- Podía probar múltiples emails sin ser detectado ⚠️

**Ahora**:

- Después de 5 emails diferentes → IP bloqueada ✅
- Sistema detecta comportamiento sospechoso ✅

## 🔒 Mejoras de Seguridad

### 1. Protección Individual

```javascript
// Cada email tiene su propio límite
maxAttemptsPerEmail: 3;
```

✅ Protege cuentas individuales contra fuerza bruta

### 2. Detección Inteligente

```javascript
// Detecta atacantes probando múltiples cuentas
maxDifferentEmailsPerIP: 5;
```

✅ Identifica patrones de ataque distribuido

### 3. Límite Global Permisivo

```javascript
// Permite más intentos totales por IP
maxAttemptsPerIP: 15; // Antes: 5
```

✅ No afecta usuarios legítimos en redes compartidas

## 📝 Archivos Modificados

1. **src/services/rateLimitService.js**
   - Actualizada configuración
   - Reescrita función `checkPasswordResetRateLimit()`
   - Agregada detección de actividad sospechosa

2. **src/scripts/test-rate-limiting.js**
   - Agregados tests para múltiples emails
   - Agregados tests de actividad sospechosa
   - Mejorada documentación de resultados

3. **Docs/RATE_LIMITING_HIBRIDO.md** (NUEVO)
   - Documentación completa del sistema
   - Casos de uso y ejemplos
   - Guía de monitoreo y mantenimiento

4. **Docs/CAMBIOS_RATE_LIMITING.md** (NUEVO)
   - Este archivo con resumen de cambios

## 🧪 Cómo Probar

```bash
# Ejecutar script de prueba
cd astrostar_backend
node src/scripts/test-rate-limiting.js
```

El script verificará:

- ✅ Bloqueo por email funciona
- ✅ Otros emails pueden intentar desde la misma IP
- ✅ Detección de actividad sospechosa
- ✅ Límite total por IP
- ✅ Sistema de bloqueo temporal

## 🚀 Despliegue

No requiere cambios en la base de datos. Los cambios son solo en la lógica de validación.

### Pasos:

1. ✅ Código actualizado
2. ✅ Tests actualizados
3. ✅ Documentación creada
4. 🔄 Reiniciar servidor (aplicar cambios)

```bash
# Reiniciar servidor
pm2 restart astrostar-backend
# o
npm run dev
```

## 📈 Monitoreo Post-Despliegue

### Verificar que funciona correctamente:

```sql
-- Ver intentos recientes
SELECT email, ip_address, created_at, success
FROM password_reset_attempts
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 20;

-- Ver bloqueos activos
SELECT email, ip_address, blocked_until,
       EXTRACT(MINUTE FROM (blocked_until - NOW())) as minutes_remaining
FROM password_reset_attempts
WHERE blocked_until > NOW()
ORDER BY blocked_until DESC;
```

### Logs a revisar:

```bash
# Ver logs del servidor
pm2 logs astrostar-backend

# Buscar bloqueos
grep "bloqueado\|blocked" logs/combined-*.log
```

## ✅ Checklist de Validación

- [x] Código actualizado sin errores de sintaxis
- [x] Tests actualizados
- [x] Documentación completa
- [ ] Pruebas en desarrollo ejecutadas
- [ ] Servidor reiniciado
- [ ] Monitoreo de logs activo
- [ ] Validación con usuarios reales

## 🎉 Beneficios

1. **Mejor experiencia de usuario**: No se bloquean usuarios legítimos
2. **Mayor seguridad**: Detecta y bloquea atacantes
3. **Escalabilidad**: Funciona en oficinas y redes compartidas
4. **Mantenibilidad**: Código más claro y documentado
5. **Monitoreo**: Mejor visibilidad de intentos y bloqueos

## 📞 Soporte

Si encuentras algún problema:

1. Revisa los logs: `pm2 logs astrostar-backend`
2. Ejecuta el script de prueba: `node src/scripts/test-rate-limiting.js`
3. Consulta la documentación: `Docs/RATE_LIMITING_HIBRIDO.md`

# 🐛 Debug: Problema de Login con Credenciales

## Problema
Las credenciales enviadas por email no funcionan al intentar iniciar sesión.

## Credenciales recibidas
- Email: `andermc1030@gmail.com`
- Contraseña: `10181029202` (documento de identidad)

## Cambios realizados

### 1. Limpieza de datos al crear usuario
**Archivo:** `src/modules/Enrollments/services/enrollments.service.js`

- ✅ Email se guarda con `.trim().toLowerCase()`
- ✅ Identificación se guarda con `.trim()`
- ✅ Todos los campos de texto se limpian con `.trim()`

### 2. Logs agregados para debugging

#### En creación de usuario (Enrollments):
```
🔑 [ENROLLMENT] Contraseña temporal generada: 10181029202
🔒 [ENROLLMENT] Hash de contraseña generado: $2b$10$...
📧 [ENROLLMENT] Email limpio: andermc1030@gmail.com
👤 [ENROLLMENT] Datos del usuario a crear: {...}
✅ [ENROLLMENT] Usuario creado con ID: 123
✅ [ENROLLMENT] Email guardado en BD: andermc1030@gmail.com
📧 [ENROLLMENT] Enviando email de bienvenida a: andermc1030@gmail.com
🔑 [ENROLLMENT] Credenciales a enviar: { email: ..., password: ... }
✅ [ENROLLMENT] Email de bienvenida enviado exitosamente
```

#### En login (Auth):
```
🔍 [AUTH] Buscando usuario con email: andermc1030@gmail.com
✅ [AUTH] Usuario encontrado: { id: ..., email: ..., status: ..., roleId: ... }
🔑 [AUTH] Verificando contraseña...
🔑 [AUTH] Contraseña recibida: 10181029202
🔒 [AUTH] Hash almacenado: $2b$10$...
🔑 [AUTH] Contraseña válida: true/false
✅ [AUTH] Login exitoso para usuario: andermc1030@gmail.com
```

## Pasos para debuggear

### 1. Crear una nueva deportista
```bash
# Observa los logs en la consola del backend
# Deberías ver todos los logs con [ENROLLMENT]
```

### 2. Intentar iniciar sesión
```bash
# Observa los logs en la consola del backend
# Deberías ver todos los logs con [AUTH]
```

### 3. Verificar en la base de datos
```sql
-- Verificar que el usuario existe
SELECT 
  id, 
  email, 
  identification, 
  "firstName", 
  "lastName", 
  status, 
  "roleId",
  LENGTH("passwordHash") as hash_length
FROM users 
WHERE email = 'andermc1030@gmail.com';

-- Verificar el rol
SELECT r.id, r.name 
FROM roles r
JOIN users u ON u."roleId" = r.id
WHERE u.email = 'andermc1030@gmail.com';
```

### 4. Verificar el hash de la contraseña
```javascript
// En Node.js (puedes ejecutar esto en la consola del backend)
const bcrypt = require('bcrypt');

// Hashear la contraseña que estás intentando
const password = '10181029202';
const hash = await bcrypt.hash(password, 10);
console.log('Hash generado:', hash);

// Comparar con el hash almacenado (copia el hash de la BD)
const storedHash = '$2b$10$...'; // Copia el hash de la BD
const isValid = await bcrypt.compare(password, storedHash);
console.log('¿Es válida?:', isValid);
```

## Posibles causas del problema

### Causa 1: Email con espacios o mayúsculas
**Solución:** ✅ Ya implementada - Email se limpia con `.trim().toLowerCase()`

### Causa 2: Contraseña con espacios
**Solución:** ✅ Ya implementada - Identificación se limpia con `.trim()`

### Causa 3: Usuario inactivo
**Verificar:** El usuario debe tener `status = 'Active'`

### Causa 4: Rol incorrecto
**Verificar:** El usuario debe tener un rol válido (roleId debe existir en la tabla roles)

### Causa 5: Hash de contraseña incorrecto
**Verificar:** El hash debe empezar con `$2b$10$` (bcrypt con 10 rounds)

## Solución temporal

Si necesitas que funcione AHORA, puedes resetear la contraseña manualmente:

```javascript
// En Node.js
const bcrypt = require('bcrypt');
const password = '10181029202';
const hash = await bcrypt.hash(password, 10);
console.log('Nuevo hash:', hash);

// Luego en SQL
UPDATE users 
SET "passwordHash" = 'AQUI_VA_EL_HASH_GENERADO'
WHERE email = 'andermc1030@gmail.com';
```

## Próximos pasos

1. **Reinicia el servidor backend** para que los cambios surtan efecto
2. **Crea una nueva deportista** y observa los logs
3. **Intenta iniciar sesión** con las credenciales del email
4. **Comparte los logs** que aparecen en la consola del backend

## Estado
- ✅ Código actualizado con limpieza de datos
- ✅ Logs agregados para debugging
- ⏳ Esperando pruebas con nueva deportista

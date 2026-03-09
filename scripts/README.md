# 🛠️ Scripts de Base de Datos

## 🧹 Reset Completo de Base de Datos

### Comando Principal:
```bash
npm run db:reset
```

### ¿Qué hace este script?

1. **🧹 Limpia completamente la base de datos**
   - Elimina todos los datos existentes
   - Resetea todas las tablas
   - Limpia migraciones aplicadas

2. **🔧 Aplica migraciones**
   - Recrea todas las tablas
   - Aplica la estructura más reciente
   - Configura índices y relaciones

3. **🌱 Ejecuta seed básico**
   - Crea tipos de documento esenciales
   - Crea rol "Administrador"
   - Crea usuario administrador por defecto

4. **✅ Verifica configuración**
   - Confirma que los datos esenciales estén creados
   - Valida la integridad del sistema

### Credenciales por defecto:
- **Email:** `astrostar.java@gmail.com`
- **Contraseña:** `Admin123*`

## 🎯 Configuración de Roles

Después de ejecutar el script, el sistema estará configurado para:

- ✅ **Administradores:** Rol "Administrador" (español)
- ✅ **Deportistas:** Rol "Deportista" (español) - se crea automáticamente
- ✅ **Empleados:** Rol "Employee" (inglés) - se crea automáticamente

## 🚀 Uso Recomendado

### Para desarrollo:
```bash
# Limpiar y configurar desde cero
npm run db:reset

# Agregar datos de prueba (opcional)
npm run seed:complete
```

### Para producción:
```bash
# Solo ejecutar el seed básico (sin datos de prueba)
npm run seed
```

## ⚠️ Advertencias

- **Este script ELIMINA TODOS LOS DATOS** de la base de datos
- Úsalo solo cuando quieras empezar desde cero
- En producción, usa `npm run seed` en lugar de `npm run db:reset`

## 🔍 Verificación

Después de ejecutar el script, puedes verificar que todo esté correcto:

1. **Iniciar sesión** con las credenciales de administrador
2. **Crear una deportista** desde el frontend
3. **Verificar** que aparezca con rol "Deportista" en el perfil

## 📝 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run db:reset` | Limpia BD + migraciones + seed básico |
| `npm run seed` | Solo ejecuta seed básico |
| `npm run seed:complete` | Ejecuta seed con datos de prueba |
| `npm run prisma:studio` | Abre interfaz visual de BD |

## 🆘 Solución de Problemas

### Error de permisos:
```bash
# En Windows
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# En Linux/Mac
chmod +x scripts/reset-database.js
```

### Error de conexión a BD:
1. Verificar que la BD esté corriendo
2. Revisar variables de entorno en `.env`
3. Verificar credenciales de conexión
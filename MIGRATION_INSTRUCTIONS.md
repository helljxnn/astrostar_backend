# Instrucciones de Migración - Multi-Categorías en Eventos

## Cambios Realizados

Se ha implementado la funcionalidad de múltiples categorías para eventos. Los cambios incluyen:

### Backend:
1. **Schema de Prisma**: Se modificó el modelo `Service` para soportar múltiples categorías mediante una tabla intermedia `ServiceCategory`
2. **Repository**: Actualizado para manejar la relación many-to-many con categorías
3. **Service**: Actualizado para validar y procesar arrays de categorías
4. **Controller**: Sin cambios necesarios (maneja los datos automáticamente)

### Frontend:
1. **Componente CategoryMultiSelect**: Nuevo componente con diseño UX/UI moderno
2. **EventModal**: Actualizado para usar el multi-select
3. **useEvents hook**: Actualizado para transformar datos con múltiples categorías
4. **Validación**: Actualizada para validar arrays de categorías

## Pasos para Aplicar la Migración

### 1. Aplicar Cambios al Esquema

```bash
cd astrostar_backend

# Aplicar cambios directamente a la base de datos
npx prisma db push

# Generar el cliente de Prisma
npx prisma generate
```

**Nota:** Se usa `db push` en lugar de `migrate dev` para evitar conflictos con migraciones anteriores.

### 2. Asignar Categorías a Eventos Existentes

Ejecuta el script para asignar categorías por defecto a eventos existentes:

```bash
cd astrostar_backend
node scripts/migrateEventCategories.js
```

Este script:
- Lee todos los eventos existentes
- Asigna la primera categoría activa como categoría por defecto
- Respeta eventos que ya tienen categorías asignadas
- Muestra progreso detallado

**Importante:** Después de ejecutar el script, edita cada evento para asignar las categorías correctas según corresponda.

### 3. Verificar la Migración

```bash
# Verificar que la tabla ServiceCategory se creó
npx prisma studio

# O consultar directamente
psql -d tu_base_de_datos -c "SELECT * FROM \"ServiceCategory\" LIMIT 5;"
```

### 4. Eliminar Campo Antiguo (Opcional - Después de Verificar)

Una vez verificado que todo funciona correctamente, puedes eliminar el campo `categoryId` del modelo `Service`:

```prisma
model Service {
  // ... otros campos
  // categoryId       Int  // ❌ ELIMINAR ESTA LÍNEA
  // ... resto del modelo
}
```

Luego ejecutar:
```bash
npx prisma migrate dev --name remove_old_category_field
```

## Rollback (Si es Necesario)

Si necesitas revertir los cambios:

```bash
cd astrostar_backend

# Ver migraciones aplicadas
npx prisma migrate status

# Revertir última migración (cuidado: esto eliminará datos)
npx prisma migrate resolve --rolled-back <migration_name>
```

## Notas Importantes

- ⚠️ **Backup**: Asegúrate de tener un backup de la base de datos antes de ejecutar las migraciones
- ✅ **Pruebas**: Prueba en un ambiente de desarrollo primero
- 📝 **Datos**: El script de migración preserva las categorías existentes
- 🔄 **Compatibilidad**: El frontend ahora espera un array de IDs de categorías

## Verificación Post-Migración

1. Crear un nuevo evento con múltiples categorías
2. Editar un evento existente y agregar/quitar categorías
3. Verificar que los eventos se muestran correctamente en el calendario
4. Verificar que los filtros por categoría funcionan correctamente

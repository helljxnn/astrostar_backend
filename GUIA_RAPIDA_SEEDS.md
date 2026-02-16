# 🚀 Guía Rápida - Seeds de Datos

## Comandos Principales

### Configuración Inicial (Primera vez)

```bash
# 1. Ejecutar migraciones
npm run prisma:migrate

# 2. Generar cliente Prisma
npm run prisma:generate

# 3. Cargar datos maestros
npm run prisma:seed

# 4. Cargar datos de prueba
npm run seed:complete
```

### Comandos Útiles

#### Poblar datos de prueba

```bash
npm run seed:complete
```

#### Limpiar datos de prueba (mantiene datos maestros)

```bash
npm run seed:clean
```

#### Refrescar datos de prueba (limpiar + poblar)

```bash
npm run seed:refresh
```

#### Ver datos en interfaz gráfica

```bash
npm run prisma:studio
```

#### Resetear toda la base de datos

```bash
npm run prisma:reset
```

---

## 📊 Datos Creados

### Datos Maestros (seed.js)

- ✅ Tipos de documento
- ✅ Roles del sistema
- ✅ Usuario administrador
- ✅ Categorías de eventos
- ✅ Tipos de eventos
- ✅ Categorías deportivas (Infantil, PreJuvenil, Juvenil)

### Datos de Prueba (seed-complete.js)

- ✅ 5 Acudientes
- ✅ 3 Empleados
- ✅ 12 Deportistas (con inscripciones activas)
- ✅ 3 Equipos de fundación
- ✅ 3 Personas temporales
- ✅ 2 Equipos temporales
- ✅ 2 Eventos deportivos
- ✅ Inscripciones de equipos y deportistas a eventos

---

## 🔑 Credenciales de Acceso

### Administrador

- **Email:** astrostar.java@gmail.com
- **Contraseña:** Admin123\*

### Deportistas

Contraseña = Número de identificación

Ejemplos:

- Sofía Hernández: `1001001001`
- Mateo García: `1001001002`

### Empleados

- **Contraseña:** Employee123

---

## 🎯 Casos de Prueba

### Validación de Categorías en Eventos

#### ✅ Inscripciones Válidas

1. Inscribir "Astrostar Infantil" al "Torneo Infantil"
2. Inscribir deportista de categoría Infantil al "Torneo Infantil"
3. Inscribir "Astrostar PreJuvenil" al "Festival PreJuvenil-Juvenil"

#### ❌ Inscripciones Inválidas (deben fallar)

1. Inscribir "Astrostar Juvenil" al "Torneo Infantil"
2. Inscribir deportista sin inscripciones activas
3. Inscribir deportista de categoría Infantil al "Festival PreJuvenil-Juvenil"

---

## 📝 Eventos Creados

### 1. Torneo Infantil Astrostar 2024

- **Fecha:** 15 de diciembre de 2024
- **Categoría:** Infantil
- **Equipos inscritos:** 2
- **Deportistas inscritos:** 2

### 2. Festival Deportivo PreJuvenil-Juvenil

- **Fecha:** 20 de diciembre de 2024
- **Categorías:** PreJuvenil y Juvenil
- **Equipos inscritos:** 3

---

## 🛠️ Troubleshooting

### Error: "Unique constraint failed"

```bash
# Opción 1: Limpiar datos de prueba
npm run seed:clean

# Opción 2: Resetear todo
npm run prisma:reset
```

### Error: "Foreign key constraint failed"

```bash
# Ejecutar en orden correcto
npm run prisma:seed
npm run seed:complete
```

### Ver logs detallados

Los scripts muestran mensajes detallados de lo que están haciendo.

---

## 📚 Documentación Completa

Para más detalles, consulta:

- `prisma/README_SEEDS.md` - Documentación completa de seeds
- `Doc/VALIDACION_CATEGORIAS_EVENTOS.md` - Validación de categorías

---

## 💡 Tips

1. **Desarrollo:** Usa `seed:refresh` para tener datos frescos
2. **Testing:** Usa `seed:clean` antes de ejecutar tests
3. **Producción:** Solo ejecuta `prisma:seed` (datos maestros)
4. **Explorar datos:** Usa `prisma:studio` para ver la base de datos

---

## 🔄 Flujo de Trabajo Recomendado

```bash
# Día a día en desarrollo
npm run seed:refresh    # Refrescar datos de prueba
npm run dev            # Iniciar servidor

# Antes de hacer commit
npm run seed:clean     # Limpiar datos de prueba
# Ejecutar tests
# Hacer commit

# Después de pull
npm run prisma:generate  # Regenerar cliente si hay cambios en schema
npm run seed:refresh     # Refrescar datos
```

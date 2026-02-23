# Seeds de Datos para Astrostar

Este directorio contiene scripts de seed para poblar la base de datos con datos iniciales y de prueba.

## Seeds Disponibles

### 1. `seed.js` - Seed de Datos Maestros

**Propósito:** Carga los datos esenciales que el sistema necesita para funcionar.

**Incluye:**

- Tipos de documento (CC, TI, Pasaporte, etc.)
- Rol de Administrador con permisos completos
- Usuario administrador por defecto
- Usuario para aplicación móvil
- Categorías de eventos (Deportivo, Cultural, Recreativo, etc.)
- Tipos de eventos (Festival, Torneo, Clausura, Taller)
- Patrocinadores temporales
- Categorías deportivas (Infantil, PreJuvenil, Juvenil)

**Ejecución:**

```bash
npm run prisma:seed
```

**Credenciales creadas:**

- Email: `astrostar.java@gmail.com`
- Contraseña: `Admin123*`

- Email: `astrostarmovil@gmail.com`
- Contraseña: `Astrostar123!`

---

### 2. `seed-complete.js` - Seed Completo de Datos de Prueba

**Propósito:** Crea un conjunto completo de datos de prueba para desarrollo y testing.

**Incluye:**

- **5 Acudientes/Guardianes** con datos completos
- **3 Empleados** (entrenadores y coordinadores)
- **12 Deportistas** distribuidos en categorías:
  - 5 en categoría Infantil (10-12 años)
  - 4 en categoría PreJuvenil (13-15 años)
  - 3 en categoría Juvenil (16-18 años)
- **Inscripciones activas** de deportistas en categorías deportivas
- **Matrículas vigentes** para todos los deportistas
- **3 Equipos de la fundación** (uno por categoría)
- **Miembros asignados** a cada equipo
- **3 Personas temporales** (deportistas y entrenadores externos)
- **2 Equipos temporales** con miembros asignados
- **2 Eventos deportivos** con categorías configuradas:
  - Torneo Infantil (solo categoría Infantil)
  - Festival PreJuvenil-Juvenil (categorías PreJuvenil y Juvenil)
- **Inscripciones de equipos y deportistas** a los eventos

**Ejecución:**

```bash
npm run seed:complete
```

**Nota:** Este seed requiere que primero se ejecute `seed.js` para tener los datos maestros.

---

## Orden de Ejecución Recomendado

### Primera vez (base de datos nueva):

```bash
# 1. Ejecutar migraciones
npm run prisma:migrate

# 2. Generar cliente Prisma
npm run prisma:generate

# 3. Ejecutar seed de datos maestros
npm run prisma:seed

# 4. Ejecutar seed completo de prueba
npm run seed:complete
```

### Para resetear y volver a poblar:

```bash
# Resetear base de datos (elimina todos los datos)
npm run prisma:reset

# Ejecutar seed completo de prueba
npm run seed:complete
```

---

## Estructura de Datos Creados

### Deportistas por Categoría

#### Categoría Infantil (10-12 años)

- Sofía Hernández
- Mateo García
- Valentina Díaz
- Santiago Moreno
- Isabella Castro

#### Categoría PreJuvenil (13-15 años)

- Camila Vargas
- Andrés Ruiz
- Daniela Jiménez
- Sebastián Mendoza

#### Categoría Juvenil (16-18 años)

- Alejandro Ortiz
- Mariana Silva
- David Rojas

### Equipos de la Fundación

1. **Astrostar Infantil** (Categoría: Infantil)
   - Entrenador: Roberto Sánchez
   - Miembros: 3 deportistas de categoría Infantil

2. **Astrostar PreJuvenil** (Categoría: PreJuvenil)
   - Entrenadora: Diana Torres
   - Miembros: 3 deportistas de categoría PreJuvenil

3. **Astrostar Juvenil** (Categoría: Juvenil)
   - Entrenador: Miguel Ramírez
   - Miembros: 2 deportistas de categoría Juvenil

### Equipos Temporales

1. **Visitantes Infantil** (Categoría: Infantil)
   - Entrenador: Pedro Navarro
   - Miembros: 1 persona temporal

2. **Invitados PreJuvenil** (Categoría: PreJuvenil)
   - Entrenador: Coach Externo
   - Miembros: 1 persona temporal

### Eventos Creados

#### 1. Torneo Infantil Astrostar 2024

- **Fecha:** 15 de diciembre de 2024
- **Categoría permitida:** Infantil
- **Equipos inscritos:**
  - Astrostar Infantil (local)
  - Visitantes Infantil (visitante)
- **Deportistas inscritos:** 2 deportistas individuales

#### 2. Festival Deportivo PreJuvenil-Juvenil

- **Fecha:** 20 de diciembre de 2024
- **Categorías permitidas:** PreJuvenil y Juvenil
- **Equipos inscritos:**
  - Astrostar PreJuvenil
  - Astrostar Juvenil
  - Invitados PreJuvenil

---

## Validación de Categorías

Los eventos tienen validación de categorías implementada:

✅ **Permitido:**

- Inscribir equipo "Astrostar Infantil" al "Torneo Infantil" (categorías coinciden)
- Inscribir deportista con inscripción activa en "Infantil" al "Torneo Infantil"
- Inscribir equipo "Astrostar PreJuvenil" al "Festival PreJuvenil-Juvenil" (categoría incluida)

❌ **No permitido:**

- Inscribir equipo "Astrostar Juvenil" al "Torneo Infantil" (categoría no coincide)
- Inscribir deportista sin inscripciones activas a cualquier evento
- Inscribir deportista de categoría "Infantil" al "Festival PreJuvenil-Juvenil"

---

## Contraseñas de Prueba

### Deportistas

Todos los deportistas tienen como contraseña su número de identificación.

Ejemplos:

- Sofía Hernández: `1001001001`
- Mateo García: `1001001002`
- Camila Vargas: `1002002001`

### Empleados

Todos los empleados tienen la contraseña: `Employee123`

---

## Notas Importantes

1. **Datos de prueba:** Los datos creados por `seed-complete.js` son ficticios y están diseñados para desarrollo y testing.

2. **Relaciones:** Todos los deportistas menores de edad tienen un acudiente asignado.

3. **Inscripciones:** Todos los deportistas tienen:
   - Una matrícula vigente (válida por 1 año)
   - Una inscripción activa en su categoría deportiva correspondiente

4. **Equipos:** Los equipos tienen miembros asignados según su categoría.

5. **Eventos:** Los eventos tienen categorías deportivas configuradas y validaciones activas.

---

## Troubleshooting

### Error: "Unique constraint failed"

Si ves este error, significa que algunos datos ya existen. Puedes:

1. Resetear la base de datos: `npm run prisma:reset`
2. O eliminar manualmente los datos conflictivos

### Error: "Foreign key constraint failed"

Asegúrate de ejecutar primero `seed.js` antes de `seed-complete.js`:

```bash
npm run prisma:seed
npm run seed:complete
```

### Ver los datos creados

Usa Prisma Studio para explorar los datos:

```bash
npm run prisma:studio
```

---

## Personalización

Puedes modificar `seed-complete.js` para:

- Agregar más deportistas
- Crear más equipos
- Agregar más eventos
- Cambiar las categorías
- Ajustar las fechas de los eventos

Simplemente edita los arrays de datos en el archivo y vuelve a ejecutar el seed.

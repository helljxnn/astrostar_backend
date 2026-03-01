# 📊 Documentación del Sistema de Dashboard

## Tabla de Contenidos

- [Arquitectura General](#arquitectura-general)
- [Frontend](#frontend)
- [Backend](#backend)
- [Flujo de Datos](#flujo-de-datos)
- [Librerías Utilizadas](#librerías-utilizadas)
- [Características Destacadas](#características-destacadas)

---

## Arquitectura General

El dashboard está organizado en **secciones temáticas** con gráficas y estadísticas específicas:

1. **Resumen General** (Overview)
2. **Eventos**
3. **Deportistas**
4. **Servicios de Salud**
5. **Donaciones**

Cada sección consume datos del backend a través de servicios dedicados y los visualiza usando componentes reutilizables.

---

## Frontend

### Estructura de Componentes

```
DashboardGraphics/
├── Dashboard.jsx                    # Componente principal con tabs
├── sections/                        # Secciones por módulo
│   ├── OverviewSection.jsx         # Resumen general
│   ├── EventsSection.jsx           # Estadísticas de eventos
│   ├── AthletesSection.jsx         # Estadísticas de deportistas
│   ├── HealthSection.jsx           # Servicios de salud
│   └── DonationsSection.jsx        # Donaciones
├── components/                      # Componentes reutilizables
│   ├── KPICard.jsx                 # Tarjetas de métricas
│   ├── EventsGraphic.jsx           # Gráfica de barras
│   ├── AthletesTrackingGraphic.jsx # Gráfica de dona
│   ├── DonationsGraphic.jsx        # Gráfica de donaciones
│   └── TopDonorsGraphic.jsx        # Top donantes
└── services/                        # Llamadas al backend
```

### Componentes Clave

#### 1. Dashboard.jsx - Componente Principal

**Responsabilidades:**

- Gestiona el estado del tab activo
- Renderiza la navegación con tabs animados
- Muestra la sección correspondiente según el tab seleccionado

**Características:**

- Tabs con animaciones de Framer Motion
- Diseño responsive con scroll horizontal en móviles
- Gradientes y efectos visuales modernos
- Transiciones suaves entre secciones

```jsx
const tabs = [
  {
    id: "overview",
    label: "Resumen General",
    icon: FaChartLine,
    color: "purple",
  },
  { id: "events", label: "Eventos", icon: FaCalendarAlt, color: "blue" },
  { id: "athletes", label: "Deportistas", icon: FaRunning, color: "pink" },
  {
    id: "health",
    label: "Servicios de Salud",
    icon: FaHeartbeat,
    color: "green",
  },
  {
    id: "donations",
    label: "Donaciones",
    icon: FaHandHoldingHeart,
    color: "yellow",
  },
];
```

#### 2. KPICard.jsx - Tarjetas de Métricas

**Propósito:** Mostrar métricas individuales con diseño atractivo

**Props:**

- `title`: Título de la métrica
- `value`: Valor a mostrar
- `icon`: Componente de icono (React Icons)
- `color`: Color del tema (purple, blue, green, pink, yellow, red)
- `trend`: Dirección de la tendencia ("up" o "down")
- `trendValue`: Porcentaje de cambio

**Ejemplo de uso:**

```jsx
<KPICard
  title="Eventos Realizados"
  value="48"
  icon={FaCalendarAlt}
  color="blue"
  trend="up"
  trendValue="12%"
/>
```

**Características:**

- Animaciones con Framer Motion (hover, scale)
- Gradientes de fondo decorativos
- Indicadores de tendencia con colores (verde/rojo)
- Sombras dinámicas según el color

#### 3. EventsGraphic.jsx - Gráfica de Barras

**Propósito:** Visualizar eventos realizados por trimestre y año

**Tecnología:** Chart.js con react-chartjs-2 (componente `Bar`)

**Flujo de datos:**

1. `useEffect` ejecuta `fetchEventsData()` al montar el componente
2. Llama a `eventsService.getByQuarter()`
3. Recibe datos agrupados por trimestre y año
4. Transforma los datos al formato de Chart.js
5. Renderiza la gráfica de barras

**Estructura de datos recibidos:**

```json
[
  { "trimestre": "Trim 1", "año2026": 5, "año2025": 8, "año2024": 3 },
  { "trimestre": "Trim 2", "año2026": 7, "año2025": 6, "año2024": 4 },
  { "trimestre": "Trim 3", "año2026": 4, "año2025": 9, "año2024": 5 },
  { "trimestre": "Trim 4", "año2026": 6, "año2025": 7, "año2024": 6 }
]
```

**Características:**

- Colores diferenciados por año (celeste, morado, rosado)
- Responsive con diferentes tamaños según pantalla
- Loading state con spinner animado
- Botón de exportación a Excel/PDF con `ReportButton`
- Animaciones suaves al cargar (easeOutQuart)
- Tooltips personalizados con fondo oscuro

**Configuración de Chart.js:**

```javascript
const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "bottom" },
    tooltip: { backgroundColor: "#111827", cornerRadius: 8 },
  },
  scales: {
    y: { beginAtZero: true, stepSize: 5 },
    x: { grid: { display: false } },
  },
  animation: { duration: 1200, easing: "easeOutQuart" },
};
```

#### 4. AthletesTrackingGraphic.jsx - Gráfica de Dona

**Propósito:** Mostrar el estado de las inscripciones de deportistas

**Tecnología:** Chart.js con react-chartjs-2 (componente `Doughnut`)

**Datos visualizados:**

- Inscripciones vigentes
- Inscripciones suspendidas
- Inscripciones vencidas

**Características:**

- Centro hueco (cutout: 70%)
- Colores: morado (suspendidas), celeste (vigentes), amarillo (vencidas)
- Leyenda personalizada con porcentajes calculados dinámicamente
- Tooltips con información detallada
- Total calculado automáticamente

**Cálculo de porcentajes:**

```javascript
const total = vigentes + suspendidas + vencidas;
const porcentajeVigentes = ((vigentes / total) * 100).toFixed(0);
```

#### 5. EventsSection.jsx - Sección de Eventos

**Propósito:** Mostrar estadísticas completas del módulo de eventos

**Componentes incluidos:**

- 4 KPICards (Eventos Totales, Deportistas Inscritas, Equipos Inscritos, Eventos Próximos)
- EventsGraphic (gráfica principal)
- Panel de "Eventos por Estado" (Completados, En Curso, Programados)
- Panel de "Tipos de Eventos" con barras de progreso

**Flujo de datos:**

```javascript
useEffect(() => {
  fetchEventsStats(); // Llama a eventsService.getStats()
}, []);
```

**Estructura de estadísticas:**

```javascript
{
  total: 48,
  enrolledAthletes: 324,
  enrolledTeams: 15,
  upcoming: 12,
  byStatus: {
    completed: 30,
    inProgress: 6,
    scheduled: 6
  },
  byType: [
    { name: "Competencia", count: 20 },
    { name: "Entrenamiento", count: 15 },
    { name: "Recreativo", count: 13 }
  ],
  trends: {
    total: 12,
    enrolledAthletes: 8,
    enrolledTeams: 5
  }
}
```

---

## Backend

### Arquitectura de Capas

El backend sigue el patrón **Controlador → Servicio → Repositorio**:

```
Ruta (routes) → Controlador (controller) → Servicio (service) → Repositorio (repository) → Base de Datos
```

### Ejemplo: Eventos por Trimestre

#### 1. Ruta (`events.routes.js`)

```javascript
router.get("/by-quarter", eventsController.getEventsByQuarter);
```

#### 2. Controlador (`events.controller.js`)

**Responsabilidad:** Manejar la petición HTTP y la respuesta

```javascript
getEventsByQuarter = async (req, res) => {
  try {
    const result = await this.eventsService.getEventsByQuarter();

    res.json({
      success: true,
      data: result.data,
      message: "Datos de eventos por trimestre obtenidos exitosamente.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al obtener datos por trimestre.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
```

#### 3. Servicio (`events.services.js`)

**Responsabilidad:** Lógica de negocio y validaciones

```javascript
async getEventsByQuarter() {
  try {
    const events = await this.eventsRepository.getEventsByQuarter();
    return {
      success: true,
      data: events
    };
  } catch (error) {
    throw error;
  }
}
```

#### 4. Repositorio (`events.repository.js`)

**Responsabilidad:** Consultas a la base de datos y transformaciones de datos

```javascript
async getEventsByQuarter() {
  try {
    // 1. Obtener todos los eventos finalizados
    const events = await prisma.service.findMany({
      where: { status: "Finalizado" },
      select: { endDate: true }
    });

    // 2. Agrupar eventos por año y trimestre
    const groupedData = {};

    events.forEach(event => {
      const date = new Date(event.endDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // 0-11 → 1-12

      // Determinar el trimestre (1-4)
      const quarter = Math.ceil(month / 3);

      // Inicializar el año si no existe
      if (!groupedData[year]) {
        groupedData[year] = {};
      }

      // Incrementar el contador del trimestre
      groupedData[year][quarter] = (groupedData[year][quarter] || 0) + 1;
    });

    // 3. Obtener los últimos 3 años
    const years = Object.keys(groupedData)
      .sort((a, b) => b - a)
      .slice(0, 3);

    // 4. Crear estructura para cada trimestre
    const result = [];
    for (let quarter = 1; quarter <= 4; quarter++) {
      const quarterData = {
        trimestre: `Trim ${quarter}`
      };

      years.forEach(year => {
        quarterData[`año${year}`] = groupedData[year]?.[quarter] || 0;
      });

      result.push(quarterData);
    }

    return result;
  } catch (error) {
    console.error("Error en getEventsByQuarter:", error);
    throw error;
  }
}
```

**Resultado final:**

```json
[
  { "trimestre": "Trim 1", "año2026": 5, "año2025": 8, "año2024": 3 },
  { "trimestre": "Trim 2", "año2026": 7, "año2025": 6, "año2024": 4 },
  { "trimestre": "Trim 3", "año2026": 4, "año2025": 9, "año2024": 5 },
  { "trimestre": "Trim 4", "año2026": 6, "año2025": 7, "año2024": 6 }
]
```

### Endpoint de Estadísticas Generales

**Ruta:** `GET /api/events/stats`

**Propósito:** Obtener todas las estadísticas del módulo de eventos

**Implementación:**

```javascript
async getStats() {
  // Calcular fechas para comparación
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(now.getDate() - 60);

  // Ejecutar todas las consultas en paralelo con Promise.all
  const [
    total,
    programado,
    enCurso,
    finalizado,
    cancelado,
    byType,
    enrolledAthletes,
    enrolledTeams,
    totalRecent,
    totalPrevious
  ] = await Promise.all([
    prisma.service.count(),
    prisma.service.count({ where: { status: "Programado" } }),
    prisma.service.count({ where: { status: "En_curso" } }),
    prisma.service.count({ where: { status: "Finalizado" } }),
    prisma.service.count({ where: { status: "Cancelado" } }),
    prisma.service.groupBy({
      by: ["typeId"],
      _count: { id: true }
    }),
    prisma.participant.count({
      where: { athleteId: { not: null } }
    }),
    prisma.participant.count({
      where: { teamId: { not: null } }
    }),
    prisma.service.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    }),
    prisma.service.count({
      where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }
    })
  ]);

  // Calcular porcentaje de crecimiento
  const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return {
    total,
    enrolledAthletes,
    enrolledTeams,
    upcoming: programado + enCurso,
    byStatus: {
      completed: finalizado,
      inProgress: enCurso,
      scheduled: programado,
      cancelled: cancelado
    },
    byType: [...], // Tipos con nombres y conteos
    trends: {
      total: calculateGrowth(totalRecent, totalPrevious),
      enrolledAthletes: calculateGrowth(enrolledAthletes, enrolledAthletesPrevious),
      enrolledTeams: calculateGrowth(enrolledTeams, enrolledTeamsPrevious)
    }
  };
}
```

**Características:**

- Uso de `Promise.all` para ejecutar consultas en paralelo (mejor rendimiento)
- Cálculo de tendencias comparando períodos de 30 días
- Agrupación por tipo de evento con nombres
- Conteo de participantes (deportistas y equipos)

---

## Flujo de Datos

### Flujo Completo: Frontend → Backend → Frontend

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Usuario abre Dashboard                                      │
│     ↓                                                            │
│  2. EventsSection.jsx                                           │
│     useEffect() se ejecuta al montar                            │
│     ↓                                                            │
│  3. eventsService.getStats()                                    │
│     → Petición HTTP: GET /api/events/stats                      │
│                                                                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  4. eventsController.getEventStats()                            │
│     - Recibe la petición HTTP                                   │
│     ↓                                                            │
│  5. eventsService.getStats()                                    │
│     - Lógica de negocio                                         │
│     ↓                                                            │
│  6. eventsRepository.getStats()                                 │
│     - Consultas a Prisma                                        │
│     - Agrupaciones y cálculos                                   │
│     - Transformaciones de datos                                 │
│     ↓                                                            │
│  7. Retorna JSON con estadísticas                               │
│     {                                                            │
│       success: true,                                             │
│       data: { total: 48, enrolledAthletes: 324, ... }          │
│     }                                                            │
│                                                                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  8. Response recibida                                           │
│     ← { success: true, data: {...} }                            │
│     ↓                                                            │
│  9. setStats(response.data)                                     │
│     - Actualiza el estado del componente                        │
│     ↓                                                            │
│  10. Re-renderizado                                             │
│      - KPICards con valores actualizados                        │
│      - Gráficas con datos reales                                │
│      - Paneles de estadísticas                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Ejemplo de Petición y Respuesta

**Petición:**

```http
GET /api/events/stats HTTP/1.1
Host: localhost:3000
Authorization: Bearer <token>
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "total": 48,
    "enrolledAthletes": 324,
    "enrolledTeams": 15,
    "upcoming": 12,
    "byStatus": {
      "completed": 30,
      "inProgress": 6,
      "scheduled": 6,
      "cancelled": 6
    },
    "byType": [
      { "name": "Competencia", "count": 20 },
      { "name": "Entrenamiento", "count": 15 },
      { "name": "Recreativo", "count": 13 }
    ],
    "trends": {
      "total": 12,
      "enrolledAthletes": 8,
      "enrolledTeams": 5
    }
  },
  "message": "Estadísticas obtenidas exitosamente"
}
```

---

## Librerías Utilizadas

### Frontend

| Librería            | Propósito                       | Uso en el Dashboard                         |
| ------------------- | ------------------------------- | ------------------------------------------- |
| **Chart.js**        | Librería de gráficas JavaScript | Motor de renderizado de gráficas            |
| **react-chartjs-2** | Wrapper de Chart.js para React  | Componentes `<Bar>`, `<Doughnut>`, `<Line>` |
| **Framer Motion**   | Animaciones y transiciones      | Animaciones de tabs, KPICards, transiciones |
| **React Icons**     | Biblioteca de iconos            | Iconos en KPICards y navegación             |
| **Tailwind CSS**    | Framework de CSS                | Estilos y diseño responsive                 |
| **ReportButton**    | Componente personalizado        | Exportación de datos a Excel/PDF            |

### Backend

| Librería    | Propósito            | Uso en el Dashboard          |
| ----------- | -------------------- | ---------------------------- |
| **Prisma**  | ORM para Node.js     | Consultas a la base de datos |
| **Express** | Framework web        | Rutas y controladores        |
| **Swagger** | Documentación de API | Documentación de endpoints   |

---

## Características Destacadas

### 1. Datos Dinámicos en Tiempo Real

- Todas las gráficas consumen datos reales del backend
- Actualización automática al montar los componentes
- Estados de carga con spinners animados

### 2. Diseño Responsive

- Adaptación automática a móvil, tablet y desktop
- Grid system con Tailwind CSS
- Scroll horizontal en tabs para móviles
- Tamaños de fuente y gráficas ajustables

### 3. Exportación de Datos

- Botón `ReportButton` en cada gráfica
- Exportación a Excel y PDF
- Columnas configurables por gráfica
- Nombres de archivo personalizados

### 4. Cálculo de Tendencias

- Comparación de períodos (últimos 30 días vs 30 días anteriores)
- Porcentajes de crecimiento/decrecimiento
- Indicadores visuales (↑/↓) con colores (verde/rojo)

### 5. Agrupaciones Inteligentes

- Por trimestre (eventos)
- Por estado (completados, en curso, programados)
- Por tipo (competencia, entrenamiento, recreativo)
- Por categoría deportiva

### 6. Animaciones y Transiciones

- Framer Motion para transiciones suaves
- Animaciones de entrada (fade in, scale)
- Hover effects en tarjetas y botones
- Transiciones entre secciones del dashboard

### 7. Paleta de Colores Consistente

- Colores temáticos: purple, blue, pink, green, yellow, red
- Gradientes en KPICards y fondos
- Colores diferenciados por año en gráficas
- Sombras dinámicas según el color

### 8. Optimización de Rendimiento

- `Promise.all` para consultas paralelas en el backend
- Lazy loading de componentes
- Memoización de cálculos costosos
- Estados de carga para mejorar UX

### 9. Manejo de Errores

- Try-catch en todas las peticiones
- Mensajes de error amigables
- Fallback a datos vacíos en caso de error
- Logs detallados en desarrollo

### 10. Documentación con Swagger

- Endpoints documentados con JSDoc
- Ejemplos de peticiones y respuestas
- Esquemas de datos
- Códigos de estado HTTP

---

## Endpoints Disponibles

### Eventos

| Método | Endpoint                     | Descripción                                                     |
| ------ | ---------------------------- | --------------------------------------------------------------- |
| GET    | `/api/events/stats`          | Obtener estadísticas generales de eventos                       |
| GET    | `/api/events/by-quarter`     | Obtener eventos agrupados por trimestre                         |
| GET    | `/api/events/reference-data` | Obtener datos de referencia (categorías, tipos, patrocinadores) |

### Usuarios

| Método | Endpoint           | Descripción                      |
| ------ | ------------------ | -------------------------------- |
| GET    | `/api/users/stats` | Obtener estadísticas de usuarios |

### Roles

| Método | Endpoint           | Descripción                   |
| ------ | ------------------ | ----------------------------- |
| GET    | `/api/roles/stats` | Obtener estadísticas de roles |

---

## Estructura de Datos

### KPICard Data

```typescript
interface KPICardData {
  title: string;
  value: string | number;
  icon: IconType;
  color: "purple" | "blue" | "green" | "pink" | "yellow" | "red";
  trend?: "up" | "down";
  trendValue?: string;
}
```

### Events Stats

```typescript
interface EventsStats {
  total: number;
  enrolledAthletes: number;
  enrolledTeams: number;
  upcoming: number;
  byStatus: {
    completed: number;
    inProgress: number;
    scheduled: number;
    cancelled: number;
  };
  byType: Array<{
    name: string;
    count: number;
  }>;
  trends: {
    total: number;
    enrolledAthletes: number;
    enrolledTeams: number;
  };
}
```

### Quarter Data

```typescript
interface QuarterData {
  trimestre: string;
  [key: `año${number}`]: number;
}

// Ejemplo:
// { trimestre: "Trim 1", año2026: 5, año2025: 8, año2024: 3 }
```

---

## Mejores Prácticas Implementadas

1. **Separación de Responsabilidades**: Controlador → Servicio → Repositorio
2. **Componentes Reutilizables**: KPICard, gráficas genéricas
3. **Estados de Carga**: Loading states en todas las peticiones
4. **Manejo de Errores**: Try-catch y mensajes amigables
5. **Optimización**: Promise.all para consultas paralelas
6. **Responsive Design**: Mobile-first approach
7. **Accesibilidad**: Colores con buen contraste, textos descriptivos
8. **Documentación**: Comentarios y Swagger en el backend
9. **Tipado Implícito**: Estructuras de datos bien definidas
10. **Performance**: Memoización y lazy loading

---

## Conclusión

El sistema de dashboard está diseñado con una arquitectura escalable y mantenible, separando claramente las responsabilidades entre frontend y backend. Utiliza tecnologías modernas como Chart.js para visualizaciones, Framer Motion para animaciones, y Prisma para consultas eficientes a la base de datos.

La estructura modular permite agregar fácilmente nuevas secciones y gráficas, mientras que el diseño responsive garantiza una experiencia óptima en todos los dispositivos.

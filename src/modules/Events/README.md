# Módulo de Gestión de Eventos

Este módulo maneja el CRUD completo de eventos deportivos y actividades en el sistema AstroStar.

## Estructura

```
Events/
├── events.controller.js    # Controladores de las rutas
├── events.services.js       # Lógica de negocio
├── events.repository.js     # Acceso a datos (Prisma)
├── events.routes.js         # Definición de rutas
└── README.md               # Documentación
```

## Endpoints Disponibles

### GET /api/events
Obtener todos los eventos con paginación y filtros.

**Query Parameters:**
- `page` (number): Número de página (default: 1)
- `limit` (number): Eventos por página (default: 10, max: 100)
- `search` (string): Búsqueda por nombre, ubicación o descripción
- `status` (string): Filtrar por estado (Programado, Finalizado, Cancelado, En_pausa)
- `categoryId` (number): Filtrar por categoría
- `typeId` (number): Filtrar por tipo de evento

**Respuesta:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "message": "Se encontraron 25 eventos."
}
```

### GET /api/events/:id
Obtener un evento específico por ID.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Torneo de Fútbol",
    "description": "...",
    "startDate": "2024-12-01",
    "endDate": "2024-12-03",
    "startTime": "08:00",
    "endTime": "18:00",
    "location": "Estadio Municipal",
    "phone": "+57 300 1234567",
    "status": "Programado",
    "imageUrl": null,
    "scheduleFile": null,
    "publish": true,
    "category": { "id": 1, "name": "Deportivo" },
    "type": { "id": 1, "name": "Torneo" },
    "sponsors": [...],
    "participants": [...]
  },
  "message": "Evento encontrado exitosamente."
}
```

### POST /api/events
Crear un nuevo evento.

**Body (JSON):**
```json
{
  "name": "Torneo de Fútbol",
  "description": "Torneo interbarrial de fútbol",
  "startDate": "2024-12-01",
  "endDate": "2024-12-03",
  "startTime": "08:00",
  "endTime": "18:00",
  "location": "Estadio Municipal",
  "phone": "+57 300 1234567",
  "status": "Programado",
  "imageUrl": null,
  "scheduleFile": null,
  "publish": true,
  "categoryId": 1,
  "typeId": 1
}
```

**Campos Requeridos:**
- `name`: Nombre del evento (3-200 caracteres)
- `startDate`: Fecha de inicio (formato: YYYY-MM-DD)
- `endDate`: Fecha de fin (formato: YYYY-MM-DD)
- `startTime`: Hora de inicio (formato: HH:MM)
- `endTime`: Hora de fin (formato: HH:MM)
- `location`: Ubicación del evento
- `phone`: Teléfono de contacto
- `categoryId`: ID de la categoría
- `typeId`: ID del tipo de evento

**Campos Opcionales:**
- `description`: Descripción del evento
- `status`: Estado (default: "Programado")
- `imageUrl`: URL de la imagen del evento
- `scheduleFile`: URL del archivo de programación
- `publish`: Publicar evento (default: false)

### PUT /api/events/:id
Actualizar un evento existente.

**Body:** Mismos campos que POST, todos opcionales.

### DELETE /api/events/:id
Eliminar un evento.

**Nota:** No se puede eliminar un evento que tenga participantes registrados.

### GET /api/events/stats
Obtener estadísticas de eventos.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total": 25,
    "programado": 15,
    "finalizado": 8,
    "cancelado": 1,
    "enPausa": 1,
    "byCategory": [...]
  },
  "message": "Estadísticas obtenidas exitosamente."
}
```

### GET /api/events/reference-data
Obtener datos de referencia para formularios (categorías y tipos).

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "categories": [
      { "id": 1, "name": "Deportivo", "description": "..." }
    ],
    "types": [
      { "id": 1, "name": "Torneo", "description": "..." }
    ]
  },
  "message": "Datos de referencia obtenidos exitosamente."
}
```

## Validaciones

### Validaciones de Formato
- Nombre: 3-200 caracteres
- Descripción: máximo 1000 caracteres
- Fechas: formato válido (YYYY-MM-DD)
- Horas: formato HH:MM (24 horas)
- Teléfono: 7-20 caracteres, solo números y símbolos permitidos
- Ubicación: máximo 200 caracteres

### Validaciones de Negocio
- La fecha de fin debe ser posterior o igual a la fecha de inicio
- Si es el mismo día, la hora de fin debe ser posterior a la hora de inicio
- No se puede eliminar un evento con participantes registrados

## Estados de Eventos

- **Programado**: Evento planificado y próximo a realizarse
- **Finalizado**: Evento que ya se realizó
- **Cancelado**: Evento cancelado
- **En_pausa**: Evento pausado temporalmente

## Patrocinadores

Los patrocinadores están configurados temporalmente en el seed. Cuando tu compañero implemente el módulo de patrocinadores, se podrán gestionar dinámicamente.

**Patrocinadores actuales (quemados):**
1. Deportes XYZ
2. Banco Nacional
3. Bebidas Energéticas Power
4. Ropa Deportiva Elite
5. Alcaldía Municipal

## Categorías de Eventos

1. Deportivo
2. Cultural
3. Recreativo
4. Formativo
5. Social

## Tipos de Eventos

1. Torneo
2. Campeonato
3. Festival
4. Taller
5. Clínica Deportiva
6. Exhibición

## Notas Importantes

- Los patrocinadores están quemados temporalmente hasta que se implemente el módulo completo
- El módulo está completamente funcional para crear, leer, actualizar y eliminar eventos
- Se incluyen validaciones completas de formato y lógica de negocio
- Los datos de prueba se cargan automáticamente con el seed

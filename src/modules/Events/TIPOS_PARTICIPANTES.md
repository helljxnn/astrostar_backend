# Tipos de Eventos y Participantes

## Mapeo de Tipos de Evento a Tipo de Participante

Cada tipo de evento determina qué tipo de participante puede inscribirse:

### 🏆 Eventos con Inscripción de EQUIPOS

| Tipo de Evento | Descripción | Tipo de Participante |
|----------------|-------------|---------------------|
| **Festival** | Evento festivo con múltiples actividades | ⚽ Equipos |
| **Torneo** | Competencia deportiva con múltiples participantes | ⚽ Equipos |

### 👤 Eventos con Inscripción de DEPORTISTAS

| Tipo de Evento | Descripción | Tipo de Participante |
|----------------|-------------|---------------------|
| **Clausura** | Evento de cierre o finalización | 🏃 Deportistas |
| **Taller** | Actividad formativa práctica | 🏃 Deportistas |

## Implementación en el Frontend

El modal de eventos muestra automáticamente el tipo de participante según el tipo de evento seleccionado:

```javascript
const eventTypeParticipantMap = {
  'Festival': 'Equipos',
  'Torneo': 'Equipos',
  'Clausura': 'Deportistas',
  'Taller': 'Deportistas'
};
```

## Visualización en la UI

Cuando el usuario selecciona un tipo de evento, aparece un badge indicador:

- **Equipos**: Badge azul 🔵
- **Deportistas**: Badge verde 🟢

## Validación

El sistema valida que:
1. Solo se puedan inscribir equipos en eventos de tipo "Torneo", "Campeonato" o "Festival"
2. Solo se puedan inscribir deportistas individuales en eventos de tipo "Taller", "Clínica Deportiva", "Exhibición" o "Clausura"

## Modelo de Datos

En la base de datos, la tabla `participants` tiene un campo `type` que puede ser:
- `Individual` - Para deportistas individuales
- `Team` - Para equipos

El tipo de evento determina automáticamente qué tipo de participante se puede registrar.

## Ejemplo de Uso

### Crear un Torneo (Equipos)
```json
{
  "name": "Torneo de Fútbol",
  "typeId": 1,  // Torneo
  ...
}
```
→ Solo se podrán inscribir **equipos**

### Crear un Taller (Deportistas)
```json
{
  "name": "Taller de Técnica",
  "typeId": 4,  // Taller
  ...
}
```
→ Solo se podrán inscribir **deportistas individuales**

## Notas Importantes

1. Esta configuración está definida tanto en el backend (seed) como en el frontend (EventModal)
2. Si se agregan nuevos tipos de eventos, deben actualizarse ambos lugares
3. El tipo de participante es informativo en la creación del evento, pero se valida al momento de inscribir participantes

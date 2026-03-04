# 📋 Guía de Integración de Validadores

## Estado Actual

✅ **Todos los validadores han sido creados** (100%)

Los siguientes validadores están listos para ser integrados en las rutas:

1. ✅ `common.validator.js` - Validadores comunes (ID, UUID)
2. ✅ `user.validator.js` - Usuarios
3. ✅ `employee.validator.js` - Empleados
4. ✅ `enrollment.validator.js` - Matrículas
5. ✅ `event.validator.js` - Eventos
6. ✅ `material.validator.js` - Materiales deportivos
7. ✅ `donation.validator.js` - Donaciones
8. ✅ `athlete.validator.js` - Deportistas
9. ✅ `team.validator.js` - Equipos
10. ✅ `preregistration.validator.js` - Pre-registros

---

## 🔧 Cómo Integrar Validadores

### Paso 1: Importar el Validador

En el archivo de rutas correspondiente, importa los validadores necesarios:

```javascript
import {
  validateCreateEvent,
  validateUpdateEvent,
  validateRSVP,
  validateEventQuery,
} from "../../middlewares/validators/event.validator.js";
```

### Paso 2: Aplicar en las Rutas

Agrega el validador como middleware antes del controlador:

```javascript
// Antes (sin validación)
router.post("/", authenticate, authorize(["ADMIN"]), createEvent);

// Después (con validación)
router.post(
  "/",
  authenticate,
  authorize(["ADMIN"]),
  validateCreateEvent, // ← Agregar aquí
  createEvent,
);
```

### Paso 3: Orden de Middlewares

El orden correcto es:

1. `authenticate` - Verificar autenticación
2. `authorize` - Verificar permisos
3. `validateXXX` - Validar datos
4. `controller` - Ejecutar lógica

```javascript
router.post(
  "/",
  authenticate, // 1. Autenticación
  authorize(["ADMIN"]), // 2. Autorización
  validateCreateEvent, // 3. Validación
  createEvent, // 4. Controlador
);
```

---

## 📝 Ejemplos por Módulo

### 1. Eventos (`src/modules/Events/routes/event.routes.js`)

```javascript
import {
  validateCreateEvent,
  validateUpdateEvent,
  validateRSVP,
  validateInvitation,
  validateEventQuery,
} from "../../middlewares/validators/event.validator.js";

// Crear evento
router.post(
  "/",
  authenticate,
  authorize(["ADMIN"]),
  validateCreateEvent,
  createEvent,
);

// Actualizar evento
router.put(
  "/:id",
  authenticate,
  authorize(["ADMIN"]),
  validateUpdateEvent,
  updateEvent,
);

// RSVP
router.post("/:id/rsvp", authenticate, validateRSVP, rsvpToEvent);

// Invitaciones
router.post(
  "/:id/invite",
  authenticate,
  authorize(["ADMIN"]),
  validateInvitation,
  inviteUsers,
);

// Listar eventos
router.get("/", validateEventQuery, getEvents);
```

### 2. Materiales (`src/modules/Materials/routes/material.routes.js`)

```javascript
import {
  validateCreateMaterial,
  validateUpdateMaterial,
  validateInventoryMovement,
  validateEventMaterialAssignment,
  validateMaterialQuery,
} from "../../middlewares/validators/material.validator.js";

// Crear material
router.post(
  "/",
  authenticate,
  authorize(["ADMIN"]),
  validateCreateMaterial,
  createMaterial,
);

// Actualizar material
router.put(
  "/:id",
  authenticate,
  authorize(["ADMIN"]),
  validateUpdateMaterial,
  updateMaterial,
);

// Movimiento de inventario
router.post(
  "/movements",
  authenticate,
  authorize(["ADMIN"]),
  validateInventoryMovement,
  createMovement,
);

// Asignar a evento
router.post(
  "/assign-event",
  authenticate,
  authorize(["ADMIN"]),
  validateEventMaterialAssignment,
  assignToEvent,
);

// Listar materiales
router.get("/", authenticate, validateMaterialQuery, getMaterials);
```

### 3. Donaciones (`src/modules/Donations/routes/donation.routes.js`)

```javascript
import {
  validateCreateDonation,
  validateUpdateDonation,
  validateDonationQuery,
} from "../../middlewares/validators/donation.validator.js";

// Crear donación (público)
router.post("/", validateCreateDonation, createDonation);

// Actualizar donación
router.put(
  "/:id",
  authenticate,
  authorize(["ADMIN"]),
  validateUpdateDonation,
  updateDonation,
);

// Listar donaciones
router.get(
  "/",
  authenticate,
  authorize(["ADMIN"]),
  validateDonationQuery,
  getDonations,
);
```

### 4. Deportistas (`src/modules/Athletes/routes/athlete.routes.js`)

```javascript
import {
  validateCreateAthlete,
  validateUpdateAthlete,
  validateAthleteQuery,
} from "../../middlewares/validators/athlete.validator.js";

// Crear deportista
router.post(
  "/",
  authenticate,
  authorize(["ADMIN"]),
  validateCreateAthlete,
  createAthlete,
);

// Actualizar deportista
router.put(
  "/:id",
  authenticate,
  authorize(["ADMIN"]),
  validateUpdateAthlete,
  updateAthlete,
);

// Listar deportistas
router.get("/", authenticate, validateAthleteQuery, getAthletes);
```

### 5. Equipos (`src/modules/Teams/routes/team.routes.js`)

```javascript
import {
  validateCreateTeam,
  validateUpdateTeam,
  validateAddTeamMember,
  validateTeamQuery,
} from "../../middlewares/validators/team.validator.js";

// Crear equipo
router.post(
  "/",
  authenticate,
  authorize(["ADMIN"]),
  validateCreateTeam,
  createTeam,
);

// Actualizar equipo
router.put(
  "/:id",
  authenticate,
  authorize(["ADMIN"]),
  validateUpdateTeam,
  updateTeam,
);

// Agregar miembro
router.post(
  "/:id/members",
  authenticate,
  authorize(["ADMIN"]),
  validateAddTeamMember,
  addMember,
);

// Listar equipos
router.get("/", authenticate, validateTeamQuery, getTeams);
```

### 6. Pre-registros (`src/modules/PreRegistrations/routes/preregistration.routes.js`)

```javascript
import {
  validateCreatePreRegistration,
  validateUpdatePreRegistration,
  validatePreRegistrationQuery,
} from "../../middlewares/validators/preregistration.validator.js";

// Crear pre-registro (público)
router.post("/", validateCreatePreRegistration, createPreRegistration);

// Actualizar pre-registro
router.put(
  "/:id",
  authenticate,
  authorize(["ADMIN"]),
  validateUpdatePreRegistration,
  updatePreRegistration,
);

// Listar pre-registros
router.get(
  "/",
  authenticate,
  authorize(["ADMIN"]),
  validatePreRegistrationQuery,
  getPreRegistrations,
);
```

---

## ✅ Checklist de Integración

### Módulos Completados

- [x] Auth (ya integrado)
- [x] Users (ya integrado)
- [x] Employees (ya integrado)
- [x] Enrollments (ya integrado)

### Módulos Pendientes

- [ ] Events
- [ ] Materials
- [ ] Donations
- [ ] Athletes
- [ ] Teams
- [ ] PreRegistrations

---

## 🧪 Cómo Probar

### 1. Probar Validación con Datos Inválidos

```bash
# Crear evento sin título (debe fallar)
curl -X POST http://localhost:4000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "description": "Test",
    "date": "2026-12-31",
    "location": "Test"
  }'

# Respuesta esperada:
{
  "success": false,
  "errors": [
    {
      "field": "title",
      "message": "El título es requerido"
    }
  ]
}
```

### 2. Probar Validación con Datos Válidos

```bash
# Crear evento con datos válidos (debe funcionar)
curl -X POST http://localhost:4000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Torneo de Fútbol",
    "description": "Torneo anual de fútbol juvenil",
    "date": "2026-12-31T10:00:00Z",
    "location": "Estadio Municipal",
    "capacity": 100
  }'

# Respuesta esperada:
{
  "success": true,
  "data": { ... }
}
```

### 3. Verificar Logs

```bash
# Ver logs de validación
tail -f logs/combined-*.log | grep "Validation Error"
```

---

## 🔒 Beneficios de la Validación

### Seguridad

- ✅ Previene inyección SQL
- ✅ Previene XSS
- ✅ Previene ataques de tipo
- ✅ Sanitiza entrada de usuario

### Calidad de Datos

- ✅ Garantiza formato correcto
- ✅ Valida rangos numéricos
- ✅ Verifica longitudes
- ✅ Normaliza emails

### Experiencia de Usuario

- ✅ Mensajes de error claros
- ✅ Validación antes de procesamiento
- ✅ Respuestas rápidas
- ✅ Feedback específico

---

## 📊 Cobertura de Validación

| Módulo          | Validadores Creados | Integrados | Estado |
| --------------- | ------------------- | ---------- | ------ |
| Auth            | ✅                  | ✅         | 100%   |
| Users           | ✅                  | ✅         | 100%   |
| Employees       | ✅                  | ✅         | 100%   |
| Enrollments     | ✅                  | ✅         | 100%   |
| Events          | ✅                  | ⏳         | 50%    |
| Materials       | ✅                  | ⏳         | 50%    |
| Donations       | ✅                  | ⏳         | 50%    |
| Athletes        | ✅                  | ⏳         | 50%    |
| Teams           | ✅                  | ⏳         | 50%    |
| PreRegistration | ✅                  | ⏳         | 50%    |

**Total**: 100% creados, 40% integrados

---

## 🚀 Próximos Pasos

1. **Integrar validadores en rutas** (1-2 horas)
2. **Probar cada endpoint** (30 minutos)
3. **Verificar logs de validación** (15 minutos)
4. **Actualizar documentación de API** (30 minutos)

---

## 📞 Soporte

Si encuentras problemas al integrar los validadores:

1. Verifica el orden de middlewares
2. Revisa los logs en `logs/error-*.log`
3. Asegúrate de importar correctamente
4. Verifica que el validador existe

---

**Creado**: 4 de marzo de 2026  
**Última actualización**: 4 de marzo de 2026  
**Estado**: ✅ Validadores completos, pendiente integración

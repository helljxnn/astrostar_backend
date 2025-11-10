# Documentación Swagger - Módulo de Personas Temporales

## ✅ Configuración Completada

Se ha documentado completamente el módulo de **Personas Temporales (TemporaryWorkers)** en Swagger con las siguientes características:

### 1. Esquemas Agregados a Swagger

En `src/config/swagger.js` se agregaron los siguientes esquemas:

- **TemporaryWorker**: Esquema completo de la entidad persona temporal
- **CreateTemporaryWorkerRequest**: Esquema para crear nuevas personas temporales
- **UpdateTemporaryWorkerRequest**: Esquema para actualizar personas temporales
- **DocumentType**: Esquema para tipos de documento
- **Pagination**: Esquema para información de paginación

### 2. Respuestas Comunes

Se agregaron respuestas estándar reutilizables:
- **BadRequest**: Para errores de validación (400)
- **NotFound**: Para recursos no encontrados (404)
- **InternalServerError**: Para errores del servidor (500)

### 3. Endpoints Documentados

Todos los endpoints del módulo están completamente documentados:

#### Endpoints CRUD
- `GET /api/temporary-workers` - Listar personas temporales con filtros y paginación
- `GET /api/temporary-workers/{id}` - Obtener persona temporal por ID
- `POST /api/temporary-workers` - Crear nueva persona temporal
- `PUT /api/temporary-workers/{id}` - Actualizar persona temporal
- `DELETE /api/temporary-workers/{id}` - Eliminar persona temporal (soft delete)

#### Endpoints Auxiliares
- `GET /api/temporary-workers/stats` - Obtener estadísticas del módulo
- `GET /api/temporary-workers/reference-data` - Obtener datos de referencia
- `GET /api/temporary-workers/check-identification` - Verificar disponibilidad de identificación
- `GET /api/temporary-workers/check-email` - Verificar disponibilidad de email

### 4. Características de la Documentación

- **Parámetros Completos**: Todos los parámetros de consulta, path y body están documentados
- **Validaciones**: Se especifican todas las reglas de validación
- **Ejemplos**: Respuestas de ejemplo para cada endpoint
- **Códigos de Estado**: Documentación completa de códigos de respuesta
- **Tipos de Datos**: Especificación precisa de tipos y formatos

## 🚀 Cómo Acceder a la Documentación

### Swagger UI
La documentación interactiva está disponible en:
```
http://localhost:4000/api-docs
```

### Buscar el Módulo
En Swagger UI, busca la sección **"TemporaryWorkers"** que contiene todos los endpoints del módulo.

## 📋 Validaciones Implementadas

### Campos Obligatorios
- `firstName`: Nombre (2-100 caracteres, solo letras)
- `personType`: Tipo de persona (Deportista, Entrenador, Participante)

### Campos Opcionales con Validación
- `lastName`: Apellido (máx. 100 caracteres, solo letras)
- `identification`: Identificación (6-50 caracteres, alfanumérico)
- `email`: Email (formato válido)
- `phone`: Teléfono (7-15 dígitos)
- `birthDate`: Fecha nacimiento (formato ISO, edad 0-120)
- `age`: Edad (0-120)
- `address`: Dirección (máx. 200 caracteres)
- `organization`: Organización (máx. 200 caracteres)
- `status`: Estado (Active/Inactive)
- `documentTypeId`: ID tipo documento (entero positivo)

## 🔍 Funcionalidades Especiales

### Búsqueda y Filtrado
- Búsqueda por texto en nombre, apellido, email, identificación
- Filtros por estado y tipo de persona
- Paginación configurable

### Verificación de Unicidad
- Verificación de disponibilidad de identificación
- Verificación de disponibilidad de email
- Soporte para exclusión en actualizaciones

### Estadísticas
- Conteo total de personas temporales
- Conteo por estado (activo/inactivo)
- Conteo por tipo de persona

## 📁 Archivos Modificados/Creados

### Archivos Modificados
- `src/config/swagger.js` - Agregados esquemas y respuestas
- `src/modules/Athletes/TemporaryWorkers/temporaryworkers.controller.js` - Tag de documentación

### Archivos Creados
- `docs/TEMPORARY_WORKERS_API.md` - Documentación detallada del API
- `docs/SWAGGER_SETUP_SUMMARY.md` - Este archivo de resumen

## ✨ Próximos Pasos

1. **Iniciar el servidor**: `npm run dev`
2. **Acceder a Swagger**: http://localhost:4000/api-docs
3. **Probar endpoints**: Usar la interfaz interactiva de Swagger
4. **Revisar documentación**: Consultar `docs/TEMPORARY_WORKERS_API.md` para ejemplos detallados

## 🎯 Beneficios de la Documentación

- **Desarrollo Frontend**: Los desarrolladores frontend pueden entender fácilmente la API
- **Testing**: Facilita las pruebas de los endpoints
- **Mantenimiento**: Documentación siempre actualizada con el código
- **Integración**: Facilita la integración con otros sistemas
- **Onboarding**: Nuevos desarrolladores pueden entender rápidamente el módulo

La documentación está completa y lista para usar. El módulo de Personas Temporales ahora tiene documentación Swagger profesional y completa.
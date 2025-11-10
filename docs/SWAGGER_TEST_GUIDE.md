# Guía de Pruebas - Documentación Swagger

## 🧪 Cómo Probar la Documentación

### 1. Iniciar el Servidor
```bash
cd astrostar_backend
npm run dev
```

### 2. Acceder a Swagger UI
Abrir en el navegador:
```
http://localhost:4000/api-docs
```

### 3. Verificar el Módulo TemporaryWorkers
En la interfaz de Swagger UI, buscar la sección **"TemporaryWorkers"** que debe mostrar:

- ✅ 9 endpoints documentados
- ✅ Esquemas de datos completos
- ✅ Ejemplos de respuesta
- ✅ Validaciones detalladas

### 4. Probar Endpoints Básicos

#### A. Obtener Datos de Referencia
1. Expandir `GET /api/temporary-workers/reference-data`
2. Hacer clic en "Try it out"
3. Hacer clic en "Execute"
4. Verificar respuesta con tipos de documento

#### B. Obtener Estadísticas
1. Expandir `GET /api/temporary-workers/stats`
2. Hacer clic en "Try it out"
3. Hacer clic en "Execute"
4. Verificar respuesta con contadores

#### C. Listar Personas Temporales
1. Expandir `GET /api/temporary-workers`
2. Hacer clic en "Try it out"
3. Probar con diferentes parámetros:
   - `page`: 1
   - `limit`: 5
   - `search`: (dejar vacío)
4. Hacer clic en "Execute"

### 5. Verificar Validaciones

#### A. Crear Persona Temporal (Datos Válidos)
1. Expandir `POST /api/temporary-workers`
2. Hacer clic en "Try it out"
3. Usar este JSON de ejemplo:
```json
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "identification": "12345678",
  "email": "juan.test@email.com",
  "phone": "3001234567",
  "personType": "Deportista",
  "organization": "Club Test"
}
```
4. Hacer clic en "Execute"
5. Verificar respuesta 201 (Created)

#### B. Crear Persona Temporal (Datos Inválidos)
1. Usar este JSON con errores:
```json
{
  "firstName": "A",
  "email": "email-invalido",
  "phone": "123",
  "personType": "TipoInvalido"
}
```
2. Hacer clic en "Execute"
3. Verificar respuesta 400 con errores de validación

### 6. Verificar Disponibilidad

#### A. Verificar Email
1. Expandir `GET /api/temporary-workers/check-email`
2. Hacer clic en "Try it out"
3. Ingresar: `email`: `test@nuevo.com`
4. Hacer clic en "Execute"
5. Verificar respuesta con `available: true`

#### B. Verificar Identificación
1. Expandir `GET /api/temporary-workers/check-identification`
2. Hacer clic en "Try it out"
3. Ingresar: `identification`: `999999999`
4. Hacer clic en "Execute"
5. Verificar respuesta con `available: true`

## ✅ Checklist de Verificación

### Documentación Visible
- [ ] Sección "TemporaryWorkers" aparece en Swagger UI
- [ ] 9 endpoints están listados
- [ ] Cada endpoint tiene descripción clara
- [ ] Parámetros están documentados
- [ ] Esquemas de respuesta están definidos

### Funcionalidad
- [ ] Endpoints de consulta funcionan (GET)
- [ ] Validaciones funcionan correctamente
- [ ] Respuestas tienen el formato esperado
- [ ] Códigos de estado son correctos

### Esquemas
- [ ] TemporaryWorker schema está completo
- [ ] CreateTemporaryWorkerRequest tiene validaciones
- [ ] UpdateTemporaryWorkerRequest es opcional
- [ ] Pagination schema funciona
- [ ] DocumentType schema está presente

## 🐛 Solución de Problemas

### Error: "Cannot GET /api-docs"
- Verificar que el servidor esté ejecutándose
- Verificar que el puerto sea 4000
- Revisar configuración en `src/app.js`

### Error: Esquemas no aparecen
- Verificar `src/config/swagger.js`
- Revisar que las rutas en `apis` sean correctas
- Reiniciar el servidor

### Error: Endpoints no funcionan
- Verificar que la base de datos esté conectada
- Revisar variables de entorno en `.env`
- Verificar logs del servidor

## 📊 Resultados Esperados

Al completar las pruebas, deberías ver:

1. **Swagger UI funcionando** con documentación completa
2. **Endpoints respondiendo** correctamente
3. **Validaciones funcionando** según las reglas definidas
4. **Esquemas de datos** mostrándose correctamente
5. **Ejemplos interactivos** funcionando

## 🎉 Confirmación Final

Si todas las pruebas pasan, la documentación Swagger del módulo de Personas Temporales está **completamente funcional** y lista para uso en desarrollo y producción.
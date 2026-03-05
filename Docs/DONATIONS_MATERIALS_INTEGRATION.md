# Integración de Donaciones con Materiales

## Descripción

Esta funcionalidad permite vincular donaciones de tipo ESPECIE (materiales) con el inventario de materiales de la fundación. Cuando se recibe una donación de materiales, se puede convertir automáticamente en entradas de inventario.

## Flujo de Trabajo

1. **Crear Donación**: Se crea una donación de tipo `ESPECIE`
2. **Convertir a Materiales**: Se convierte la donación en entradas de material
3. **Consultar Materiales**: Se pueden consultar los materiales vinculados a una donación

## Endpoints

### 1. Convertir Donación a Materiales

Convierte los items de una donación en entradas de material en el inventario.

**Endpoint**: `POST /api/donations/:id/convert-to-materials`

**Requisitos**:
- La donación debe existir
- La donación debe ser de tipo `ESPECIE`
- Los materiales deben existir y estar activos

**Body**:
```json
{
  "items": [
    {
      "materialId": 1,
      "cantidad": 50,
      "inventarioDestino": "FUNDACION",
      "observaciones": "Donación de arroz"
    },
    {
      "materialId": 2,
      "cantidad": 30,
      "inventarioDestino": "EVENTOS",
      "observaciones": "Donación de frijoles"
    }
  ]
}
```

**Parámetros de cada item**:
- `materialId` (requerido): ID del material en el inventario
- `cantidad` (requerido): Cantidad a ingresar
- `inventarioDestino` (opcional): `FUNDACION` o `EVENTOS` (default: `FUNDACION`)
- `observaciones` (opcional): Notas adicionales

**Respuesta exitosa**:
```json
{
  "success": true,
  "data": {
    "donationId": 123,
    "donationCode": "DON-000123",
    "processed": 2,
    "failed": 0,
    "results": [
      {
        "materialId": 1,
        "materialNombre": "Arroz",
        "cantidad": 50,
        "movementId": 456
      },
      {
        "materialId": 2,
        "materialNombre": "Frijoles",
        "cantidad": 30,
        "movementId": 457
      }
    ],
    "errors": []
  }
}
```

**Respuesta con errores parciales**:
```json
{
  "success": true,
  "data": {
    "donationId": 123,
    "donationCode": "DON-000123",
    "processed": 1,
    "failed": 1,
    "results": [
      {
        "materialId": 1,
        "materialNombre": "Arroz",
        "cantidad": 50,
        "movementId": 456
      }
    ],
    "errors": [
      {
        "item": {
          "materialId": 999,
          "cantidad": 30
        },
        "error": "Material con ID 999 no encontrado"
      }
    ]
  }
}
```

### 2. Consultar Materiales de una Donación

Obtiene todos los materiales vinculados a una donación específica.

**Endpoint**: `GET /api/donations/:id/materials`

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "donation": {
      "id": 123,
      "code": "DON-000123",
      "type": "ESPECIE",
      "status": "Verificada",
      "donationAt": "2024-03-15T10:00:00.000Z"
    },
    "materials": [
      {
        "id": 456,
        "materialId": 1,
        "materialNombre": "Arroz",
        "categoria": "Alimentos",
        "tipoMovimiento": "Entrada",
        "cantidad": 50,
        "stockAnterior": 100,
        "stockNuevo": 150,
        "inventarioDestino": "FUNDACION",
        "observaciones": "Donación DON-000123",
        "fecha": "2024-03-15T10:30:00.000Z",
        "material": {
          "id": 1,
          "nombre": "Arroz",
          "categoria": "Alimentos",
          "estado": "Activo",
          "unidadMedida": "kg",
          "stockFundacion": 150,
          "stockEventos": 50
        }
      }
    ]
  }
}
```

## Base de Datos

### Relación en MaterialMovement

El modelo `MaterialMovement` tiene un campo `donacionId` que vincula el movimiento con la donación:

```prisma
model MaterialMovement {
  id                Int                @id @default(autoincrement())
  materialId        Int
  donacionId        Int?               @map("donacion_id")
  // ... otros campos
}
```

Esto permite:
- Rastrear el origen de los materiales
- Auditar qué donaciones se convirtieron en inventario
- Generar reportes de donaciones vs inventario

## Casos de Uso

### Caso 1: Donación Simple
Una empresa dona 100kg de arroz:
1. Crear donación tipo ESPECIE
2. Convertir a material con `materialId` del arroz
3. El sistema crea un movimiento de entrada automáticamente

### Caso 2: Donación Múltiple
Una fundación dona varios productos:
1. Crear donación tipo ESPECIE
2. Convertir con array de items (arroz, frijoles, aceite)
3. El sistema crea múltiples movimientos de entrada

### Caso 3: Consulta de Trazabilidad
Auditar de dónde vino el inventario:
1. Consultar materiales por donación
2. Ver todos los movimientos vinculados
3. Generar reporte de donaciones recibidas

## Validaciones

El sistema valida:
- ✅ Donación existe
- ✅ Donación es tipo ESPECIE
- ✅ Material existe y está activo
- ✅ Cantidad es válida (> 0)
- ✅ Inventario destino es válido (FUNDACION o EVENTOS)

## Transacciones Atómicas

Cada conversión de material usa transacciones atómicas para garantizar:
- Stock se actualiza correctamente
- Movimiento se registra
- No hay inconsistencias en caso de error

## Notas Importantes

1. **Tipo de Donación**: Solo donaciones tipo `ESPECIE` pueden convertirse en materiales
2. **Estado del Material**: El material debe estar en estado `Activo`
3. **Procesamiento Parcial**: Si algunos items fallan, los exitosos se procesan igual
4. **Fecha de Ingreso**: Se usa la fecha de la donación como fecha de ingreso del material
5. **Trazabilidad**: Cada movimiento queda vinculado a la donación para auditoría

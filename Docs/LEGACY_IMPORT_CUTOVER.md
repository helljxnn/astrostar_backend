# Legacy Import Cutover

## Objetivo

Este flujo existe para el dia de salida a produccion.
No debe usarse el endpoint normal `POST /api/enrollments` para deportistas que ya existen en la operacion real.

El flujo `legacy import` permite:

- Crear la deportista y su usuario.
- Registrar la matricula en su estado real (`Vigente` o `Vencida`).
- Evitar el cobro automatico de `ENROLLMENT_INITIAL`.
- Importar deudas mensuales reales como saldo inicial.
- Importar renovacion pendiente solo si aplica.
- Arrancar la mora historica desde una fecha de corte, no desde meses atras.

## Endpoints

- `POST /api/enrollments/legacy-import/preview`
- `POST /api/enrollments/legacy-import`

Ambos endpoints requieren autenticacion y permiso `enrollments: Aceptar`.

## Script recomendado para el corte

1. Preparar el archivo JSON.
2. Ejecutar preview:

```bash
npm run legacy:import -- --file ./Docs/legacy-import.sample.json --dry-run
```

3. Revisar casos con deuda, matriculas vencidas y becadas.
4. Hacer backup de la base.
5. Ejecutar importacion real:

```bash
npm run legacy:import -- --file ./Docs/legacy-import.sample.json --performed-by "cutover-2026-04-01"
```

6. Validar en el sistema:

- deportista creada
- matricula en estado correcto
- sin obligacion `ENROLLMENT_INITIAL`
- deudas mensuales esperadas
- renovacion solo si aplica

## Regla operativa recomendada

- Deportista nueva despues del corte: usar flujo normal de matricula.
- Deportista que ya existia antes del corte: usar `legacy import`.
- No mezclar ambos flujos para la misma persona.

## Estructura JSON

```json
{
  "records": [
    {
      "athlete": {
        "firstName": "Ana",
        "lastName": "Lopez",
        "documentTypeId": 1,
        "identification": "100200300",
        "email": "ana@example.com",
        "phoneNumber": "3000000000",
        "birthDate": "2010-05-12",
        "guardianId": 5,
        "relationship": "Mother",
        "categoria": "Juvenil",
        "isScholarship": false,
        "status": "Active"
      },
      "enrollment": {
        "estado": "Vigente",
        "fechaInicio": "2025-08-01",
        "fechaVencimiento": "2026-07-31",
        "observaciones": "Migrada desde control manual"
      },
      "financial": {
        "monthlyDebtPeriods": ["2026-01", "2026-02"],
        "waiveHistoricalLateFee": true
      },
      "options": {
        "cutoverDate": "2026-04-01"
      }
    }
  ]
}
```

## Campos relevantes

### `athlete`

- `firstName`, `lastName`, `documentTypeId`, `identification`, `email`, `phoneNumber`, `birthDate`: obligatorios.
- `guardianId`: obligatorio para menores de edad.
- `relationship`: acepta valores como `Mother`, `Father`, `Grandparent`, `Uncle_Aunt`, `Sibling`, `Cousin`, `Legal_Guardian`, `Neighbor`, `Family_Friend`, `Other`. Tambien acepta equivalentes comunes en espanol.
- `categoria`: opcional. Si existe, se crea inscripcion.
- `isScholarship`: opcional.
- `status`: `Active` o `Inactive`.
- `statusAssignedAt`: opcional. Si la deportista entra inactiva y no se envia, se usa la fecha de corte.

### `enrollment`

- `estado`: obligatorio. Solo `Vigente` o `Vencida`.
- `fechaInicio`: opcional si envias `fechaVencimiento`.
- `fechaVencimiento`: opcional si envias `fechaInicio`.
- `observaciones`: opcional.

### `financial`

- `monthlyDebtPeriods`: lista explicita de periodos `YYYY-MM`.
- `monthlyDebtStartPeriod` y `monthlyDebtEndPeriod`: alternativa para generar rango.
- `createRenewalObligation`: crear obligacion `ENROLLMENT_RENEWAL`. Solo permitido si la matricula importada esta `Vencida`.
- `waiveHistoricalLateFee`: por defecto `true`. Si no lo cambias, la mora empieza desde la fecha de corte.
- `lateFeeStartsAt`: opcional. Sobrescribe la fecha desde la que empieza a correr mora en deuda importada.

## Reglas importantes

- No se genera `ENROLLMENT_INITIAL`.
- Los periodos de deuda no pueden estar en el futuro respecto a la fecha de corte.
- Si importas deuda mensual o renovacion, debe existir configuracion en `payment_settings`.
- Si `waiveHistoricalLateFee` queda en `true`, la mora se empieza a contar desde `cutoverDate`.

## Recomendacion de negocio

Para esta entrega, la mejor practica es manejar la carga inicial con archivo y `dry-run`, no con un formulario improvisado en frontend. Eso reduce riesgo, deja auditoria y te permite revisar todo antes de afectar datos reales.

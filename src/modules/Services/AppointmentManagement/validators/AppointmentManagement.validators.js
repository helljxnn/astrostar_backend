
import { body, param, query, validationResult } from 'express-validator';

/**
 * Middleware para manejar errores de validación
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({
      success: false,
      message: firstError.msg,
      field: firstError.path,
      value: firstError.value,
      errors: errors.array()
    });
  }
  next();
};

const APPOINTMENT_STATUSES = ['Programado', 'Completado', 'Cancelado'];

export const appointmentValidators = {
  /**
   * Validación para obtener todas las citas
   */
  getAll: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('La página debe ser un número entero mayor a 0.')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('El límite debe ser un número entre 1 y 100.')
      .toInt(),
    query('search')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('La búsqueda debe tener entre 1 y 100 caracteres.')
      .trim(),
    query('athleteId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('El ID del deportista debe ser un número válido.')
      .toInt(),
    query('specialistId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('El ID del especialista debe ser un número válido.')
      .toInt(),
    query('specialty')
      .optional()
      .isLength({ min: 3, max: 80 })
      .withMessage('La especialidad debe tener entre 3 y 80 caracteres.')
      .trim(),
    query('status')
      .optional()
      .isIn(APPOINTMENT_STATUSES)
      .withMessage('El estado debe ser: Programado, Completado o Cancelado.'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('La fecha de inicio debe tener formato válido (YYYY-MM-DD).'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('La fecha de fin debe tener formato válido (YYYY-MM-DD).')
  ],

  /**
   * Validación para obtener cita por ID
   */
  getById: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('El ID de la cita debe ser un número entero válido mayor a 0.')
      .toInt()
  ],

  /**
   * Validación para crear cita
   */
  create: [
    body('athleteId')
      .notEmpty()
      .withMessage('El deportista es obligatorio.')
      .isInt({ min: 1 })
      .withMessage('Debe seleccionar un deportista válido.')
      .toInt(),
    body('specialistId')
      .notEmpty()
      .withMessage('El especialista es obligatorio.')
      .isInt({ min: 1 })
      .withMessage('Debe seleccionar un especialista válido.')
      .toInt(),
    body('specialty')
      .notEmpty()
      .withMessage('La especialidad es obligatoria.')
      .isLength({ min: 3, max: 80 })
      .withMessage('La especialidad debe tener entre 3 y 80 caracteres.')
      .trim(),
    body('start')
      .notEmpty()
      .withMessage('La fecha y hora de inicio son obligatorias.')
      .isISO8601()
      .withMessage('La fecha y hora de inicio deben tener formato válido.'),
    body('end')
      .notEmpty()
      .withMessage('La fecha y hora de fin son obligatorias.')
      .isISO8601()
      .withMessage('La fecha y hora de fin deben tener formato válido.')
      .custom((value, { req }) => {
        if (req.body.start) {
          const start = new Date(req.body.start);
          const end = new Date(value);
          if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return true;
          if (end <= start) {
            throw new Error('La hora de fin debe ser mayor que la hora de inicio.');
          }
        }
        return true;
      }),
    body('description')
      .notEmpty()
      .withMessage('La descripción es obligatoria.')
      .isLength({ min: 10, max: 500 })
      .withMessage('La descripción debe tener entre 10 y 500 caracteres.')
      .trim(),
    body('status')
      .optional()
      .isIn(APPOINTMENT_STATUSES)
      .withMessage('El estado debe ser: Programado, Completado o Cancelado.')
  ],

  /**
   * Validación para actualizar cita
   */
  update: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('El ID de la cita debe ser un número entero válido mayor a 0.')
      .toInt(),
    body('athleteId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('El deportista debe ser válido.')
      .toInt(),
    body('specialistId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('El especialista debe ser válido.')
      .toInt(),
    body('specialty')
      .optional()
      .isLength({ min: 3, max: 80 })
      .withMessage('La especialidad debe tener entre 3 y 80 caracteres.')
      .trim(),
    body('start')
      .optional()
      .isISO8601()
      .withMessage('La fecha y hora de inicio deben tener formato válido.'),
    body('end')
      .optional()
      .isISO8601()
      .withMessage('La fecha y hora de fin deben tener formato válido.')
      .custom((value, { req }) => {
        if (req.body.start) {
          const start = new Date(req.body.start);
          const end = new Date(value);
          if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return true;
          if (end <= start) {
            throw new Error('La hora de fin debe ser mayor que la hora de inicio.');
          }
        }
        return true;
      }),
    body('description')
      .optional()
      .isLength({ min: 10, max: 500 })
      .withMessage('La descripción debe tener entre 10 y 500 caracteres.')
      .trim(),
    body('status')
      .optional()
      .isIn(APPOINTMENT_STATUSES)
      .withMessage('El estado debe ser: Programado, Completado o Cancelado.')
  ],

  /**
   * Validación para cancelar cita
   */
  cancel: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('El ID de la cita debe ser un número entero válido mayor a 0.')
      .toInt(),
    body('cancelReason')
      .notEmpty()
      .withMessage('El motivo de cancelación es obligatorio.')
      .isLength({ min: 10, max: 500 })
      .withMessage('El motivo de cancelación debe tener entre 10 y 500 caracteres.')
      .trim()
  ],

  /**
   * Validación para completar cita
   */
  complete: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('El ID de la cita debe ser un número entero válido mayor a 0.')
      .toInt(),
    body('conclusion')
      .notEmpty()
      .withMessage('La conclusión es obligatoria.')
      .isLength({ min: 10, max: 500 })
      .withMessage('La conclusión debe tener entre 10 y 500 caracteres.')
      .trim()
  ],

  /**
   * Validación para proponer reagendamiento
   */
  reschedule: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('El ID de la cita debe ser un número entero válido mayor a 0.')
      .toInt(),
    body('newDate')
      .notEmpty()
      .withMessage('La nueva fecha es obligatoria.')
      .isISO8601()
      .withMessage('La nueva fecha debe tener formato válido (YYYY-MM-DD).'),
    body('newStartTime')
      .notEmpty()
      .withMessage('La hora de inicio es obligatoria.')
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage('La hora de inicio debe tener formato HH:MM.'),
    body('newEndTime')
      .notEmpty()
      .withMessage('La hora de fin es obligatoria.')
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage('La hora de fin debe tener formato HH:MM.')
      .custom((value, { req }) => {
        if (req.body.newStartTime) {
          const [startHour, startMin] = req.body.newStartTime.split(':').map(Number);
          const [endHour, endMin] = value.split(':').map(Number);
          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;
          if (endMinutes <= startMinutes) {
            throw new Error('La hora de fin debe ser mayor que la hora de inicio.');
          }
        }
        return true;
      })
  ],

  /**
   * Validación para eliminar cita
   */
  delete: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('El ID de la cita debe ser un número entero válido mayor a 0.')
      .toInt()
  ]
};

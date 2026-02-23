// 📁 Services/Employees/EmployeesSchedule/validators/schedule.validator.js
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

/**
 * Validadores para el módulo de horarios de empleados
 */
export const scheduleValidators = {
  /**
   * Validación para obtener todos los horarios (con filtros y paginación)
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
    query('employeeId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('El ID del empleado debe ser un número válido.')
      .toInt(),
    query('dayOfWeek')
      .optional()
      .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
      .withMessage('El día de la semana debe ser: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday o Sunday.'),
    // Estado eliminado del módulo
  ],

  /**
   * Validación para obtener horario por ID
   */
  getById: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('El ID del horario debe ser un número entero válido mayor a 0.')
      .toInt()
  ],

  /**
   * Validación para obtener horarios por empleado
   */
  getByEmployeeId: [
    param('employeeId')
      .isInt({ min: 1 })
      .withMessage('El ID del empleado debe ser un número entero válido mayor a 0.')
      .toInt()
  ],

  /**
   * Validación para crear nuevo horario
   */
  create: [
    body('empleadoId')
      .notEmpty()
      .withMessage('El empleado es obligatorio.')
      .isInt({ min: 1 })
      .withMessage('Debe seleccionar un empleado válido.')
      .toInt(),
    body('fecha')
      .notEmpty()
      .withMessage('La fecha es obligatoria.')
      .isISO8601()
      .withMessage('La fecha debe tener formato válido (YYYY-MM-DD).')
      .custom((value) => {
        // Parsear en horario local para evitar desfases por zona horaria
        const scheduleDate = new Date(`${value}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (scheduleDate < today) {
          throw new Error('No se puede crear un horario en una fecha pasada.');
        }
        const oneYearFromNow = new Date();
        oneYearFromNow.setHours(0, 0, 0, 0);
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        if (scheduleDate > oneYearFromNow) {
          throw new Error('La fecha no puede ser mayor a 1 año en el futuro.');
        }
        return true;
      }),
    body('horaInicio')
      .notEmpty()
      .withMessage('La hora de inicio es obligatoria.')
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage('La hora de inicio debe tener formato HH:MM (24 horas), ejemplo: 08:00 o 14:30.'),
    body('horaFin')
      .notEmpty()
      .withMessage('La hora de fin es obligatoria.')
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage('La hora de fin debe tener formato HH:MM (24 horas), ejemplo: 17:00 o 23:30.')
      .custom((value, { req }) => {
        if (req.body.horaInicio && value <= req.body.horaInicio) {
          throw new Error('La hora de fin debe ser mayor que la hora de inicio.');
        }
        return true;
      }),
    body('repeticion')
      .optional()
      .isIn(['no', 'dia', 'semana', 'mes', 'anio', 'laboral', 'personalizado'])
      .withMessage('El tipo de repetición debe ser: no, dia, semana, mes, anio, laboral o personalizado.'),
    body('customRecurrence')
      .optional()
      .custom((value) => {
        if (value !== null && typeof value !== 'object') {
          throw new Error('La repetición personalizada debe ser un objeto válido o null.');
        }
        return true;
      }),
    body('descripcion')
      .notEmpty()
      .withMessage('La descripción es obligatoria.')
      .isLength({ min: 3, max: 500 })
      .withMessage('La descripción debe tener entre 3 y 500 caracteres.')
      .trim(),
    // Estado eliminado del módulo
  ],

  /**
   * Validación para actualizar horario
   */
  update: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('El ID del horario debe ser un número entero válido mayor a 0.')
      .toInt(),
    body('fecha')
      .optional()
      .isISO8601()
      .withMessage('La fecha debe tener formato válido (YYYY-MM-DD).')
      .custom((value) => {
        const scheduleDate = new Date(`${value}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (scheduleDate < today) {
          throw new Error('No se puede actualizar a una fecha pasada.');
        }
        return true;
      }),
    body('horaInicio')
      .optional()
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage('La hora de inicio debe tener formato HH:MM (24 horas).'),
    body('horaFin')
      .optional()
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage('La hora de fin debe tener formato HH:MM (24 horas).')
      .custom((value, { req }) => {
        if (value && req.body.horaInicio && value <= req.body.horaInicio) {
          throw new Error('La hora de fin debe ser mayor que la hora de inicio.');
        }
        return true;
      }),
    body('repeticion')
      .optional()
      .isIn(['no', 'dia', 'semana', 'mes', 'anio', 'laboral', 'personalizado'])
      .withMessage('El tipo de repetición debe ser: no, dia, semana, mes, anio, laboral o personalizado.'),
    body('customRecurrence')
      .optional(),
    body('descripcion')
      .optional()
      .isLength({ min: 3, max: 500 })
      .withMessage('La descripción debe tener entre 3 y 500 caracteres.')
      .trim(),
    // Estado eliminado del módulo
  ],

  /**
   * Validación para registrar novedad
   */
  novelty: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('El ID del horario debe ser un número entero válido mayor a 0.')
      .toInt(),
    body('fecha')
      .optional()
      .isISO8601()
      .withMessage('La fecha de la novedad debe tener formato válido (YYYY-MM-DD).'),
    body('tipoCancelacion')
      .optional()
      .isIn(['full', 'time'])
      .withMessage('El tipo de novedad debe ser: full o time.'),
    body('horaInicio')
      .optional()
      .matches(/^([01]?\d|2[0-3]):([0-5]\d)$/)
      .withMessage('La hora de inicio debe tener formato HH:MM (24 horas).'),
    body('horaFin')
      .optional()
      .matches(/^([01]?\d|2[0-3]):([0-5]\d)$/)
      .withMessage('La hora de fin debe tener formato HH:MM (24 horas).'),
    body('tiempoCancelacion')
      .optional()
      .custom((value) => {
        if (!value) return true;
        if (value === 'Todo el dia') return true;
        const rangeRegex = /^([01]?\d|2[0-3]):([0-5]\d)\s*-\s*([01]?\d|2[0-3]):([0-5]\d)$/;
        if (!rangeRegex.test(value)) {
          throw new Error('El tiempo de la novedad debe tener formato HH:MM - HH:MM.');
        }
        return true;
      }),
    body('explicacionTiempo')
      .optional()
      .isLength({ min: 3, max: 500 })
      .withMessage('La explicación de la novedad debe tener entre 3 y 500 caracteres.')
      .trim(),
    body('motivoCancelacion')
      .notEmpty()
      .withMessage('El motivo de la novedad es obligatorio.')
      .isLength({ min: 10, max: 500 })
      .withMessage('El motivo de la novedad debe tener entre 10 y 500 caracteres.')
      .trim()
      .custom((value) => {
        if (!/[a-zA-Z0-9]/.test(value)) {
          throw new Error('El motivo debe contener al menos letras o números.');
        }
        const repeated = /(.)\1{9,}/.test(value);
        if (repeated) {
          throw new Error('El motivo de la novedad debe ser descriptivo.');
        }

        return true;
      })
  ],

  /**
   * Validación para eliminar horario
   */
  delete: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('El ID del horario debe ser un número entero válido mayor a 0.')
      .toInt()
  ]
};

// Validadores personalizados adicionales (sin cambios)
export const isWithinBusinessHours = (time) => {
  const [hours] = time.split(':').map(Number);
  if (hours < 6 || hours >= 23) {
    throw new Error('El horario debe estar entre las 06:00 y las 23:00.');
  }
  return true;
};

export const hasMinimumDuration = (startTime, endTime, minHours = 1) => {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  const durationMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
  const durationHours = durationMinutes / 60;
  if (durationHours < minHours) {
    throw new Error(`El turno debe tener una duración mínima de ${minHours} hora(s).`);
  }
  return true;
};

export const hasMaximumDuration = (startTime, endTime, maxHours = 12) => {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  const durationMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
  const durationHours = durationMinutes / 60;
  if (durationHours > maxHours) {
    throw new Error(`El turno no puede exceder ${maxHours} horas de duración.`);
  }
  return true;
};

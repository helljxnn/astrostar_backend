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
 * Validadores para categorías deportivas
 */
export const sportsCategoryValidators = {

  getAll: [
    query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un número entero mayor o igual a 1.').toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100.').toInt(),
    query('search').optional().isString().isLength({ max: 100 }).withMessage('El término de búsqueda no puede exceder 100 caracteres.').trim(),
    query('status').optional().isIn(['Activo', 'Inactivo']).withMessage('El estado debe ser "Activo" o "Inactivo".')
  ],

  checkName: [
    query('name').notEmpty().withMessage('El nombre es obligatorio.').isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres.').trim(),
    query('excludeId').optional().isInt({ min: 1 }).withMessage('El ID a excluir debe ser un entero positivo.').toInt()
  ],

  getById: [
    param('id').isInt({ min: 1 }).withMessage('El ID de la categoría debe ser un número entero válido.').toInt()
  ],

  create: [
    body('name').notEmpty().withMessage('El nombre es obligatorio.').isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres.').trim(),
    body('description').optional({ nullable: true }).isString().isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres.').trim(),
    body('minAge').notEmpty().withMessage('La edad mínima es obligatoria.').isInt({ min: 5, max: 79 }).withMessage('La edad mínima debe estar entre 5 y 79 años.').toInt(),
    body('maxAge').notEmpty().withMessage('La edad máxima es obligatoria.').isInt({ min: 6, max: 80 }).withMessage('La edad máxima debe estar entre 6 y 80 años.')
      .custom((value, { req }) => {
        if (parseInt(value) <= parseInt(req.body.minAge)) throw new Error('La edad máxima debe ser mayor que la mínima.');
        return true;
      }).toInt(),
    body('status').optional().isIn(['Activo', 'Inactivo']).withMessage('El estado debe ser "Activo" o "Inactivo".').default('Activo'),
    body('publicar').optional().isBoolean().withMessage('publicar debe ser true o false.').default(false)
  ],

  update: [
    param('id').isInt({ min: 1 }).withMessage('El ID de la categoría debe ser un número entero válido.').toInt(),
    body('name').optional().isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres.').trim(),
    body('description').optional().isString().isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres.').trim(),
    body('minAge').optional().isInt({ min: 5, max: 79 }).withMessage('La edad mínima debe estar entre 5 y 79 años.').toInt(),
    body('maxAge').optional().isInt({ min: 6, max: 80 }).withMessage('La edad máxima debe estar entre 6 y 80 años.')
      .custom((value, { req }) => {
        const minAge = req.body.minAge !== undefined ? parseInt(req.body.minAge) : req.existingCategory?.edadMinima;
        if (parseInt(value) <= minAge) throw new Error('La edad máxima debe ser mayor que la mínima.');
        return true;
      }).toInt(),
    body('status').optional().isIn(['Activo', 'Inactivo']).withMessage('El estado debe ser "Activo" o "Inactivo".'),
    body('publicar').optional().isBoolean().withMessage('publicar debe ser true o false.')
  ],

  delete: [
    param('id').isInt({ min: 1 }).withMessage('El ID de la categoría debe ser un número entero válido.').toInt()
  ]
};

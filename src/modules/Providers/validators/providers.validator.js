import { body, param, query, validationResult } from "express-validator";

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
 * Validadores para proveedores
 */
export const providersValidators = {
  
  /**
   * Validación para obtener todos los proveedores
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
      .isLength({ max: 100 })
      .withMessage('La búsqueda no puede exceder 100 caracteres.')
      .trim(),
    
    query('status')
      .optional({ checkFalsy: true })
      .isIn(['Activo', 'Inactivo'])
      .withMessage('El estado debe ser: Activo o Inactivo.'),
      
    query('entityType')
      .optional({ checkFalsy: true })
      .isIn(['juridica', 'natural'])
      .withMessage('El tipo de entidad debe ser: juridica o natural.')
  ],

  /**
   * Validación para obtener proveedor por ID
   */
  getById: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('El ID del proveedor debe ser un número entero válido.')
      .toInt()
  ],

  /**
   * Validación para crear proveedor
   */
  create: [
    // Tipo de entidad
    body('tipoEntidad')
      .notEmpty()
      .withMessage('El tipo de entidad es obligatorio.')
      .isIn(['juridica', 'natural'])
      .withMessage('El tipo de entidad debe ser "juridica" o "natural".'),

    // Razón social / Nombre
    body('razonSocial')
      .notEmpty()
      .withMessage((value, { req }) => 
        req.body.tipoEntidad === 'juridica' 
          ? 'La razón social es obligatoria.' 
          : 'El nombre completo es obligatorio.'
      )
      .isLength({ min: 3, max: 200 })
      .withMessage((value, { req }) => 
        req.body.tipoEntidad === 'juridica'
          ? 'La razón social debe tener entre 3 y 200 caracteres.'
          : 'El nombre debe tener entre 3 y 200 caracteres.'
      )
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\.,\-&()]+$/)
      .withMessage('Solo se permiten letras, números, espacios y caracteres especiales básicos.')
      .trim(),

    // NIT / Documento de identidad
    body('nit')
      .notEmpty()
      .withMessage((value, { req }) => 
        req.body.tipoEntidad === 'juridica'
          ? 'El NIT es obligatorio.'
          : 'El documento de identidad es obligatorio.'
      )
      .isLength({ min: 6, max: 20 })
      .withMessage('El documento debe tener entre 6 y 20 caracteres.')
      .custom((value, { req }) => {
        const cleanedValue = value.replace(/[.\-\s]/g, '');
        
        if (req.body.tipoEntidad === 'juridica') {
          // PERSONA JURÍDICA: Solo números (NIT colombiano)
          if (!/^\d{8,15}$/.test(cleanedValue)) {
            throw new Error('El NIT debe contener entre 8 y 15 dígitos numéricos.');
          }
        } else {
          // PERSONA NATURAL: Permite letras y números (documentos extranjeros)
          if (!/^[a-zA-Z0-9\-]{6,20}$/.test(cleanedValue)) {
            throw new Error('El documento debe contener entre 6 y 20 caracteres alfanuméricos.');
          }
        }
        
        return true;
      })
      .trim(),

    // Tipo de documento (solo para persona natural)
    body('tipoDocumento')
      .optional()
      .custom((value, { req }) => {
        if (req.body.tipoEntidad === 'natural' && !value) {
          throw new Error('Debe seleccionar un tipo de documento para persona natural.');
        }
        if (value && (!Number.isInteger(parseInt(value)) || parseInt(value) < 1)) {
          throw new Error('Debe seleccionar un tipo de documento válido.');
        }
        return true;
      }),

    // Contacto principal
    body('contactoPrincipal')
      .notEmpty()
      .withMessage('El contacto principal es obligatorio.')
      .isLength({ min: 2, max: 150 })
      .withMessage('El contacto principal debe tener entre 2 y 150 caracteres.')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage('El contacto principal solo puede contener letras y espacios.')
      .trim(),

    // Correo electrónico
    body('correo')
      .optional({ nullable: true })
      .isEmail()
      .withMessage('Debe proporcionar un email válido.')
      .isLength({ max: 150 })
      .withMessage('El email no puede exceder 150 caracteres.')
      .trim()
      .toLowerCase(),

    // Teléfono
    body('telefono')
      .notEmpty()
      .withMessage('El número telefónico es obligatorio.')
      .isLength({ min: 7, max: 20 })
      .withMessage('El teléfono debe tener entre 7 y 20 caracteres.')
      .matches(/^\+?[\d\s\-()]+$/)
      .withMessage('El formato del teléfono no es válido.')
      .trim(),

    // Dirección
    body('direccion')
      .notEmpty()
      .withMessage('La dirección es obligatoria.')
      .isLength({ min: 10, max: 200 })
      .withMessage('La dirección debe tener entre 10 y 200 caracteres.')
      .trim(),

    // Ciudad
    body('ciudad')
      .notEmpty()
      .withMessage('La ciudad es obligatoria.')
      .isLength({ min: 2, max: 100 })
      .withMessage('La ciudad debe tener entre 2 y 100 caracteres.')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage('La ciudad solo puede contener letras y espacios.')
      .trim(),

    // Descripción (opcional)
    body('descripcion')
      .optional({ nullable: true })
      .isLength({ max: 500 })
      .withMessage('La descripción no puede exceder 500 caracteres.')
      .trim(),

    // Estado
    body('estado')
      .optional()
      .isIn(['Activo', 'Inactivo'])
      .withMessage('El estado debe ser: Activo o Inactivo.')
  ],

  /**
   * Validación para actualizar proveedor
   */
  update: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('El ID del proveedor debe ser un número entero válido.')
      .toInt(),

    // Todos los campos son opcionales en actualización
    body('tipoEntidad')
      .optional()
      .isIn(['juridica', 'natural'])
      .withMessage('El tipo de entidad debe ser "juridica" o "natural".'),

    body('razonSocial')
      .optional()
      .isLength({ min: 3, max: 200 })
      .withMessage((value, { req }) => 
        req.body.tipoEntidad === 'juridica'
          ? 'La razón social debe tener entre 3 y 200 caracteres.'
          : 'El nombre debe tener entre 3 y 200 caracteres.'
      )
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\.,\-&()]+$/)
      .withMessage('Solo se permiten letras, números, espacios y caracteres especiales básicos.')
      .trim(),

    body('nit')
      .optional()
      .isLength({ min: 6, max: 20 })
      .withMessage('El documento debe tener entre 6 y 20 caracteres.')
      .custom((value, { req }) => {
        if (value) {
          const cleanedValue = value.replace(/[.\-\s]/g, '');
          
          if (req.body.tipoEntidad === 'juridica') {
            // PERSONA JURÍDICA: Solo números
            if (!/^\d{8,15}$/.test(cleanedValue)) {
              throw new Error('El NIT debe contener entre 8 y 15 dígitos numéricos.');
            }
          } else {
            // PERSONA NATURAL: Permite letras y números
            if (!/^[a-zA-Z0-9\-]{6,20}$/.test(cleanedValue)) {
              throw new Error('El documento debe contener entre 6 y 20 caracteres alfanuméricos.');
            }
          }
        }
        return true;
      })
      .trim(),

    body('tipoDocumento')
      .optional()
      .custom((value, { req }) => {
        if (value && (!Number.isInteger(parseInt(value)) || parseInt(value) < 1)) {
          throw new Error('Debe seleccionar un tipo de documento válido.');
        }
        return true;
      }),

    body('contactoPrincipal')
      .optional()
      .isLength({ min: 2, max: 150 })
      .withMessage('El contacto principal debe tener entre 2 y 150 caracteres.')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage('El contacto principal solo puede contener letras y espacios.')
      .trim(),

    body('correo')
      .optional()
      .isEmail()
      .withMessage('Debe proporcionar un email válido.')
      .isLength({ max: 150 })
      .withMessage('El email no puede exceder 150 caracteres.')
      .trim()
      .toLowerCase(),

    body('telefono')
      .optional()
      .isLength({ min: 7, max: 20 })
      .withMessage('El teléfono debe tener entre 7 y 20 caracteres.')
      .matches(/^\+?[\d\s\-()]+$/)
      .withMessage('El formato del teléfono no es válido.')
      .trim(),

    body('direccion')
      .optional()
      .isLength({ min: 10, max: 200 })
      .withMessage('La dirección debe tener entre 10 y 200 caracteres.')
      .trim(),

    body('ciudad')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('La ciudad debe tener entre 2 y 100 caracteres.')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage('La ciudad solo puede contener letras y espacios.')
      .trim(),

    body('descripcion')
      .optional({ nullable: true })
      .isLength({ max: 500 })
      .withMessage('La descripción no puede exceder 500 caracteres.')
      .trim(),

    body('estado')
      .optional()
      .isIn(['Activo', 'Inactivo'])
      .withMessage('El estado debe ser: Activo o Inactivo.')
  ],

  /**
   * Validación para eliminar proveedor
   */
  delete: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('El ID del proveedor debe ser un número entero válido.')
      .toInt()
  ],

  /**
   * Validación para cambiar estado
   */
  changeStatus: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('El ID del proveedor debe ser un número entero válido.')
      .toInt(),

    body('status')
      .notEmpty()
      .withMessage('El estado es obligatorio.')
      .isIn(['Activo', 'Inactivo'])
      .withMessage('El estado debe ser: Activo o Inactivo.')
  ],

  /**
   * Validación para verificar disponibilidad de NIT/documento
   */
  checkNit: [
    query('nit')
      .notEmpty()
      .withMessage((value, { req }) => 
        req.query.tipoEntidad === 'juridica'
          ? 'El NIT es obligatorio.' 
          : 'El documento de identidad es obligatorio.'
      )
      .isLength({ min: 6, max: 20 })
      .withMessage('El documento debe tener entre 6 y 20 caracteres.')
      .custom((value, { req }) => {
        const cleanedValue = value.replace(/[.\-\s]/g, '');
        
        if (req.query.tipoEntidad === 'juridica') {
          // PERSONA JURÍDICA: Solo números
          if (!/^\d{8,15}$/.test(cleanedValue)) {
            throw new Error('El NIT debe contener entre 8 y 15 dígitos numéricos.');
          }
        } else {
          // PERSONA NATURAL: Permite letras y números
          if (!/^[a-zA-Z0-9\-]{6,20}$/.test(cleanedValue)) {
            throw new Error('El documento debe contener entre 6 y 20 caracteres alfanuméricos.');
          }
        }
        
        return true;
      })
      .trim(),

    query('excludeId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('El excludeId debe ser un número entero válido.')
      .toInt(),

    query('tipoEntidad')
      .optional()
      .isIn(['juridica', 'natural'])
      .withMessage('El tipo de entidad debe ser "juridica" o "natural".')
  ],

  /**
   * Validación para verificar disponibilidad de razón social/nombre
   */
  checkBusinessName: [
    query('businessName')
      .notEmpty()
      .withMessage((value, { req }) => 
        req.query.tipoEntidad === 'juridica'
          ? 'La razón social es requerida.' 
          : 'El nombre es requerido.'
      )
      .isLength({ min: 3, max: 200 })
      .withMessage('Debe tener entre 3 y 200 caracteres.')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\.,\-&()]+$/)
      .withMessage('Solo se permiten letras, números, espacios y caracteres especiales básicos.')
      .trim(),

    query('excludeId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('El excludeId debe ser un número entero válido.')
      .toInt(),

    query('tipoEntidad')
      .optional()
      .isIn(['juridica', 'natural'])
      .withMessage('El tipo de entidad debe ser "juridica" o "natural".')
  ],

  /**
   * Validación para verificar disponibilidad de email
   */
  checkEmail: [
    query('email')
      .notEmpty()
      .withMessage('El email es obligatorio.')
      .isEmail()
      .withMessage('Debe proporcionar un email válido.')
      .isLength({ max: 150 })
      .withMessage('El email no puede exceder 150 caracteres.')
      .trim()
      .toLowerCase(),
    
    query('excludeId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('El ID a excluir debe ser un número entero válido.')
      .toInt()
  ],

  /**
   * Validación para verificar disponibilidad de contacto
   */
  checkContact: [
    query('contact')
      .notEmpty()
      .withMessage('El nombre de contacto es obligatorio.')
      .isLength({ min: 2, max: 150 })
      .withMessage('El contacto debe tener entre 2 y 150 caracteres.')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage('El contacto solo puede contener letras y espacios.')
      .trim(),

    query('excludeId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('El ID a excluir debe ser un número entero válido.')
      .toInt()
  ]
};
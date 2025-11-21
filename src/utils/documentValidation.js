/**
 * Reglas de validación para tipos de documento en Colombia
 */

export const documentValidationRules = {
  'Cédula de Ciudadanía': {
    minLength: 6,
    maxLength: 10,
    pattern: /^[0-9]+$/,
    errorMessage: 'La cédula debe tener entre 6 y 10 dígitos numéricos'
  },
  'Tarjeta de Identidad': {
    minLength: 10,
    maxLength: 11,
    pattern: /^[0-9]+$/,
    errorMessage: 'La tarjeta de identidad debe tener entre 10 y 11 dígitos numéricos'
  },
  'Cédula de Extranjería': {
    minLength: 6,
    maxLength: 10,
    pattern: /^[0-9]+$/,
    errorMessage: 'La cédula de extranjería debe tener entre 6 y 10 dígitos numéricos'
  },
  'Pasaporte': {
    minLength: 6,
    maxLength: 20,
    pattern: /^[A-Z0-9]+$/i,
    errorMessage: 'El pasaporte debe tener entre 6 y 20 caracteres alfanuméricos'
  },
  'Permiso de Permanencia': {
    minLength: 6,
    maxLength: 15,
    pattern: /^[A-Z0-9-]+$/i,
    errorMessage: 'El permiso debe tener entre 6 y 15 caracteres alfanuméricos'
  },
  'Tarjeta de Extranjería': {
    minLength: 6,
    maxLength: 15,
    pattern: /^[A-Z0-9-]+$/i,
    errorMessage: 'La tarjeta de extranjería debe tener entre 6 y 15 caracteres alfanuméricos'
  },
  'Número de Identificación Extranjero': {
    minLength: 6,
    maxLength: 20,
    pattern: /^[A-Z0-9-]+$/i,
    errorMessage: 'El número de identificación debe tener entre 6 y 20 caracteres alfanuméricos'
  },
  'Número de Identificación Tributaria': {
    minLength: 9,
    maxLength: 10,
    pattern: /^[0-9]+$/,
    errorMessage: 'El NIT debe tener entre 9 y 10 dígitos numéricos'
  }
};

/**
 * Valida un número de documento según su tipo
 * @param {string} documentTypeName - Nombre del tipo de documento
 * @param {string} documentNumber - Número de documento a validar
 * @returns {Object} { isValid: boolean, error: string }
 */
export const validateDocumentNumber = (documentTypeName, documentNumber) => {
  if (!documentNumber || !documentNumber.trim()) {
    return {
      isValid: false,
      error: 'El número de documento es obligatorio'
    };
  }

  const rules = documentValidationRules[documentTypeName];
  
  if (!rules) {
    // Si no hay reglas específicas, validación básica
    if (documentNumber.length < 6 || documentNumber.length > 20) {
      return {
        isValid: false,
        error: 'El documento debe tener entre 6 y 20 caracteres'
      };
    }
    return { isValid: true, error: '' };
  }

  const trimmedDoc = documentNumber.trim();

  // Validar longitud
  if (trimmedDoc.length < rules.minLength || trimmedDoc.length > rules.maxLength) {
    return {
      isValid: false,
      error: rules.errorMessage
    };
  }

  // Validar patrón
  if (!rules.pattern.test(trimmedDoc)) {
    return {
      isValid: false,
      error: rules.errorMessage
    };
  }

  return { isValid: true, error: '' };
};

/**
 * Middleware de validación de documento para express-validator
 */
export const createDocumentValidator = (documentTypeField = 'documentTypeId') => {
  return async (value, { req }) => {
    // Obtener el tipo de documento
    const documentTypeId = req.body[documentTypeField];
    
    if (!documentTypeId) {
      throw new Error('Debe seleccionar un tipo de documento');
    }

    // Aquí podrías buscar el nombre del tipo de documento en la BD
    // Por ahora, asumimos que se valida en el servicio
    
    return true;
  };
};

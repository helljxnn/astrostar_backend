// middlewares/sportsCategoryValidation.js

export const validateSportsCategory = (req, res, next) => {
  const { nombre, edadMinima, edadMaxima, descripcion, estado, archivo } = req.body;
  const errors = [];

  // Validar nombre
  if (!nombre || nombre.trim().length === 0) {
    errors.push('El nombre de la categoría es obligatorio');
  } else if (nombre.trim().length < 3) {
    errors.push('El nombre debe tener al menos 3 caracteres');
  } else if (nombre.trim().length > 50) {
    errors.push('El nombre no puede exceder 50 caracteres');
  }

  // Validar edad mínima
  if (edadMinima === undefined || edadMinima === null || edadMinima === '') {
    errors.push('La edad mínima es obligatoria');
  } else {
    const minAge = parseInt(edadMinima);
    if (isNaN(minAge)) {
      errors.push('La edad mínima debe ser un número válido');
    } else if (minAge < 5) {
      errors.push('La edad mínima debe ser mayor o igual a 5 años');
    } else if (minAge > 50) {
      errors.push('La edad mínima no puede ser mayor a 50 años');
    }
  }

  // Validar edad máxima
  if (edadMaxima === undefined || edadMaxima === null || edadMaxima === '') {
    errors.push('La edad máxima es obligatoria');
  } else {
    const maxAge = parseInt(edadMaxima);
    if (isNaN(maxAge)) {
      errors.push('La edad máxima debe ser un número válido');
    } else if (maxAge > 80) {
      errors.push('La edad máxima no puede ser mayor a 80 años');
    } else if (edadMinima && maxAge <= parseInt(edadMinima)) {
      errors.push('La edad máxima debe ser mayor que la edad mínima');
    }
  }

  // Validar descripción (opcional, pero con reglas si se proporciona)
  if (descripcion && descripcion.trim().length > 0) {
    if (descripcion.trim().length < 10) {
      errors.push('La descripción debe tener al menos 10 caracteres');
    } else if (descripcion.trim().length > 500) {
      errors.push('La descripción no puede exceder 500 caracteres');
    }
  }

  // Validar estado
  if (!estado) {
    errors.push('Debe seleccionar un estado para la categoría');
  } else if (!['Activo', 'Inactivo'].includes(estado)) {
    errors.push('El estado debe ser "Activo" o "Inactivo"');
  }

  // Validar archivo (obligatorio en creación, opcional en actualización)
  if (req.method === 'POST' && !archivo) {
    errors.push('Debe subir un archivo antes de continuar');
  }

  // Si hay errores, devolver respuesta
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors
    });
  }

  next();
};
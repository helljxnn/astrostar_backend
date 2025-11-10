/**
 * Middleware para validaciones de lógica de negocio específicas
 * Validaciones que requieren conocimiento del contexto del negocio
 */

/**
 * Validación de lógica de negocio para personas temporales
 */
export const validateTemporaryPersonBusinessLogic = (req, res, next) => {
  const { personType, team, category, birthDate, age, identification, email } = req.body;
  const errors = [];

  // Validar coherencia entre fecha de nacimiento y edad
  if (birthDate && age) {
    const calculatedAge = calculateAge(birthDate);
    if (Math.abs(calculatedAge - parseInt(age)) > 1) {
      errors.push('La edad proporcionada no coincide con la fecha de nacimiento');
    }
  }

  // Validar que deportistas y entrenadores tengan información coherente
  if (personType === 'Deportista' || personType === 'Entrenador') {
    // Si se especifica equipo o categoría, no pueden estar vacíos
    if (team !== undefined && team !== null && team.trim() === '') {
      errors.push('Si se especifica un equipo para deportistas/entrenadores, no puede estar vacío');
    }
    
    if (category !== undefined && category !== null && category.trim() === '') {
      errors.push('Si se especifica una categoría para deportistas/entrenadores, no puede estar vacía');
    }

    // Validar edad mínima para deportistas
    const personAge = age || (birthDate ? calculateAge(birthDate) : null);
    if (personAge && personAge < 5) {
      errors.push('Los deportistas y entrenadores deben tener al menos 5 años de edad');
    }
  }

  // Validar que participantes no tengan restricciones específicas
  if (personType === 'Participante') {
    // Los participantes pueden tener cualquier edad válida (5+)
    const personAge = age || (birthDate ? calculateAge(birthDate) : null);
    if (personAge && personAge < 5) {
      errors.push('Los participantes deben tener al menos 5 años de edad');
    }
  }

  // Validar que si se proporciona identificación, sea coherente con la edad
  if (identification && birthDate) {
    const personAge = calculateAge(birthDate);
    // En Colombia, la cédula se obtiene a los 18 años
    if (personAge < 18 && identification.length > 11) {
      errors.push('Las personas menores de 18 años generalmente tienen tarjeta de identidad, no cédula');
    }
  }

  // Validar formato de email según el tipo de persona
  if (email && personType === 'Entrenador') {
    // Los entrenadores deberían tener emails más formales
    if (email.includes('hotmail') || email.includes('gmail')) {
      // Esto es solo una advertencia, no un error bloqueante
      console.warn(`Entrenador con email personal: ${email}`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación de lógica de negocio',
      errors: errors.map(error => ({
        field: 'businessLogic',
        message: error,
        type: 'business_rule'
      }))
    });
  }

  next();
};

/**
 * Validación para verificar que no se eliminen personas temporales activas
 */
export const validateTemporaryPersonDeletion = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Esta validación se hace en el servicio, pero podemos agregar validaciones adicionales aquí
    // Por ejemplo, verificar si la persona está asignada a equipos activos
    
    next();
  } catch (error) {
    console.error('Error in deletion validation:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor durante la validación de eliminación'
    });
  }
};

/**
 * Validación para actualizaciones que requieren aprobación
 */
export const validateCriticalUpdates = (req, res, next) => {
  const { status, personType } = req.body;
  const warnings = [];

  // Advertir sobre cambios críticos
  if (status === 'Inactive') {
    warnings.push('Cambiar el estado a Inactivo puede afectar la participación en eventos');
  }

  if (personType && req.method === 'PUT') {
    warnings.push('Cambiar el tipo de persona puede requerir actualizar información adicional');
  }

  // Agregar advertencias al request para que el controlador las maneje
  req.validationWarnings = warnings;
  
  next();
};

/**
 * Función auxiliar para calcular edad
 */
function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age >= 0 ? age : 0;
}

/**
 * Middleware para sanitizar datos de entrada
 */
export const sanitizeTemporaryPersonData = (req, res, next) => {
  const { body } = req;

  // Limpiar y normalizar datos
  if (body.firstName) {
    body.firstName = body.firstName.trim().replace(/\s+/g, ' ');
  }
  
  if (body.lastName) {
    body.lastName = body.lastName.trim().replace(/\s+/g, ' ');
  }
  
  if (body.email) {
    body.email = body.email.toLowerCase().trim();
  }
  
  if (body.identification) {
    body.identification = body.identification.trim().replace(/\s+/g, '');
  }
  
  if (body.phone) {
    body.phone = body.phone.trim();
  }
  
  if (body.address) {
    body.address = body.address.trim().replace(/\s+/g, ' ');
  }
  
  if (body.team) {
    body.team = body.team ? body.team.trim().replace(/\s+/g, ' ') : null;
  }
  
  if (body.category) {
    body.category = body.category ? body.category.trim().replace(/\s+/g, ' ') : null;
  }

  // Convertir strings vacíos a null para campos opcionales
  const optionalFields = ['identification', 'email', 'phone', 'address', 'team', 'category'];
  optionalFields.forEach(field => {
    if (body[field] === '') {
      body[field] = null;
    }
  });

  next();
};
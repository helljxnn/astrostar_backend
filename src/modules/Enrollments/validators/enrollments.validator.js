// Validación simple sin dependencias externas
const validateAthlete = (athlete) => {
  const errors = [];
  
  if (!athlete.firstName || athlete.firstName.length < 2) {
    errors.push({ field: 'firstName', message: 'Nombre es requerido (mínimo 2 caracteres)' });
  }
  
  if (!athlete.lastName || athlete.lastName.length < 2) {
    errors.push({ field: 'lastName', message: 'Apellido es requerido (mínimo 2 caracteres)' });
  }
  
  if (!athlete.documentTypeId) {
    errors.push({ field: 'documentTypeId', message: 'Tipo de documento es requerido' });
  }
  
  if (!athlete.identification || athlete.identification.length < 6) {
    errors.push({ field: 'identification', message: 'Identificación es requerida (mínimo 6 caracteres)' });
  }
  
  if (!athlete.email) {
    errors.push({ field: 'email', message: 'Email es requerido' });
  }
  
  if (!athlete.phoneNumber) {
    errors.push({ field: 'phoneNumber', message: 'Teléfono es requerido' });
  }
  
  if (!athlete.birthDate) {
    errors.push({ field: 'birthDate', message: 'Fecha de nacimiento es requerida' });
  }
  
  if (!athlete.categoria) {
    errors.push({ field: 'categoria', message: 'Categoría es requerida' });
  }
  
  return errors;
};

const validateEnrollment = (enrollment) => {
  const errors = [];
  const validStates = ["Vigente", "Suspendida", "Vencida", "Cancelada"];
  
  if (enrollment.estado && !validStates.includes(enrollment.estado)) {
    errors.push({ field: 'estado', message: 'Estado inválido' });
  }
  
  return errors;
};

export const enrollmentSchemas = {
  create: {
    validate: (data) => {
      const errors = [];
      
      if (!data.athlete) {
        errors.push({ field: 'athlete', message: 'Datos del deportista son requeridos' });
      } else {
        errors.push(...validateAthlete(data.athlete));
      }
      
      if (!data.enrollment) {
        errors.push({ field: 'enrollment', message: 'Datos de matrícula son requeridos' });
      } else {
        errors.push(...validateEnrollment(data.enrollment));
      }
      
      if (errors.length > 0) {
        return { error: { details: errors }, value: null };
      }
      
      return { error: null, value: data };
    }
  },

  update: {
    validate: (data) => {
      const errors = validateEnrollment(data);
      
      if (errors.length > 0) {
        return { error: { details: errors }, value: null };
      }
      
      return { error: null, value: data };
    }
  }
};

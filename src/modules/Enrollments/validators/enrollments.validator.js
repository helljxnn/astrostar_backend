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
  
  // Categoría es opcional - puede venir como categoria, category, o sportsCategoryId
  // No es obligatoria para la creación de matrícula
  
  return errors;
};

const validateEnrollment = (enrollment) => {
  const errors = [];
  const validStates = ["Vigente", "Vencida", "Pending_Payment"];
  
  if (enrollment.estado && !validStates.includes(enrollment.estado)) {
    errors.push({ field: 'estado', message: 'Estado inválido' });
  }
  
  return errors;
};

const validateLegacyEnrollment = (enrollment) => {
  const errors = [];
  const validStates = ["Vigente", "Vencida"];

  if (!enrollment.estado) {
    errors.push({ field: "estado", message: "Estado de matricula es requerido" });
    return errors;
  }

  if (!validStates.includes(enrollment.estado)) {
    errors.push({
      field: "estado",
      message: "Estado invalido para importacion legacy. Usa Vigente o Vencida",
    });
  }

  return errors;
};

const validateLegacyImportPayload = (data) => {
  const errors = [];

  if (!data.athlete) {
    errors.push({ field: "athlete", message: "Datos del deportista son requeridos" });
  } else {
    errors.push(...validateAthlete(data.athlete));
  }

  if (!data.enrollment) {
    errors.push({ field: "enrollment", message: "Datos de matricula son requeridos" });
  } else {
    errors.push(...validateLegacyEnrollment(data.enrollment));
  }

  if (errors.length > 0) {
    return { error: { details: errors }, value: null };
  }

  return { error: null, value: data };
};

const validateLegacyImportBatchPayload = (data) => {
  const errors = [];

  if (!data || typeof data !== "object") {
    errors.push({ field: "body", message: "El cuerpo de la solicitud es requerido" });
  }

  if (!Array.isArray(data?.records) || data.records.length === 0) {
    errors.push({
      field: "records",
      message: "Debes enviar al menos un registro para la importación masiva",
    });
  }

  if (errors.length > 0) {
    return { error: { details: errors }, value: null };
  }

  return { error: null, value: data };
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
  },

  legacyImport: {
    validate: (data) => validateLegacyImportPayload(data)
  },

  legacyImportBatch: {
    validate: (data) => validateLegacyImportBatchPayload(data)
  }
};


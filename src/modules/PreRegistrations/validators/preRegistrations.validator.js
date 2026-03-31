// Validación simple sin dependencias externas
export const preRegistrationSchemas = {
  create: {
    validate: (data) => {
      const errors = [];
      
      if (!data.firstName || data.firstName.length < 2) {
        errors.push({ field: 'firstName', message: 'Primer nombre es requerido (mínimo 2 caracteres)' });
      }
      
      if (!data.lastName || data.lastName.length < 2) {
        errors.push({ field: 'lastName', message: 'Primer apellido es requerido (mínimo 2 caracteres)' });
      }

      if (!data.identification || data.identification.length < 6) {
        errors.push({ field: 'identification', message: 'Número de documento es requerido (mínimo 6 caracteres)' });
      }
      
      if (!data.birthDate) {
        errors.push({ field: 'birthDate', message: 'Fecha de nacimiento es requerida' });
      }
      
      if (!data.phoneNumber) {
        errors.push({ field: 'phoneNumber', message: 'Teléfono es requerido' });
      }
      
      if (!data.email) {
        errors.push({ field: 'email', message: 'Correo es requerido' });
      }

      if (data.acceptDataPolicy !== true) {
        errors.push({
          field: 'acceptDataPolicy',
          message: 'Debes aceptar la política de tratamiento de datos'
        });
      }
      
      // middleName y secondLastName son opcionales, no se validan
      
      if (errors.length > 0) {
        return { error: { details: errors }, value: null };
      }
      
      return { error: null, value: data };
    }
  }
};


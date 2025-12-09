// Validación simple sin dependencias externas
export const preRegistrationSchemas = {
  create: {
    validate: (data) => {
      const errors = [];
      
      if (!data.nombres || data.nombres.length < 2) {
        errors.push({ field: 'nombres', message: 'Nombres son requeridos (mínimo 2 caracteres)' });
      }
      
      if (!data.apellidos || data.apellidos.length < 2) {
        errors.push({ field: 'apellidos', message: 'Apellidos son requeridos (mínimo 2 caracteres)' });
      }

      // numeroDocumento es opcional, no requiere validación adicional
      
      if (!data.fechaNacimiento) {
        errors.push({ field: 'fechaNacimiento', message: 'Fecha de nacimiento es requerida' });
      }
      
      if (!data.telefono) {
        errors.push({ field: 'telefono', message: 'Teléfono es requerido' });
      }
      
      if (!data.correo) {
        errors.push({ field: 'correo', message: 'Correo es requerido' });
      }
      
      if (errors.length > 0) {
        return { error: { details: errors }, value: null };
      }
      
      return { error: null, value: data };
    }
  }
};

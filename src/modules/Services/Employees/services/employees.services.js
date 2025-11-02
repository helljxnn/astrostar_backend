import bcrypt from 'bcrypt';
import { EmployeeRepository } from '../repository/employees.repository.js';
import emailService from '../../../../services/emailService.js';

export class EmployeeService {
  constructor() {
    this.employeeRepository = new EmployeeRepository();
  }

  /**
   * Calcular edad basada en fecha de nacimiento
   */
  calculateAge(birthDate) {
    if (!birthDate) return null;
    
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age >= 0 ? age : null;
  }

  /**
   * Obtener todos los empleados con filtros
   */
  async getAllEmployees({ page = 1, limit = 10, search = '', status = '' }) {
    try {
      const result = await this.employeeRepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status
      });

      return result;
    } catch (error) {
      console.error('Service error - getAllEmployees:', error);
      throw error;
    }
  }

  /**
   * Obtener empleado por ID
   */
  async getEmployeeById(id) {
    try {
      const employee = await this.employeeRepository.findById(id);
      
      if (!employee) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el empleado con ID ${id}.`
        };
      }

      return {
        success: true,
        data: employee
      };
    } catch (error) {
      console.error('Service error - getEmployeeById:', error);
      throw error;
    }
  }

  /**
   * Crear empleado con usuario
   */
  async createEmployee(employeeData) {
    try {
      // 1. REGLA DE NEGOCIO: Verificar email único
      const existingUserByEmail = await this.employeeRepository.findByEmail(employeeData.email);
      if (existingUserByEmail) {
        throw new Error(`El email "${employeeData.email}" ya está en uso.`);
      }

      // 2. REGLA DE NEGOCIO: Verificar identificación única
      const existingUserByIdentification = await this.employeeRepository.findByIdentification(employeeData.identification);
      if (existingUserByIdentification) {
        throw new Error(`La identificación "${employeeData.identification}" ya está en uso.`);
      }

      // 3. REGLA DE NEGOCIO: Generar contraseña temporal si no se proporciona
      const temporaryPassword = employeeData.temporaryPassword || this.generateTemporaryPassword();
      const passwordHash = await bcrypt.hash(temporaryPassword, 10);

      // 4. Preparar datos del usuario
      const birthDate = employeeData.birthDate ? new Date(employeeData.birthDate) : new Date();
      const age = this.calculateAge(birthDate);
      
      const userData = {
        firstName: employeeData.firstName?.trim() || '',
        middleName: employeeData.middleName?.trim() || null,
        lastName: employeeData.lastName?.trim() || '',
        secondLastName: employeeData.secondLastName?.trim() || null,
        email: employeeData.email?.trim().toLowerCase() || '',
        passwordHash,
        phoneNumber: employeeData.phoneNumber?.trim() || null,
        address: employeeData.address?.trim() || null,
        birthDate: birthDate,
        age: age,
        identification: employeeData.identification?.trim() || '',
        status: 'Active',
        documentTypeId: employeeData.documentTypeId ? parseInt(employeeData.documentTypeId) : null,
        roleId: employeeData.roleId ? parseInt(employeeData.roleId) : null
      };

      // 5. Preparar datos del empleado
      const employeeDataForDB = {
        status: employeeData.status || 'Active'
      };

      // 6. Crear empleado y usuario en transacción
      const newEmployee = await this.employeeRepository.create(employeeDataForDB, userData);

      // 7. REGLA DE NEGOCIO: Enviar credenciales por email
      const emailResult = await this.sendWelcomeEmail(newEmployee, temporaryPassword);

      return {
        success: true,
        data: newEmployee,
        temporaryPassword: process.env.NODE_ENV === 'development' ? temporaryPassword : undefined,
        emailSent: emailResult.success,
        message: `Empleado "${newEmployee.user.firstName} ${newEmployee.user.lastName}" creado exitosamente. ${emailResult.success ? 'Credenciales enviadas por email.' : 'Error enviando credenciales por email.'}`
      };
    } catch (error) {
      console.error('Service error - createEmployee:', error);
      throw error;
    }
  }

  /**
   * Actualizar empleado
   */
  async updateEmployee(id, updateData) {
    try {
      // 1. REGLA DE NEGOCIO: Verificar que el empleado existe
      const existingEmployee = await this.employeeRepository.findById(id);
      if (!existingEmployee) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el empleado con ID ${id}.`
        };
      }

      // 2. REGLA DE NEGOCIO: Verificar email único (si se está actualizando)
      if (updateData.email && updateData.email !== existingEmployee.user.email) {
        const existingUserByEmail = await this.employeeRepository.findByEmail(updateData.email);
        if (existingUserByEmail && existingUserByEmail.id !== existingEmployee.userId) {
          throw new Error(`El email "${updateData.email}" ya está en uso por otro usuario.`);
        }
      }

      // 3. REGLA DE NEGOCIO: Verificar identificación única (si se está actualizando)
      if (updateData.identification && updateData.identification !== existingEmployee.user.identification) {
        const existingUserByIdentification = await this.employeeRepository.findByIdentification(updateData.identification);
        if (existingUserByIdentification && existingUserByIdentification.id !== existingEmployee.userId) {
          throw new Error(`La identificación "${updateData.identification}" ya está en uso por otro usuario.`);
        }
      }

      // 4. Separar datos de usuario y empleado
      const userData = {};
      const employeeData = { userId: existingEmployee.userId };

      // Campos de usuario
      if (updateData.firstName !== undefined) userData.firstName = updateData.firstName?.trim() || '';
      if (updateData.middleName !== undefined) userData.middleName = updateData.middleName?.trim() || null;
      if (updateData.lastName !== undefined) userData.lastName = updateData.lastName?.trim() || '';
      if (updateData.secondLastName !== undefined) userData.secondLastName = updateData.secondLastName?.trim() || null;
      if (updateData.email !== undefined) userData.email = updateData.email?.trim().toLowerCase() || '';
      if (updateData.phoneNumber !== undefined) userData.phoneNumber = updateData.phoneNumber?.trim() || null;
      if (updateData.address !== undefined) userData.address = updateData.address?.trim() || null;
      if (updateData.birthDate !== undefined) {
        userData.birthDate = updateData.birthDate ? new Date(updateData.birthDate) : null;
        userData.age = userData.birthDate ? this.calculateAge(userData.birthDate) : null;
      }
      if (updateData.identification !== undefined) userData.identification = updateData.identification?.trim() || '';
      if (updateData.documentTypeId !== undefined) userData.documentTypeId = updateData.documentTypeId ? parseInt(updateData.documentTypeId) : null;
      if (updateData.roleId !== undefined) userData.roleId = updateData.roleId ? parseInt(updateData.roleId) : null;

      // Campos de empleado
      if (updateData.status !== undefined) employeeData.status = updateData.status || 'Active';

      // 5. Actualizar empleado
      const updatedEmployee = await this.employeeRepository.update(id, employeeData, userData);

      return {
        success: true,
        data: updatedEmployee,
        message: `Empleado "${updatedEmployee.user.firstName} ${updatedEmployee.user.lastName}" actualizado exitosamente.`
      };
    } catch (error) {
      console.error('Service error - updateEmployee:', error);
      throw error;
    }
  }

  /**
   * Eliminar empleado (hard delete)
   */
  async deleteEmployee(id) {
    try {
      // 1. REGLA DE NEGOCIO: Verificar que el empleado existe
      const employeeToDelete = await this.employeeRepository.findById(id);
      if (!employeeToDelete) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el empleado con ID ${id}.`
        };
      }

      // 2. REGLA DE NEGOCIO: Verificar si tiene compras asociadas
      // Si tiene compras, no permitir eliminación
      if (employeeToDelete.purchases && employeeToDelete.purchases.length > 0) {
        throw new Error(`No se puede eliminar el empleado "${employeeToDelete.user.firstName} ${employeeToDelete.user.lastName}" porque tiene compras asociadas.`);
      }

      // 3. Proceder con la eliminación (hard delete)
      const deleted = await this.employeeRepository.delete(id);

      if (deleted) {
        return {
          success: true,
          message: `El empleado "${employeeToDelete.user.firstName} ${employeeToDelete.user.lastName}" ha sido eliminado exitosamente.`
        };
      }
    } catch (error) {
      console.error('Service error - deleteEmployee:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de empleados
   */
  async getEmployeeStats() {
    try {
      const stats = await this.employeeRepository.getStats();
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Service error - getEmployeeStats:', error);
      throw error;
    }
  }

  /**
   * Obtener datos de referencia para formularios
   */
  async getReferenceData() {
    try {
      const [roles, documentTypes] = await Promise.all([
        this.employeeRepository.getAvailableRoles(),
        this.employeeRepository.getDocumentTypes()
      ]);

      return {
        success: true,
        data: {
          roles,
          documentTypes
        }
      };
    } catch (error) {
      console.error('Service error - getReferenceData:', error);
      throw error;
    }
  }

  /**
   * Verificar disponibilidad de email
   */
  async checkEmailAvailability(email, excludeUserId = null) {
    try {
      const existingUser = await this.employeeRepository.findByEmail(email);
      
      if (!existingUser) {
        return { available: true };
      }

      if (excludeUserId && existingUser.id === parseInt(excludeUserId)) {
        return { available: true };
      }

      return { 
        available: false, 
        message: `El email "${email}" ya está en uso.` 
      };
    } catch (error) {
      console.error('Service error - checkEmailAvailability:', error);
      throw error;
    }
  }

  /**
   * Verificar disponibilidad de identificación
   */
  async checkIdentificationAvailability(identification, excludeUserId = null) {
    try {
      const existingUser = await this.employeeRepository.findByIdentification(identification);
      
      if (!existingUser) {
        return { available: true };
      }

      if (excludeUserId && existingUser.id === parseInt(excludeUserId)) {
        return { available: true };
      }

      return { 
        available: false, 
        message: `La identificación "${identification}" ya está en uso.` 
      };
    } catch (error) {
      console.error('Service error - checkIdentificationAvailability:', error);
      throw error;
    }
  }

  /**
   * Generar contraseña temporal segura
   */
  generateTemporaryPassword() {
    // Caracteres seguros (sin caracteres ambiguos como 0, O, l, I)
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnpqrstuvwxyz';
    const numbers = '23456789';
    const symbols = '!@#$%&*';
    
    let password = '';
    
    // Asegurar al menos un carácter de cada tipo
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));
    
    // Completar con caracteres aleatorios
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = 4; i < 12; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Mezclar la contraseña
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Enviar email de bienvenida con credenciales
   */
  async sendWelcomeEmail(employeeData, temporaryPassword) {
    try {
      const employeeInfo = {
        email: employeeData.user.email,
        firstName: employeeData.user.firstName,
        lastName: employeeData.user.lastName
      };

      const credentials = {
        email: employeeData.user.email,
        temporaryPassword
      };

      const result = await emailService.sendWelcomeEmail(employeeInfo, credentials);
      


      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
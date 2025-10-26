import bcrypt from 'bcrypt';
import { EmployeeRepository } from '../repository/employees.repository.js';

export class EmployeeService {
  constructor() {
    this.employeeRepository = new EmployeeRepository();
  }

  /**
   * Obtener todos los empleados con filtros
   */
  async getAllEmployees({ page = 1, limit = 10, search = '', status = '', employeeTypeId = '' }) {
    try {
      const result = await this.employeeRepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        employeeTypeId
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
      const userData = {
        firstName: employeeData.firstName.trim(),
        middleName: employeeData.middleName?.trim() || null,
        lastName: employeeData.lastName.trim(),
        secondLastName: employeeData.secondLastName?.trim() || null,
        email: employeeData.email.toLowerCase().trim(),
        passwordHash,
        phoneNumber: employeeData.phoneNumber?.trim() || null,
        address: employeeData.address?.trim() || null,
        birthDate: new Date(employeeData.birthDate),
        identification: employeeData.identification.trim(),
        status: 'Active',
        documentTypeId: parseInt(employeeData.documentTypeId),
        roleId: parseInt(employeeData.roleId)
      };

      // 5. Preparar datos del empleado
      const employeeDataForDB = {
        status: employeeData.status || 'Active',
        employeeTypeId: parseInt(employeeData.employeeTypeId)
      };

      // 6. Crear empleado y usuario en transacción
      const newEmployee = await this.employeeRepository.create(employeeDataForDB, userData);

      // 7. REGLA DE NEGOCIO: Enviar credenciales por email (simulado)
      await this.sendWelcomeEmail(newEmployee.user.email, temporaryPassword);

      return {
        success: true,
        data: newEmployee,
        temporaryPassword, // Para mostrar en la respuesta (solo en desarrollo)
        message: `Empleado "${newEmployee.user.firstName} ${newEmployee.user.lastName}" creado exitosamente.`
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
      if (updateData.firstName) userData.firstName = updateData.firstName.trim();
      if (updateData.middleName !== undefined) userData.middleName = updateData.middleName?.trim() || null;
      if (updateData.lastName) userData.lastName = updateData.lastName.trim();
      if (updateData.secondLastName !== undefined) userData.secondLastName = updateData.secondLastName?.trim() || null;
      if (updateData.email) userData.email = updateData.email.toLowerCase().trim();
      if (updateData.phoneNumber !== undefined) userData.phoneNumber = updateData.phoneNumber?.trim() || null;
      if (updateData.address !== undefined) userData.address = updateData.address?.trim() || null;
      if (updateData.birthDate) userData.birthDate = new Date(updateData.birthDate);
      if (updateData.identification) userData.identification = updateData.identification.trim();
      if (updateData.documentTypeId) userData.documentTypeId = parseInt(updateData.documentTypeId);
      if (updateData.roleId) userData.roleId = parseInt(updateData.roleId);

      // Campos de empleado
      if (updateData.status) employeeData.status = updateData.status;
      if (updateData.employeeTypeId) employeeData.employeeTypeId = parseInt(updateData.employeeTypeId);

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
   * Eliminar empleado (soft delete)
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

      // 2. REGLA DE NEGOCIO: No eliminar empleados que ya están deshabilitados
      if (employeeToDelete.status === 'Disabled') {
        throw new Error(`El empleado "${employeeToDelete.user.firstName} ${employeeToDelete.user.lastName}" ya está deshabilitado.`);
      }

      // 3. REGLA DE NEGOCIO: Verificar si tiene compras asociadas (opcional)
      // Aquí podrías agregar validaciones adicionales según las reglas de negocio

      // 4. Proceder con la eliminación (soft delete)
      const deleted = await this.employeeRepository.delete(id);

      if (deleted) {
        return {
          success: true,
          message: `El empleado "${employeeToDelete.user.firstName} ${employeeToDelete.user.lastName}" ha sido deshabilitado exitosamente.`
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
      const [employeeTypes, roles, documentTypes] = await Promise.all([
        this.employeeRepository.getEmployeeTypes(),
        this.employeeRepository.getAvailableRoles(),
        this.employeeRepository.getDocumentTypes()
      ]);

      return {
        success: true,
        data: {
          employeeTypes,
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
   * Generar contraseña temporal
   */
  generateTemporaryPassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Enviar email de bienvenida (simulado)
   */
  async sendWelcomeEmail(email, temporaryPassword) {
    // TODO: Implementar envío real de email
    console.log(`📧 [SIMULADO] Enviando credenciales a ${email}:`);
    console.log(`   Usuario: ${email}`);
    console.log(`   Contraseña temporal: ${temporaryPassword}`);
    console.log(`   Debe cambiar la contraseña en el primer login.`);
    
    return true;
  }
}
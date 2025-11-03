import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRepository } from '../repository/auth.repository.js';

export class AuthService {
  constructor() {
    this.authRepository = new AuthRepository();
  }

  /**
   * Autenticar usuario
   */
  async login(email, password) {
    try {
      // 1. Validar entrada
      if (!email || !password) {
        return {
          success: false,
          statusCode: 400,
          message: 'Email y contraseña son requeridos'
        };
      }

      // 2. Buscar usuario por email
      const cleanEmail = email.toLowerCase().trim();
      const user = await this.authRepository.findByEmail(cleanEmail);
      
      if (!user) {
        return {
          success: false,
          statusCode: 401,
          message: 'Credenciales inválidas'
        };
      }

      // 3. Verificar estado del usuario
      if (user.status !== 'Active') {
        return {
          success: false,
          statusCode: 401,
          message: 'Usuario inactivo. Contacte al administrador.'
        };
      }

      // 4. Verificar contraseña
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      
      if (!isPasswordValid) {
        return {
          success: false,
          statusCode: 401,
          message: 'Credenciales inválidas'
        };
      }

      // 5. Verificar rol activo
      if (user.role.status !== 'Active') {
        return {
          success: false,
          statusCode: 401,
          message: 'Rol inactivo. Contacte al administrador.'
        };
      }

      // 6. Generar token JWT
      const token = jwt.sign(
        { 
          id: user.id,
          email: user.email,
          roleId: user.roleId
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // 7. Preparar datos de respuesta (sin contraseña)
      const userData = {
        id: user.id,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        secondLastName: user.secondLastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address,
        birthDate: user.birthDate,
        age: user.age,
        identification: user.identification,
        status: user.status,
        documentType: user.documentType,
        role: user.role,
        employee: user.employee,
        athlete: user.athlete
      };

      return {
        success: true,
        data: {
          user: userData,
          token
        }
      };
    } catch (error) {
      console.error('Service error - login:', error);
      throw error;
    }
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // 1. Validar entrada
      if (!currentPassword || !newPassword) {
        return {
          success: false,
          statusCode: 400,
          message: 'Contraseña actual y nueva contraseña son requeridas'
        };
      }

      if (newPassword.length < 6) {
        return {
          success: false,
          statusCode: 400,
          message: 'La nueva contraseña debe tener al menos 6 caracteres'
        };
      }

      // 2. Buscar usuario
      const user = await this.authRepository.findById(userId);
      
      if (!user) {
        return {
          success: false,
          statusCode: 404,
          message: 'Usuario no encontrado'
        };
      }

      // 3. Verificar contraseña actual
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          statusCode: 401,
          message: 'Contraseña actual incorrecta'
        };
      }

      // 4. Hashear nueva contraseña
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // 5. Actualizar contraseña
      await this.authRepository.updatePassword(userId, newPasswordHash);

      return {
        success: true
      };
    } catch (error) {
      console.error('Service error - changePassword:', error);
      throw error;
    }
  }
}
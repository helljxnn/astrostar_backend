import express from 'express';
import { EmployeeController } from '../controllers/employees.controller.js';
import { employeeValidators, handleValidationErrors } from '../validators/employee.validator.js';

const router = express.Router();
const employeeController = new EmployeeController();

/**
 * @swagger
 * tags:
 *   name: Employees
 *   description: Gestión de empleados
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Employee:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del empleado
 *           example: 1
 *         status:
 *           type: string
 *           enum: [Active, Disabled, OnVacation, Retired]
 *           description: Estado del empleado
 *           example: "Active"
 *         statusAssignedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de asignación del estado
 *           example: "2024-01-15T10:30:00Z"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *           example: "2024-01-15T10:30:00Z"
 *         employeeTypeId:
 *           type: integer
 *           description: ID del tipo de empleado
 *           example: 1
 *         userId:
 *           type: integer
 *           description: ID del usuario asociado
 *           example: 1
 *         user:
 *           $ref: '#/components/schemas/User'
 *         employeeType:
 *           $ref: '#/components/schemas/EmployeeType'
 *     
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         firstName:
 *           type: string
 *           example: "Juan"
 *         middleName:
 *           type: string
 *           nullable: true
 *           example: "Carlos"
 *         lastName:
 *           type: string
 *           example: "Pérez"
 *         secondLastName:
 *           type: string
 *           nullable: true
 *           example: "González"
 *         email:
 *           type: string
 *           format: email
 *           example: "juan.perez@astrostar.com"
 *         phoneNumber:
 *           type: string
 *           nullable: true
 *           example: "+573001234567"
 *         address:
 *           type: string
 *           nullable: true
 *           example: "Calle 123 #45-67"
 *         birthDate:
 *           type: string
 *           format: date
 *           example: "1990-05-15"
 *         identification:
 *           type: string
 *           example: "1234567890"
 *         status:
 *           type: string
 *           enum: [Active, Inactive, Suspended]
 *           example: "Active"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         documentType:
 *           $ref: '#/components/schemas/DocumentType'
 *         role:
 *           $ref: '#/components/schemas/Role'
 *     
 *     EmployeeType:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Administrador"
 *         description:
 *           type: string
 *           nullable: true
 *           example: "Personal administrativo"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *     
 *     DocumentType:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Cédula de Ciudadanía"
 *         description:
 *           type: string
 *           nullable: true
 *           example: "Documento de identidad para ciudadanos colombianos"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *     
 *     Role:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Administrador"
 *         description:
 *           type: string
 *           example: "Rol de administrador con acceso completo"
 *         status:
 *           type: string
 *           enum: [Active, Inactive]
 *           example: "Active"
 *         permissions:
 *           type: object
 *           example: {"users": {"Create": true, "Read": true}}
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *     
 *     CreateEmployeeRequest:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - identification
 *         - documentTypeId
 *         - birthDate
 *         - employeeTypeId
 *         - roleId
 *       properties:
 *         firstName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: "Juan"
 *           description: "Nombre del empleado"
 *         middleName:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           example: "Carlos"
 *           description: "Segundo nombre (opcional)"
 *         lastName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: "Pérez"
 *           description: "Apellido del empleado"
 *         secondLastName:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           example: "González"
 *           description: "Segundo apellido (opcional)"
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 150
 *           example: "juan.perez@astrostar.com"
 *           description: "Email único del empleado"
 *         phoneNumber:
 *           type: string
 *           minLength: 10
 *           maxLength: 20
 *           nullable: true
 *           example: "+573001234567"
 *           description: "Número de teléfono (opcional)"
 *         address:
 *           type: string
 *           maxLength: 200
 *           nullable: true
 *           example: "Calle 123 #45-67"
 *           description: "Dirección (opcional)"
 *         identification:
 *           type: string
 *           minLength: 6
 *           maxLength: 50
 *           example: "1234567890"
 *           description: "Número de identificación único"
 *         documentTypeId:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *           description: "ID del tipo de documento"
 *         birthDate:
 *           type: string
 *           format: date
 *           example: "1990-05-15"
 *           description: "Fecha de nacimiento (YYYY-MM-DD)"
 *         employeeTypeId:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *           description: "ID del tipo de empleado"
 *         roleId:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *           description: "ID del rol asignado"
 *         status:
 *           type: string
 *           enum: [Active, Disabled, OnVacation, Retired]
 *           default: "Active"
 *           example: "Active"
 *           description: "Estado inicial del empleado"
 *         temporaryPassword:
 *           type: string
 *           minLength: 6
 *           maxLength: 50
 *           example: "TempPass123"
 *           description: "Contraseña temporal (opcional, se genera automáticamente si no se proporciona)"
 *     
 *     UpdateEmployeeRequest:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: "Juan"
 *         middleName:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           example: "Carlos"
 *         lastName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: "Pérez"
 *         secondLastName:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           example: "González"
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 150
 *           example: "juan.perez@astrostar.com"
 *         phoneNumber:
 *           type: string
 *           minLength: 10
 *           maxLength: 20
 *           nullable: true
 *           example: "+573001234567"
 *         address:
 *           type: string
 *           maxLength: 200
 *           nullable: true
 *           example: "Calle 123 #45-67"
 *         identification:
 *           type: string
 *           minLength: 6
 *           maxLength: 50
 *           example: "1234567890"
 *         documentTypeId:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *         birthDate:
 *           type: string
 *           format: date
 *           example: "1990-05-15"
 *         employeeTypeId:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *         roleId:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *         status:
 *           type: string
 *           enum: [Active, Disabled, OnVacation, Retired]
 *           example: "Active"
 *     
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         total:
 *           type: integer
 *           example: 25
 *         pages:
 *           type: integer
 *           example: 3
 *   
 *   responses:
 *     BadRequest:
 *       description: Solicitud incorrecta
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "El nombre es obligatorio."
 *               field:
 *                 type: string
 *                 example: "firstName"
 *               value:
 *                 type: string
 *                 example: ""
 *     
 *     NotFound:
 *       description: Recurso no encontrado
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "No se encontró el empleado con ID 123."
 *     
 *     InternalServerError:
 *       description: Error interno del servidor
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "Error interno del servidor."
 *               error:
 *                 type: string
 *                 example: "Database connection failed"
 *                 description: "Detalles del error (solo en desarrollo)"
 */

// Rutas específicas PRIMERO (antes de rutas con parámetros)
router.get('/stats', employeeController.getEmployeeStats);
router.get('/reference-data', employeeController.getReferenceData);
router.get('/check-email', 
  employeeValidators.checkEmail,
  handleValidationErrors,
  employeeController.checkEmailAvailability
);
router.get('/check-identification',
  employeeValidators.checkIdentification,
  handleValidationErrors,
  employeeController.checkIdentificationAvailability
);

// CRUD básico
router.get('/',
  employeeValidators.getAll,
  handleValidationErrors,
  employeeController.getAllEmployees
);

router.post('/',
  employeeValidators.create,
  handleValidationErrors,
  employeeController.createEmployee
);

// Rutas con parámetros AL FINAL
router.get('/:id',
  employeeValidators.getById,
  handleValidationErrors,
  employeeController.getEmployeeById
);

router.put('/:id',
  employeeValidators.update,
  handleValidationErrors,
  employeeController.updateEmployee
);

router.delete('/:id',
  employeeValidators.delete,
  handleValidationErrors,
  employeeController.deleteEmployee
);

export default router;
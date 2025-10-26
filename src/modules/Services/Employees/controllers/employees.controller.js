import { EmployeeService } from '../services/employees.services.js';

export class EmployeeController {
  constructor() {
    this.employeeService = new EmployeeService();
  }

  /**
   * @swagger
   * /api/employees:
   *   get:
   *     summary: Obtener todos los empleados
   *     tags: [Employees]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Número de página
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: Cantidad de empleados por página
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *           maxLength: 100
   *         description: Búsqueda por nombre, apellido, email o identificación
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [Active, Disabled, OnVacation, Retired]
   *         description: Filtrar por estado del empleado
   *       - in: query
   *         name: employeeTypeId
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Filtrar por tipo de empleado
   *     responses:
   *       200:
   *         description: Lista de empleados obtenida exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Employee'
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   *                 message:
   *                   type: string
   *                   example: "Se encontraron 15 empleados."
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  getAllEmployees = async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', status = '', employeeTypeId = '' } = req.query;

      const result = await this.employeeService.getAllEmployees({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        employeeTypeId
      });

      res.json({
        success: true,
        data: result.employees,
        pagination: result.pagination,
        message: `Se encontraron ${result.pagination.total} empleados.`
      });
    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener empleados.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * @swagger
   * /api/employees/{id}:
   *   get:
   *     summary: Obtener empleado por ID
   *     tags: [Employees]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: ID del empleado
   *     responses:
   *       200:
   *         description: Empleado encontrado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Employee'
   *                 message:
   *                   type: string
   *                   example: "Empleado encontrado exitosamente."
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  getEmployeeById = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await this.employeeService.getEmployeeById(id);

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message
        });
      }

      res.json({
        success: true,
        data: result.data,
        message: 'Empleado encontrado exitosamente.'
      });
    } catch (error) {
      console.error('Error fetching employee by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener el empleado.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * @swagger
   * /api/employees:
   *   post:
   *     summary: Crear nuevo empleado
   *     tags: [Employees]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateEmployeeRequest'
   *     responses:
   *       201:
   *         description: Empleado creado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Employee'
   *                 temporaryPassword:
   *                   type: string
   *                   example: "Abc123def"
   *                   description: "Contraseña temporal generada (solo en desarrollo)"
   *                 message:
   *                   type: string
   *                   example: "Empleado 'Juan Pérez' creado exitosamente."
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  createEmployee = async (req, res) => {
    try {
      const employeeData = req.body;
      const result = await this.employeeService.createEmployee(employeeData);

      res.status(201).json({
        success: true,
        data: result.data,
        temporaryPassword: process.env.NODE_ENV === 'development' ? result.temporaryPassword : undefined,
        message: result.message
      });
    } catch (error) {
      console.error('Error creating employee:', error);
      
      // Manejar errores específicos
      if (error.message.includes('ya está en uso')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: 'El email o identificación ya están en uso por otro usuario.'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al crear el empleado.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * @swagger
   * /api/employees/{id}:
   *   put:
   *     summary: Actualizar empleado
   *     tags: [Employees]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: ID del empleado
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateEmployeeRequest'
   *     responses:
   *       200:
   *         description: Empleado actualizado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Employee'
   *                 message:
   *                   type: string
   *                   example: "Empleado 'Juan Pérez' actualizado exitosamente."
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  updateEmployee = async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const result = await this.employeeService.updateEmployee(id, updateData);

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message
        });
      }

      res.json({
        success: true,
        data: result.data,
        message: result.message
      });
    } catch (error) {
      console.error('Error updating employee:', error);
      
      // Manejar errores específicos
      if (error.message.includes('ya está en uso')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al actualizar el empleado.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * @swagger
   * /api/employees/{id}:
   *   delete:
   *     summary: Eliminar empleado (soft delete)
   *     tags: [Employees]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: ID del empleado
   *     responses:
   *       200:
   *         description: Empleado eliminado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "El empleado 'Juan Pérez' ha sido deshabilitado exitosamente."
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  deleteEmployee = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await this.employeeService.deleteEmployee(id);

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message
        });
      }

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error deleting employee:', error);
      
      if (error.message.includes('ya está deshabilitado')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al eliminar el empleado.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * @swagger
   * /api/employees/stats:
   *   get:
   *     summary: Obtener estadísticas de empleados
   *     tags: [Employees]
   *     responses:
   *       200:
   *         description: Estadísticas obtenidas exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     total:
   *                       type: integer
   *                       example: 25
   *                     active:
   *                       type: integer
   *                       example: 20
   *                     disabled:
   *                       type: integer
   *                       example: 3
   *                     onVacation:
   *                       type: integer
   *                       example: 2
   *                     retired:
   *                       type: integer
   *                       example: 0
   *                 message:
   *                   type: string
   *                   example: "Estadísticas obtenidas exitosamente."
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  getEmployeeStats = async (req, res) => {
    try {
      const result = await this.employeeService.getEmployeeStats();

      res.json({
        success: true,
        data: result.data,
        message: 'Estadísticas obtenidas exitosamente.'
      });
    } catch (error) {
      console.error('Error fetching employee stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener estadísticas.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * @swagger
   * /api/employees/reference-data:
   *   get:
   *     summary: Obtener datos de referencia para formularios
   *     tags: [Employees]
   *     responses:
   *       200:
   *         description: Datos de referencia obtenidos exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     employeeTypes:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/EmployeeType'
   *                     roles:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Role'
   *                     documentTypes:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/DocumentType'
   *                 message:
   *                   type: string
   *                   example: "Datos de referencia obtenidos exitosamente."
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  getReferenceData = async (req, res) => {
    try {
      const result = await this.employeeService.getReferenceData();

      res.json({
        success: true,
        data: result.data,
        message: 'Datos de referencia obtenidos exitosamente.'
      });
    } catch (error) {
      console.error('Error fetching reference data:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener datos de referencia.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * @swagger
   * /api/employees/check-email:
   *   get:
   *     summary: Verificar disponibilidad de email
   *     tags: [Employees]
   *     parameters:
   *       - in: query
   *         name: email
   *         required: true
   *         schema:
   *           type: string
   *           format: email
   *         description: Email a verificar
   *       - in: query
   *         name: excludeUserId
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: ID de usuario a excluir de la verificación (para edición)
   *     responses:
   *       200:
   *         description: Verificación completada
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 available:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Email disponible."
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  checkEmailAvailability = async (req, res) => {
    try {
      const { email, excludeUserId } = req.query;
      const result = await this.employeeService.checkEmailAvailability(email, excludeUserId);

      res.json({
        success: true,
        available: result.available,
        message: result.available ? 'Email disponible.' : result.message
      });
    } catch (error) {
      console.error('Error checking email availability:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al verificar email.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * @swagger
   * /api/employees/check-identification:
   *   get:
   *     summary: Verificar disponibilidad de identificación
   *     tags: [Employees]
   *     parameters:
   *       - in: query
   *         name: identification
   *         required: true
   *         schema:
   *           type: string
   *           minLength: 6
   *           maxLength: 50
   *         description: Identificación a verificar
   *       - in: query
   *         name: excludeUserId
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: ID de usuario a excluir de la verificación (para edición)
   *     responses:
   *       200:
   *         description: Verificación completada
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 available:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Identificación disponible."
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  checkIdentificationAvailability = async (req, res) => {
    try {
      const { identification, excludeUserId } = req.query;
      const result = await this.employeeService.checkIdentificationAvailability(identification, excludeUserId);

      res.json({
        success: true,
        available: result.available,
        message: result.available ? 'Identificación disponible.' : result.message
      });
    } catch (error) {
      console.error('Error checking identification availability:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al verificar identificación.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
}
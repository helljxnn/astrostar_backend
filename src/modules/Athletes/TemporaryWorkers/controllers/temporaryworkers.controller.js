import { TemporaryWorkersService } from '../services/temporaryworkers.service.js';

/**
 * @swagger
 * tags:
 *   name: TemporaryWorkers
 *   description: Gestión de personas temporales - Permite administrar deportistas, entrenadores y participantes temporales en el sistema
 */

export class TemporaryWorkersController {
  constructor() {
    this.temporaryWorkersService = new TemporaryWorkersService();
  }

  /**
   * @swagger
   * /api/temporary-workers:
   *   get:
   *     summary: Obtener todas las personas temporales
   *     tags: [TemporaryWorkers]
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
   *         description: Cantidad de personas por página
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
   *           enum: [Active, Inactive]
   *         description: Filtrar por estado
   *       - in: query
   *         name: personType
   *         schema:
   *           type: string
   *           enum: [Deportista, Entrenador, Participante]
   *         description: Filtrar por tipo de persona
   *     responses:
   *       200:
   *         description: Lista de personas temporales obtenida exitosamente
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
   *                     $ref: '#/components/schemas/TemporaryWorker'
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   *                 message:
   *                   type: string
   *                   example: "Se encontraron 15 personas temporales."
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  getAllTemporaryWorkers = async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', status = '', personType = '' } = req.query;

      const result = await this.temporaryWorkersService.getAllTemporaryWorkers({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        personType
      });

      res.json({
        success: true,
        data: result.temporaryPersons,
        pagination: result.pagination,
        message: `Se encontraron ${result.pagination.total} personas temporales.`
      });
    } catch (error) {
      console.error('Error fetching temporary workers:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener personas temporales.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * @swagger
   * /api/temporary-workers/{id}:
   *   get:
   *     summary: Obtener persona temporal por ID
   *     tags: [TemporaryWorkers]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: ID de la persona temporal
   *     responses:
   *       200:
   *         description: Persona temporal encontrada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/TemporaryWorker'
   *                 message:
   *                   type: string
   *                   example: "Persona temporal encontrada exitosamente."
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  getTemporaryWorkerById = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await this.temporaryWorkersService.getTemporaryWorkerById(id);

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message
        });
      }

      res.json({
        success: true,
        data: result.data,
        message: 'Persona temporal encontrada exitosamente.'
      });
    } catch (error) {
      console.error('Error fetching temporary worker by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener la persona temporal.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * @swagger
   * /api/temporary-workers:
   *   post:
   *     summary: Crear nueva persona temporal
   *     tags: [TemporaryWorkers]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateTemporaryWorkerRequest'
   *     responses:
   *       201:
   *         description: Persona temporal creada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/TemporaryWorker'
   *                 message:
   *                   type: string
   *                   example: "Persona temporal 'Juan Pérez' creada exitosamente."
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  createTemporaryWorker = async (req, res) => {
    try {
      const workerData = req.body;
      const warnings = req.validationWarnings || [];
      
      const result = await this.temporaryWorkersService.createTemporaryWorker(workerData);

      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message,
        warnings: warnings.length > 0 ? warnings : undefined
      });
    } catch (error) {
      console.error('Error creating temporary worker:', error);
      
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
          message: 'La identificación o email ya están en uso por otra persona temporal.'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al crear la persona temporal.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * @swagger
   * /api/temporary-workers/{id}:
   *   put:
   *     summary: Actualizar persona temporal
   *     tags: [TemporaryWorkers]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: ID de la persona temporal
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateTemporaryWorkerRequest'
   *     responses:
   *       200:
   *         description: Persona temporal actualizada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/TemporaryWorker'
   *                 message:
   *                   type: string
   *                   example: "Persona temporal 'Juan Pérez' actualizada exitosamente."
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  updateTemporaryWorker = async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const warnings = req.validationWarnings || [];
      
      const result = await this.temporaryWorkersService.updateTemporaryWorker(id, updateData);

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message
        });
      }

      res.json({
        success: true,
        data: result.data,
        message: result.message,
        warnings: warnings.length > 0 ? warnings : undefined
      });
    } catch (error) {
      console.error('Error updating temporary worker:', error);
      
      // Manejar errores específicos
      if (error.message.includes('ya está en uso')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al actualizar la persona temporal.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * @swagger
   * /api/temporary-workers/{id}:
   *   delete:
   *     summary: Eliminar persona temporal
   *     tags: [TemporaryWorkers]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: ID de la persona temporal
   *     responses:
   *       200:
   *         description: Persona temporal eliminada exitosamente
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
   *                   example: "La persona temporal 'Juan Pérez' ha sido eliminada exitosamente."
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  deleteTemporaryWorker = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await this.temporaryWorkersService.deleteTemporaryWorker(id);

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
      console.error('Error deleting temporary worker:', error);
      
      if (error.message.includes('ya está inactiva')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al eliminar la persona temporal.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * @swagger
   * /api/temporary-workers/stats:
   *   get:
   *     summary: Obtener estadísticas de personas temporales
   *     tags: [TemporaryWorkers]
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
   *                     inactive:
   *                       type: integer
   *                       example: 5
   *                     deportista:
   *                       type: integer
   *                       example: 10
   *                     entrenador:
   *                       type: integer
   *                       example: 8
   *                     participante:
   *                       type: integer
   *                       example: 7
   *                 message:
   *                   type: string
   *                   example: "Estadísticas obtenidas exitosamente."
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  getTemporaryWorkerStats = async (req, res) => {
    try {
      const result = await this.temporaryWorkersService.getTemporaryWorkerStats();

      res.json({
        success: true,
        data: result.data,
        message: 'Estadísticas obtenidas exitosamente.'
      });
    } catch (error) {
      console.error('Error fetching temporary worker stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener estadísticas.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * @swagger
   * /api/temporary-workers/reference-data:
   *   get:
   *     summary: Obtener datos de referencia para formularios
   *     tags: [TemporaryWorkers]
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
      const result = await this.temporaryWorkersService.getReferenceData();

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
   * /api/temporary-workers/check-identification:
   *   get:
   *     summary: Verificar disponibilidad de identificación
   *     tags: [TemporaryWorkers]
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
   *         name: excludeId
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: ID a excluir de la verificación (para edición)
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
      const { identification, excludeId } = req.query;
      const result = await this.temporaryWorkersService.checkIdentificationAvailability(identification, excludeId);

      res.json({
        success: true,
        available: result.available,
        message: result.message
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

  /**
   * @swagger
   * /api/temporary-workers/check-email:
   *   get:
   *     summary: Verificar disponibilidad de email
   *     tags: [TemporaryWorkers]
   *     parameters:
   *       - in: query
   *         name: email
   *         required: true
   *         schema:
   *           type: string
   *           format: email
   *         description: Email a verificar
   *       - in: query
   *         name: excludeId
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: ID a excluir de la verificación (para edición)
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
      const { email, excludeId } = req.query;
      const result = await this.temporaryWorkersService.checkEmailAvailability(email, excludeId);

      res.json({
        success: true,
        available: result.available,
        message: result.message
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
}

/**

 * @swagger
 * components:
 *   schemas:
 *     TemporaryWorker:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único de la persona temporal
 *           example: 1
 *         firstName:
 *           type: string
 *           description: Primer nombre
 *           example: "Juan"
 *         middleName:
 *           type: string
 *           nullable: true
 *           description: Segundo nombre (opcional)
 *           example: "Carlos"
 *         lastName:
 *           type: string
 *           description: Primer apellido
 *           example: "Pérez"
 *         secondLastName:
 *           type: string
 *           nullable: true
 *           description: Segundo apellido (opcional)
 *           example: "García"
 *         identification:
 *           type: string
 *           description: Número de identificación
 *           example: "1234567890"
 *         email:
 *           type: string
 *           format: email
 *           description: Correo electrónico
 *           example: "juan.perez@example.com"
 *         phone:
 *           type: string
 *           description: Número de teléfono
 *           example: "+57 300 1234567"
 *         birthDate:
 *           type: string
 *           format: date
 *           nullable: true
 *           description: Fecha de nacimiento
 *           example: "1990-05-15"
 *         age:
 *           type: integer
 *           nullable: true
 *           description: Edad calculada
 *           example: 33
 *         address:
 *           type: string
 *           nullable: true
 *           description: Dirección de residencia
 *           example: "Calle 123 #45-67"
 *         team:
 *           type: string
 *           nullable: true
 *           description: Equipo al que pertenece
 *           example: "Equipo A"
 *         category:
 *           type: string
 *           nullable: true
 *           description: Categoría deportiva
 *           example: "Juvenil"
 *         personType:
 *           type: string
 *           enum: [Deportista, Entrenador, Participante]
 *           description: Tipo de persona temporal
 *           example: "Deportista"
 *         status:
 *           type: string
 *           enum: [Active, Inactive]
 *           description: Estado de la persona temporal
 *           example: "Active"
 *         documentTypeId:
 *           type: integer
 *           nullable: true
 *           description: ID del tipo de documento
 *           example: 1
 *         documentType:
 *           $ref: '#/components/schemas/DocumentType'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *           example: "2024-01-20T15:45:00Z"
 *
 *     CreateTemporaryWorkerRequest:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - personType
 *         - identification
 *         - email
 *         - phone
 *         - birthDate
 *         - address
 *       properties:
 *         firstName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Primer nombre (requerido)
 *           example: "Juan"
 *         middleName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           nullable: true
 *           description: Segundo nombre (opcional)
 *           example: "Carlos"
 *         lastName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Primer apellido (requerido)
 *           example: "Pérez"
 *         secondLastName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           nullable: true
 *           description: Segundo apellido (opcional)
 *           example: "García"
 *         personType:
 *           type: string
 *           enum: [Deportista, Entrenador, Participante]
 *           description: Tipo de persona temporal (requerido)
 *           example: "Deportista"
 *         identification:
 *           type: string
 *           minLength: 6
 *           maxLength: 50
 *           description: Número de identificación (requerido)
 *           example: "1234567890"
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 150
 *           description: Correo electrónico (requerido)
 *           example: "juan.perez@example.com"
 *         phone:
 *           type: string
 *           minLength: 7
 *           maxLength: 20
 *           description: Número de teléfono (requerido)
 *           example: "+57 300 1234567"
 *         birthDate:
 *           type: string
 *           format: date
 *           description: Fecha de nacimiento (requerido)
 *           example: "1990-05-15"
 *         age:
 *           type: integer
 *           minimum: 5
 *           maximum: 120
 *           nullable: true
 *           description: Edad (opcional, se calcula automáticamente)
 *           example: 33
 *         address:
 *           type: string
 *           maxLength: 200
 *           description: Dirección de residencia (requerido)
 *           example: "Calle 123 #45-67"
 *         team:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           description: Equipo al que pertenece (opcional)
 *           example: "Equipo A"
 *         category:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           description: Categoría deportiva (opcional)
 *           example: "Juvenil"
 *         documentTypeId:
 *           type: integer
 *           minimum: 1
 *           nullable: true
 *           description: ID del tipo de documento (opcional)
 *           example: 1
 *         status:
 *           type: string
 *           enum: [Active, Inactive]
 *           default: Active
 *           description: Estado de la persona temporal (opcional, por defecto Active)
 *           example: "Active"
 *
 *     UpdateTemporaryWorkerRequest:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Primer nombre
 *           example: "Juan"
 *         middleName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           nullable: true
 *           description: Segundo nombre
 *           example: "Carlos"
 *         lastName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Primer apellido
 *           example: "Pérez"
 *         secondLastName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           nullable: true
 *           description: Segundo apellido
 *           example: "García"
 *         personType:
 *           type: string
 *           enum: [Deportista, Entrenador, Participante]
 *           description: Tipo de persona temporal
 *           example: "Deportista"
 *         identification:
 *           type: string
 *           minLength: 6
 *           maxLength: 50
 *           nullable: true
 *           description: Número de identificación
 *           example: "1234567890"
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 150
 *           nullable: true
 *           description: Correo electrónico
 *           example: "juan.perez@example.com"
 *         phone:
 *           type: string
 *           minLength: 7
 *           maxLength: 20
 *           nullable: true
 *           description: Número de teléfono
 *           example: "+57 300 1234567"
 *         birthDate:
 *           type: string
 *           format: date
 *           nullable: true
 *           description: Fecha de nacimiento
 *           example: "1990-05-15"
 *         age:
 *           type: integer
 *           minimum: 5
 *           maximum: 120
 *           nullable: true
 *           description: Edad
 *           example: 33
 *         address:
 *           type: string
 *           maxLength: 200
 *           nullable: true
 *           description: Dirección de residencia
 *           example: "Calle 123 #45-67"
 *         team:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           description: Equipo al que pertenece
 *           example: "Equipo A"
 *         category:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           description: Categoría deportiva
 *           example: "Juvenil"
 *         documentTypeId:
 *           type: integer
 *           minimum: 1
 *           nullable: true
 *           description: ID del tipo de documento
 *           example: 1
 *         status:
 *           type: string
 *           enum: [Active, Inactive]
 *           description: Estado de la persona temporal
 *           example: "Active"
 *
 *     DocumentType:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID del tipo de documento
 *           example: 1
 *         name:
 *           type: string
 *           description: Nombre del tipo de documento
 *           example: "Cédula de Ciudadanía"
 *
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           description: Página actual
 *           example: 1
 *         limit:
 *           type: integer
 *           description: Cantidad de registros por página
 *           example: 10
 *         total:
 *           type: integer
 *           description: Total de registros
 *           example: 50
 *         pages:
 *           type: integer
 *           description: Total de páginas
 *           example: 5
 *         hasNext:
 *           type: boolean
 *           description: Indica si hay página siguiente
 *           example: true
 *         hasPrev:
 *           type: boolean
 *           description: Indica si hay página anterior
 *           example: false
 *
 *   responses:
 *     BadRequest:
 *       description: Solicitud incorrecta - Error de validación
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
 *                 example: "Errores de validación"
 *               errors:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     field:
 *                       type: string
 *                       example: "email"
 *                     message:
 *                       type: string
 *                       example: "El formato del email no es válido"
 *                     value:
 *                       type: string
 *                       example: "correo-invalido"
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
 *                 example: "Persona temporal no encontrada."
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
 *                 example: "Error interno del servidor"
 *               error:
 *                 type: string
 *                 description: Detalles del error (solo en desarrollo)
 *                 example: "Database connection failed"
 */

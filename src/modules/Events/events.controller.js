import { EventsService } from './events.services.js';

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Gestión de eventos - Permite administrar eventos deportivos y actividades
 */

export class EventsController {
  constructor() {
    this.eventsService = new EventsService();
  }

  /**
   * @swagger
   * /api/events:
   *   get:
   *     summary: Obtener todos los eventos
   *     description: Obtiene una lista paginada de eventos con filtros opcionales. Los eventos finalizados se actualizan automáticamente según su fecha/hora.
   *     tags: [Events]
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
   *         description: Cantidad de eventos por página
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Búsqueda por nombre, ubicación o descripción
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [Programado, Finalizado, Cancelado, Pausado]
   *         description: Filtrar por estado
   *       - in: query
   *         name: categoryId
   *         schema:
   *           type: integer
   *         description: Filtrar por categoría
   *       - in: query
   *         name: typeId
   *         schema:
   *           type: integer
   *         description: Filtrar por tipo de evento
   *     responses:
   *       200:
   *         description: Lista de eventos obtenida exitosamente
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
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                       name:
   *                         type: string
   *                       description:
   *                         type: string
   *                       startDate:
   *                         type: string
   *                         format: date-time
   *                       endDate:
   *                         type: string
   *                         format: date-time
   *                       startTime:
   *                         type: string
   *                       endTime:
   *                         type: string
   *                       location:
   *                         type: string
   *                       phone:
   *                         type: string
   *                       status:
   *                         type: string
   *                         enum: [Programado, Finalizado, Cancelado, Pausado]
   *                       imageUrl:
   *                         type: string
   *                       scheduleFile:
   *                         type: string
   *                       publish:
   *                         type: boolean
   *                       category:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: integer
   *                           name:
   *                             type: string
   *                       type:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: integer
   *                           name:
   *                             type: string
   *                       _count:
   *                         type: object
   *                         properties:
   *                           participants:
   *                             type: integer
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     total:
   *                       type: integer
   *                     totalPages:
   *                       type: integer
   *                     hasNext:
   *                       type: boolean
   *                     hasPrev:
   *                       type: boolean
   *                 message:
   *                   type: string
   *       500:
   *         description: Error interno del servidor
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   */
  getAllEvents = async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', status = '', categoryId = '', typeId = '' } = req.query;

      const result = await this.eventsService.getAllEvents({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        categoryId,
        typeId
      });

      res.json({
        success: true,
        data: result.events,
        pagination: result.pagination,
        message: `Se encontraron ${result.pagination.total} eventos.`
      });
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener eventos.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * @swagger
   * /api/events/{id}:
   *   get:
   *     summary: Obtener evento por ID
   *     description: Obtiene los detalles completos de un evento específico, incluyendo participantes, patrocinadores y relaciones.
   *     tags: [Events]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del evento
   *     responses:
   *       200:
   *         description: Evento encontrado exitosamente
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
   *                     id:
   *                       type: integer
   *                     name:
   *                       type: string
   *                     description:
   *                       type: string
   *                     startDate:
   *                       type: string
   *                       format: date-time
   *                     endDate:
   *                       type: string
   *                       format: date-time
   *                     startTime:
   *                       type: string
   *                     endTime:
   *                       type: string
   *                     location:
   *                       type: string
   *                     phone:
   *                       type: string
   *                     status:
   *                       type: string
   *                     imageUrl:
   *                       type: string
   *                     scheduleFile:
   *                       type: string
   *                     publish:
   *                       type: boolean
   *                     category:
   *                       type: object
   *                     type:
   *                       type: object
   *                     sponsors:
   *                       type: array
   *                       items:
   *                         type: object
   *                     participants:
   *                       type: array
   *                       items:
   *                         type: object
   *                 message:
   *                   type: string
   *       404:
   *         description: Evento no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Evento no encontrado."
   *       500:
   *         description: Error interno del servidor
   */
  getEventById = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await this.eventsService.getEventById(id);

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message
        });
      }

      res.json({
        success: true,
        data: result.data,
        message: 'Evento encontrado exitosamente.'
      });
    } catch (error) {
      console.error('Error fetching event by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener el evento.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * @swagger
   * /api/events:
   *   post:
   *     summary: Crear nuevo evento
   *     tags: [Events]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - startDate
   *               - endDate
   *               - startTime
   *               - endTime
   *               - location
   *               - phone
   *               - categoryId
   *               - typeId
   *             properties:
   *               name:
   *                 type: string
   *                 minLength: 3
   *                 maxLength: 200
   *                 description: Nombre del evento
   *                 example: "Festival Deportivo 2025"
   *               description:
   *                 type: string
   *                 maxLength: 1000
   *                 description: Descripción detallada del evento
   *                 example: "Festival anual de deportes con múltiples disciplinas"
   *               startDate:
   *                 type: string
   *                 format: date
   *                 description: Fecha de inicio (YYYY-MM-DD)
   *                 example: "2025-12-01"
   *               endDate:
   *                 type: string
   *                 format: date
   *                 description: Fecha de finalización (YYYY-MM-DD)
   *                 example: "2025-12-03"
   *               startTime:
   *                 type: string
   *                 pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
   *                 description: Hora de inicio (HH:MM formato 24h)
   *                 example: "09:00"
   *               endTime:
   *                 type: string
   *                 pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
   *                 description: Hora de finalización (HH:MM formato 24h)
   *                 example: "18:00"
   *               location:
   *                 type: string
   *                 maxLength: 200
   *                 description: Ubicación del evento
   *                 example: "Estadio Municipal"
   *               phone:
   *                 type: string
   *                 minLength: 7
   *                 maxLength: 20
   *                 description: Teléfono de contacto
   *                 example: "+57 300 1234567"
   *               status:
   *                 type: string
   *                 enum: [Programado, Finalizado, Cancelado, Pausado]
   *                 default: Programado
   *                 description: Estado del evento
   *               imageUrl:
   *                 type: string
   *                 format: uri
   *                 description: URL de la imagen del evento (Cloudinary)
   *                 example: "https://res.cloudinary.com/dpi6uu5fk/image/upload/..."
   *               scheduleFile:
   *                 type: string
   *                 format: uri
   *                 description: URL del cronograma PDF (Cloudinary)
   *                 example: "https://res.cloudinary.com/dpi6uu5fk/raw/upload/..."
   *               publish:
   *                 type: boolean
   *                 default: false
   *                 description: Si el evento está publicado o no
   *               categoryId:
   *                 type: integer
   *                 description: ID de la categoría del evento
   *                 example: 1
   *               typeId:
   *                 type: integer
   *                 description: ID del tipo de evento
   *                 example: 2
   *           example:
   *             name: "Festival Deportivo 2025"
   *             description: "Festival anual de deportes con múltiples disciplinas"
   *             startDate: "2025-12-01"
   *             endDate: "2025-12-03"
   *             startTime: "09:00"
   *             endTime: "18:00"
   *             location: "Estadio Municipal"
   *             phone: "+57 300 1234567"
   *             status: "Programado"
   *             imageUrl: "https://res.cloudinary.com/dpi6uu5fk/image/upload/v1234567890/astrostar/events/images/abc123.jpg"
   *             scheduleFile: "https://res.cloudinary.com/dpi6uu5fk/raw/upload/v1234567890/astrostar/events/schedules/xyz789.pdf"
   *             publish: true
   *             categoryId: 1
   *             typeId: 2
   *     responses:
   *       201:
   *         description: Evento creado exitosamente
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
   *                 message:
   *                   type: string
   *                   example: "Evento 'Festival Deportivo 2025' creado exitosamente."
   *       400:
   *         description: Datos inválidos o campos requeridos faltantes
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "El nombre del evento es requerido"
   *       500:
   *         description: Error interno del servidor
   */
  createEvent = async (req, res) => {
    try {
      const eventData = req.body;
      
      const result = await this.eventsService.createEvent(eventData);

      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } catch (error) {
      console.error('Error creating event:', error);
      
      res.status(400).json({
        success: false,
        message: error.message || 'Error al crear el evento.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * @swagger
   * /api/events/{id}:
   *   put:
   *     summary: Actualizar evento
   *     tags: [Events]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del evento
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 minLength: 3
   *                 maxLength: 200
   *                 example: "Festival Deportivo 2025"
   *               description:
   *                 type: string
   *                 maxLength: 1000
   *                 example: "Festival anual de deportes con múltiples disciplinas"
   *               startDate:
   *                 type: string
   *                 format: date
   *                 example: "2025-12-01"
   *               endDate:
   *                 type: string
   *                 format: date
   *                 example: "2025-12-03"
   *               startTime:
   *                 type: string
   *                 pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
   *                 example: "09:00"
   *               endTime:
   *                 type: string
   *                 pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
   *                 example: "18:00"
   *               location:
   *                 type: string
   *                 maxLength: 200
   *                 example: "Estadio Municipal"
   *               phone:
   *                 type: string
   *                 minLength: 7
   *                 maxLength: 20
   *                 example: "+57 300 1234567"
   *               status:
   *                 type: string
   *                 enum: [Programado, Finalizado, Cancelado, Pausado]
   *                 default: Programado
   *               imageUrl:
   *                 type: string
   *                 format: uri
   *                 example: "https://res.cloudinary.com/..."
   *               scheduleFile:
   *                 type: string
   *                 format: uri
   *                 example: "https://res.cloudinary.com/..."
   *               publish:
   *                 type: boolean
   *                 default: false
   *               categoryId:
   *                 type: integer
   *                 example: 1
   *               typeId:
   *                 type: integer
   *                 example: 2
   *     responses:
   *       200:
   *         description: Evento actualizado exitosamente
   *       400:
   *         description: Datos inválidos
   *       404:
   *         description: Evento no encontrado
   *       500:
   *         description: Error interno del servidor
   */
  updateEvent = async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const result = await this.eventsService.updateEvent(id, updateData);

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
      console.error('Error updating event:', error);
      
      res.status(400).json({
        success: false,
        message: error.message || 'Error al actualizar el evento.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * @swagger
   * /api/events/{id}:
   *   delete:
   *     summary: Eliminar evento
   *     description: Elimina un evento y todos sus participantes y relaciones con patrocinadores (eliminación en cascada).
   *     tags: [Events]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del evento
   *     responses:
   *       200:
   *         description: Evento eliminado exitosamente
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
   *                   example: "El evento 'Festival Deportivo 2025' y sus 15 participante(s) han sido eliminados exitosamente."
   *       400:
   *         description: No se puede eliminar el evento
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *       404:
   *         description: Evento no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Evento no encontrado."
   *       500:
   *         description: Error interno del servidor
   */
  deleteEvent = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await this.eventsService.deleteEvent(id);

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
      console.error('Error deleting event:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al eliminar el evento.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * @swagger
   * /api/events/stats:
   *   get:
   *     summary: Obtener estadísticas de eventos
   *     description: Obtiene estadísticas generales de eventos agrupadas por estado y categoría.
   *     tags: [Events]
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
   *                       description: Total de eventos
   *                       example: 45
   *                     programado:
   *                       type: integer
   *                       description: Eventos programados
   *                       example: 20
   *                     finalizado:
   *                       type: integer
   *                       description: Eventos finalizados
   *                       example: 18
   *                     cancelado:
   *                       type: integer
   *                       description: Eventos cancelados
   *                       example: 5
   *                     pausado:
   *                       type: integer
   *                       description: Eventos pausados
   *                       example: 2
   *                     byCategory:
   *                       type: array
   *                       description: Eventos agrupados por categoría
   *                       items:
   *                         type: object
   *                         properties:
   *                           categoryId:
   *                             type: integer
   *                           _count:
   *                             type: object
   *                             properties:
   *                               id:
   *                                 type: integer
   *                 message:
   *                   type: string
   *                   example: "Estadísticas obtenidas exitosamente."
   *       500:
   *         description: Error interno del servidor
   */
  getEventStats = async (req, res) => {
    try {
      const result = await this.eventsService.getEventStats();

      res.json({
        success: true,
        data: result.data,
        message: 'Estadísticas obtenidas exitosamente.'
      });
    } catch (error) {
      console.error('Error fetching event stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener estadísticas.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * @swagger
   * /api/events/reference-data:
   *   get:
   *     summary: Obtener datos de referencia para formularios
   *     description: Obtiene las categorías y tipos de eventos disponibles para usar en formularios de creación/edición.
   *     tags: [Events]
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
   *                     categories:
   *                       type: array
   *                       description: Lista de categorías de eventos
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: integer
   *                             example: 1
   *                           name:
   *                             type: string
   *                             example: "Deportivo"
   *                           description:
   *                             type: string
   *                             example: "Eventos relacionados con deportes"
   *                     types:
   *                       type: array
   *                       description: Lista de tipos de eventos
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: integer
   *                             example: 1
   *                           name:
   *                             type: string
   *                             example: "Torneo"
   *                           description:
   *                             type: string
   *                             example: "Competencia deportiva"
   *                 message:
   *                   type: string
   *                   example: "Datos de referencia obtenidos exitosamente."
   *       500:
   *         description: Error interno del servidor
   */
  getReferenceData = async (req, res) => {
    try {
      const result = await this.eventsService.getReferenceData();

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
}

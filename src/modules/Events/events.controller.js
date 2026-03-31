import { EventsService } from "./events.services.js";

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

  getPublicEvents = async (req, res) => {
    try {
      const { limit = 1000 } = req.query;
      const parsedLimit = Number.parseInt(limit, 10);

      const result = await this.eventsService.getPublicEvents({
        limit: Number.isNaN(parsedLimit) ? 1000 : parsedLimit,
      });

      return res.json({
        success: true,
        data: result.data,
        message: `Se encontraron ${result.data.length} eventos publicados.`,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener eventos publicos.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

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
   *           enum: [Programado, Finalizado, Cancelado]
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
   *                         enum: [Programado, Finalizado, Cancelado]
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
      const {
        page = 1,
        limit = 10,
        search = "",
        status = "",
        categoryId = "",
        typeId = "",
        publish = "",
      } = req.query;

      const result = await this.eventsService.getAllEvents({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        categoryId,
        typeId,
        publish,
      });

      res.json({
        success: true,
        data: result.events,
        pagination: result.pagination,
        message: `Se encontraron ${result.pagination.total} eventos.`,
      });
    } catch (error) {
      console.error("Error in getAllEvents:", error);
      console.error("Stack trace:", error.stack);

      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener eventos.",
        error:
          process.env.NODE_ENV === "development"
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
              }
            : undefined,
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
          message: result.message,
        });
      }

      res.json({
        success: true,
        data: result.data,
        message: "Evento encontrado exitosamente.",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener el evento.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
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
   *                 enum: [Programado, Finalizado, Cancelado]
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
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Error al crear el evento.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
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
   *                 enum: [Programado, Finalizado, Cancelado]
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
          message: result.message,
        });
      }

      res.json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Error al actualizar el evento.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
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
          message: result.message,
        });
      }

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al eliminar el evento.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
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

   *                     finalizado:
   *                       type: integer
   *                       description: Eventos finalizados
   *                       example: 18
   *                     cancelado:
   *                       type: integer
   *                       description: Eventos cancelados
   *                       example: 5
   *                     
   *                       type: integer


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
        message: "Estadísticas obtenidas exitosamente.",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener estadísticas.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/events/by-quarter:
   *   get:
   *     summary: Obtener eventos agrupados por trimestre
   *     description: Obtiene la cantidad de eventos finalizados agrupados por trimestre y año para los últimos 3 años.
   *     tags: [Events]
   *     responses:
   *       200:
   *         description: Datos obtenidos exitosamente
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
   *                       trimestre:
   *                         type: string
   *                         example: "Trim 1"
   *                       año2023:
   *                         type: integer
   *                         example: 21
   *                       año2024:
   *                         type: integer
   *                         example: 13
   *                       año2025:
   *                         type: integer
   *                         example: 18
   *                 message:
   *                   type: string
   *                   example: "Datos de eventos por trimestre obtenidos exitosamente."
   *       500:
   *         description: Error interno del servidor
   */
  getEventsByQuarter = async (req, res) => {
    try {
      const result = await this.eventsService.getEventsByQuarter();

      res.json({
        success: true,
        data: result.data,
        message: "Datos de eventos por trimestre obtenidos exitosamente.",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener datos por trimestre.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
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
        message: "Datos de referencia obtenidos exitosamente.",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener datos de referencia.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/events/check-name:
   *   get:
   *     summary: Verificar si un nombre de evento ya existe
   *     description: Valida si un nombre de evento está disponible (case insensitive)
   *     tags: [Events]
   *     parameters:
   *       - in: query
   *         name: name
   *         required: true
   *         schema:
   *           type: string
   *         description: Nombre del evento a verificar
   *       - in: query
   *         name: excludeId
   *         schema:
   *           type: integer
   *         description: ID del evento a excluir de la búsqueda (para edición)
   *     responses:
   *       200:
   *         description: Resultado de la verificación
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 available:
   *                   type: boolean
   *                   description: true si el nombre está disponible
   *                 message:
   *                   type: string
   *       400:
   *         description: Parámetros inválidos
   *       500:
   *         description: Error interno del servidor
   */
  checkEventName = async (req, res) => {
    try {
      const { name, excludeId } = req.query;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "El nombre es requerido.",
        });
      }

      const existingEvent =
        await this.eventsService.eventsRepository.findByName(name.trim());

      const isAvailable =
        !existingEvent ||
        (excludeId && existingEvent.id === parseInt(excludeId));

      res.json({
        success: true,
        available: isAvailable,
        message: isAvailable
          ? "El nombre está disponible."
          : `Ya existe un evento con el nombre "${name}".`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al verificar el nombre del evento.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/events/{id}/available-athletes:
   *   get:
   *     summary: Obtener deportistas disponibles para inscribir en un evento
   *     description: Obtiene una lista paginada de deportistas activas que pueden inscribirse en el evento especificado
   *     tags: [Events]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del evento
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
   *         description: Cantidad de deportistas por página
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Búsqueda por nombre, identificación o email
   *       - in: query
   *         name: categoryId
   *         schema:
   *           type: integer
   *         description: Filtrar por categoría deportiva
   *     responses:
   *       200:
   *         description: Lista de deportistas disponibles obtenida exitosamente
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
   *                     athletes:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: integer
   *                           fullName:
   *                             type: string
   *                           identification:
   *                             type: string
   *                           email:
   *                             type: string
   *                           age:
   *                             type: integer
   *                           category:
   *                             type: object
   *                             properties:
   *                               id:
   *                                 type: integer
   *                               name:
   *                                 type: string
   *                               ageRange:
   *                                 type: string
   *                     pagination:
   *                       type: object
   *                       properties:
   *                         page:
   *                           type: integer
   *                         limit:
   *                           type: integer
   *                         total:
   *                           type: integer
   *                         totalPages:
   *                           type: integer
   *                         hasNext:
   *                           type: boolean
   *                         hasPrev:
   *                           type: boolean
   *       404:
   *         description: Evento no encontrado
   *       500:
   *         description: Error interno del servidor
   */
  getAvailableAthletes = async (req, res) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10, search = "", categoryId = "" } = req.query;

      const result = await this.eventsService.getAvailableAthletes(id, {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        categoryId,
      });

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message,
        });
      }

      res.json({
        success: true,
        data: result.data,
        message: `Se encontraron ${result.data.pagination.total} deportistas disponibles.`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Error interno del servidor al obtener deportistas disponibles.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/events/{id}/enroll-athlete:
   *   post:
   *     summary: Inscribir deportista en un evento
   *     description: Inscribe una deportista específica en el evento
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
   *             required:
   *               - athleteId
   *             properties:
   *               athleteId:
   *                 type: integer
   *                 description: ID de la deportista a inscribir
   *                 example: 1
   *               sportsCategoryId:
   *                 type: integer
   *                 description: ID de la categoría deportiva (opcional, usa la de la inscripción activa si no se especifica)

   *               notes:
   *                 type: string
   *                 description: Notas adicionales sobre la inscripción
   *                 example: "Inscripción especial por invitación"
   *     responses:
   *       200:
   *         description: Deportista inscrita exitosamente
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
   *                     athlete:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: integer
   *                         fullName:
   *                           type: string
   *                         identification:
   *                           type: string
   *                     category:
   *                       type: object
   *                     registrationDate:
   *                       type: string
   *                       format: date-time
   *                     status:
   *                       type: string
   *                 message:
   *                   type: string
   *       400:
   *         description: Error en los datos o reglas de negocio
   *       404:
   *         description: Evento o deportista no encontrado
   *       500:
   *         description: Error interno del servidor
   */
  enrollAthlete = async (req, res) => {
    try {
      const { id } = req.params;
      const { athleteId, sportsCategoryId, notes } = req.body;

      if (!athleteId) {
        return res.status(400).json({
          success: false,
          message: "El ID de la deportista es requerido.",
        });
      }

      const result = await this.eventsService.enrollAthlete(id, athleteId, {
        sportsCategoryId,
        notes,
      });

      res.json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error.message || "Error al inscribir la deportista en el evento.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/events/{id}/unenroll-athlete/{athleteId}:
   *   delete:
   *     summary: Desinscribir deportista de un evento
   *     description: Remueve la inscripción de una deportista del evento
   *     tags: [Events]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del evento
   *       - in: path
   *         name: athleteId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la deportista a desinscribir
   *     responses:
   *       200:
   *         description: Deportista desinscrita exitosamente
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
   *                   example: "María García ha sido desinscrita del evento exitosamente."
   *       400:
   *         description: Error en los datos o reglas de negocio
   *       404:
   *         description: Evento o deportista no encontrado
   *       500:
   *         description: Error interno del servidor
   */
  unenrollAthlete = async (req, res) => {
    try {
      const { id, athleteId } = req.params;

      const result = await this.eventsService.unenrollAthlete(id, athleteId);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error.message || "Error al desinscribir la deportista del evento.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/events/{id}/check-affected-registrations:
   *   post:
   *     summary: Verificar inscripciones afectadas por cambio de categorías
   *     description: Verifica qué equipos y deportistas serían eliminados al cambiar las categorías del evento
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
   *             required:
   *               - categoryIds
   *             properties:
   *               categoryIds:
   *                 type: array
   *                 items:
   *                   type: integer
   *                 description: Nuevos IDs de categorías deportivas
   *                 example: [1, 2]
   *     responses:
   *       200:
   *         description: Información sobre inscripciones afectadas
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
   *                     hasAffectedRegistrations:
   *                       type: boolean
   *                     removedCategories:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: integer
   *                           nombre:
   *                             type: string
   *                     affectedTeams:
   *                       type: array
   *                       items:
   *                         type: object
   *                     affectedAthletes:
   *                       type: array
   *                       items:
   *                         type: object
   *                     totalAffected:
   *                       type: integer
   *       400:
   *         description: Error en los datos
   *       404:
   *         description: Evento no encontrado
   *       500:
   *         description: Error interno del servidor
   */
  checkAffectedRegistrations = async (req, res) => {
    try {
      const { id } = req.params;
      const { categoryIds } = req.body;

      if (!categoryIds || !Array.isArray(categoryIds)) {
        return res.status(400).json({
          success: false,
          message: "Se requiere un array de categoryIds",
        });
      }

      const result = await this.eventsService.checkAffectedRegistrations(
        id,
        categoryIds,
      );

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Error al verificar inscripciones afectadas.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };
}

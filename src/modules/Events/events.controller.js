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
   *           enum: [Programado, Finalizado, Cancelado, En_pausa]
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
   *       500:
   *         description: Error interno del servidor
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
   *       404:
   *         description: Evento no encontrado
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
   *               description:
   *                 type: string
   *               startDate:
   *                 type: string
   *                 format: date
   *               endDate:
   *                 type: string
   *                 format: date
   *               startTime:
   *                 type: string
   *               endTime:
   *                 type: string
   *               location:
   *                 type: string
   *               phone:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [Programado, Finalizado, Cancelado, En_pausa]
   *               imageUrl:
   *                 type: string
   *               scheduleFile:
   *                 type: string
   *               publish:
   *                 type: boolean
   *               categoryId:
   *                 type: integer
   *               typeId:
   *                 type: integer
   *     responses:
   *       201:
   *         description: Evento creado exitosamente
   *       400:
   *         description: Datos inválidos
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
   *       400:
   *         description: No se puede eliminar el evento
   *       404:
   *         description: Evento no encontrado
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
   *     tags: [Events]
   *     responses:
   *       200:
   *         description: Estadísticas obtenidas exitosamente
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
   *     tags: [Events]
   *     responses:
   *       200:
   *         description: Datos de referencia obtenidos exitosamente
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

import { RegistrationsService } from "./registrations.service.js";

/**
 * @swagger
 * tags:
 *   name: Registrations
 *   description: Gestión de inscripciones de equipos y deportistas a eventos
 */

export class RegistrationsController {
  constructor() {
    this.registrationsService = new RegistrationsService();
  }

  /**
   * @swagger
   * /api/registrations:
   *   post:
   *     summary: Inscribir equipo a un evento
   *     description: Inscribe un equipo (fundación o temporal) a un evento deportivo. Valida que el evento esté activo y que el equipo no esté ya inscrito.
   *     tags: [Registrations]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - serviceId
   *               - teamId
   *             properties:
   *               serviceId:
   *                 type: integer
   *                 description: ID del evento
   *                 example: 1
   *               teamId:
   *                 type: integer
   *                 description: ID del equipo
   *                 example: 5
   *               sportsCategoryId:
   *                 type: integer
   *                 description: ID de la categoría deportiva (opcional)
   *                 example: 2
   *               notes:
   *                 type: string
   *                 maxLength: 500
   *                 description: Notas adicionales sobre la inscripción
   *                 example: "Equipo confirmado para categoría sub-17"
   *     responses:
   *       201:
   *         description: Equipo inscrito exitosamente
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
   *                   description: Datos de la inscripción creada
   *                 message:
   *                   type: string
   *                   example: "El equipo 'Tigres FC' ha sido inscrito exitosamente al evento 'Torneo 2025'."
   *       400:
   *         description: Error de validación o equipo ya inscrito
   *       404:
   *         description: Evento o equipo no encontrado
   *       500:
   *         description: Error interno del servidor
   */
  registerTeamToEvent = async (req, res) => {
    try {
      const result = await this.registrationsService.registerTeamToEvent(
        req.body,
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al inscribir equipo.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/registrations/event/{serviceId}:
   *   get:
   *     summary: Obtener inscripciones de equipos de un evento
   *     description: Obtiene todas las inscripciones de equipos para un evento específico, con opción de filtrar por estado.
   *     tags: [Registrations]
   *     parameters:
   *       - in: path
   *         name: serviceId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del evento
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [Registered, Confirmed, Cancelled, Attended]
   *         description: Filtrar por estado de inscripción
   *     responses:
   *       200:
   *         description: Lista de inscripciones obtenida exitosamente
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
   *                     event:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: integer
   *                         name:
   *                           type: string
   *                         status:
   *                           type: string
   *                     registrations:
   *                       type: array
   *                       items:
   *                         type: object
   *                     total:
   *                       type: integer
   *                 message:
   *                   type: string
   *       404:
   *         description: Evento no encontrado
   *       500:
   *         description: Error interno del servidor
   */
  getEventRegistrations = async (req, res) => {
    try {
      const { serviceId } = req.params;
      const { status } = req.query;

      const result = await this.registrationsService.getEventRegistrations(
        serviceId,
        {
          status,
        },
      );

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: `Se encontraron ${result.data.total} inscripciones para el evento.`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener inscripciones.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/registrations/team/{teamId}:
   *   get:
   *     summary: Obtener inscripciones de un equipo
   *     description: Obtiene todas las inscripciones de un equipo específico a diferentes eventos.
   *     tags: [Registrations]
   *     parameters:
   *       - in: path
   *         name: teamId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del equipo
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [Registered, Confirmed, Cancelled, Attended]
   *         description: Filtrar por estado de inscripción
   *     responses:
   *       200:
   *         description: Lista de inscripciones obtenida exitosamente
   *       404:
   *         description: Equipo no encontrado
   *       500:
   *         description: Error interno del servidor
   */
  getTeamRegistrations = async (req, res) => {
    try {
      const { teamId } = req.params;
      const { status } = req.query;

      const result = await this.registrationsService.getTeamRegistrations(
        teamId,
        {
          status,
        },
      );

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: `Se encontraron ${result.data.total} inscripciones para el equipo.`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener inscripciones.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/registrations/{id}:
   *   get:
   *     summary: Obtener inscripción por ID
   *     description: Obtiene los detalles completos de una inscripción específica, incluyendo información del equipo y evento.
   *     tags: [Registrations]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la inscripción
   *     responses:
   *       200:
   *         description: Inscripción encontrada exitosamente
   *       404:
   *         description: Inscripción no encontrada
   *       500:
   *         description: Error interno del servidor
   */
  getRegistrationById = async (req, res) => {
    try {
      const { id } = req.params;

      const result = await this.registrationsService.getRegistrationById(id);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: "Inscripción encontrada exitosamente.",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener inscripción.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/registrations/{id}/status:
   *   patch:
   *     summary: Actualizar estado de inscripción
   *     description: Actualiza el estado de una inscripción (Registered, Confirmed, Cancelled, Attended).
   *     tags: [Registrations]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la inscripción
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [Registered, Confirmed, Cancelled, Attended]
   *                 description: Nuevo estado de la inscripción
   *                 example: "Confirmed"
   *               notes:
   *                 type: string
   *                 maxLength: 500
   *                 description: Notas adicionales sobre el cambio de estado
   *                 example: "Confirmado pago de inscripción"
   *     responses:
   *       200:
   *         description: Estado actualizado exitosamente
   *       400:
   *         description: Estado inválido
   *       404:
   *         description: Inscripción no encontrada
   *       500:
   *         description: Error interno del servidor
   */
  updateRegistrationStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const result = await this.registrationsService.updateRegistrationStatus(
        id,
        status,
        notes,
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al actualizar estado.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/registrations/{id}:
   *   delete:
   *     summary: Cancelar/eliminar inscripción
   *     description: Elimina permanentemente una inscripción de un equipo o deportista a un evento.
   *     tags: [Registrations]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la inscripción
   *     responses:
   *       200:
   *         description: Inscripción cancelada exitosamente
   *       404:
   *         description: Inscripción no encontrada
   *       500:
   *         description: Error interno del servidor
   */
  cancelRegistration = async (req, res) => {
    try {
      const { id } = req.params;

      const result = await this.registrationsService.cancelRegistration(id);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al cancelar inscripción.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/registrations/stats:
   *   get:
   *     summary: Obtener estadísticas de inscripciones
   *     description: Obtiene estadísticas generales de inscripciones agrupadas por estado y eventos más populares.
   *     tags: [Registrations]
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
   *                       description: Total de inscripciones
   *                     byStatus:
   *                       type: object
   *                       properties:
   *                         Registered:
   *                           type: integer
   *                         Confirmed:
   *                           type: integer
   *                         Cancelled:
   *                           type: integer
   *                         Attended:
   *                           type: integer
   *                     topEvents:
   *                       type: array
   *                       description: Eventos con más inscripciones
   *                 message:
   *                   type: string
   *       500:
   *         description: Error interno del servidor
   */
  getRegistrationStats = async (req, res) => {
    try {
      const result = await this.registrationsService.getRegistrationStats();

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
   * /api/registrations/teams/available:
   *   get:
   *     summary: Obtener equipos disponibles para inscripción
   *     description: Obtiene todos los equipos activos disponibles para inscribir, separados por tipo (fundación y temporales).
   *     tags: [Registrations]
   *     parameters:
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *         description: Filtrar por categoría deportiva
   *     responses:
   *       200:
   *         description: Lista de equipos disponibles
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
   *                     foundation:
   *                       type: array
   *                       description: Equipos de la fundación
   *                       items:
   *                         type: object
   *                     temporary:
   *                       type: array
   *                       description: Equipos temporales
   *                       items:
   *                         type: object
   *                     total:
   *                       type: integer
   *                 message:
   *                   type: string
   *       500:
   *         description: Error interno del servidor
   */
  getAvailableTeams = async (req, res) => {
    try {
      const { category } = req.query;

      const result = await this.registrationsService.getAvailableTeams({
        category,
      });

      res.json({
        success: true,
        data: result.data,
        message: `Se encontraron ${result.data.total} equipos disponibles (${result.data.foundation.length} de fundación, ${result.data.temporary.length} temporales).`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener equipos.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/registrations/bulk:
   *   post:
   *     summary: Inscribir múltiples equipos a un evento
   *     description: Inscribe varios equipos a un evento en una sola operación. Retorna resultados exitosos y errores por separado.
   *     tags: [Registrations]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - serviceId
   *               - teamIds
   *             properties:
   *               serviceId:
   *                 type: integer
   *                 description: ID del evento
   *                 example: 1
   *               teamIds:
   *                 type: array
   *                 items:
   *                   type: integer
   *                 description: Array de IDs de equipos a inscribir
   *                 example: [1, 2, 3, 4, 5]
   *               notes:
   *                 type: string
   *                 description: Notas adicionales (opcional)
   *                 example: "Inscripción masiva para torneo"
   *     responses:
   *       201:
   *         description: Equipos inscritos (puede incluir errores parciales)
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
   *                     registered:
   *                       type: array
   *                       description: Equipos inscritos exitosamente
   *                     errors:
   *                       type: array
   *                       description: Equipos que no pudieron inscribirse
   *                     total:
   *                       type: integer
   *                     successful:
   *                       type: integer
   *                     failed:
   *                       type: integer
   *                 message:
   *                   type: string
   *       400:
   *         description: Datos inválidos
   *       404:
   *         description: Evento no encontrado
   *       500:
   *         description: Error interno del servidor
   */
  registerMultipleTeams = async (req, res) => {
    try {
      const { serviceId, teamIds, notes } = req.body;

      if (
        !serviceId ||
        !teamIds ||
        !Array.isArray(teamIds) ||
        teamIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Se requiere serviceId y un array de teamIds con al menos un equipo.",
        });
      }

      const result = await this.registrationsService.registerMultipleTeams({
        serviceId,
        teamIds,
        notes,
      });

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al inscribir equipos.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  // ============================================
  // CONTROLADORES PARA INSCRIPCIÓN DE DEPORTISTAS
  // ============================================

  /**
   * @swagger
   * /api/registrations/athlete:
   *   post:
   *     summary: Inscribir deportista individual a un evento
   *     description: Inscribe un deportista de forma individual a un evento deportivo. Valida que el evento esté activo y que el deportista no esté ya inscrito.
   *     tags: [Registrations]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - serviceId
   *               - athleteId
   *             properties:
   *               serviceId:
   *                 type: integer
   *                 description: ID del evento
   *                 example: 1
   *               athleteId:
   *                 type: integer
   *                 description: ID del deportista
   *                 example: 10
   *               sportsCategoryId:
   *                 type: integer
   *                 description: ID de la categoría deportiva (opcional)
   *                 example: 2
   *               notes:
   *                 type: string
   *                 maxLength: 500
   *                 description: Notas adicionales sobre la inscripción
   *                 example: "Deportista confirmado para categoría individual"
   *     responses:
   *       201:
   *         description: Deportista inscrito exitosamente
   *       400:
   *         description: Error de validación o deportista ya inscrito
   *       404:
   *         description: Evento o deportista no encontrado
   *       500:
   *         description: Error interno del servidor
   */
  registerAthleteToEvent = async (req, res) => {
    try {
      const result = await this.registrationsService.registerAthleteToEvent(
        req.body,
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al inscribir deportista.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/registrations/event/{serviceId}/athletes:
   *   get:
   *     summary: Obtener inscripciones individuales de deportistas de un evento
   *     description: Obtiene todas las inscripciones individuales de deportistas para un evento específico.
   *     tags: [Registrations]
   *     parameters:
   *       - in: path
   *         name: serviceId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del evento
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [Registered, Confirmed, Cancelled, Attended]
   *         description: Filtrar por estado de inscripción
   *     responses:
   *       200:
   *         description: Lista de inscripciones individuales obtenida exitosamente
   *       404:
   *         description: Evento no encontrado
   *       500:
   *         description: Error interno del servidor
   */
  getEventAthleteRegistrations = async (req, res) => {
    try {
      const { serviceId } = req.params;
      const { status } = req.query;

      const result =
        await this.registrationsService.getEventAthleteRegistrations(
          serviceId,
          {
            status,
          },
        );

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: `Se encontraron ${result.data.total} inscripciones individuales para el evento.`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener inscripciones.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/registrations/athlete/{athleteId}:
   *   get:
   *     summary: Obtener inscripciones de un deportista
   *     description: Obtiene todas las inscripciones de un deportista específico a diferentes eventos.
   *     tags: [Registrations]
   *     parameters:
   *       - in: path
   *         name: athleteId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del deportista
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [Registered, Confirmed, Cancelled, Attended]
   *         description: Filtrar por estado de inscripción
   *     responses:
   *       200:
   *         description: Lista de inscripciones obtenida exitosamente
   *       404:
   *         description: Deportista no encontrado
   *       500:
   *         description: Error interno del servidor
   */
  getAthleteRegistrations = async (req, res) => {
    try {
      const { athleteId } = req.params;
      const { status } = req.query;

      const result = await this.registrationsService.getAthleteRegistrations(
        athleteId,
        {
          status,
        },
      );

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: `Se encontraron ${result.data.total} inscripciones para el deportista.`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener inscripciones.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/registrations/athletes/available:
   *   get:
   *     summary: Obtener deportistas disponibles para inscripción
   *     description: Obtiene todos los deportistas activos disponibles para inscribir a eventos.
   *     tags: [Registrations]
   *     parameters:
   *       - in: query
   *         name: sportsCategoryId
   *         schema:
   *           type: integer
   *         description: Filtrar por categoría deportiva
   *     responses:
   *       200:
   *         description: Lista de deportistas disponibles
   *       500:
   *         description: Error interno del servidor
   */
  getAvailableAthletes = async (req, res) => {
    try {
      const { sportsCategoryId } = req.query;

      const result = await this.registrationsService.getAvailableAthletes({
        sportsCategoryId,
      });

      res.json({
        success: true,
        data: result.data,
        message: `Se encontraron ${result.data.total} deportistas disponibles.`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener deportistas.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/registrations/athletes/bulk:
   *   post:
   *     summary: Inscribir múltiples deportistas a un evento
   *     description: Inscribe varios deportistas a un evento en una sola operación. Retorna resultados exitosos y errores por separado.
   *     tags: [Registrations]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - serviceId
   *               - athleteIds
   *             properties:
   *               serviceId:
   *                 type: integer
   *                 description: ID del evento
   *                 example: 1
   *               athleteIds:
   *                 type: array
   *                 items:
   *                   type: integer
   *                 description: Array de IDs de deportistas a inscribir
   *                 example: [10, 11, 12, 13, 14]
   *               notes:
   *                 type: string
   *                 description: Notas adicionales (opcional)
   *                 example: "Inscripción masiva para competencia individual"
   *     responses:
   *       201:
   *         description: Deportistas inscritos (puede incluir errores parciales)
   *       400:
   *         description: Datos inválidos
   *       404:
   *         description: Evento no encontrado
   *       500:
   *         description: Error interno del servidor
   */
  registerMultipleAthletes = async (req, res) => {
    try {
      const { serviceId, athleteIds, notes } = req.body;

      if (
        !serviceId ||
        !athleteIds ||
        !Array.isArray(athleteIds) ||
        athleteIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Se requiere serviceId y un array de athleteIds con al menos un deportista.",
        });
      }

      const result = await this.registrationsService.registerMultipleAthletes({
        serviceId,
        athleteIds,
        notes,
      });

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al inscribir deportistas.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * @swagger
   * /api/registrations/event/{serviceId}/teams:
   *   get:
   *     summary: Obtener equipos disponibles filtrados por categorías del evento
   *     description: Devuelve solo los equipos que coinciden con las categorías del evento, optimizado con datos mínimos (id, nombre, categoría, tipo)
   *     tags: [Registrations]
   *     parameters:
   *       - in: path
   *         name: serviceId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del evento
   *     responses:
   *       200:
   *         description: Lista de equipos disponibles filtrados por categoría
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
   *                     foundation:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: integer
   *                           name:
   *                             type: string
   *                           category:
   *                             type: string
   *                           teamType:
   *                             type: string
   *                     temporary:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: integer
   *                           name:
   *                             type: string
   *                           category:
   *                             type: string
   *                           teamType:
   *                             type: string
   *                     total:
   *                       type: integer
   *                 message:
   *                   type: string
   *       404:
   *         description: Evento no encontrado
   *       500:
   *         description: Error interno del servidor
   */
  getTeamsByEventCategories = async (req, res) => {
    try {
      const { serviceId } = req.params;

      const result =
        await this.registrationsService.getTeamsByEventCategories(serviceId);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: `Se encontraron ${result.data.total} equipos disponibles para este evento.`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener equipos.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };
}

export default new RegistrationsController();

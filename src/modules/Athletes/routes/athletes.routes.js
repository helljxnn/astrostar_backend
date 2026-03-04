import express from "express";
import { AthletesController } from "../controllers/athletes.controller.js";
import {
  athletesValidators,
  handleValidationErrors,
} from "../validators/athletes.validator.js";

const router = express.Router();
const athletesController = new AthletesController();

/**
 * @swagger
 * tags:
 *   name: Athletes
 *   description: Gestión de deportistas de la fundación
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Athlete:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - documentTypeId
 *         - identification
 *         - email
 *         - phoneNumber
 *         - birthDate
 *         - categoria
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del deportista
 *         firstName:
 *           type: string
 *           description: Primer nombre del deportista
 *         middleName:
 *           type: string
 *           description: Segundo nombre del deportista (opcional)
 *         lastName:
 *           type: string
 *           description: Primer apellido del deportista
 *         secondLastName:
 *           type: string
 *           description: Segundo apellido del deportista (opcional)
 *         documentTypeId:
 *           type: integer
 *           description: ID del tipo de documento de identidad
 *         documentTypeName:
 *           type: string
 *           description: Nombre del tipo de documento
 *         identification:
 *           type: string
 *           description: Número de documento
 *         email:
 *           type: string
 *           format: email
 *           description: Correo electrónico
 *         phoneNumber:
 *           type: string
 *           description: Número telefónico formato 3XXXXXXXXX
 *         birthDate:
 *           type: string
 *           format: date
 *           description: Fecha de nacimiento
 *         age:
 *           type: integer
 *           description: Edad calculada automáticamente
 *         address:
 *           type: string
 *           description: Dirección
 *         categoria:
 *           type: string
 *           description: Categoría deportiva (Infantil, Sub 15, Juvenil)
 *         estado:
 *           type: string
 *           enum: [Activo, Inactivo]
 *           description: Estado del deportista
 *         acudiente:
 *           type: integer
 *           description: ID del acudiente (obligatorio para menores de edad)
 *         parentesco:
 *           type: string
 *           description: Parentesco con el acudiente
 *         estadoInscripcion:
 *           type: string
 *           enum: [Vigente, Suspendida, Vencida]
 *           description: Estado de la inscripción actual
 *         inscripciones:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               fechaInscripcion:
 *                 type: string
 *                 format: date-time
 *               estado:
 *                 type: string
 *               categoria:
 *                 type: string
 *               concepto:
 *                 type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/athletes/check-email:
 *   get:
 *     summary: Verificar disponibilidad de email
 *     tags: [Athletes]
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
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.get("/check-email", athletesController.checkEmailAvailability);

/**
 * @swagger
 * /api/athletes/check-identification:
 *   get:
 *     summary: Verificar disponibilidad de identificación
 *     tags: [Athletes]
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
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.get("/check-identification", athletesController.checkIdentificationAvailability);

/**
 * @swagger
 * /api/athletes/document-types:
 *   get:
 *     summary: Obtener tipos de documento válidos para deportistas
 *     description: Retorna solo los tipos de documento permitidos para deportistas (Registro Civil, Tarjeta de Identidad, Cédula de Ciudadanía, Cédula de Extranjería, Permiso de Permanencia)
 *     tags: [Athletes]
 *     responses:
 *       200:
 *         description: Tipos de documento obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
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
 *                 message:
 *                   type: string
 *       500:
 *         description: Error interno del servidor
 */
router.get("/document-types", athletesController.getDocumentTypes);

/**
 * @swagger
 * /api/athletes/reference-data:
 *   get:
 *     summary: Obtener datos de referencia para deportistas
 *     description: Retorna tipos de documento y otros datos necesarios para formularios
 *     tags: [Athletes]
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     documentTypes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                     sportsCategories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           minAge:
 *                             type: integer
 *                           maxAge:
 *                             type: integer
 *                           description:
 *                             type: string
 *                 message:
 *                   type: string
 *       500:
 *         description: Error interno del servidor
 */
router.get("/reference-data", athletesController.getReferenceData);

/**
 * @swagger
 * /api/athletes/stats:
 *   get:
 *     summary: Obtener estadísticas de deportistas
 *     description: Retorna estadísticas generales de deportistas (total, activos, inactivos, por categoría, por estado de inscripción)
 *     tags: [Athletes]
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     activos:
 *                       type: integer
 *                     inactivos:
 *                       type: integer
 *                     porCategoria:
 *                       type: object
 *                     porInscripcion:
 *                       type: object
 *                 message:
 *                   type: string
 *       500:
 *         description: Error interno del servidor
 */
router.get("/stats", athletesController.getAthleteStats);

/**
 * @swagger
 * /api/athletes:
 *   get:
 *     summary: Obtener lista de deportistas
 *     description: Retorna lista paginada de deportistas con filtros opcionales
 *     tags: [Athletes]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de registros por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre, apellido, documento o correo
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Activo, Inactivo]
 *         description: Filtrar por estado
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *         description: Filtrar por categoría deportiva
 *       - in: query
 *         name: estadoInscripcion
 *         schema:
 *           type: string
 *           enum: [Vigente, Suspendida, Vencida]
 *         description: Filtrar por estado de inscripción
 *     responses:
 *       200:
 *         description: Lista de deportistas obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Athlete'
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
 *                 message:
 *                   type: string
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  "/",
  athletesValidators.getAll,
  handleValidationErrors,
  athletesController.getAllAthletes
);

/**
 * @swagger
 * /api/athletes/{id}:
 *   get:
 *     summary: Obtener deportista por ID
 *     description: Retorna información detallada de un deportista específico
 *     tags: [Athletes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del deportista
 *     responses:
 *       200:
 *         description: Deportista encontrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Athlete'
 *                 message:
 *                   type: string
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Deportista no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  "/:id",
  athletesValidators.getById,
  handleValidationErrors,
  athletesController.getAthleteById
);

/**
 * @swagger
 * /api/athletes:
 *   post:
 *     summary: Crear nuevo deportista
 *     description: Crea un nuevo deportista con inscripción inicial automática. El deportista se crea con estado "Activo" por defecto.
 *     tags: [Athletes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombres
 *               - apellidos
 *               - tipoDocumento
 *               - numeroDocumento
 *               - correo
 *               - telefono
 *               - fechaNacimiento
 *               - categoria
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "María José"
 *               middleName:
 *                 type: string
 *                 example: "Andrea"
 *               lastName:
 *                 type: string
 *                 example: "García"
 *               secondLastName:
 *                 type: string
 *                 example: "López"
 *               documentTypeId:
 *                 type: integer
 *                 example: 2
 *                 description: ID del tipo de documento (obtener de /document-types)
 *               identification:
 *                 type: string
 *                 example: "1234567890"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "maria.garcia@example.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "3001234567"
 *               birthDate:
 *                 type: string
 *                 format: date
 *                 example: "2010-05-15"
 *               categoria:
 *                 type: string
 *                 example: "Infantil"
 *               acudiente:
 *                 type: integer
 *                 description: ID del acudiente (obligatorio para menores de 18 años)
 *                 example: 1
 *               parentesco:
 *                 type: string
 *                 example: "Madre"
 *     responses:
 *       201:
 *         description: Deportista creado exitosamente con estado Activo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Athlete'
 *                 message:
 *                   type: string
 *       400:
 *         description: Datos inválidos o deportista duplicado
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  "/",
  athletesValidators.create,
  handleValidationErrors,
  athletesController.createAthlete
);

/**
 * @swagger
 * /api/athletes/{id}:
 *   put:
 *     summary: Actualizar deportista
 *     description: Actualiza información de un deportista existente
 *     tags: [Athletes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del deportista
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               middleName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               secondLastName:
 *                 type: string
 *               documentTypeId:
 *                 type: integer
 *               identification:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phoneNumber:
 *                 type: string
 *               birthDate:
 *                 type: string
 *                 format: date
 *               categoria:
 *                 type: string
 *               estado:
 *                 type: string
 *                 enum: [Activo, Inactivo]
 *               acudiente:
 *                 type: integer
 *               parentesco:
 *                 type: string
 *               shouldUpdateInscription:
 *                 type: boolean
 *                 description: Indica si se debe actualizar la inscripción al cambiar a Inactivo
 *     responses:
 *       200:
 *         description: Deportista actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Athlete'
 *                 message:
 *                   type: string
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Deportista no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put(
  "/:id",
  athletesValidators.update,
  handleValidationErrors,
  athletesController.updateAthlete
);

/**
 * @swagger
 * /api/athletes/{id}/status:
 *   patch:
 *     summary: Cambiar estado del deportista
 *     description: Cambia el estado de un deportista entre Activo e Inactivo
 *     tags: [Athletes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del deportista
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
 *                 enum: [Activo, Inactivo]
 *                 description: Nuevo estado del deportista
 *     responses:
 *       200:
 *         description: Estado cambiado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Athlete'
 *                 message:
 *                   type: string
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Deportista no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch(
  "/:id/status",
  athletesValidators.changeStatus,
  handleValidationErrors,
  athletesController.changeAthleteStatus
);

/**
 * @swagger
 * /api/athletes/{id}/remove-guardian:
 *   put:
 *     summary: Remover acudiente de un deportista
 *     description: Desasocia el acudiente de un deportista específico sin eliminar el acudiente de la base de datos
 *     tags: [Athletes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del deportista
 *     responses:
 *       200:
 *         description: Acudiente removido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Athlete'
 *                 message:
 *                   type: string
 *       400:
 *         description: El deportista no tiene acudiente asignado
 *       404:
 *         description: Deportista no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put("/:id/remove-guardian", athletesController.removeGuardian);

/**
 * @swagger
 * /api/athletes/{id}:
 *   delete:
 *     summary: Eliminar deportista
 *     description: Elimina un deportista y todas sus inscripciones asociadas
 *     tags: [Athletes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del deportista
 *     responses:
 *       200:
 *         description: Deportista eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Deportista no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete(
  "/:id",
  athletesValidators.delete,
  handleValidationErrors,
  athletesController.deleteAthlete
);

export default router;

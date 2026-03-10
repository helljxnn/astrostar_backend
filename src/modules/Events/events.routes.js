import express from "express";
import { EventsController } from "./events.controller.js";
import { UploadController } from "./upload.controller.js";
import upload from "../../middlewares/upload.middleware.js";

const router = express.Router();
const eventsController = new EventsController();
const uploadController = new UploadController();

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management endpoints
 */

/**
 * @swagger
 * /api/events/upload/image:
 *   post:
 *     summary: Upload event image
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded
 */
router.post(
  "/upload/image",
  upload.single("image"),
  uploadController.uploadEventImage,
);

/**
 * @swagger
 * /api/events/upload/schedule:
 *   post:
 *     summary: Upload event schedule file
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [schedule]
 *             properties:
 *               schedule:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Schedule file uploaded
 */
router.post(
  "/upload/schedule",
  upload.single("schedule"),
  uploadController.uploadEventSchedule,
);

/**
 * @swagger
 * /api/events/upload/delete:
 *   delete:
 *     summary: Delete uploaded file
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: File deleted
 */
router.delete("/upload/delete", uploadController.deleteFile);

/**
 * @swagger
 * /api/events/stats:
 *   get:
 *     summary: Get event stats
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: Stats retrieved
 */
router.get("/stats", eventsController.getEventStats);

/**
 * @swagger
 * /api/events/by-quarter:
 *   get:
 *     summary: Get events grouped by quarter
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: Quarter data retrieved
 */
router.get("/by-quarter", eventsController.getEventsByQuarter);

/**
 * @swagger
 * /api/events/reference-data:
 *   get:
 *     summary: Get event reference data
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: Reference data retrieved
 */
router.get("/reference-data", eventsController.getReferenceData);

/**
 * @swagger
 * /api/events/check-name:
 *   get:
 *     summary: Check event name availability
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: excludeId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Availability result
 */
router.get("/check-name", eventsController.checkEventName);

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: Events list
 *   post:
 *     summary: Create event
 *     tags: [Events]
 *     responses:
 *       201:
 *         description: Event created
 */
router.get("/", eventsController.getAllEvents);
router.post("/", eventsController.createEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get event by id
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event found
 *   put:
 *     summary: Update event by id
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event updated
 *   delete:
 *     summary: Delete event by id
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event deleted
 */
router.get("/:id", eventsController.getEventById);
router.put("/:id", eventsController.updateEvent);
router.delete("/:id", eventsController.deleteEvent);

/**
 * @swagger
 * /api/events/{id}/check-affected-registrations:
 *   post:
 *     summary: Check affected registrations
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Impact information
 */
router.post(
  "/:id/check-affected-registrations",
  eventsController.checkAffectedRegistrations,
);

/**
 * @swagger
 * /api/events/{id}/available-athletes:
 *   get:
 *     summary: Get athletes available for event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Available athletes
 */
router.get("/:id/available-athletes", eventsController.getAvailableAthletes);

/**
 * @swagger
 * /api/events/{id}/enroll-athlete:
 *   post:
 *     summary: Enroll athlete in event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Athlete enrolled
 */
router.post("/:id/enroll-athlete", eventsController.enrollAthlete);

/**
 * @swagger
 * /api/events/{id}/unenroll-athlete/{athleteId}:
 *   delete:
 *     summary: Unenroll athlete from event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: athleteId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Athlete unenrolled
 */
router.delete(
  "/:id/unenroll-athlete/:athleteId",
  eventsController.unenrollAthlete,
);

export default router;

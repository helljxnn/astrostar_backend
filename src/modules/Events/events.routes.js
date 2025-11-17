import express from 'express';
import { EventsController } from './events.controller.js';
import { UploadController } from './upload.controller.js';
import upload from '../../middlewares/upload.middleware.js';

const router = express.Router();
const eventsController = new EventsController();
const uploadController = new UploadController();

// Rutas de upload (deben ir antes de las rutas con parámetros)
router.post('/upload/image', upload.single('image'), uploadController.uploadEventImage);
router.post('/upload/schedule', upload.single('schedule'), uploadController.uploadEventSchedule);
router.delete('/upload/delete', uploadController.deleteFile);

// Rutas de estadísticas y datos de referencia (deben ir antes de las rutas con parámetros)
router.get('/stats', eventsController.getEventStats);
router.get('/reference-data', eventsController.getReferenceData);

// Rutas CRUD principales
router.get('/', eventsController.getAllEvents);
router.get('/:id', eventsController.getEventById);
router.post('/', eventsController.createEvent);
router.put('/:id', eventsController.updateEvent);
router.delete('/:id', eventsController.deleteEvent);

export default router;

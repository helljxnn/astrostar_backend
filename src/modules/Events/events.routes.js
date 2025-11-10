import express from 'express';
import { EventsController } from './events.controller.js';

const router = express.Router();
const eventsController = new EventsController();

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

// src/routes/documentTypes.routes.js
import express from 'express';
import documentTypesController from '../controllers/documentTypes.controller.js';

const router = express.Router();

// Ruta: GET /api/document-types
router.get('/', documentTypesController.getDocumentTypes);

export default router;
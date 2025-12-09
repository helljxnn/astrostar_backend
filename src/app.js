import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { swaggerUi, specs } from './config/swagger.js';
import routes from './routes/index.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // En desarrollo, permitir cualquier localhost o IP local
    if (process.env.NODE_ENV === 'development') {
      // Permitir localhost en cualquier puerto
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
      // Permitir IPs locales (192.168.x.x, 10.x.x.x, etc.)
      if (origin.match(/^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/)) {
        return callback(null, true);
      }
    }
    
    // Lista de orígenes permitidos para producción
    const allowedOrigins = [
      'http://localhost:5173',      // React/Vite dev
      'http://localhost:3000',      // React dev alternativo
      'http://localhost:50243',     // Flutter Web
      'http://localhost:51251',     // Flutter Web (puerto alternativo)
      process.env.FRONTEND_URL,     // URL del .env
    ].filter(Boolean); // Eliminar undefined/null
    
    // Verificar si el origin está permitido
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // En desarrollo, permitir de todas formas (para debugging)
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ CORS: Permitiendo origin no listado en desarrollo: ${origin}`);
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true // Permitir envío de cookies
}));
app.use(cookieParser());
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));

// 💾 Servir imágenes subidas de categorías
app.use('/uploads/categories', express.static('src/uploads/categories'));

// Swagger documentation - DEBE IR ANTES de las rutas API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "AstroStar API Documentation",
  swaggerOptions: {
    persistAuthorization: true,
  }
}));


// Asegurar UTF-8 en respuestas JSON (solo para rutas /api)
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// API routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AstroStar API is running!',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

export default app;

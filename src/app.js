import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { swaggerUi, specs } from './config/swagger.js';
import routes from './routes/index.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

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
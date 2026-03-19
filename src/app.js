import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { swaggerUi, specs } from "./config/swagger.js";
import routes from "./routes/index.js";
import { requestLogger, errorLogger } from "./middlewares/requestLogger.js";
import { apiLimiter } from "./middlewares/rateLimiter.js";
import logger from "./config/logger.js";

const app = express();

// Helmet - Headers de seguridad
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Permitir recursos externos
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Permitir CORS
    hsts: {
      maxAge: 31536000, // 1 año
      includeSubDomains: true,
      preload: true,
    },
  }),
);

// Request logger (en todos los ambientes)
app.use(requestLogger);

// CORS - Configuración segura
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [
        process.env.FRONTEND_URL || "https://astrostar.com",
        "https://www.astrostar.com",
        "https://app.astrostar.com",
      ].filter(Boolean)
    : [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        process.env.FRONTEND_URL,
      ].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // En desarrollo, permitir todas las conexiones (incluyendo móvil)
      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      // Permitir requests sin origin (mobile apps, Postman, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️  CORS blocked request from origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Permitir envío de cookies
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 600, // Cache preflight requests por 10 minutos
  }),
);
app.use(cookieParser());
app.use(
  express.json({
    limit: "10mb", // Límite de 10MB para JSON
    charset: "utf-8",
  }),
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb", // Límite de 10MB para form data
    charset: "utf-8",
  }),
);

// 💾 Servir imágenes subidas de categorías
app.use("/uploads/categories", express.static("src/uploads/categories"));

// 💾 Servir assets públicos (imágenes para RSVP, etc.)
app.use("/public", express.static("src/public"));

// Swagger documentation - DEBE IR ANTES de las rutas API
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "AstroStar API Documentation",
    swaggerOptions: {
      persistAuthorization: true,
    },
  }),
);

// Asegurar UTF-8 en respuestas JSON (solo para rutas /api)
app.use("/api", (req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// Rate limiting global para API
app.use("/api/", apiLimiter);

// API routes
app.use("/api", routes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "AstroStar API is running!",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use(errorLogger); // Log de errores
app.use((error, req, res, next) => {
  // Log del error
  logger.error("Unhandled Error", {
    message: error.message,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    url: req.originalUrl,
    method: req.method,
  });

  // Respuesta al cliente
  res.status(error.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Error interno del servidor"
        : error.message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
});

export default app;

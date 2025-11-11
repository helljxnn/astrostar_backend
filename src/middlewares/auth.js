import jwt from "jsonwebtoken";
import prisma from "../config/database.js";

// Middleware de autenticación JWT
export const authenticateToken = async (req, res, next) => {
  try {
    const { accessToken } = req.cookies;

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: "No autorizado. No se encontró el token.",
      });
    }

    // Verificar el token y decodificacion
    const decoded = jwt.verify(
      accessToken,
      process.env.JWT_SECRET
    );

    // Guardamos los datos del token
    req.user = decoded;
    console.log(req.user);

    // Seguimos con la api
    next();
  } catch (error) {
    // Si el error es porque el token ha expirado, enviamos una respuesta 401 específica.
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "Token expirado. Por favor, refresque el token.",
        error: "token_expired", // Un código de error para que el frontend lo identifique fácil.
      });
    }

    // Para otros errores de JWT (ej. firma inválida), también es un error de autorización.
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Token inválido.",
        error: "invalid_token",
      });
    }

    // Para cualquier otro tipo de error, sí es un error del servidor.
    console.error("Error en autenticación:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

// Middleware opcional de autenticación (no falla si no hay token)
export const optionalAuth = async (req, res, next) => {
  try {
    const { accessToken } = req.cookies;

    if (!accessToken) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET || "your-secret-key"
    );

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        role: {
          select: {
            id: true,
            name: true,
            status: true,
            permissions: true,
          },
        },
      },
    });

    req.user = user && user.status === "Active" ? user : null;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

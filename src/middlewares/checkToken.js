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
      process.env.JWT_SECRET || "your-secret-key"
    );

    // Guardamos los datos del token
    req.user = decoded;
    console.log(req.user);

    // Seguimos con la api
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({
        success: false,
        message: "Token inválido",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(403).json({
        success: false,
        message: "Token expirado",
      });
    }

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

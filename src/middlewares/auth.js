import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no está configurado en variables de entorno');
  }
  return secret;
};

// Middleware de autenticación JWT
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    const decoded = jwt.verify(token, getJwtSecret());

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
            permissions: true
          }
        },
        athlete: {
          select: {
            id: true,
            status: true,
            guardianId: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (user.status !== 'Active') {
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        message: 'Token inválido'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({
        success: false,
        message: 'Token expirado'
      });
    }

    console.error('Error en autenticación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware opcional de autenticación (no falla si no hay token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, getJwtSecret());

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
            permissions: true
          }
        },
        athlete: {
          select: {
            id: true,
            status: true,
            guardianId: true
          }
        }
      }
    });

    req.user = user && user.status === 'Active' ? user : null;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

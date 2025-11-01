import bcrypt from "bcryptjs";
import prisma from "../../../config/database.js";
import jwt from "jsonwebtoken";

/**
 * Maneja el inicio de sesión de un usuario, generando un accessToken y un refreshToken.
 * @param {object} req - El objeto de solicitud de Express.
 * @param {object} res - El objeto de respuesta de Express.
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  // Validación de entrada
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Por favor, proporcione un email y una contraseña.",
    });
  }

  try {
    // Búsqueda del usuario por email. Usamos findUnique que es más eficiente.
    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(), // Normalizar el email a minúsculas
      },
      include: {
        role: true, // Incluir la información del rol
      },
    });

    // Validación si el usuario no existe o si su estado no es 'Activo'
    if (!user || user.status !== "Active") {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas o usuario inactivo.",
      });
    }

    // Comparación de la contraseña proporcionada con el hash almacenado
    const match = await bcrypt.compare(password, user.passwordHash);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas o usuario inactivo.",
      });
    }

    // --- Generación de Access Token ---
    const accessTokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role.name,
      permissions: user.role.permissions,
    };
    const accessToken = jwt.sign(
      accessTokenPayload,
      process.env.TOKEN_SECRET,
      {
        expiresIn: "15m",
      }
    );

    // --- Generación de Refresh Token ---
    const refreshTokenPayload = { id: user.id };
    const refreshToken = jwt.sign(
      refreshTokenPayload,
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Guardar el refreshToken en la base de datos para el usuario
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshToken },
    });

    // Guardar refreshToken en una cookie segura
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    // Devolver el accessToken en la respuesta JSON
    res.status(200).json({
      success: true,
      message: `Bienvenido, ${user.firstName}!`,
      token: accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role.name,
        permissions: user.role.permissions,
      },
    });
  } catch (error) {
    console.error("Error en el login:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor. Por favor, inténtelo de nuevo.",
    });
  }
};

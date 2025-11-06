import bcrypt from "bcryptjs";
import prisma from "../../../config/database.js";
import jwt from "jsonwebtoken";

class Auth {
  /**
   * Maneja el inicio de sesión de un usuario, generando un accessToken y un refreshToken.
   * @param {object} req - El objeto de solicitud de Express.
   * @param {object} res - El objeto de respuesta de Express.
   */
  Login = async (req, res) => {
    const { email, password } = req.body;

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
          message: "Invalid credentials or inactive user.",
        });
      }

      // Comparación de la contraseña proporcionada con el hash almacenado
      const match = await bcrypt.compare(password, user.passwordHash);

      if (!match) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid credentials or inactive user.Invalid credentials or inactive user.",
        });
      }

      // --- Generación de Access Token ---
      const accessTokenPayload = {
        id: user.id,
        email: user.email,
        name: user.firstName,
      };
      const accessToken = jwt.sign(accessTokenPayload, process.env.JWT_SECRET, {
        expiresIn: "15m",
      });

      // --- Generación de Refresh Token ---
      const refreshTokenPayload = {
        id: user.id,
      };
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

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV == "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 1000, // 1 hora
      });

      // Devolver el accessToken en la respuesta JSON
      res.status(200).json({
        success: true,
        message: `Welcome, ${user.firstName}!`,
      });
    } catch (error) {
      console.error("Error in the auth:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error. Please try again",
      });
    }
  };

  Logout = async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (refreshToken) {
        // Busca el usuario con ese refreshToken
        const user = await prisma.user.findFirst({
          where: { refreshToken },
        });

        if (user) {
          // Limpia el refreshToken en la base de datos
          await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: null },
          });
        }
      }

      // Limpia las cookies en el navegador
      res.clearCookie("accessToken", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });

      return res.status(200).json({
        success: true,
        message: "Sesión cerrada correctamente",
      });
    } catch (error) {
      console.log("Error: ", error);
      res.status(500).json({
        success: false,
        message: "Internal server error. Please try again",
      });
    }
  };

  Profile = async (req, res) => {
    try {
      const { id } = req.user;
      // Validacion de existencia del usuario
      if (!id) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      let permissions = await prisma.user.findUnique({
        where: {
          id: id,
        },
        include: {
          role: true,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Permissions found successfully",
        data: permissions,
      });
    } catch (error) {
      console.log("Error: ", error);
      res.status(500).json({
        success: false,
        message: "Error internal sever. Please try again",
      });
    }
  };
}

export { Auth };

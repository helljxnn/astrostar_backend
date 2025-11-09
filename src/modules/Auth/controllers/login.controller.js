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
          email: email.toLowerCase(),
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
            "Invalid credentials or inactive user.",
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
      });

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV == "production",
        sameSite: "strict",
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
      const { accessToken } = req.cookies;

      // Decodificación del accessToken para extraer el usuario
      const id = jwt.verify(accessToken, process.env.JWT_SECRET).id;

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          role: {
            include: {
              rolePermissionPrivilege: {
                include: {
                  permission: true,
                  privilege: true,
                }, // include privileges & permissions
              }, // rolePermissionPrivilege
            }, // include role
          }, // role
        }, // include user
      });

      // Si no existe el usuario
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const formattedUser = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: {
          id: user.role.id,
          name: user.role.name,
          permissions: Object.values(
            user.role.rolePermissionPrivilege.reduce((acc, rpp) => {
              const moduleName = rpp.permission.name;

              if (!acc[moduleName]) {
                acc[moduleName] = {
                  id: rpp.permission.id,
                  name: moduleName,
                  privileges: [],
                };
              }

              acc[moduleName].privileges.push({
                id: rpp.privilege.id,
                name: rpp.privilege.name,
              });

              return acc;
            }, {})
          ),
        },
      };

      return res.status(200).json({
        success: true,
        message: "Permissions found successfully",
        data: formattedUser,
      });
    } catch (error) {
      console.log("Error: ", error);
      res.status(500).json({
        success: false,
        message: "Internal server error. Please try again",
      });
    }
  };

  
  RefreshToken = (req, res) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "No refresh token provided",
      });
    }

    try {
      // Verificar el refreshToken
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );

      // Generar un nuevo accessToken
      const accessTokenPayload = {
        // Extraemos el id del usuario del token decodificado
        id: decoded.id,
      };

      // Generamos el nuevo accessToken
      const newAccessToken = jwt.sign(
        accessTokenPayload,
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV == "production",
        sameSite: "strict",
      });
      res.status(200).json({
        sucess: true,
        message: "New access token generated successfully",
      });
    } catch (error) {
      return res.status(500).jsxon({
        success: false,
        message: "Internal server error. Please try again",
      });
    }
  }
}
export { Auth };

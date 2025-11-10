import bcrypt from "bcryptjs";
import prisma from "../../../config/database.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

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
          message: "Invalid credentials or inactive user.",
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

  DocumentType = async (req, res) => {
    try {
      const documents = await prisma.documentType.findMany();

      if (!documents || documents.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No se encontraron tipos de documento.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Tipos de documento encontrados exitosamente.",
        data: documents,
      });
    } catch (error) {
      console.error("Error fetching document types:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor. Por favor, inténtelo de nuevo.",
      });
    }
  };

  UpdateProfile = async (req, res) => {
    const { pk } = req.params;
    try {
      const user = await prisma.user.update({
        where: { id: parseInt(pk) },
        data: req.body,
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Error to update user",
        });
      }

      return res.status(200).json({
        success: true,
        message: "User updated successfully",
      });
    } catch (error) {
      console.log("Error", error);
      return res.status(500).json({
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
  };

  forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        // Por seguridad, no revelamos si el usuario existe o no.
        return res.status(200).json({
          success: true,
          message:
            "Si existe una cuenta con este correo, se ha enviado un enlace para restablecer la contraseña.",
        });
      }

      // Generar token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      const passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: passwordResetToken,
          resetPasswordExpires: passwordResetExpires,
        },
      });

      // --- Lógica de envío de correo directamente en la función ---
      try {
        // 1. Crear el transportador de Nodemailer usando credenciales de Mailtrap del .env
        //    Asegúrate de que MAILTRAP_USER y MAILTRAP_PASS estén en tu archivo .env
        const transporter = nodemailer.createTransport({
          host: "smtp.mailtrap.io",
          port: 2525,
          auth: {
            user: process.env.MAILTRAP_USER,
            pass: process.env.MAILTRAP_PASS,
          },
        });

        // 2. Definir el contenido del correo
        const resetUrl = `${
          process.env.FRONTEND_URL || "http://localhost:5173"
        }/reset-password?token=${resetToken}`;

        const mailOptions = {
          from: '"Soporte AstroStar" <no-reply@astrostar.com>', // Remitente
          to: email, // Destinatario (el email del frontend)
          subject: "🔐 Recuperación de Contraseña - AstroStar", // Asunto
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
              <h2 style="color: #333;">Recuperación de Contraseña</h2>
              <p>Hola,</p>
              <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente botón para continuar:</p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Restablecer Contraseña
                </a>
              </div>
              <p>Este enlace expirará en 15 minutos.</p>
              <p>Si no solicitaste esto, puedes ignorar este correo de forma segura.</p>
              <hr>
              <p style="font-size: 0.9em; color: #777;">Si tienes problemas con el botón, copia y pega la siguiente URL en tu navegador:</p>
              <p style="font-size: 0.9em; color: #777; word-break: break-all;">${resetUrl}</p>
            </div>`,
        };

        // 3. Enviar el correo
        await transporter.sendMail(mailOptions);
        console.log(`📧 Correo de recuperación enviado a ${email}`);
      } catch (emailError) {
        console.error("❌ Error al enviar el correo de recuperación:", emailError);
        // Aunque el correo falle, no revelamos el error al usuario por seguridad.
        // El error se verá en la consola del servidor para que puedas depurarlo.
      }

      return res.status(200).json({
        success: true,
        message:
          "Si existe una cuenta con este correo, se ha enviado un enlace para restablecer la contraseña.",
      });
    } catch (error) {
      console.error("Error in forgotPassword:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor. Por favor, inténtelo de nuevo.",
      });
    }
  };

  verifyCode = async (req, res) => {
    const { token } = req.body;

    try {
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const user = await prisma.user.findFirst({
        where: {
          resetPasswordToken: hashedToken,
          resetPasswordExpires: {
            gt: new Date(),
          },
        },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "El código es inválido o ha expirado.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Código verificado correctamente.",
      });
    } catch (error) {
      console.error("Error in verifyCode:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor. Por favor, inténtelo de nuevo.",
      });
    }
  };

  resetPassword = async (req, res) => {
    const { token, password } = req.body;

    try {
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const user = await prisma.user.findFirst({
        where: {
          resetPasswordToken: hashedToken,
          resetPasswordExpires: {
            gt: new Date(),
          },
        },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "El token es inválido o ha expirado.",
        });
      }

      // Encriptar la nueva contraseña
      const passwordHash = await bcrypt.hash(password, 10);

      // Actualizar la contraseña y limpiar los campos de reseteo
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Contraseña actualizada correctamente.",
      });
    } catch (error) {
      console.error("Error in resetPassword:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor. Por favor, inténtelo de nuevo.",
      });
    }
  };
}
export { Auth };

import prisma from "../../../config/database.js";

export class AuthRepository {
  /**
   * Buscar usuario por email con relaciones completas
   */
  async findByEmail(email) {
    try {
      return await prisma.user.findUnique({
        where: { email },
        include: {
          documentType: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          role: {
            select: {
              id: true,
              name: true,
              description: true,
              permissions: true
            }
          },
          employee: {
            select: {
              id: true,
              status: true,
              statusAssignedAt: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          athlete: {
            select: {
              id: true,
              status: true,
              guardianId: true,
              relationship: true,
              otherRelationship: true,
              currentInscriptionStatus: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Repository error - findByEmail:", error);
      throw error;
    }
  }

  /**
   * Buscar usuario por ID
   */
  async findById(id) {
    try {
      return await prisma.user.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          passwordHash: true,
          email: true,
          status: true,
          refreshToken: true,
        },
      });
    } catch (error) {
      console.error("Repository error - findById:", error);
      throw error;
    }
  }

  /**
   * Actualizar contraseña del usuario
   */
  async updatePassword(userId, newPasswordHash) {
    try {
      return await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { passwordHash: newPasswordHash },
        select: {
          id: true,
          email: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      console.error("Repository error - updatePassword:", error);
      throw error;
    }
  }

  /**
   * Actualizar el refresh token del usuario
   */
  async updateUserRefreshToken(userId, refreshToken) {
    try {
      return await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { refreshToken },
        select: { id: true },
      });
    } catch (error) {
      console.error("Repository error - updateUserRefreshToken:", error);
      throw error;
    }
  }

  /**
   * Actualizar el token de reseteo de contraseña del usuario
   */
  async updateUserResetToken(userId, resetToken, resetExpires) {
    try {
      return await prisma.user.update({
        where: { id: parseInt(userId) },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
        },
        select: { id: true },
      });
    } catch (error) {
      console.error("Repository error - updateUserResetToken:", error);
      throw error;
    }
  }

  /**
   * Buscar usuario por token de reseteo de contraseña y verificar expiración
   */
  async findByPasswordResetToken(resetToken) {
    try {
      return await prisma.user.findFirst({
        where: {
          passwordResetToken: resetToken,
          passwordResetExpires: {
            gt: new Date(), // Asegura que el token no haya expirado
          },
        },
        select: { id: true, email: true }, // Solo necesitamos el ID y email para el reseteo
      });
    } catch (error) {
      console.error("Repository error - findByPasswordResetToken:", error);
      throw error;
    }
  }

  /**
   * Resetear la contraseña del usuario y limpiar los campos de reseteo
   */
  async resetPassword(userId, newPasswordHash) {
    try {
      return await prisma.user.update({
        where: { id: parseInt(userId) },
        data: {
          passwordHash: newPasswordHash,
          passwordResetToken: null,
          passwordResetExpires: null,
        },
        select: {
          id: true,
          email: true,
        },
      });
    } catch (error) {
      console.error("Repository error - resetPassword:", error);
      throw error;
    }
  }

  /**
   * Buscar perfil de usuario por ID con relaciones completas
   */
  async findProfileById(userId) {
    try {
      return await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        include: {
          documentType: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          role: {
            select: {
              id: true,
              name: true,
              description: true,
              status: true,
              permissions: true,
            },
          },
          employee: {
            select: {
              id: true,
              status: true,
            },
          },
          athlete: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Repository error - findProfileById:", error);
      throw error;
    }
  }

  /**
   * Actualizar perfil de usuario
   */
  async updateProfile(userId, data) {
    try {
      return await prisma.user.update({
        where: { id: parseInt(userId) },
        data,
        select: { id: true }, // Solo devolvemos el ID para confirmar la actualización
      });
    } catch (error) {
      console.error("Repository error - updateProfile:", error);
      throw error;
    }
  }
}

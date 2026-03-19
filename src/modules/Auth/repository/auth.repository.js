import prisma from "../../../config/database.js";

export class AuthRepository {
  normalizeEmail(email) {
    return String(email || "").toLowerCase().trim();
  }

  toCanonicalGmailEmail(email) {
    const normalized = this.normalizeEmail(email);
    if (!normalized.includes("@")) return null;

    const [localPartRaw, domainRaw] = normalized.split("@");
    const domain = domainRaw?.trim();
    if (!localPartRaw || !domain) return null;
    if (domain !== "gmail.com" && domain !== "googlemail.com") return null;

    const localWithoutPlus = localPartRaw.split("+")[0];
    const canonicalLocal = localWithoutPlus.replace(/\./g, "");
    if (!canonicalLocal) return null;

    return `${canonicalLocal}@gmail.com`;
  }

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
              permissions: true,
            },
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
   * Buscar usuario por alias canónico de Gmail.
   * Permite autenticación con correos equivalentes (con/sin puntos o +tag).
   */
  async findByGmailAlias(email) {
    try {
      const canonical = this.toCanonicalGmailEmail(email);
      if (!canonical) {
        return null;
      }

      const rows = await prisma.$queryRaw`
        SELECT u.id
        FROM "public"."users" u
        WHERE
          (
            LOWER(SPLIT_PART(u.email, '@', 2)) = 'gmail.com'
            OR LOWER(SPLIT_PART(u.email, '@', 2)) = 'googlemail.com'
          )
          AND LOWER(
            CONCAT(
              SPLIT_PART(
                REPLACE(LOWER(SPLIT_PART(u.email, '@', 1)), '.', ''),
                '+',
                1
              ),
              '@gmail.com'
            )
          ) = ${canonical}
        LIMIT 2
      `;

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      // Si hay colisión canónica, evitamos autenticar un usuario ambiguo.
      if (rows.length > 1) {
        console.warn(
          `[AUTH] Colisión de alias Gmail para ${canonical}. Revisar usuarios duplicados.`,
        );
        return null;
      }

      return await this.findByIdComplete(rows[0].id);
    } catch (error) {
      console.error("Repository error - findByGmailAlias:", error);
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
   * Crear token de recuperación de contraseña
   */
  async createPasswordResetToken(
    userId,
    token,
    expiresAt,
    ipAddress = null,
    userAgent = null,
  ) {
    try {
      return await prisma.passwordResetToken.create({
        data: {
          userId: parseInt(userId),
          token,
          expiresAt,
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      console.error("Repository error - createPasswordResetToken:", error);
      throw error;
    }
  }

  /**
   * Buscar token de recuperación por valor (sin validar expiración)
   */
  async findResetTokenByValue(token) {
    try {
      return await prisma.passwordResetToken.findFirst({
        where: { token },
        select: {
          id: true,
          attempts: true,
          used: true,
          expiresAt: true,
        },
      });
    } catch (error) {
      console.error("Repository error - findResetTokenByValue:", error);
      throw error;
    }
  }

  /**
   * Buscar token de recuperación válido
   */
  async findValidResetToken(token) {
    try {
      return await prisma.passwordResetToken.findFirst({
        where: {
          token,
          used: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Repository error - findValidResetToken:", error);
      throw error;
    }
  }

  /**
   * Marcar token como usado
   */
  async markTokenAsUsed(tokenId) {
    try {
      return await prisma.passwordResetToken.update({
        where: { id: tokenId },
        data: { used: true },
      });
    } catch (error) {
      console.error("Repository error - markTokenAsUsed:", error);
      throw error;
    }
  }

  /**
   * Eliminar tokens antiguos de un usuario
   */
  async deleteOldTokens(userId) {
    try {
      return await prisma.passwordResetToken.deleteMany({
        where: {
          userId: parseInt(userId),
          OR: [{ used: true }, { expiresAt: { lt: new Date() } }],
        },
      });
    } catch (error) {
      console.error("Repository error - deleteOldTokens:", error);
      throw error;
    }
  }

  /**
   * Buscar usuario por ID con información completa
   */
  async findByIdComplete(id) {
    try {
      return await prisma.user.findUnique({
        where: { id: parseInt(id) },
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
              permissions: true,
            },
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

              currentInscriptionStatus: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Repository error - findByIdComplete:", error);
      throw error;
    }
  }

  /**
   * Crear token de verificación de email
   */
  async createEmailVerificationToken(userId, newEmail, token, expiresAt) {
    try {
      return await prisma.emailVerificationToken.create({
        data: {
          userId: parseInt(userId),
          newEmail,
          token,
          expiresAt,
        },
      });
    } catch (error) {
      console.error("Repository error - createEmailVerificationToken:", error);
      throw error;
    }
  }

  /**
   * Buscar token de verificación de email válido
   */
  async findValidEmailVerificationToken(userId, token) {
    try {
      return await prisma.emailVerificationToken.findFirst({
        where: {
          userId: parseInt(userId),
          token,
          used: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });
    } catch (error) {
      console.error(
        "Repository error - findValidEmailVerificationToken:",
        error,
      );
      throw error;
    }
  }

  /**
   * Marcar token de email como usado
   */
  async markEmailTokenAsUsed(tokenId) {
    try {
      return await prisma.emailVerificationToken.update({
        where: { id: tokenId },
        data: { used: true },
      });
    } catch (error) {
      console.error("Repository error - markEmailTokenAsUsed:", error);
      throw error;
    }
  }

  /**
   * Eliminar tokens antiguos de verificación de email
   */
  async deleteOldEmailVerificationTokens(userId) {
    try {
      return await prisma.emailVerificationToken.deleteMany({
        where: {
          userId: parseInt(userId),
          OR: [{ used: true }, { expiresAt: { lt: new Date() } }],
        },
      });
    } catch (error) {
      console.error(
        "Repository error - deleteOldEmailVerificationTokens:",
        error,
      );
      throw error;
    }
  }

  /**
   * Actualizar email del usuario
   */
  async updateEmail(userId, newEmail) {
    try {
      return await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { email: newEmail },
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
              permissions: true,
            },
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

              currentInscriptionStatus: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Repository error - updateEmail:", error);
      throw error;
    }
  }

  /**
   * Actualizar perfil del usuario
   */
  async updateProfile(userId, updateData) {
    try {
      return await prisma.user.update({
        where: { id: parseInt(userId) },
        data: updateData,
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
              permissions: true,
            },
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

              currentInscriptionStatus: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Repository error - updateProfile:", error);
      throw error;
    }
  }

  /**
   * Crear refresh token
   */
  async createRefreshToken(userId, token, expiresAt) {
    try {
      return await prisma.refreshToken.create({
        data: {
          userId: parseInt(userId),
          token,
          expiresAt,
        },
      });
    } catch (error) {
      console.error("Repository error - createRefreshToken:", error);
      throw error;
    }
  }

  /**
   * Buscar refresh token válido
   */
  async findValidRefreshToken(token) {
    try {
      return await prisma.refreshToken.findFirst({
        where: {
          token,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              status: true,
              roleId: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Repository error - findValidRefreshToken:", error);
      throw error;
    }
  }

  /**
   * Eliminar refresh token
   */
  async deleteRefreshToken(token) {
    try {
      return await prisma.refreshToken.deleteMany({
        where: { token },
      });
    } catch (error) {
      console.error("Repository error - deleteRefreshToken:", error);
      throw error;
    }
  }

  /**
   * Eliminar todos los refresh tokens de un usuario
   */
  async deleteUserRefreshTokens(userId) {
    try {
      return await prisma.refreshToken.deleteMany({
        where: { userId: parseInt(userId) },
      });
    } catch (error) {
      console.error("Repository error - deleteUserRefreshTokens:", error);
      throw error;
    }
  }

  /**
   * Eliminar refresh tokens expirados
   */
  async deleteExpiredRefreshTokens() {
    try {
      return await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
    } catch (error) {
      console.error("Repository error - deleteExpiredRefreshTokens:", error);
      throw error;
    }
  }
}


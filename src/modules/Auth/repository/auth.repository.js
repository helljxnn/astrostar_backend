import prisma from '../../../config/database.js';

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
              description: true
            }
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
              updatedAt: true
            }
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
              updatedAt: true
            }
          }
        }
      });
    } catch (error) {
      console.error('Repository error - findByEmail:', error);
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
          status: true
        }
      });
    } catch (error) {
      console.error('Repository error - findById:', error);
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
          updatedAt: true
        }
      });
    } catch (error) {
      console.error('Repository error - updatePassword:', error);
      throw error;
    }
  }
}
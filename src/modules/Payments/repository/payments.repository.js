import prisma from "../../../config/database.js";

export const paymentsRepository = {
  // ============================================================================
  // OBLIGACIONES DE PAGO
  // ============================================================================

  /**
   * Crear una nueva obligación de pago
   */
  async createObligation(data) {
    return await prisma.paymentObligation.create({
      data,
      include: {
        athlete: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                identification: true,
                email: true
              }
            }
          }
        }
      }
    });
  },

  /**
   * Buscar obligación existente para evitar duplicados
   */
  async findExistingObligation(athleteId, type, period = null) {
    const where = {
      athleteId,
      type
    };

    // Solo agregar period si es tipo MONTHLY
    if (type === 'MONTHLY' && period) {
      where.period = period;
    }

    // Para ENROLLMENT_RENEWAL, buscar cualquier obligación sin pago aprobado
    if (type === 'ENROLLMENT_RENEWAL') {
      where.payments = {
        none: { status: 'APPROVED' }
      };
    }

    return await prisma.paymentObligation.findFirst({
      where,
      include: {
        payments: {
          where: { status: 'APPROVED' },
          take: 1
        }
      }
    });
  },

  /**
   * Obtener TODAS las obligaciones pendientes de un atleta (MEJORADO)
   * Incluye obligaciones sin pago aprobado
   */
  async getAllPendingObligations(athleteId) {
    return await prisma.paymentObligation.findMany({
      where: {
        athleteId,
        payments: {
          none: { status: 'APPROVED' }
        }
      },
      include: {
        payments: {
          orderBy: { uploadedAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  },

  /**
   * Obtener estado financiero de un atleta (MÉTODO ORIGINAL - MANTENER COMPATIBILIDAD)
   */
  async getAthleteFinancialStatus(athleteId) {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Buscar mensualidad actual
    const monthlyObligation = await prisma.paymentObligation.findFirst({
      where: {
        athleteId,
        type: 'MONTHLY',
        period: currentMonth
      },
      include: {
        payments: {
          where: { status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    // Buscar renovación de matrícula pendiente
    const enrollmentObligation = await prisma.paymentObligation.findFirst({
      where: {
        athleteId,
        type: 'ENROLLMENT_RENEWAL'
      },
      include: {
        payments: {
          where: { status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    return {
      monthly: monthlyObligation,
      enrollment: enrollmentObligation
    };
  },

  /**
   * Obtener obligaciones vencidas para bloqueo
   */
  async getOverdueObligations(athleteId) {
    const now = new Date();
    
    return await prisma.paymentObligation.findMany({
      where: {
        athleteId,
        dueEnd: { lt: now },
        payments: {
          none: { status: 'APPROVED' }
        }
      },
      include: {
        payments: {
          where: { status: { in: ['PENDING', 'REJECTED'] } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  },

  // ============================================================================
  // PAGOS/COMPROBANTES
  // ============================================================================

  /**
   * Crear un nuevo pago (comprobante)
   */
  async createPayment(data) {
    return await prisma.payment.create({
      data,
      include: {
        obligation: {
          include: {
            athlete: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    identification: true
                  }
                }
              }
            }
          }
        }
      }
    });
  },

  /**
   * Obtener pagos pendientes para admin
   */
  async getPendingPayments(filters = {}) {
    const { page = 1, limit = 20, type } = filters;
    const skip = (page - 1) * limit;

    const where = {
      status: 'PENDING',
      ...(type && { obligation: { type } })
    };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          obligation: true,
          athlete: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  identification: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.payment.count({ where })
    ]);

    return {
      payments,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  },

  /**
   * Aprobar o rechazar un pago
   */
  async updatePaymentStatus(paymentId, status, reviewedBy, rejectionReason = null) {
    return await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy,
        rejectionReason
      },
      include: {
        obligation: true,
        athlete: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });
  },

  /**
   * Obtener historial de pagos de un atleta
   */
  async getAthletePaymentHistory(athleteId, filters = {}) {
    const { page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { athleteId },
        include: {
          obligation: true
        },
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.payment.count({ where: { athleteId } })
    ]);

    return {
      payments,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
      }
    };
  }
};
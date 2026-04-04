import prisma from "../../../config/database.js";

/**
 * Repositorio para el Dashboard
 * Consultas a la base de datos para estadisticas del dashboard
 */
class DashboardRepository {
  getSponsorDelegate() {
    return prisma?.sponsor ?? prisma?.donorSponsor ?? null;
  }

  toNumberAmount(value) {
    const numberValue = Number(value ?? 0);
    return Number.isFinite(numberValue) ? numberValue : 0;
  }

  getEventWhere() {
    return {
      OR: [
        { ServiceType: { is: { name: { in: ["Clausura", "Taller", "Torneo", "Festival"] } } } },
        { categoryId: { not: null } },
      ],
    };
  }

  async getActiveDonorsCount(sponsorDelegate) {
    if (!sponsorDelegate?.count) {
      return 0;
    }

    try {
      return await sponsorDelegate.count({
        where: { status: "Active" },
      });
    } catch (error) {
      console.warn(
        "[WARN] Unable to count active sponsors with status filter; falling back to total count.",
      );
      return sponsorDelegate.count();
    }
  }

  /**
   * Obtener resumen general del dashboard
   */
  async getOverview() {
    try {
      // Ejecutar todas las consultas en paralelo para mejor rendimiento
      const [
        totalUsers,
        totalAthletes,
        totalEvents,
        totalEmployees,
        totalDonations,
        totalPayments,
        recentActivity,
      ] = await Promise.all([
        // Total de usuarios
        prisma.user.count(),

        // Total de deportistas activos
        prisma.athlete.count({
          where: { status: "Active" },
        }),

        // Total de eventos
        prisma.service.count({
          where: this.getEventWhere(),
        }),

        // Total de empleados activos
        prisma.employee.count({
          where: { status: "Activo" },
        }),

        // Total de donaciones
        prisma.donation.count(),

        // Total de pagos aprobados
        prisma.payment.count({
          where: { status: "APPROVED" },
        }),

        // Actividad reciente (ultimos 7 dias)
        this.getRecentActivity(),
      ]);

      return {
        kpis: {
          totalUsers,
          totalAthletes,
          totalEvents,
          totalEmployees,
          totalDonations,
          totalPayments,
        },
        recentActivity,
      };
    } catch (error) {
      console.error("Error in DashboardRepository.getOverview:", error);
      throw error;
    }
  }

  /**
   * Obtener estadisticas de eventos
   */
  async getEventsStats() {
    try {
      const [
        total,
        programmed,
        inProgress,
        completed,
        cancelled,
        byQuarter,
        byType,
        enrolledAthletes,
        enrolledTeams,
      ] = await Promise.all([
        // Total de eventos
        prisma.service.count({
          where: this.getEventWhere(),
        }),

        // Eventos programados
        prisma.service.count({
          where: {
            status: "Programado",
            ...this.getEventWhere(),
          },
        }),

        // Eventos en curso
        prisma.service.count({
          where: {
            status: "En_curso",
            ...this.getEventWhere(),
          },
        }),

        // Eventos completados
        prisma.service.count({
          where: {
            status: "Finalizado",
            ...this.getEventWhere(),
          },
        }),

        // Eventos cancelados
        prisma.service.count({
          where: {
            status: "Cancelado",
            ...this.getEventWhere(),
          },
        }),

        // Eventos por trimestre
        this.getEventsByQuarter(),

        // Eventos por tipo
        this.getEventsByType(),

        // Deportistas inscritos
        prisma.participant.count({
          where: { athleteId: { not: null } },
        }),

        // Equipos inscritos
        prisma.participant.count({
          where: { teamId: { not: null } },
        }),
      ]);

      return {
        total,
        upcoming: programmed + inProgress,
        enrolledAthletes,
        enrolledTeams,
        byStatus: {
          completed,
          inProgress,
          scheduled: programmed,
          cancelled,
        },
        byQuarter,
        byType,
        trends: await this.getEventsTrends(),
      };
    } catch (error) {
      console.error("Error in DashboardRepository.getEventsStats:", error);
      throw error;
    }
  }

  /**
   * Obtener estadisticas de deportistas
   */
  async getAthletesStats() {
    try {
      const [
        total,
        active,
        suspended,
        expired,
        byCategory,
        byAge,
        enrollmentStats,
      ] = await Promise.all([
        // Total de deportistas
        prisma.athlete.count(),

        // Deportistas activos
        prisma.athlete.count({
          where: { status: "Active" },
        }),

        // Deportistas suspendidos
        prisma.athlete.count({
          where: { status: "Inactive" },
        }),

        // Deportistas con inscripcion vencida
        prisma.enrollment.count({
          where: {
            estado: "Vencida",
          },
        }),

        // Por categoria deportiva
        this.getAthletesByCategory(),

        // Por rango de edad
        this.getAthletesByAge(),

        // Estadisticas de inscripciones
        this.getEnrollmentStats(),
      ]);

      return {
        total,
        active,
        suspended,
        expired,
        byCategory,
        byAge,
        enrollmentStats,
        trends: await this.getAthletesTrends(),
      };
    } catch (error) {
      console.error("Error in DashboardRepository.getAthletesStats:", error);
      throw error;
    }
  }

  /**
   * Obtener estadisticas de servicios de salud
   */
  async getHealthStats() {
    try {
      const [
        totalAppointments,
        completedAppointments,
        pendingAppointments,
        cancelledAppointments,
        totalEmployees,
        activeEmployees,
        bySpecialty,
        monthlyAppointments,
      ] = await Promise.all([
        // Total de citas
        prisma.appointment.count(),

        // Citas completadas
        prisma.appointment.count({
          where: { status: "Completado" },
        }),

        // Citas pendientes
        prisma.appointment.count({
          where: { status: "Programado" },
        }),

        // Citas canceladas
        prisma.appointment.count({
          where: { status: "Cancelado" },
        }),

        // Total de empleados
        prisma.employee.count(),

        // Empleados activos
        prisma.employee.count({
          where: { status: "Activo" },
        }),

        // Por especialidad
        this.getEmployeesBySpecialty(),

        // Citas por mes
        this.getMonthlyAppointments(),
      ]);

      return {
        appointments: {
          total: totalAppointments,
          completed: completedAppointments,
          pending: pendingAppointments,
          cancelled: cancelledAppointments,
        },
        employees: {
          total: totalEmployees,
          active: activeEmployees,
          bySpecialty,
        },
        monthlyAppointments,
        trends: await this.getHealthTrends(),
      };
    } catch (error) {
      console.error("Error in DashboardRepository.getHealthStats:", error);
      throw error;
    }
  }

  /**
   * Obtener estadisticas de donaciones
   */
  async getDonationsStats() {
    try {
      const sponsorDelegate = this.getSponsorDelegate();
      if (!sponsorDelegate?.count) {
        console.warn(
          "[WARN] Sponsor delegate is not available in Prisma client. Donor counters will use 0.",
        );
      }

      const [
        totalDonations,
        totalAmount,
        totalDonors,
        activeDonors,
        byType,
        monthlyDonations,
        topDonors,
      ] = await Promise.all([
        // Total de donaciones
        prisma.donation.count(),

        // Monto total donado
        prisma?.donationDetail?.aggregate
          ? prisma.donationDetail.aggregate({
              _sum: { amount: true },
            })
          : Promise.resolve({ _sum: { amount: 0 } }),

        // Total de donantes
        sponsorDelegate?.count ? sponsorDelegate.count() : Promise.resolve(0),

        // Donantes activos
        this.getActiveDonorsCount(sponsorDelegate),

        // Por tipo de donacion
        this.getDonationsByType(),

        // Donaciones por mes
        this.getMonthlyDonations(),

        // Top donantes
        this.getTopDonors(),
      ]);

      return {
        total: totalDonations,
        totalAmount: this.toNumberAmount(totalAmount?._sum?.amount),
        totalDonors,
        activeDonors,
        byType,
        monthlyDonations,
        topDonors,
        trends: await this.getDonationsTrends(),
      };
    } catch (error) {
      console.error("Error in DashboardRepository.getDonationsStats:", error);
      throw error;
    }
  }

  // ============================================================================
  // METODOS AUXILIARES
  // ============================================================================

  /**
   * Obtener actividad reciente
   */
  async getRecentActivity() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [newUsers, newAthletes, newEvents, newDonations] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.athlete.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.service.count({
        where: {
          ...this.getEventWhere(),
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.donation.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
    ]);

    return {
      newUsers,
      newAthletes,
      newEvents,
      newDonations,
    };
  }

  /**
   * Obtener eventos por trimestre
   */
  async getEventsByQuarter() {
    const events = await prisma.service.findMany({
      where: {
        ...this.getEventWhere(),
        status: "Finalizado",
      },
      select: { endDate: true },
    });

    const groupedData = {};

    events.forEach((event) => {
      const date = new Date(event.endDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const quarter = Math.ceil(month / 3);

      if (!groupedData[year]) {
        groupedData[year] = {};
      }

      groupedData[year][quarter] = (groupedData[year][quarter] || 0) + 1;
    });

    // Obtener los ultimos 3 anios
    const years = Object.keys(groupedData)
      .sort((a, b) => b - a)
      .slice(0, 3);

    const result = [];
    for (let quarter = 1; quarter <= 4; quarter++) {
      const quarterData = {
        trimestre: `Trim ${quarter}`,
      };

      years.forEach((year) => {
        quarterData[`anio${year}`] = groupedData[year]?.[quarter] || 0;
      });

      result.push(quarterData);
    }

    return result;
  }

  /**
   * Obtener eventos por tipo
   */
  async getEventsByType() {
    const eventTypes = await prisma.service.groupBy({
      by: ["typeId"],
      where: this.getEventWhere(),
      _count: { id: true },
    });

    // Obtener nombres de los tipos
    const typeIds = eventTypes.map((et) => et.typeId).filter(Boolean);
    const types = await prisma.serviceType.findMany({
      where: { id: { in: typeIds } },
      select: { id: true, name: true },
    });

    return eventTypes.map((et) => {
      const type = types.find((t) => t.id === et.typeId);
      return {
        name: type?.name || "Sin tipo",
        count: et._count.id,
      };
    });
  }

  /**
   * Obtener deportistas por categoria
   */
  async getAthletesByCategory() {
    const athletes = await prisma.athlete.findMany({
      where: { status: "Active" },
      select: {
        inscriptions: {
          where: { status: "Active" },
          orderBy: { inscriptionDate: "desc" },
          take: 1,
          select: {
            sportsCategory: {
              select: { nombre: true },
            },
          },
        },
      },
    });

    const categoryCounts = new Map();

    athletes.forEach((athlete) => {
      const categoryName =
        athlete.inscriptions?.[0]?.sportsCategory?.nombre || "Sin categoria";
      categoryCounts.set(categoryName, (categoryCounts.get(categoryName) || 0) + 1);
    });

    return Array.from(categoryCounts.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  }

  /**
   * Obtener deportistas por rango de edad
   */
  async getAthletesByAge() {
    const athletes = await prisma.athlete.findMany({
      select: {
        user: {
          select: { birthDate: true },
        },
      },
    });

    const ageRanges = {
      "6-10": 0,
      "11-15": 0,
      "16-20": 0,
      "21-25": 0,
      "26+": 0,
    };

    athletes.forEach((athlete) => {
      const birthDate = athlete.user?.birthDate;
      if (!birthDate) return;

      const age = new Date().getFullYear() - new Date(birthDate).getFullYear();

      if (age >= 6 && age <= 10) ageRanges["6-10"]++;
      else if (age >= 11 && age <= 15) ageRanges["11-15"]++;
      else if (age >= 16 && age <= 20) ageRanges["16-20"]++;
      else if (age >= 21 && age <= 25) ageRanges["21-25"]++;
      else if (age >= 26) ageRanges["26+"]++;
    });

    return Object.entries(ageRanges).map(([range, count]) => ({
      range,
      count,
    }));
  }

  /**
   * Obtener estadisticas de inscripciones
   */
  async getEnrollmentStats() {
    const [active, expired, suspended] = await Promise.all([
      prisma.enrollment.count({
        where: { estado: "Vigente" },
      }),
      prisma.enrollment.count({
        where: { estado: "Vencida" },
      }),
      prisma.inscription.count({
        where: { status: "Suspended" },
      }),
    ]);

    return { active, expired, suspended };
  }

  /**
   * Obtener empleados por especialidad
   */
  async getEmployeesBySpecialty() {
    const bySpecialty = await prisma.employee.groupBy({
      by: ["specialty"],
      _count: { id: true },
    });

    return bySpecialty.map((bs) => ({
      specialty: bs.specialty || "Sin especialidad",
      count: bs._count.id,
    }));
  }

  /**
   * Obtener citas por mes
   */
  async getMonthlyAppointments() {
    const appointments = await prisma.appointment.findMany({
      select: { appointmentDate: true, status: true },
    });

    const monthlyData = {};

    appointments.forEach((appointment) => {
      const date = new Date(appointment.appointmentDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { total: 0, completed: 0, cancelled: 0 };
      }

      monthlyData[monthKey].total++;
      if (appointment.status === "COMPLETED") monthlyData[monthKey].completed++;
      else if (appointment.status === "CANCELLED")
        monthlyData[monthKey].cancelled++;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Obtener donaciones por tipo
   */
  async getDonationsByType() {
    if (!prisma?.donationDetail?.groupBy) {
      return [];
    }

    const byType = await prisma.donationDetail.groupBy({
      by: ["kind"],
      _count: { id: true },
      _sum: { amount: true },
    });

    return byType.map((bt) => ({
      type: bt.kind,
      count: bt._count.id,
      amount: this.toNumberAmount(bt?._sum?.amount),
    }));
  }

  /**
   * Obtener donaciones por mes
   */
  async getMonthlyDonations() {
    const [donations, donationDetails] = await Promise.all([
      prisma.donation.findMany({
        select: { id: true, createdAt: true },
      }),
      prisma?.donationDetail?.findMany
        ? prisma.donationDetail.findMany({
            select: { donationId: true, amount: true },
          })
        : Promise.resolve([]),
    ]);

    const monthlyData = {};
    const amountByDonationId = new Map();

    for (const detail of donationDetails) {
      const current = amountByDonationId.get(detail.donationId) || 0;
      amountByDonationId.set(
        detail.donationId,
        current + this.toNumberAmount(detail.amount),
      );
    }

    donations.forEach((donation) => {
      const date = new Date(donation.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { count: 0, amount: 0 };
      }

      monthlyData[monthKey].count++;
      monthlyData[monthKey].amount += amountByDonationId.get(donation.id) || 0;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Obtener top donantes
   */
  async getTopDonors() {
    const sponsorDelegate = this.getSponsorDelegate();
    if (!sponsorDelegate?.findMany) {
      return [];
    }

    const [donors, donations, donationDetails] = await Promise.all([
      sponsorDelegate.findMany({
        select: { id: true, name: true },
      }),
      prisma.donation.findMany({
        where: { donorSponsorId: { not: null } },
        select: { id: true, donorSponsorId: true },
      }),
      prisma?.donationDetail?.findMany
        ? prisma.donationDetail.findMany({
            select: { donationId: true, amount: true },
          })
        : Promise.resolve([]),
    ]);

    const amountByDonationId = new Map();
    for (const detail of donationDetails) {
      const current = amountByDonationId.get(detail.donationId) || 0;
      amountByDonationId.set(
        detail.donationId,
        current + this.toNumberAmount(detail.amount),
      );
    }

    const donorTotals = new Map();
    const donorDonationCount = new Map();

    for (const donation of donations) {
      const sponsorId = donation.donorSponsorId;
      if (!sponsorId) continue;

      donorTotals.set(
        sponsorId,
        (donorTotals.get(sponsorId) || 0) +
          (amountByDonationId.get(donation.id) || 0),
      );
      donorDonationCount.set(
        sponsorId,
        (donorDonationCount.get(sponsorId) || 0) + 1,
      );
    }

    return donors
      .map((donor) => ({
        id: donor.id,
        name: donor.name,
        totalAmount: donorTotals.get(donor.id) || 0,
        donationsCount: donorDonationCount.get(donor.id) || 0,
      }))
      .filter((donor) => donor.totalAmount > 0 || donor.donationsCount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);
  }

  // ============================================================================
  // METODOS DE TENDENCIAS
  // ============================================================================

  async getEventsTrends() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [recent, previous] = await Promise.all([
      prisma.service.count({
        where: {
          ...this.getEventWhere(),
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.service.count({
        where: {
          ...this.getEventWhere(),
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      }),
    ]);

    return this.calculateGrowth(recent, previous);
  }

  async getAthletesTrends() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [recent, previous] = await Promise.all([
      prisma.athlete.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.athlete.count({
        where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),
    ]);

    return this.calculateGrowth(recent, previous);
  }

  async getHealthTrends() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [recent, previous] = await Promise.all([
      prisma.appointment.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.appointment.count({
        where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),
    ]);

    return this.calculateGrowth(recent, previous);
  }

  async getDonationsTrends() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [recent, previous] = await Promise.all([
      prisma.donation.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.donation.count({
        where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),
    ]);

    return this.calculateGrowth(recent, previous);
  }

  /**
   * Calcular porcentaje de crecimiento
   */
  calculateGrowth(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }
}

export const dashboardRepository = new DashboardRepository();

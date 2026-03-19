import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Repositorio para el Dashboard
 * Consultas a la base de datos para estadísticas del dashboard
 */
class DashboardRepository {
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
          where: { status: "ACTIVE" },
        }),

        // Total de eventos
        prisma.service.count({
          where: { type: "EVENT" },
        }),

        // Total de empleados activos
        prisma.employee.count({
          where: { status: "ACTIVE" },
        }),

        // Total de donaciones
        prisma.donation.count(),

        // Total de pagos aprobados
        prisma.payment.count({
          where: { status: "APPROVED" },
        }),

        // Actividad reciente (últimos 7 días)
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
      console.error("Error en DashboardRepository.getOverview:", error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de eventos
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
          where: { type: "EVENT" },
        }),

        // Eventos programados
        prisma.service.count({
          where: {
            type: "EVENT",
            status: "Programado",
          },
        }),

        // Eventos en curso
        prisma.service.count({
          where: {
            type: "EVENT",
            status: "En_curso",
          },
        }),

        // Eventos completados
        prisma.service.count({
          where: {
            type: "EVENT",
            status: "Finalizado",
          },
        }),

        // Eventos cancelados
        prisma.service.count({
          where: {
            type: "EVENT",
            status: "Cancelado",
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
      console.error("Error en DashboardRepository.getEventsStats:", error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de deportistas
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
          where: { status: "ACTIVE" },
        }),

        // Deportistas suspendidos
        prisma.athlete.count({
          where: { status: "SUSPENDED" },
        }),

        // Deportistas con inscripción vencida
        prisma.enrollment.count({
          where: {
            status: "EXPIRED",
          },
        }),

        // Por categoría deportiva
        this.getAthletesByCategory(),

        // Por rango de edad
        this.getAthletesByAge(),

        // Estadísticas de inscripciones
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
      console.error("Error en DashboardRepository.getAthletesStats:", error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de servicios de salud
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
          where: { status: "COMPLETED" },
        }),

        // Citas pendientes
        prisma.appointment.count({
          where: { status: "SCHEDULED" },
        }),

        // Citas canceladas
        prisma.appointment.count({
          where: { status: "CANCELLED" },
        }),

        // Total de empleados
        prisma.employee.count(),

        // Empleados activos
        prisma.employee.count({
          where: { status: "ACTIVE" },
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
      console.error("Error en DashboardRepository.getHealthStats:", error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de donaciones
   */
  async getDonationsStats() {
    try {
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
        prisma.donationDetail.aggregate({
          _sum: { amount: true },
        }),

        // Total de donantes
        prisma.donorSponsor.count(),

        // Donantes activos
        prisma.donorSponsor.count({
          where: { status: "ACTIVE" },
        }),

        // Por tipo de donación
        this.getDonationsByType(),

        // Donaciones por mes
        this.getMonthlyDonations(),

        // Top donantes
        this.getTopDonors(),
      ]);

      return {
        total: totalDonations,
        totalAmount: totalAmount._sum.amount || 0,
        totalDonors,
        activeDonors,
        byType,
        monthlyDonations,
        topDonors,
        trends: await this.getDonationsTrends(),
      };
    } catch (error) {
      console.error("Error en DashboardRepository.getDonationsStats:", error);
      throw error;
    }
  }

  // ============================================================================
  // MÉTODOS AUXILIARES
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
          type: "EVENT",
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
        type: "EVENT",
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

    // Obtener los últimos 3 años
    const years = Object.keys(groupedData)
      .sort((a, b) => b - a)
      .slice(0, 3);

    const result = [];
    for (let quarter = 1; quarter <= 4; quarter++) {
      const quarterData = {
        trimestre: `Trim ${quarter}`,
      };

      years.forEach((year) => {
        quarterData[`año${year}`] = groupedData[year]?.[quarter] || 0;
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
      where: { type: "EVENT" },
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
   * Obtener deportistas por categoría
   */
  async getAthletesByCategory() {
    const byCategory = await prisma.athlete.groupBy({
      by: ["sportsCategoryId"],
      _count: { id: true },
    });

    const categoryIds = byCategory
      .map((bc) => bc.sportsCategoryId)
      .filter(Boolean);
    const categories = await prisma.sportsCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });

    return byCategory.map((bc) => {
      const category = categories.find((c) => c.id === bc.sportsCategoryId);
      return {
        name: category?.name || "Sin categoría",
        count: bc._count.id,
      };
    });
  }

  /**
   * Obtener deportistas por rango de edad
   */
  async getAthletesByAge() {
    const athletes = await prisma.athlete.findMany({
      select: { birthDate: true },
    });

    const ageRanges = {
      "6-10": 0,
      "11-15": 0,
      "16-20": 0,
      "21-25": 0,
      "26+": 0,
    };

    athletes.forEach((athlete) => {
      if (!athlete.birthDate) return;

      const age =
        new Date().getFullYear() - new Date(athlete.birthDate).getFullYear();

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
   * Obtener estadísticas de inscripciones
   */
  async getEnrollmentStats() {
    const [active, expired, suspended] = await Promise.all([
      prisma.enrollment.count({
        where: { status: "ACTIVE" },
      }),
      prisma.enrollment.count({
        where: { status: "EXPIRED" },
      }),
      prisma.enrollment.count({
        where: { status: "SUSPENDED" },
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
    const byType = await prisma.donationDetail.groupBy({
      by: ["type"],
      _count: { id: true },
      _sum: { amount: true },
    });

    return byType.map((bt) => ({
      type: bt.type,
      count: bt._count.id,
      amount: bt._sum.amount || 0,
    }));
  }

  /**
   * Obtener donaciones por mes
   */
  async getMonthlyDonations() {
    const donations = await prisma.donation.findMany({
      select: { createdAt: true },
      include: {
        donationDetails: {
          select: { amount: true },
        },
      },
    });

    const monthlyData = {};

    donations.forEach((donation) => {
      const date = new Date(donation.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { count: 0, amount: 0 };
      }

      monthlyData[monthKey].count++;
      monthlyData[monthKey].amount += donation.donationDetails.reduce(
        (sum, detail) => sum + (detail.amount || 0),
        0,
      );
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Obtener top donantes
   */
  async getTopDonors() {
    const topDonors = await prisma.donorSponsor.findMany({
      include: {
        donations: {
          include: {
            donationDetails: {
              select: { amount: true },
            },
          },
        },
      },
    });

    const donorsWithTotals = topDonors.map((donor) => {
      const totalAmount = donor.donations.reduce((sum, donation) => {
        return (
          sum +
          donation.donationDetails.reduce(
            (detailSum, detail) => detailSum + (detail.amount || 0),
            0,
          )
        );
      }, 0);

      return {
        id: donor.id,
        name: donor.name,
        totalAmount,
        donationsCount: donor.donations.length,
      };
    });

    return donorsWithTotals
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);
  }

  // ============================================================================
  // MÉTODOS DE TENDENCIAS
  // ============================================================================

  async getEventsTrends() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [recent, previous] = await Promise.all([
      prisma.service.count({
        where: {
          type: "EVENT",
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.service.count({
        where: {
          type: "EVENT",
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

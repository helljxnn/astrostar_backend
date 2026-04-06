import prisma from "../../../../config/database.js";

export class AssistanceathletesRepository {
  isAttendanceTableMissing(error) {
    return (
      error?.code === "P2021" && error?.meta?.modelName === "AthleteAttendance"
    );
  }

  normalizeDate(dateString) {
    return new Date(`${dateString}T00:00:00.000Z`);
  }

  buildMissingTableError() {
    const missingTableError = new Error(
      "La tabla de asistencias no está disponible. Ejecuta las migraciones pendientes.",
    );
    missingTableError.statusCode = 503;
    return missingTableError;
  }

  buildAthleteName(user) {
    return [user.firstName, user.lastName].filter(Boolean).join(" ");
  }

  calculateAge(birthDate) {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  }

  buildWhere({ search, categoria }) {
    const where = {};

    if (search) {
      const userConditions = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { identification: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];

      // Búsqueda por nombre completo (ej: "Martha Cataño")
      const parts = search.trim().split(/\s+/);
      if (parts.length >= 2) {
        userConditions.push(
          {
            AND: [
              { firstName: { contains: parts[0], mode: "insensitive" } },
              {
                lastName: {
                  contains: parts.slice(1).join(" "),
                  mode: "insensitive",
                },
              },
            ],
          },
          {
            AND: [
              { lastName: { contains: parts[0], mode: "insensitive" } },
              {
                firstName: {
                  contains: parts.slice(1).join(" "),
                  mode: "insensitive",
                },
              },
            ],
          },
        );
      }

      where.OR = [
        { user: { OR: userConditions } },
        {
          inscriptions: {
            some: {
              sportsCategory: {
                nombre: { contains: search, mode: "insensitive" },
              },
            },
          },
        },
      ];
    }

    if (categoria) {
      where.inscriptions = {
        some: {
          sportsCategory: {
            nombre: { equals: categoria, mode: "insensitive" },
          },
        },
      };
    }

    return where;
  }

  buildPagination(page, limit, total) {
    const currentPage = parseInt(page, 10);
    const pageLimit = parseInt(limit, 10);
    const pages = Math.ceil(total / pageLimit);

    return {
      page: currentPage,
      limit: pageLimit,
      total,
      pages,
      hasNext: currentPage < pages,
      hasPrev: currentPage > 1,
    };
  }

  getCategoriaNombre(athlete) {
    const currentInscription = athlete.inscriptions[0];
    return currentInscription?.sportsCategory?.nombre || "";
  }

  mapAttendance(athlete, attendanceMap) {
    const attendance = attendanceMap.get(athlete.id);
    return {
      id: athlete.id,
      athleteId: athlete.id,
      nombre: this.buildAthleteName(athlete.user),
      documento: athlete.user.identification,
      edad: this.calculateAge(athlete.user.birthDate),
      categoria: this.getCategoriaNombre(athlete),
      asistencia: attendance ? attendance.asistencia : false,
      observacion: attendance?.observacion || "",
    };
  }

  async getAttendanceByDate({
    date,
    page = 1,
    limit = 10,
    search = "",
    categoria = "",
  }) {
    const skip = (page - 1) * limit;
    const where = this.buildWhere({ search, categoria });

    const [athletes, total] = await Promise.all([
      prisma.athlete.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: true,
          inscriptions: {
            include: { sportsCategory: true },
            orderBy: { inscriptionDate: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.athlete.count({ where }),
    ]);

    if (!athletes.length) {
      return {
        data: [],
        pagination: this.buildPagination(page, limit, total),
      };
    }

    const athleteIds = athletes.map((athlete) => athlete.id);
    const normalizedDate = this.normalizeDate(date);

    let attendanceRecords = [];
    try {
      attendanceRecords = await prisma.athleteAttendance.findMany({
        where: {
          date: normalizedDate,
          athleteId: { in: athleteIds },
        },
      });
    } catch (error) {
      if (!this.isAttendanceTableMissing(error)) {
        throw error;
      }
      throw this.buildMissingTableError();
    }

    const attendanceMap = new Map(
      attendanceRecords.map((record) => [record.athleteId, record]),
    );

    const data = athletes.map((athlete) =>
      this.mapAttendance(athlete, attendanceMap),
    );

    return {
      data,
      pagination: this.buildPagination(page, limit, total),
    };
  }

  async saveAttendanceBulk({ date, items }) {
    const normalizedDate = this.normalizeDate(date);

    const upserts = items.map((item) =>
      prisma.athleteAttendance.upsert({
        where: {
          athleteId_date: {
            athleteId: item.athleteId,
            date: normalizedDate,
          },
        },
        update: {
          asistencia: item.asistencia,
          observacion: item.observacion || "",
        },
        create: {
          athleteId: item.athleteId,
          date: normalizedDate,
          asistencia: item.asistencia,
          observacion: item.observacion || "",
        },
      }),
    );

    try {
      await prisma.$transaction(upserts);
    } catch (error) {
      if (this.isAttendanceTableMissing(error)) {
        throw this.buildMissingTableError();
      }

      if (error?.code === "P2003") {
        const foreignKeyError = new Error(
          "Uno o más deportistas no existen o no son válidos.",
        );
        foreignKeyError.statusCode = 400;
        throw foreignKeyError;
      }

      throw error;
    }
    return true;
  }

  buildHistoryRange(startDate, endDate) {
    const end = endDate ? new Date(`${endDate}T23:59:59.999Z`) : new Date();
    const start = startDate
      ? new Date(`${startDate}T00:00:00.000Z`)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { start, end };
  }

  async getHistorySummary({
    startDate,
    endDate,
    page = 1,
    limit = 10,
    search = "",
    categoria = "",
  }) {
    const { start, end } = this.buildHistoryRange(startDate, endDate);
    const skip = (page - 1) * limit;
    const where = this.buildWhere({ search, categoria });

    let athletes = [];
    let total = 0;
    try {
      [athletes, total] = await Promise.all([
        prisma.athlete.findMany({
          where,
          skip,
          take: limit,
          include: {
            user: true,
            inscriptions: {
              include: { sportsCategory: true },
              orderBy: { inscriptionDate: "desc" },
            },
            attendances: {
              where: {
                date: {
                  gte: start,
                  lte: end,
                },
              },
            },
          },
          orderBy: [
            { user: { firstName: "asc" } },
            { user: { lastName: "asc" } },
          ],
        }),
        prisma.athlete.count({ where }),
      ]);
    } catch (error) {
      if (!this.isAttendanceTableMissing(error)) {
        throw error;
      }
      throw this.buildMissingTableError();
    }

    const data = athletes.map((athlete) => {
      const records = athlete.attendances || [];
      const present = records.filter((r) => r.asistencia).length;
      const absent = records.filter((r) => !r.asistencia).length;
      const totalRecords = records.length;
      const percent = totalRecords
        ? Math.round((present / totalRecords) * 100)
        : 0;

      return {
        athleteId: athlete.id,
        documento: athlete.user.identification,
        nombre: this.buildAthleteName(athlete.user),
        categoria: this.getCategoriaNombre(athlete),
        present,
        absent,
        total: totalRecords,
        percent,
      };
    });

    return {
      data,
      pagination: this.buildPagination(page, limit, total),
      range: {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      },
    };
  }

  async getAthleteHistory({ athleteId, startDate, endDate }) {
    const { start, end } = this.buildHistoryRange(startDate, endDate);

    let records = [];
    try {
      records = await prisma.athleteAttendance.findMany({
        where: {
          athleteId,
          date: {
            gte: start,
            lte: end,
          },
        },
        orderBy: { date: "desc" },
      });
    } catch (error) {
      if (!this.isAttendanceTableMissing(error)) {
        throw error;
      }
      throw this.buildMissingTableError();
    }

    return records.map((record) => ({
      id: record.id,
      date: record.date ? record.date.toISOString().split("T")[0] : "",
      asistencia: record.asistencia,
      observacion: record.observacion || "",
    }));
  }
}

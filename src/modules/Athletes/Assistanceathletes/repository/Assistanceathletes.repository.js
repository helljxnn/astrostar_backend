import prisma from "../../../../config/database.js";

export class AssistanceathletesRepository {
  normalizeDate(dateString) {
    return new Date(`${dateString}T00:00:00.000Z`);
  }

  calculateAge(birthDate) {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  buildAthleteName(user) {
    return [user.firstName, user.lastName].filter(Boolean).join(" ");
  }

  async getAttendanceByDate({
    date,
    page = 1,
    limit = 10,
    search = "",
    categoria = "",
  }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { identification: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
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

    const athleteIds = athletes.map((athlete) => athlete.id);
    const normalizedDate = this.normalizeDate(date);

    const attendanceRecords = await prisma.athleteAttendance.findMany({
      where: {
        date: normalizedDate,
        athleteId: { in: athleteIds },
      },
    });

    const attendanceMap = new Map(
      attendanceRecords.map((record) => [record.athleteId, record])
    );

    const data = athletes.map((athlete) => {
      const attendance = attendanceMap.get(athlete.id);
      const currentInscription = athlete.inscriptions[0];
      const categoriaNombre = currentInscription?.sportsCategory?.nombre || "";

      return {
        id: athlete.id,
        athleteId: athlete.id,
        nombre: this.buildAthleteName(athlete.user),
        documento: athlete.user.identification,
        edad: this.calculateAge(athlete.user.birthDate),
        categoria: categoriaNombre,
        asistencia: attendance ? attendance.asistencia : false,
        observacion: attendance?.observacion || "",
      };
    });

    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
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
      })
    );

    await prisma.$transaction(upserts);
    return true;
  }

  async getAthleteHistory({ athleteId, startDate, endDate }) {
    const end = endDate ? new Date(`${endDate}T23:59:59.999Z`) : new Date();
    const start = startDate
      ? new Date(`${startDate}T00:00:00.000Z`)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const records = await prisma.athleteAttendance.findMany({
      where: {
        athleteId,
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { date: "desc" },
    });

    return records.map((record) => ({
      id: record.id,
      date: record.date,
      asistencia: record.asistencia,
      observacion: record.observacion || "",
    }));
  }
}

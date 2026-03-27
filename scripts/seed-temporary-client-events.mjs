import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

const DEFAULT_PHONE = process.env.EVENTS_SEED_PHONE || "3000000000";

const extractGoogleDriveFileId = (url) => {
  if (!url) return "";
  const match = String(url).match(/\/d\/([^/]+)/);
  return match?.[1] || "";
};

const driveImage = (url, size = "w1600") => {
  const fileId = extractGoogleDriveFileId(url);
  return fileId
    ? `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`
    : url;
};

const CLIENT_EVENTS = [
  {
    name: "CONVOCATORIA 2026, PARA BENEFICIARIAS",
    description:
      "Invitamos a niñas y jóvenes de 5 a 17 años apasionadas por el fútbol a formarse en la Fundación Manuela Vanegas, donde podrán desarrollar su talento, crecer integralmente y aprender valores como la disciplina, el respeto y el trabajo en equipo. ¡TE ESPERAMOS!",
    startDate: "2026-02-01",
    endDate: "2026-02-01",
    startTime: "08:00",
    endTime: "09:30",
    location: "Unidad Deportiva Cristo Rey, Copacabana, Antioquia",
    imageUrl: driveImage(
      "https://drive.google.com/file/d/1YQczxwdOyJtQeK47L4iTIb6SS4jEOc46/view?usp=drivesdk",
    ),
    typeCandidates: ["Taller", "Clausura", "Festival"],
    sponsorNames: [],
    scheduleFile: null,
    publish: true,
    status: "Programado",
  },
  {
    name: "QUINTO FESTIVAL MANUELA VANEGAS",
    description:
      "Te invitamos a vivir la quinta edición de nuestro festival, ven y comparte con tu familia mil experiencias inolvidables, tendremos actividades, juegos y muchos premios para ti. ¡Apoyemos Juntos La Comunidad!",
    startDate: "2026-08-10",
    endDate: "2026-08-10",
    startTime: "10:00",
    endTime: "17:00",
    location: "UNIDAD DEPORTIVA IDEM, COPACABANA",
    imageUrl: driveImage(
      "https://drive.google.com/file/d/1_yoeM_LsZTspjsw1ta4B1D-BGwzuT06n/view?usp=drivesdk",
    ),
    typeCandidates: ["Festival"],
    sponsorNames: [],
    scheduleFile: null,
    publish: true,
    status: "Programado",
  },
  {
    name: "CLAUSURA 2026, FUNDACIÓN MANUELA VANEGAS",
    description:
      "Los años más grandes y retadores se cierran con broche de oro, ven y comparte con nosotros un día muy especial, vivirás un día inolvidable con premios y actividades.",
    startDate: "2026-12-22",
    endDate: "2026-12-22",
    startTime: "10:00",
    endTime: "17:00",
    location: "El Castillo de Santa Marta, Vereda el Limonar, Copacabana.",
    imageUrl: driveImage(
      "https://drive.google.com/file/d/17hywBq8disGtecv3lL5zZFCzR1XyEdTe/view?usp=drivesdk",
    ),
    typeCandidates: ["Clausura"],
    sponsorNames: [],
    scheduleFile: null,
    publish: true,
    status: "Programado",
  },
  {
    name: "FESTIVAL DE VERIFICACIÓN 2025",
    description:
      "Evento de verificación creado temporalmente para comprobar el filtro por año en la vista pública y administrativa.",
    startDate: "2025-08-10",
    endDate: "2025-08-10",
    startTime: "10:00",
    endTime: "15:00",
    location: "Unidad Deportiva de Copacabana, Antioquia",
    imageUrl: driveImage(
      "https://drive.google.com/file/d/1_yoeM_LsZTspjsw1ta4B1D-BGwzuT06n/view?usp=drivesdk",
    ),
    typeCandidates: ["Festival"],
    sponsorNames: [],
    scheduleFile: null,
    publish: true,
    status: "Finalizado",
  },
  {
    name: "ENCUENTRO DE INTEGRACIÓN ASTROSTAR 2026",
    description:
      "Evento de integración creado para validar el flujo completo entre el módulo de gestión de eventos y la landing pública. Incluye convocatoria, exhibición deportiva y cierre comunitario.",
    startDate: "2026-09-14",
    endDate: "2026-09-14",
    startTime: "09:00",
    endTime: "12:30",
    location: "Coliseo Municipal de Copacabana, Antioquia",
    imageUrl: driveImage(
      "https://drive.google.com/file/d/1_yoeM_LsZTspjsw1ta4B1D-BGwzuT06n/view?usp=drivesdk",
    ),
    typeCandidates: ["Festival", "Taller"],
    sponsorNames: [],
    scheduleFile: null,
    publish: true,
    status: "Programado",
  },
];

const DEFAULT_SERVICE_TYPES = [
  {
    name: "Clausura",
    description: "Evento de cierre o finalización.",
  },
  {
    name: "Taller",
    description: "Actividad formativa práctica.",
  },
  {
    name: "Torneo",
    description: "Competencia deportiva con inscripción por equipos.",
  },
  {
    name: "Festival",
    description: "Evento festivo con múltiples actividades.",
  },
];

const ensureServiceTypes = async () => {
  await Promise.all(
    DEFAULT_SERVICE_TYPES.map((serviceType) =>
      prisma.serviceType.upsert({
        where: { name: serviceType.name },
        update: { description: serviceType.description },
        create: serviceType,
      }),
    ),
  );
};

const pickCategoryIds = async () => {
  const activeCategories = await prisma.sportsCategory.findMany({
    where: { estado: "Activo" },
    select: {
      id: true,
      nombre: true,
      edadMinima: true,
      edadMaxima: true,
    },
    orderBy: { nombre: "asc" },
  });

  const categories =
    activeCategories.length > 0
      ? activeCategories
      : await prisma.sportsCategory.findMany({
          select: {
            id: true,
            nombre: true,
            edadMinima: true,
            edadMaxima: true,
          },
          orderBy: { nombre: "asc" },
        });

  if (categories.length === 0) {
    throw new Error("No hay categorías deportivas disponibles para asociar a los eventos.");
  }

  const overlapping = categories.filter((category) => {
    const minAge = Number(category.edadMinima ?? 0);
    const maxAge = Number(category.edadMaxima ?? 99);
    return maxAge >= 5 && minAge <= 17;
  });

  return (overlapping.length > 0 ? overlapping : categories.slice(0, 3)).map(
    (category) => category.id,
  );
};

const resolveTypeId = async (typeCandidates) => {
  for (const typeName of typeCandidates) {
    const match = await prisma.serviceType.findUnique({
      where: { name: typeName },
      select: { id: true },
    });

    if (match) return match.id;
  }

  const fallbackType = await prisma.serviceType.findFirst({
    orderBy: { id: "asc" },
    select: { id: true },
  });

  if (!fallbackType) {
    throw new Error("No existen tipos de evento en la base de datos.");
  }

  return fallbackType.id;
};

const resolveSponsorIds = async (sponsorNames) => {
  if (!Array.isArray(sponsorNames) || sponsorNames.length === 0) return [];

  const sponsors = await prisma.sponsor.findMany({
    where: {
      name: { in: sponsorNames },
      type: "Sponsor",
      status: "Active",
    },
    select: { id: true },
  });

  return sponsors.map((sponsor) => sponsor.id);
};

const upsertEvent = async (eventSeed, sharedCategoryIds) => {
  const typeId = await resolveTypeId(eventSeed.typeCandidates);
  const sponsorIds = await resolveSponsorIds(eventSeed.sponsorNames);

  const payload = {
    name: eventSeed.name,
    description: eventSeed.description,
    startDate: new Date(`${eventSeed.startDate}T12:00:00`),
    endDate: new Date(`${eventSeed.endDate}T12:00:00`),
    startTime: eventSeed.startTime,
    endTime: eventSeed.endTime,
    location: eventSeed.location,
    phone: DEFAULT_PHONE,
    status: eventSeed.status,
    imageUrl: eventSeed.imageUrl,
    scheduleFile: eventSeed.scheduleFile,
    publish: eventSeed.publish,
    typeId,
  };

  const existing = await prisma.service.findFirst({
    where: { name: eventSeed.name },
    select: { id: true },
  });

  if (!existing) {
    return prisma.service.create({
      data: {
        ...payload,
        serviceSportsCategories: {
          create: sharedCategoryIds.map((sportsCategoryId) => ({ sportsCategoryId })),
        },
        ServiceSponsor: {
          create: sponsorIds.map((sponsorId) => ({ sponsorId })),
        },
      },
      select: { id: true, name: true, startDate: true, status: true, publish: true },
    });
  }

  return prisma.service.update({
    where: { id: existing.id },
    data: {
      ...payload,
      serviceSportsCategories: {
        deleteMany: {},
        create: sharedCategoryIds.map((sportsCategoryId) => ({ sportsCategoryId })),
      },
      ServiceSponsor: {
        deleteMany: {},
        create: sponsorIds.map((sponsorId) => ({ sponsorId })),
      },
    },
    select: { id: true, name: true, startDate: true, status: true, publish: true },
  });
};

const main = async () => {
  await ensureServiceTypes();
  const categoryIds = await pickCategoryIds();

  const results = [];
  for (const eventSeed of CLIENT_EVENTS) {
    const result = await upsertEvent(eventSeed, categoryIds);
    results.push(result);
  }

  console.table(
    results.map((event) => ({
      id: event.id,
      name: event.name,
      startDate: event.startDate.toISOString().slice(0, 10),
      status: event.status,
      publish: event.publish,
    })),
  );
};

main()
  .catch((error) => {
    console.error("Error sembrando eventos temporales:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

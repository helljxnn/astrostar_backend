import { PrismaClient } from "../generated/prisma/index.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const createDate = (y, m, d) => new Date(Date.UTC(y, m - 1, d, 5, 0, 0));

const getPeriod = (date) => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const getDocumentType = async () => {
  const candidates = [
    "Tarjeta de Identidad",
    "Tarjeta de identidad",
    "Tarjeta de Identidad ",
  ];
  for (const name of candidates) {
    const doc = await prisma.documentType.findFirst({ where: { name } });
    if (doc) return doc;
  }
  const fallback = await prisma.documentType.findFirst();
  if (!fallback) throw new Error("No hay tipos de documento en la BD");
  return fallback;
};

const getRole = async () => {
  const role = await prisma.role.findFirst({ where: { name: { contains: "Deportista" } } });
  if (!role) throw new Error("No existe rol Deportista");
  return role;
};

const getCategory = async () => {
  const cat = await prisma.sportsCategory.findFirst({ where: { nombre: { contains: "Infantil" } } });
  if (!cat) throw new Error("No existe categoría Infantil");
  return cat;
};

const getPaymentSettings = async () => {
  const settings = await prisma.paymentSettings.findFirst();
  if (!settings) throw new Error("No existe payment_settings");
  return settings;
};

const createGuardian = async (docTypeId, idx) => {
  return prisma.guardian.create({
    data: {
      firstName: `Acudiente${idx}`,
      lastName: `Mensualidades${idx}`,
      identification: `9000000${idx}`,
      email: `acudiente.mensualidades${idx}@mailinator.com`,
      phone: `31200000${idx}`,
      address: "Calle 74 # 93-74, Chapinero",
      occupation: "Empleado",
      documentTypeId: docTypeId,
      birthDate: createDate(1985, 1, 10),
    }
  });
};

const createAthleteUser = async (docTypeId, roleId, data) => {
  return prisma.user.create({
    data: {
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      secondLastName: data.secondLastName,
      identification: data.identification,
      email: data.email,
      phoneNumber: data.phone,
      address: data.address,
      birthDate: data.birthDate,
      documentTypeId: docTypeId,
      passwordHash: await bcrypt.hash(data.identification, 10),
      roleId,
      status: "Active",
    }
  });
};

const createAthlete = async (userId, guardianId) => {
  return prisma.athlete.create({
    data: {
      userId,
      status: "Active",
      guardianId,
      relationship: "Mother",
      currentInscriptionStatus: "Active",
      isScholarship: false,
      statusAssignedAt: createDate(2026, 3, 16),
    }
  });
};

const createEnrollmentAndInscription = async (athleteId, sportsCategoryId) => {
  await prisma.enrollment.create({
    data: {
      athleteId,
      estado: "Vigente",
      fechaInicio: createDate(2026, 1, 1),
      fechaVencimiento: createDate(2027, 1, 1),
    }
  });

  await prisma.inscription.create({
    data: {
      athleteId,
      sportsCategoryId,
      status: "Active",
      expirationDate: createDate(2027, 1, 1),
      concept: "Inscripción en categoría deportiva",
    }
  });
};

const createMonthlyObligation = async (athleteId, baseAmount, dueStart, dueEnd) => {
  return prisma.paymentObligation.create({
    data: {
      athleteId,
      type: "MONTHLY",
      period: getPeriod(dueStart),
      baseAmount,
      dueStart,
      dueEnd,
    }
  });
};

const createPayment = async ({ obligationId, athleteId, status, uploadedAt, reviewedAt, reviewedBy, receiptUrl, receiptName, rejectionReason }) => {
  return prisma.payment.create({
    data: {
      obligationId,
      athleteId,
      status,
      uploadedAt,
      reviewedAt,
      reviewedBy,
      receiptUrl,
      receiptName,
      rejectionReason,
    }
  });
};

const main = async () => {
  const docType = await getDocumentType();
  const role = await getRole();
  const category = await getCategory();
  const settings = await getPaymentSettings();
  const baseMonthly = settings.monthlyAmount || 30000;

  const baseData = {
    firstName: "Jennifer",
    middleName: "Maria",
    lastName: "Lascarro",
    secondLastName: "Sosa",
    phone: "3131090327",
    birthDate: createDate(2017, 1, 31),
    address: "Calle 74 # 93-74, Chapinero",
  };

  const athletes = [
    { email: "juanita2@mailinator.com", identification: "1033335555", idx: 1 },
    { email: "emilie1@mailinator.com", identification: "1033339999", idx: 2 },
    { email: "vanesa@mailinator.com", identification: "1033338888", idx: 3 },
  ];

  for (const a of athletes) {
    const existing = await prisma.user.findFirst({ where: { email: a.email } });
    if (existing) {
      console.log(`SKIP: ${a.email} ya existe`);
      continue;
    }

    const guardian = await createGuardian(docType.id, a.idx);
    const user = await createAthleteUser(docType.id, role.id, {
      ...baseData,
      email: a.email,
      identification: a.identification,
    });
    const athlete = await createAthlete(user.id, guardian.id);
    await createEnrollmentAndInscription(athlete.id, category.id);

    // Crear 3 obligaciones: Enero, Febrero, Marzo 2026
    const janStart = createDate(2026, 1, 1);
    const febStart = createDate(2026, 2, 1);
    const marStart = createDate(2026, 3, 1);
    const janOb = await createMonthlyObligation(athlete.id, baseMonthly, janStart, createDate(2026, 1, 5));
    const febOb = await createMonthlyObligation(athlete.id, baseMonthly, febStart, createDate(2026, 2, 5));
    const marOb = await createMonthlyObligation(athlete.id, baseMonthly, marStart, createDate(2026, 3, 5));

    // Casos distintos
    if (a.email === "juanita2@mailinator.com") {
      // Caso 1: Marzo pendiente (sin pago), Febrero aprobado con mora, Enero aprobado a tiempo
      await createPayment({
        obligationId: janOb.id,
        athleteId: athlete.id,
        status: "APPROVED",
        uploadedAt: createDate(2026, 1, 3),
        reviewedAt: createDate(2026, 1, 4),
        reviewedBy: 1,
        receiptUrl: "https://res.cloudinary.com/dpi6uu5fk/image/upload/v1773695796/payment-receipts/jan_juanita.jpg",
        receiptName: "mensualidad_juanita_2026-01.jpg",
      });
      await createPayment({
        obligationId: febOb.id,
        athleteId: athlete.id,
        status: "APPROVED",
        uploadedAt: createDate(2026, 2, 12),
        reviewedAt: createDate(2026, 2, 13),
        reviewedBy: 1,
        receiptUrl: "https://res.cloudinary.com/dpi6uu5fk/image/upload/v1773695796/payment-receipts/feb_juanita.jpg",
        receiptName: "mensualidad_juanita_2026-02.jpg",
      });
      // Marzo sin pago (pendiente sin comprobante)
    }

    if (a.email === "emilie1@mailinator.com") {
      // Caso 2: Marzo en revisión (PENDING), Febrero rechazado, Enero aprobado
      await createPayment({
        obligationId: janOb.id,
        athleteId: athlete.id,
        status: "APPROVED",
        uploadedAt: createDate(2026, 1, 4),
        reviewedAt: createDate(2026, 1, 5),
        reviewedBy: 1,
        receiptUrl: "https://res.cloudinary.com/dpi6uu5fk/image/upload/v1773695796/payment-receipts/jan_emilie.jpg",
        receiptName: "mensualidad_emilie_2026-01.jpg",
      });
      await createPayment({
        obligationId: febOb.id,
        athleteId: athlete.id,
        status: "REJECTED",
        uploadedAt: createDate(2026, 2, 4),
        reviewedAt: createDate(2026, 2, 6),
        reviewedBy: 1,
        receiptUrl: "https://res.cloudinary.com/dpi6uu5fk/image/upload/v1773695796/payment-receipts/feb_emilie_rejected.jpg",
        receiptName: "mensualidad_emilie_2026-02.jpg",
        rejectionReason: "El comprobante está borroso y no se identifica el valor.",
      });
      await createPayment({
        obligationId: marOb.id,
        athleteId: athlete.id,
        status: "PENDING",
        uploadedAt: createDate(2026, 3, 4),
        receiptUrl: "https://res.cloudinary.com/dpi6uu5fk/image/upload/v1773695796/payment-receipts/mar_emilie_pending.jpg",
        receiptName: "mensualidad_emilie_2026-03.jpg",
      });
    }

    if (a.email === "vanesa@mailinator.com") {
      // Caso 3: Todo aprobado a tiempo
      await createPayment({
        obligationId: janOb.id,
        athleteId: athlete.id,
        status: "APPROVED",
        uploadedAt: createDate(2026, 1, 2),
        reviewedAt: createDate(2026, 1, 3),
        reviewedBy: 1,
        receiptUrl: "https://res.cloudinary.com/dpi6uu5fk/image/upload/v1773695796/payment-receipts/jan_vanesa.jpg",
        receiptName: "mensualidad_vanesa_2026-01.jpg",
      });
      await createPayment({
        obligationId: febOb.id,
        athleteId: athlete.id,
        status: "APPROVED",
        uploadedAt: createDate(2026, 2, 2),
        reviewedAt: createDate(2026, 2, 3),
        reviewedBy: 1,
        receiptUrl: "https://res.cloudinary.com/dpi6uu5fk/image/upload/v1773695796/payment-receipts/feb_vanesa.jpg",
        receiptName: "mensualidad_vanesa_2026-02.jpg",
      });
      await createPayment({
        obligationId: marOb.id,
        athleteId: athlete.id,
        status: "APPROVED",
        uploadedAt: createDate(2026, 3, 3),
        reviewedAt: createDate(2026, 3, 4),
        reviewedBy: 1,
        receiptUrl: "https://res.cloudinary.com/dpi6uu5fk/image/upload/v1773695796/payment-receipts/mar_vanesa.jpg",
        receiptName: "mensualidad_vanesa_2026-03.jpg",
      });
    }

    console.log(`OK: ${a.email} (${a.identification}) atletaId=${athlete.id}`);
  }
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


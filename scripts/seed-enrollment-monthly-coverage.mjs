import { PrismaClient } from "../generated/prisma/index.js";
import bcrypt from "bcryptjs";
import { paymentsService } from "../src/modules/Payments/services/payments.service.js";

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

const main = async () => {
  const docType = await getDocumentType();
  const role = await getRole();
  const category = await getCategory();
  const settings = await getPaymentSettings();

  const email = "coverage.enrollment@mailinator.com";
  const identification = "1033344444";

  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) {
    console.log(`SKIP: ${email} ya existe`);
    return;
  }

  const guardian = await prisma.guardian.create({
    data: {
      firstName: "Acudiente",
      lastName: "Cobertura",
      identification: "9001234567",
      email: "acudiente.cobertura@mailinator.com",
      phone: "3120000000",
      address: "Calle 74 # 93-74, Chapinero",
      occupation: "Empleado",
      documentTypeId: docType.id,
      birthDate: createDate(1985, 1, 10),
    }
  });

  const user = await prisma.user.create({
    data: {
      firstName: "Camila",
      middleName: "María",
      lastName: "Cobertura",
      secondLastName: "Enero",
      identification,
      email,
      phoneNumber: "3131090327",
      address: "Calle 74 # 93-74, Chapinero",
      birthDate: createDate(2017, 1, 31),
      documentTypeId: docType.id,
      passwordHash: await bcrypt.hash(identification, 10),
      roleId: role.id,
      status: "Active",
    }
  });

  const athlete = await prisma.athlete.create({
    data: {
      userId: user.id,
      status: "Active",
      guardianId: guardian.id,
      relationship: "Mother",
      currentInscriptionStatus: "Active",
      isScholarship: false,
      statusAssignedAt: createDate(2026, 3, 16),
    }
  });

  await prisma.enrollment.create({
    data: {
      athleteId: athlete.id,
      estado: "Pending_Payment",
    }
  });

  await prisma.inscription.create({
    data: {
      athleteId: athlete.id,
      sportsCategoryId: category.id,
      status: "Active",
      expirationDate: createDate(2027, 1, 31),
      concept: "Inscripción en categoría deportiva",
    }
  });

  // Crear obligación mensual enero y febrero (para validar que enero quede exenta)
  const janStart = createDate(2026, 1, 1);
  const febStart = createDate(2026, 2, 1);
  await prisma.paymentObligation.create({
    data: {
      athleteId: athlete.id,
      type: "MONTHLY",
      period: getPeriod(janStart),
      baseAmount: settings.monthlyAmount,
      dueStart: janStart,
      dueEnd: createDate(2026, 1, 5),
    }
  });
  await prisma.paymentObligation.create({
    data: {
      athleteId: athlete.id,
      type: "MONTHLY",
      period: getPeriod(febStart),
      baseAmount: settings.monthlyAmount,
      dueStart: febStart,
      dueEnd: createDate(2026, 2, 5),
    }
  });

  // Crear obligación de matrícula inicial + pago enviado el 30 de enero
  const enrollmentObligation = await prisma.paymentObligation.create({
    data: {
      athleteId: athlete.id,
      type: "ENROLLMENT_INITIAL",
      baseAmount: settings.enrollmentAmount,
      dueStart: createDate(2026, 1, 30),
      dueEnd: createDate(2026, 2, 5),
    }
  });

  const payment = await prisma.payment.create({
    data: {
      obligationId: enrollmentObligation.id,
      athleteId: athlete.id,
      status: "PENDING",
      uploadedAt: createDate(2026, 1, 30),
      receiptUrl: "https://res.cloudinary.com/demo/image/upload/enrollment_coverage.jpg",
      receiptName: "enrollment_coverage.jpg",
    }
  });

  // Aprobar el pago usando el servicio (aplica la cobertura del mes por fecha de envío)
  await paymentsService.approvePayment(payment.id, 1);

  console.log("✅ Registro creado para validar cobertura mensual por matrícula");
  console.log(`- Email login: ${email}`);
  console.log(`- Password: ${identification}`);
  console.log(`- Atleta ID: ${athlete.id}`);
  console.log("Esperado:");
  console.log("- Mensualidad 2026-01 queda exenta por matrícula (no debe aparecer como deuda).");
  console.log("- Mensualidad 2026-02 sigue pendiente.");
};

main()
  .catch((e) => {
    console.error("❌ Error en seed de cobertura:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

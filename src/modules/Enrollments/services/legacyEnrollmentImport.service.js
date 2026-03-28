import bcrypt from "bcrypt";
import prisma from "../../../config/database.js";
import { paymentSettingsRepository } from "../../Payments/repository/paymentSettings.repository.js";

class LegacyImportBatchValidationError extends Error {
  constructor(message, preview) {
    super(message);
    this.name = "LegacyImportBatchValidationError";
    this.preview = preview;
  }
}

const LEGACY_IMPORT_DEFAULTS = {
  ROLE_NAME: "Deportista",
  DEFAULT_ADDRESS: "N/A",
  BCRYPT_SALT_ROUNDS: 10,
  ENROLLMENT_DURATION_YEARS: 1,
  GRACE_DAYS: 5,
  MIN_ATHLETE_AGE: 5,
  MAX_PERSON_AGE: 100,
  ORIGIN: "LEGACY_IMPORT",
};

const ENROLLMENT_STATUS = {
  ACTIVE: "Vigente",
  EXPIRED: "Vencida",
};

const ATHLETE_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

const INSCRIPTION_STATUS = {
  ACTIVE: "Active",
  EXPIRED: "Expired",
};

const PHONE_REGEX = /^(\+57\s?)?3\d{9}$/;

const RELATIONSHIP_ALIASES = new Map([
  ["mother", "Mother"],
  ["madre", "Mother"],
  ["father", "Father"],
  ["padre", "Father"],
  ["grandparent", "Grandparent"],
  ["abuelo", "Grandparent"],
  ["abuela", "Grandparent"],
  ["uncle", "Uncle_Aunt"],
  ["aunt", "Uncle_Aunt"],
  ["tio", "Uncle_Aunt"],
  ["tia", "Uncle_Aunt"],
  ["sibling", "Sibling"],
  ["hermano", "Sibling"],
  ["hermana", "Sibling"],
  ["cousin", "Cousin"],
  ["primo", "Cousin"],
  ["prima", "Cousin"],
  ["legal guardian", "Legal_Guardian"],
  ["guardian", "Legal_Guardian"],
  ["tutor", "Legal_Guardian"],
  ["acudiente", "Legal_Guardian"],
  ["apoderado", "Legal_Guardian"],
  ["neighbor", "Neighbor"],
  ["vecino", "Neighbor"],
  ["vecina", "Neighbor"],
  ["family friend", "Family_Friend"],
  ["friend", "Family_Friend"],
  ["amigo", "Family_Friend"],
  ["amiga", "Family_Friend"],
  ["other", "Other"],
  ["otro", "Other"],
  ["otra", "Other"],
]);

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const normalizeIdentifier = (value) => String(value || "").trim();
const normalizePhone = (value) => String(value || "").trim();

const normalizeBoolean = (value, defaultValue = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = normalizeText(value);
    if (["true", "1", "si", "yes", "y"].includes(normalized)) return true;
    if (["false", "0", "no", "n"].includes(normalized)) return false;
  }
  return defaultValue;
};

const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
};

const calculateExpirationDate = (
  startDate,
  years = LEGACY_IMPORT_DEFAULTS.ENROLLMENT_DURATION_YEARS
) => {
  const expirationDate = new Date(startDate);
  expirationDate.setFullYear(expirationDate.getFullYear() + years);
  return expirationDate;
};

const parseDateInput = (value, fieldName) => {
  if (!value) return null;
  let parsed = null;

  if (value instanceof Date) {
    parsed = new Date(value);
  } else if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const [year, month, day] = value.trim().split("-").map((part) => parseInt(part, 10));
    parsed = new Date(year, month - 1, day, 0, 0, 0, 0);
  } else {
    parsed = new Date(value);
  }

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`La fecha "${fieldName}" no es valida.`);
  }

  return parsed;
};

const getCurrentPeriod = (referenceDate = new Date()) => {
  const date = new Date(referenceDate);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const isValidPeriod = (value) => /^\d{4}-\d{2}$/.test(String(value || ""));

const comparePeriods = (left, right) => {
  const [leftYear, leftMonth] = String(left).split("-").map((part) => parseInt(part, 10));
  const [rightYear, rightMonth] = String(right).split("-").map((part) => parseInt(part, 10));

  if (leftYear !== rightYear) return leftYear - rightYear;
  return leftMonth - rightMonth;
};

const sortPeriods = (periods) =>
  [...periods].sort((a, b) => {
    const [yearA, monthA] = a.split("-").map((part) => parseInt(part, 10));
    const [yearB, monthB] = b.split("-").map((part) => parseInt(part, 10));

    if (yearA !== yearB) return yearA - yearB;
    return monthA - monthB;
  });

const expandPeriodsRange = (startPeriod, endPeriod) => {
  if (!isValidPeriod(startPeriod) || !isValidPeriod(endPeriod)) {
    throw new Error("Los periodos de deuda deben tener formato YYYY-MM.");
  }

  const [startYear, startMonth] = startPeriod.split("-").map((part) => parseInt(part, 10));
  const [endYear, endMonth] = endPeriod.split("-").map((part) => parseInt(part, 10));

  const cursor = new Date(startYear, startMonth - 1, 1);
  const endDate = new Date(endYear, endMonth - 1, 1);

  if (cursor > endDate) {
    throw new Error("monthlyDebtEndPeriod no puede ser anterior a monthlyDebtStartPeriod.");
  }

  const periods = [];
  while (cursor <= endDate) {
    periods.push(
      `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`
    );
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return periods;
};

const buildMonthlyDebtPeriods = (financial = {}, cutoverDate = new Date()) => {
  const currentPeriod = getCurrentPeriod(cutoverDate);

  if (Array.isArray(financial.monthlyDebtPeriods) && financial.monthlyDebtPeriods.length > 0) {
    const normalizedPeriods = financial.monthlyDebtPeriods
      .map((period) => String(period || "").trim())
      .filter(Boolean);
    const invalidPeriod = normalizedPeriods.find((period) => !isValidPeriod(period));

    if (invalidPeriod) {
      throw new Error(`El periodo "${invalidPeriod}" no tiene formato YYYY-MM.`);
    }

    const uniquePeriods = sortPeriods([...new Set(normalizedPeriods)]);
    const futurePeriod = uniquePeriods.find((period) => comparePeriods(period, currentPeriod) > 0);

    if (futurePeriod) {
      throw new Error(
        `El periodo "${futurePeriod}" es futuro respecto a la fecha de corte ${currentPeriod}.`
      );
    }

    return uniquePeriods;
  }

  if (financial.monthlyDebtStartPeriod) {
    const endPeriod = financial.monthlyDebtEndPeriod || getCurrentPeriod(cutoverDate);
    const periods = expandPeriodsRange(
      String(financial.monthlyDebtStartPeriod).trim(),
      String(endPeriod).trim()
    );

    const futurePeriod = periods.find((period) => comparePeriods(period, currentPeriod) > 0);
    if (futurePeriod) {
      throw new Error(
        `El periodo "${futurePeriod}" es futuro respecto a la fecha de corte ${currentPeriod}.`
      );
    }

    return periods;
  }

  return [];
};

const getMonthlyDueDates = (period) => {
  const [year, month] = period.split("-").map((part) => parseInt(part, 10));
  return {
    dueStart: new Date(year, month - 1, 1, 0, 0, 0, 0),
    dueEnd: new Date(year, month - 1, LEGACY_IMPORT_DEFAULTS.GRACE_DAYS, 23, 59, 59, 999),
  };
};

const normalizeAthleteOperationalStatus = (value) => {
  const normalized = normalizeText(value);
  if (normalized === "inactive" || normalized === "inactivo") {
    return ATHLETE_STATUS.INACTIVE;
  }
  return ATHLETE_STATUS.ACTIVE;
};

const normalizeEnrollmentStatus = (value) => {
  const normalized = normalizeText(value);

  if (normalized === normalizeText(ENROLLMENT_STATUS.ACTIVE)) {
    return ENROLLMENT_STATUS.ACTIVE;
  }

  if (normalized === normalizeText(ENROLLMENT_STATUS.EXPIRED)) {
    return ENROLLMENT_STATUS.EXPIRED;
  }

  throw new Error("El estado de la matricula importada debe ser Vigente o Vencida.");
};

const normalizeGuardianRelationship = (value) => {
  if (!value) {
    return { relationship: null, otherRelationship: null };
  }

  const rawValue = String(value).trim();
  const normalized = normalizeText(value);
  const resolved = RELATIONSHIP_ALIASES.get(normalized);

  if (resolved) {
    return {
      relationship: resolved,
      otherRelationship: resolved === "Other" ? rawValue : null,
    };
  }

  return {
    relationship: "Other",
    otherRelationship: rawValue,
  };
};

const resolveLegacyStatusAssignedAt = (athlete = {}, cutoverDate = new Date()) => {
  if (athlete.statusAssignedAt || athlete.fechaEstado || athlete.statusDate) {
    return parseDateInput(
      athlete.statusAssignedAt || athlete.fechaEstado || athlete.statusDate,
      "athlete.statusAssignedAt"
    );
  }

  if (normalizeAthleteOperationalStatus(athlete.status || athlete.estado) === ATHLETE_STATUS.INACTIVE) {
    return new Date(cutoverDate);
  }

  return null;
};

const resolveLegacyEnrollmentDates = (enrollment = {}) => {
  const estado = normalizeEnrollmentStatus(enrollment.estado);
  let fechaInicio = parseDateInput(enrollment.fechaInicio, "enrollment.fechaInicio");
  let fechaVencimiento = parseDateInput(
    enrollment.fechaVencimiento,
    "enrollment.fechaVencimiento"
  );

  if (!fechaInicio && !fechaVencimiento) {
    throw new Error(
      "La importacion legacy requiere fechaInicio o fechaVencimiento para representar el estado real."
    );
  }

  if (!fechaInicio && fechaVencimiento) {
    fechaInicio = new Date(fechaVencimiento);
    fechaInicio.setFullYear(fechaInicio.getFullYear() - 1);
  }

  if (!fechaVencimiento && fechaInicio) {
    fechaVencimiento = calculateExpirationDate(fechaInicio);
  }

  if (fechaInicio > fechaVencimiento) {
    throw new Error("fechaInicio no puede ser posterior a fechaVencimiento.");
  }

  return { estado, fechaInicio, fechaVencimiento };
};

const validateLegacySnapshotConsistency = ({
  enrollment,
  cutoverDate,
  athleteStatus,
  statusAssignedAt,
}) => {
  if (!(cutoverDate instanceof Date) || Number.isNaN(cutoverDate.getTime())) {
    return;
  }

  if (statusAssignedAt && statusAssignedAt > cutoverDate) {
    throw new Error(
      "La fecha de estado de la deportista no puede ser posterior a la fecha de corte."
    );
  }

  if (athleteStatus === ATHLETE_STATUS.INACTIVE && !statusAssignedAt) {
    throw new Error(
      "Las deportistas inactivas deben tener una fecha de estado valida al momento del corte."
    );
  }

  if (enrollment.estado === ENROLLMENT_STATUS.ACTIVE) {
    if (cutoverDate < enrollment.fechaInicio) {
      throw new Error(
        "Una matricula Vigente no puede iniciar despues de la fecha de corte."
      );
    }

    if (cutoverDate > enrollment.fechaVencimiento) {
      throw new Error(
        "Una matricula Vigente no puede estar vencida frente a la fecha de corte."
      );
    }
  }

  if (
    enrollment.estado === ENROLLMENT_STATUS.EXPIRED &&
    cutoverDate <= enrollment.fechaVencimiento
  ) {
    throw new Error(
      "Una matricula Vencida debe tener fecha de vencimiento anterior a la fecha de corte."
    );
  }
};

const normalizeAthleteInput = (athlete = {}) => {
  const guardianRelationship = normalizeGuardianRelationship(
    athlete.relationship || athlete.parentesco || athlete.parentRelationship
  );

  return {
    ...athlete,
    guardianId: athlete.guardianId || athlete.acudiente || null,
    relationship: guardianRelationship.relationship,
    otherRelationship: guardianRelationship.otherRelationship,
    email: normalizeEmail(athlete.email),
    identification: normalizeIdentifier(athlete.identification),
    phoneNumber: normalizePhone(athlete.phoneNumber),
    status: normalizeAthleteOperationalStatus(athlete.status || athlete.estado),
    isScholarship: normalizeBoolean(athlete.isScholarship, false),
    categoria:
      athlete.categoria ||
      athlete.category ||
      athlete.categoryName ||
      athlete.sportsCategoryName ||
      null,
  };
};

const splitGuardianFullName = (guardian = {}) => {
  if (guardian.firstName || guardian.lastName) {
    return {
      firstName: String(guardian.firstName || "").trim(),
      lastName: String(guardian.lastName || "").trim(),
    };
  }

  const fullName = String(guardian.nombreCompleto || guardian.fullName || "").trim();
  if (!fullName) {
    return { firstName: "", lastName: "" };
  }

  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: parts[0] };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.slice(-1).join(" "),
  };
};

const normalizeGuardianInput = (guardian = {}) => {
  const source = guardian?.guardian || guardian;
  if (!source || typeof source !== "object") {
    return null;
  }

  const { firstName, lastName } = splitGuardianFullName(source);

  const normalized = {
    documentTypeId:
      source.documentTypeId ||
      source.guardianDocumentTypeId ||
      source.tipoDocumentoId ||
      null,
    identification: normalizeIdentifier(
      source.identification || source.guardianIdentification || source.document
    ),
    firstName,
    lastName,
    email: normalizeEmail(source.email || source.guardianEmail),
    phone: normalizePhone(source.phone || source.phoneNumber || source.guardianPhone),
    address: String(source.address || source.guardianAddress || "").trim() || null,
    occupation:
      String(source.occupation || source.guardianOccupation || "").trim() || null,
    birthDate:
      source.birthDate || source.guardianBirthDate || source.fechaNacimiento || null,
    statusAssignedAt:
      source.statusAssignedAt || source.guardianStatusAssignedAt || null,
  };

  const hasAnyValue = Object.values(normalized).some((value) => {
    if (value === null || value === undefined) return false;
    return String(value).trim() !== "";
  });

  return hasAnyValue ? normalized : null;
};

const isTarjetaIdentidadDocument = (documentTypeName) => {
  const normalized = normalizeText(documentTypeName);
  return (
    normalized === "ti" ||
    (normalized.includes("tarjeta") && normalized.includes("identidad"))
  );
};

const isCedulaDocument = (documentTypeName) => {
  const normalized = normalizeText(documentTypeName);
  return normalized.includes("cedula");
};

const isForbiddenGuardianDocumentType = (documentTypeName) => {
  const normalized = normalizeText(documentTypeName);

  return (
    normalized === "ti" ||
    normalized === "nit" ||
    (normalized.includes("tarjeta") && normalized.includes("identidad")) ||
    (normalized.includes("registro") && normalized.includes("civil")) ||
    normalized.includes("tributaria")
  );
};

const validateAthletePhoneNumber = (phoneNumber) => {
  if (!PHONE_REGEX.test(phoneNumber)) {
    throw new Error(
      "El telefono de la deportista debe tener el formato 3XXXXXXXXX o +57 3XXXXXXXXX."
    );
  }
};

const validateGuardianPhoneNumber = (phoneNumber) => {
  if (!PHONE_REGEX.test(phoneNumber)) {
    throw new Error(
      "El telefono del acudiente debe tener el formato 3XXXXXXXXX o +57 3XXXXXXXXX."
    );
  }
};

const validateEmailFormat = (email, label) => {
  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailPattern.test(email)) {
    throw new Error(`El ${label} no tiene un formato valido.`);
  }
};

const validatePersonBirthDate = (birthDate, { label, minAge, maxAge }) => {
  const parsed = parseDateInput(birthDate, label);
  const today = new Date();

  if (parsed > today) {
    throw new Error(`La fecha de nacimiento de ${label} no puede ser futura.`);
  }

  const age = calculateAge(parsed);

  if (Number.isFinite(minAge) && age < minAge) {
    throw new Error(`${label} debe tener al menos ${minAge} anos.`);
  }

  if (Number.isFinite(maxAge) && age > maxAge) {
    throw new Error(`${label} no puede superar ${maxAge} anos.`);
  }

  return { parsed, age };
};

const validateDocumentTypeByAge = async (documentTypeId, age) => {
  const parsedDocumentTypeId = parseInt(documentTypeId, 10);
  if (!Number.isFinite(age) || Number.isNaN(parsedDocumentTypeId)) {
    return;
  }

  const documentType = await prisma.documentType.findUnique({
    where: { id: parsedDocumentTypeId },
    select: { id: true, name: true },
  });

  if (!documentType) {
    throw new Error("Tipo de documento no encontrado");
  }

  const isMinor = age < 18;
  if (isMinor && isCedulaDocument(documentType.name)) {
    throw new Error(
      "Si es menor de edad no puede usar cedula. Selecciona TI u otro documento valido."
    );
  }

  if (!isMinor && isTarjetaIdentidadDocument(documentType.name)) {
    throw new Error(
      "Si es mayor de edad no puede usar Tarjeta de Identidad (TI). Selecciona cedula u otro documento valido."
    );
  }
};

const validateGuardianDocumentType = async (documentTypeId) => {
  const parsedDocumentTypeId = parseInt(documentTypeId, 10);
  if (!Number.isFinite(parsedDocumentTypeId)) {
    throw new Error("El tipo de documento del acudiente es obligatorio.");
  }

  const documentType = await prisma.documentType.findUnique({
    where: { id: parsedDocumentTypeId },
    select: { id: true, name: true },
  });

  if (!documentType) {
    throw new Error("Tipo de documento de acudiente no encontrado.");
  }

  if (isForbiddenGuardianDocumentType(documentType.name)) {
    throw new Error(
      "El acudiente no puede usar Registro Civil, Tarjeta de Identidad ni NIT. Selecciona un documento valido para adulto."
    );
  }
};

const getOrCreateAthleteRole = async (tx) => {
  let athleteRole = await tx.role.findFirst({
    where: { name: LEGACY_IMPORT_DEFAULTS.ROLE_NAME },
  });

  if (!athleteRole) {
    athleteRole = await tx.role.create({
      data: {
        name: LEGACY_IMPORT_DEFAULTS.ROLE_NAME,
        description: "Rol de deportista",
        status: ATHLETE_STATUS.ACTIVE,
        permissions: {
          Perfil: { Ver: true, Editar: true },
          Pagos: { Ver: true, Crear: true },
          Matriculas: { Ver: true },
        },
      },
    });
  }

  return athleteRole;
};

const buildLegacyLateFeeStartAt = (financial = {}, cutoverDate = new Date()) => {
  if (normalizeBoolean(financial.waiveHistoricalLateFee, true) === false) {
    return financial.lateFeeStartsAt
      ? parseDateInput(financial.lateFeeStartsAt, "financial.lateFeeStartsAt")
      : null;
  }

  return parseDateInput(
    financial.lateFeeStartsAt || cutoverDate,
    "financial.lateFeeStartsAt"
  );
};

const buildObligationMetadata = ({
  cutoverDate,
  importedAt,
  importedBy,
  lateFeeStartsAt,
  note,
  extra = {},
}) => {
  const metadata = {
    origin: LEGACY_IMPORT_DEFAULTS.ORIGIN,
    importedAt,
    cutoverDate,
    importedBy: importedBy ?? null,
    ...extra,
  };

  if (lateFeeStartsAt) {
    metadata.lateFeeStartsAt = lateFeeStartsAt;
  }

  if (note) {
    metadata.note = note;
  }

  return metadata;
};

const buildEnrollmentObservation = (baseObservation = null) => {
  if (baseObservation) {
    return `${baseObservation} | Importada como saldo inicial de produccion`;
  }

  return "Importada como saldo inicial de produccion";
};

const resolveSportsCategory = async (categoryName, { required = false } = {}) => {
  if (!categoryName && required) {
    throw new Error(
      "La categoria deportiva es obligatoria para la importacion inicial. Carga primero las categorias y luego completa el Excel."
    );
  }

  if (!categoryName) return null;

  const category = await prisma.sportsCategory.findFirst({
    where: {
      nombre: { equals: String(categoryName).trim(), mode: "insensitive" },
    },
    select: { id: true, nombre: true },
  });

  if (!category) {
    throw new Error(`La categoria "${categoryName}" no existe en sports_categories.`);
  }

  return category;
};

const getPaymentSettingsForImport = async (allowCreate = false) => {
  const settings = await paymentSettingsRepository.getSettings();

  if (settings) return settings;
  if (allowCreate) {
    return await paymentSettingsRepository.createInitialSettings();
  }

  throw new Error(
    "No existe configuracion de pagos. Configura payment_settings antes de ejecutar la migracion."
  );
};

const buildGuardianPreview = ({ guardian, guardianDraft, action }) => {
  if (!guardian && !guardianDraft) return null;

  const source = guardian || guardianDraft;
  return {
    mode: action,
    id: guardian?.id ?? null,
    fullName:
      source.nombreCompleto ||
      [source.firstName, source.lastName].filter(Boolean).join(" ").trim(),
    identification: source.identification || null,
    email: source.email || null,
  };
};

const buildPreviewResponse = ({
  athlete,
  guardian,
  guardianDraft,
  guardianAction,
  enrollment,
  sportsCategory,
  monthlyDebtPeriods,
  createRenewalObligation,
  lateFeeStartsAt,
  cutoverDate,
}) => ({
  athlete: {
    fullName: [
      athlete.firstName,
      athlete.middleName,
      athlete.lastName,
      athlete.secondLastName,
    ]
      .filter(Boolean)
      .join(" "),
    identification: athlete.identification,
    email: athlete.email,
    status: athlete.status,
    isScholarship: athlete.isScholarship === true,
  },
  guardian: buildGuardianPreview({ guardian, guardianDraft, action: guardianAction }),
  enrollment: {
    estado: enrollment.estado,
    fechaInicio: enrollment.fechaInicio,
    fechaVencimiento: enrollment.fechaVencimiento,
    skipInitialEnrollmentCharge: true,
  },
  category: sportsCategory
    ? {
        id: sportsCategory.id,
        name: sportsCategory.nombre,
      }
    : null,
  financial: {
    monthlyDebtPeriods,
    monthlyDebtCount: monthlyDebtPeriods.length,
    createRenewalObligation,
    lateFeeStartsAt,
  },
  options: {
    cutoverDate,
  },
});

const mergeLegacyImportPayload = (payload = {}, sharedOptions = {}) => ({
  ...payload,
  options: {
    ...(payload.options || {}),
    ...Object.fromEntries(
      Object.entries(sharedOptions).filter(([, value]) => value !== undefined)
    ),
  },
});

const buildGuardianCacheKeys = (guardian) => {
  const keys = [];

  if (guardian?.id) {
    keys.push(`id:${guardian.id}`);
  }

  if (guardian?.identification) {
    keys.push(`doc:${normalizeIdentifier(guardian.identification)}`);
  }

  if (guardian?.email) {
    keys.push(`email:${normalizeEmail(guardian.email)}`);
  }

  return [...new Set(keys)];
};

const getGuardianSnapshot = ({ guardian, guardianDraft }) => {
  const source = guardianDraft || guardian;
  if (!source) return null;

  return {
    id: guardian?.id ?? null,
    documentTypeId: guardian?.documentTypeId ?? source.documentTypeId ?? null,
    identification: normalizeIdentifier(source.identification),
    email: normalizeEmail(source.email),
    firstName: String(source.firstName || "").trim(),
    lastName: String(source.lastName || "").trim(),
    phone: normalizePhone(source.phone || source.phoneNumber),
    birthDate: source.birthDate ? new Date(source.birthDate).toISOString().slice(0, 10) : null,
    address: String(source.address || "").trim() || null,
    occupation: String(source.occupation || "").trim() || null,
  };
};

const areGuardianSnapshotsCompatible = (left, right) => {
  const fields = [
    "id",
    "documentTypeId",
    "identification",
    "email",
    "firstName",
    "lastName",
    "phone",
    "birthDate",
    "address",
    "occupation",
  ];

  return fields.every((field) => {
    const leftValue = left?.[field];
    const rightValue = right?.[field];

    if (leftValue === null || leftValue === undefined || leftValue === "") return true;
    if (rightValue === null || rightValue === undefined || rightValue === "") return true;

    return String(leftValue) === String(rightValue);
  });
};

const requiresPaymentSettings = (normalized) =>
  normalized.monthlyDebtPeriods.length > 0 || normalized.createRenewalObligation;

const markBatchRowError = (row, message) => {
  row.status = "error";
  row.errors = Array.isArray(row.errors) ? row.errors : [];

  if (!row.errors.includes(message)) {
    row.errors.push(message);
  }

  delete row.normalized;
  return row;
};

const applyBatchConsistencyChecks = (rows) => {
  const athleteDocumentRows = new Map();
  const athleteEmailRows = new Map();
  const guardianRows = new Map();

  rows.forEach((row) => {
    if (row.status !== "ready" || !row.normalized) return;

    const athleteDocument = row.normalized.athlete.identification;
    if (athleteDocumentRows.has(athleteDocument)) {
      const previousRow = athleteDocumentRows.get(athleteDocument);
      const message = `Documento duplicado en el archivo: "${athleteDocument}".`;
      markBatchRowError(row, message);
      markBatchRowError(previousRow, message);
      return;
    } else {
      athleteDocumentRows.set(athleteDocument, row);
    }

    const athleteEmail = row.normalized.athlete.email;
    if (athleteEmailRows.has(athleteEmail)) {
      const previousRow = athleteEmailRows.get(athleteEmail);
      const message = `Email duplicado en el archivo: "${athleteEmail}".`;
      markBatchRowError(row, message);
      markBatchRowError(previousRow, message);
    } else {
      athleteEmailRows.set(athleteEmail, row);
    }

    const guardianSnapshot = getGuardianSnapshot({
      guardian: row.normalized.guardian,
      guardianDraft: row.normalized.guardianDraft,
    });

    if (!guardianSnapshot) return;

    const guardianKeys = [];
    if (guardianSnapshot.identification) {
      guardianKeys.push(`doc:${guardianSnapshot.identification}`);
    }
    if (guardianSnapshot.email) {
      guardianKeys.push(`email:${guardianSnapshot.email}`);
    }

    guardianKeys.forEach((key) => {
      if (!guardianRows.has(key)) {
        guardianRows.set(key, { row, snapshot: guardianSnapshot });
        return;
      }

      const previousGuardianRow = guardianRows.get(key);
      if (!areGuardianSnapshotsCompatible(previousGuardianRow.snapshot, guardianSnapshot)) {
        const message =
          "El mismo acudiente aparece con datos distintos en varias filas del archivo.";
        markBatchRowError(row, message);
        markBatchRowError(previousGuardianRow.row, message);
      }
    });
  });
};

const buildBatchPreviewResponse = (preparedBatch) => {
  const publicRows = preparedBatch.rows.map((row) => ({
    index: row.index,
    rowNumber: row.rowNumber,
    status: row.status,
    athlete: row.plan?.athlete ?? null,
    guardian: row.plan?.guardian ?? null,
    plan: row.plan ?? null,
    errors: row.errors ?? [],
  }));

  const readyRows = publicRows.filter((row) => row.status === "ready");
  const invalidRows = publicRows.filter((row) => row.status === "error");

  return {
    options: preparedBatch.options,
    summary: {
      totalRows: publicRows.length,
      readyRows: readyRows.length,
      invalidRows: invalidRows.length,
      requireSportsCategory: preparedBatch.options.requireSportsCategory === true,
      monthlyDebtRows: readyRows.filter(
        (row) => (row.plan?.financial?.monthlyDebtCount || 0) > 0
      ).length,
      renewalRows: readyRows.filter(
        (row) => row.plan?.financial?.createRenewalObligation === true
      ).length,
    },
    rows: publicRows,
  };
};

const prepareLegacyImportBatch = async (payload, audit = {}) => {
  const records = Array.isArray(payload) ? payload : payload?.records;

  if (!Array.isArray(records) || records.length === 0) {
    throw new Error("Debes enviar al menos un registro para la importacion masiva.");
  }

  const batchOptions = {
    ...(payload?.options || {}),
    requireSportsCategory:
      payload?.options?.requireSportsCategory === undefined
        ? true
        : payload.options.requireSportsCategory,
  };

  const rows = [];

  for (let index = 0; index < records.length; index += 1) {
    const record = mergeLegacyImportPayload(records[index], batchOptions);

    try {
      const result = await legacyEnrollmentImportService.preview(record, audit);
      rows.push({
        index,
        rowNumber: index + 2,
        status: "ready",
        plan: result.plan,
        normalized: result.normalized,
        payload: record,
        errors: [],
      });
    } catch (error) {
      rows.push({
        index,
        rowNumber: index + 2,
        status: "error",
        plan: null,
        errors: [error.message],
      });
    }
  }

  applyBatchConsistencyChecks(rows);

  return {
    options: {
      cutoverDate: batchOptions.cutoverDate || null,
      requireSportsCategory: normalizeBoolean(batchOptions.requireSportsCategory, true),
    },
    rows,
  };
};

const resolveGuardianForPreview = async ({ athlete, guardianDraft, age }) => {
  const parsedGuardianId = athlete.guardianId ? parseInt(athlete.guardianId, 10) : null;
  const hasGuardianDraft = Boolean(guardianDraft);

  if (age < 18 && !parsedGuardianId && !hasGuardianDraft) {
    throw new Error("Las deportistas menores de edad requieren un acudiente.");
  }

  if ((parsedGuardianId || hasGuardianDraft) && !athlete.relationship) {
    throw new Error("El parentesco es obligatorio cuando la deportista tiene acudiente.");
  }

  if (parsedGuardianId) {
    const guardian = await prisma.guardian.findUnique({
      where: { id: parsedGuardianId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        identification: true,
        email: true,
        phone: true,
        documentTypeId: true,
        birthDate: true,
        address: true,
        occupation: true,
      },
    });

    if (!guardian) {
      throw new Error("El acudiente indicado no existe.");
    }

    return {
      guardianId: guardian.id,
      guardian,
      guardianDraft: null,
      action: "linked_by_id",
    };
  }

  if (!guardianDraft) {
    return {
      guardianId: null,
      guardian: null,
      guardianDraft: null,
      action: "none",
    };
  }

  if (!guardianDraft.documentTypeId) {
    throw new Error("El tipo de documento del acudiente es obligatorio.");
  }
  if (!guardianDraft.identification || guardianDraft.identification.length < 6) {
    throw new Error(
      "La identificacion del acudiente es obligatoria y debe tener al menos 6 caracteres."
    );
  }
  if (!guardianDraft.firstName || guardianDraft.firstName.length < 2) {
    throw new Error("El nombre del acudiente es obligatorio.");
  }
  if (!guardianDraft.lastName || guardianDraft.lastName.length < 2) {
    throw new Error("El apellido del acudiente es obligatorio.");
  }
  if (!guardianDraft.email) {
    throw new Error("El email del acudiente es obligatorio.");
  }
  if (!guardianDraft.phone) {
    throw new Error("El telefono del acudiente es obligatorio.");
  }
  if (!guardianDraft.birthDate) {
    throw new Error("La fecha de nacimiento del acudiente es obligatoria.");
  }

  validateEmailFormat(guardianDraft.email, "email del acudiente");
  validateGuardianPhoneNumber(guardianDraft.phone);
  await validateGuardianDocumentType(guardianDraft.documentTypeId);

  const guardianBirth = validatePersonBirthDate(guardianDraft.birthDate, {
    label: "el acudiente",
    minAge: 18,
    maxAge: LEGACY_IMPORT_DEFAULTS.MAX_PERSON_AGE,
  });

  const existingGuardianByDocument = await prisma.guardian.findUnique({
    where: { identification: guardianDraft.identification },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      identification: true,
      email: true,
      phone: true,
      documentTypeId: true,
      birthDate: true,
      address: true,
      occupation: true,
    },
  });

  const existingGuardianByEmail = await prisma.guardian.findUnique({
    where: { email: guardianDraft.email },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      identification: true,
      email: true,
      phone: true,
      documentTypeId: true,
      birthDate: true,
      address: true,
      occupation: true,
    },
  });

  if (
    existingGuardianByDocument &&
    existingGuardianByEmail &&
    existingGuardianByDocument.id !== existingGuardianByEmail.id
  ) {
    throw new Error(
      "El documento y el email del acudiente apuntan a acudientes distintos. Corrige la fila antes de importar."
    );
  }

  const existingGuardian = existingGuardianByDocument || existingGuardianByEmail;
  const normalizedGuardianDraft = {
    ...guardianDraft,
    birthDate: guardianBirth.parsed,
  };

  if (existingGuardian) {
    const existingSnapshot = getGuardianSnapshot({ guardian: existingGuardian });
    const draftSnapshot = getGuardianSnapshot({ guardianDraft: normalizedGuardianDraft });

    if (!areGuardianSnapshotsCompatible(existingSnapshot, draftSnapshot)) {
      throw new Error(
        "El acudiente ya existe pero los datos del archivo no coinciden con los registrados actualmente."
      );
    }

    return {
      guardianId: existingGuardian.id,
      guardian: existingGuardian,
      guardianDraft: null,
      action: "reuse_existing",
    };
  }

  return {
    guardianId: null,
    guardian: null,
    guardianDraft: normalizedGuardianDraft,
    action: "create_new",
  };
};

const resolveGuardianInTransaction = async ({
  tx,
  guardianId,
  guardian,
  guardianDraft,
  guardianCache,
}) => {
  if (guardianId) {
    return guardianId;
  }

  if (guardian) {
    return guardian.id;
  }

  if (!guardianDraft) {
    return null;
  }

  const cacheKeys = buildGuardianCacheKeys(guardianDraft);
  const cachedGuardian = cacheKeys
    .map((key) => guardianCache.get(key))
    .find(Boolean);

  if (cachedGuardian?.id) {
    return cachedGuardian.id;
  }

  const existingGuardianByDocument = guardianDraft.identification
    ? await tx.guardian.findUnique({
        where: { identification: guardianDraft.identification },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          identification: true,
          email: true,
          phone: true,
          documentTypeId: true,
          birthDate: true,
          address: true,
          occupation: true,
        },
      })
    : null;

  const existingGuardianByEmail = guardianDraft.email
    ? await tx.guardian.findUnique({
        where: { email: guardianDraft.email },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          identification: true,
          email: true,
          phone: true,
          documentTypeId: true,
          birthDate: true,
          address: true,
          occupation: true,
        },
      })
    : null;

  if (
    existingGuardianByDocument &&
    existingGuardianByEmail &&
    existingGuardianByDocument.id !== existingGuardianByEmail.id
  ) {
    throw new Error(
      "El documento y el email del acudiente apuntan a acudientes distintos dentro de la base de datos."
    );
  }

  const existingGuardian = existingGuardianByDocument || existingGuardianByEmail;
  if (existingGuardian) {
    const existingSnapshot = getGuardianSnapshot({ guardian: existingGuardian });
    const draftSnapshot = getGuardianSnapshot({ guardianDraft });

    if (!areGuardianSnapshotsCompatible(existingSnapshot, draftSnapshot)) {
      throw new Error(
        "El acudiente ya existe pero la informacion del Excel no coincide con el registro actual."
      );
    }

    buildGuardianCacheKeys(existingGuardian).forEach((key) => {
      guardianCache.set(key, existingGuardian);
    });
    buildGuardianCacheKeys(guardianDraft).forEach((key) => {
      guardianCache.set(key, existingGuardian);
    });

    return existingGuardian.id;
  }

  const createdGuardian = await tx.guardian.create({
    data: {
      documentTypeId: parseInt(guardianDraft.documentTypeId, 10),
      identification: guardianDraft.identification,
      firstName: guardianDraft.firstName,
      lastName: guardianDraft.lastName,
      email: guardianDraft.email,
      phone: guardianDraft.phone,
      address: guardianDraft.address || null,
      occupation: guardianDraft.occupation || null,
      birthDate: guardianDraft.birthDate ? new Date(guardianDraft.birthDate) : null,
      statusAssignedAt: guardianDraft.statusAssignedAt
        ? new Date(guardianDraft.statusAssignedAt)
        : new Date(),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      identification: true,
      email: true,
      phone: true,
      documentTypeId: true,
      birthDate: true,
      address: true,
      occupation: true,
    },
  });

  buildGuardianCacheKeys(createdGuardian).forEach((key) => {
    guardianCache.set(key, createdGuardian);
  });

  return createdGuardian.id;
};

const persistLegacyImportRecord = async ({
  tx,
  normalized,
  settings,
  athleteRole,
  importedAt,
  guardianCache,
}) => {
  const temporaryPassword = normalized.athlete.identification;
  const passwordHash = await bcrypt.hash(
    temporaryPassword,
    LEGACY_IMPORT_DEFAULTS.BCRYPT_SALT_ROUNDS
  );

  const resolvedGuardianId = await resolveGuardianInTransaction({
    tx,
    guardianId: normalized.guardianId,
    guardian: normalized.guardian,
    guardianDraft: normalized.guardianDraft,
    guardianCache,
  });

  const user = await tx.user.create({
    data: {
      firstName: normalized.athlete.firstName?.trim(),
      middleName: normalized.athlete.middleName?.trim() || null,
      lastName: normalized.athlete.lastName?.trim(),
      secondLastName: normalized.athlete.secondLastName?.trim() || null,
      documentTypeId: parseInt(normalized.athlete.documentTypeId, 10),
      identification: normalized.athlete.identification,
      email: normalized.athlete.email,
      phoneNumber: normalizePhone(normalized.athlete.phoneNumber),
      birthDate: new Date(normalized.athlete.birthDate),
      age: normalized.age,
      address:
        String(normalized.athlete.address || "").trim() ||
        LEGACY_IMPORT_DEFAULTS.DEFAULT_ADDRESS,
      passwordHash,
      roleId: athleteRole.id,
      status: normalized.athlete.status,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      identification: true,
    },
  });

  const athlete = await tx.athlete.create({
    data: {
      userId: user.id,
      status: normalized.athlete.status,
      inactivityReason: null,
      guardianId: resolvedGuardianId,
      relationship: normalized.athlete.relationship || null,
      otherRelationship: normalized.athlete.otherRelationship || null,
      currentInscriptionStatus:
        normalized.enrollment.estado === ENROLLMENT_STATUS.ACTIVE
          ? INSCRIPTION_STATUS.ACTIVE
          : INSCRIPTION_STATUS.EXPIRED,
      isScholarship: normalized.athlete.isScholarship === true,
      ...(normalized.statusAssignedAt
        ? { statusAssignedAt: normalized.statusAssignedAt }
        : {}),
    },
    select: {
      id: true,
      status: true,
      isScholarship: true,
    },
  });

  const enrollment = await tx.enrollment.create({
    data: {
      athleteId: athlete.id,
      estado: normalized.enrollment.estado,
      observaciones: buildEnrollmentObservation(normalized.enrollmentObservation),
      fechaInicio: normalized.enrollment.fechaInicio,
      fechaVencimiento: normalized.enrollment.fechaVencimiento,
    },
    select: {
      id: true,
      athleteId: true,
      estado: true,
      fechaInicio: true,
      fechaVencimiento: true,
      createdAt: true,
    },
  });

  if (normalized.sportsCategory) {
    await tx.inscription.create({
      data: {
        athleteId: athlete.id,
        sportsCategoryId: normalized.sportsCategory.id,
        type: "initial_inscription",
        status:
          normalized.enrollment.estado === ENROLLMENT_STATUS.ACTIVE
            ? INSCRIPTION_STATUS.ACTIVE
            : INSCRIPTION_STATUS.EXPIRED,
        inscriptionDate: normalized.enrollment.fechaInicio,
        conceptDate: importedAt,
        expirationDate: normalized.enrollment.fechaVencimiento,
        concept: "Inscripcion importada desde control manual al corte de produccion",
        notes: "Registro legacy importado sin cobro inicial de matricula",
      },
    });
  }

  const createdObligations = [];

  for (const period of normalized.monthlyDebtPeriods) {
    const { dueStart, dueEnd } = getMonthlyDueDates(period);
    const obligation = await tx.paymentObligation.create({
      data: {
        athleteId: athlete.id,
        type: "MONTHLY",
        period,
        baseAmount: settings.monthlyAmount,
        dueStart,
        dueEnd,
        metadata: buildObligationMetadata({
          cutoverDate: normalized.cutoverDate,
          importedAt,
          importedBy: normalized.importedBy,
          lateFeeStartsAt: normalized.lateFeeStartsAt,
          note: "Deuda mensual importada al saldo inicial",
          extra: {
            importedDebtPeriod: period,
          },
        }),
      },
      select: {
        id: true,
        type: true,
        period: true,
        dueStart: true,
        dueEnd: true,
      },
    });

    createdObligations.push(obligation);
  }

  if (normalized.createRenewalObligation) {
    const renewalDueStart = new Date(normalized.cutoverDate);
    const renewalDueEnd = new Date(renewalDueStart);
    renewalDueEnd.setDate(renewalDueEnd.getDate() + LEGACY_IMPORT_DEFAULTS.GRACE_DAYS);

    const renewalObligation = await tx.paymentObligation.create({
      data: {
        athleteId: athlete.id,
        type: "ENROLLMENT_RENEWAL",
        period: null,
        baseAmount: settings.enrollmentAmount,
        dueStart: renewalDueStart,
        dueEnd: renewalDueEnd,
        metadata: buildObligationMetadata({
          cutoverDate: normalized.cutoverDate,
          importedAt,
          importedBy: normalized.importedBy,
          lateFeeStartsAt: null,
          note: "Renovacion pendiente importada al corte de produccion",
        }),
      },
      select: {
        id: true,
        type: true,
        period: true,
        dueStart: true,
        dueEnd: true,
      },
    });

    createdObligations.push(renewalObligation);
  }

  return {
    athlete: { ...athlete, user, guardianId: resolvedGuardianId },
    enrollment,
    createdObligations,
    temporaryPassword,
  };
};

export const legacyEnrollmentImportService = {
  BatchValidationError: LegacyImportBatchValidationError,

  async preview(payload, audit = {}) {
    const mergedPayload = mergeLegacyImportPayload(payload);

    if (!mergedPayload?.athlete) {
      throw new Error("Los datos de athlete son requeridos.");
    }

    if (!mergedPayload?.enrollment) {
      throw new Error("Los datos de enrollment son requeridos.");
    }

    const athlete = normalizeAthleteInput(mergedPayload.athlete);
    const guardianDraft = normalizeGuardianInput(mergedPayload.guardian);
    const financial = mergedPayload.financial || {};
    const options = mergedPayload.options || {};

    if (!athlete.firstName || !athlete.lastName) {
      throw new Error("El nombre y el apellido de la deportista son obligatorios.");
    }

    if (!athlete.documentTypeId) {
      throw new Error("documentTypeId es obligatorio.");
    }

    if (!athlete.identification || athlete.identification.length < 6) {
      throw new Error("La identificacion es obligatoria y debe tener al menos 6 caracteres.");
    }

    if (!athlete.email) {
      throw new Error("El email es obligatorio.");
    }

    if (!athlete.phoneNumber) {
      throw new Error("El telefono es obligatorio.");
    }

    if (!athlete.birthDate) {
      throw new Error("birthDate es obligatorio.");
    }

    validateEmailFormat(athlete.email, "email");
    validateAthletePhoneNumber(athlete.phoneNumber);

    const athleteBirth = validatePersonBirthDate(athlete.birthDate, {
      label: "la deportista",
      minAge: LEGACY_IMPORT_DEFAULTS.MIN_ATHLETE_AGE,
      maxAge: LEGACY_IMPORT_DEFAULTS.MAX_PERSON_AGE,
    });

    const age = athleteBirth.age;
    await validateDocumentTypeByAge(athlete.documentTypeId, age);

    const existingUserByDocument = await prisma.user.findUnique({
      where: { identification: athlete.identification },
      select: { id: true },
    });

    if (existingUserByDocument) {
      throw new Error(
        `Ya existe una deportista registrada con el documento "${athlete.identification}".`
      );
    }

    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: athlete.email },
      select: { id: true },
    });

    if (existingUserByEmail) {
      throw new Error(`Ya existe un usuario registrado con el email "${athlete.email}".`);
    }

    const cutoverDate = parseDateInput(
      options.cutoverDate || new Date(),
      "options.cutoverDate"
    );
    const statusAssignedAt = resolveLegacyStatusAssignedAt(mergedPayload.athlete, cutoverDate);
    const enrollment = resolveLegacyEnrollmentDates(mergedPayload.enrollment);
    validateLegacySnapshotConsistency({
      enrollment,
      cutoverDate,
      athleteStatus: athlete.status,
      statusAssignedAt,
    });
    const sportsCategory = await resolveSportsCategory(athlete.categoria, {
      required: normalizeBoolean(options.requireSportsCategory, false),
    });

    const guardianResolution = await resolveGuardianForPreview({
      athlete,
      guardianDraft,
      age,
    });

    const monthlyDebtPeriods = buildMonthlyDebtPeriods(financial, cutoverDate);
    const createRenewalObligation = normalizeBoolean(
      financial.createRenewalObligation,
      false
    );

    if (createRenewalObligation && enrollment.estado !== ENROLLMENT_STATUS.EXPIRED) {
      throw new Error(
        "Solo puedes crear una obligacion de renovacion si la matricula importada esta Vencida."
      );
    }

    if (createRenewalObligation && athlete.isScholarship === true) {
      throw new Error(
        "Una deportista becada no debe entrar con renovacion pendiente generada automaticamente."
      );
    }

    const lateFeeStartsAt = buildLegacyLateFeeStartAt(financial, cutoverDate);

    if (requiresPaymentSettings({ monthlyDebtPeriods, createRenewalObligation })) {
      await getPaymentSettingsForImport(false);
    }

    return {
      normalized: {
        athlete,
        guardianId: guardianResolution.guardianId,
        guardian: guardianResolution.guardian,
        guardianDraft: guardianResolution.guardianDraft,
        guardianAction: guardianResolution.action,
        age,
        sportsCategory,
        enrollment,
        enrollmentObservation: mergedPayload?.enrollment?.observaciones || null,
        monthlyDebtPeriods,
        createRenewalObligation,
        lateFeeStartsAt,
        cutoverDate,
        statusAssignedAt,
        importedBy: audit?.performedBy ?? null,
      },
      plan: buildPreviewResponse({
        athlete,
        guardian: guardianResolution.guardian,
        guardianDraft: guardianResolution.guardianDraft,
        guardianAction: guardianResolution.action,
        enrollment,
        sportsCategory,
        monthlyDebtPeriods,
        createRenewalObligation,
        lateFeeStartsAt,
        cutoverDate,
      }),
    };
  },

  async previewBatch(payload, audit = {}) {
    const preparedBatch = await prepareLegacyImportBatch(payload, audit);
    return buildBatchPreviewResponse(preparedBatch);
  },

  async create(payload, audit = {}) {
    const { normalized, plan } = await this.preview(payload, audit);
    const settings = requiresPaymentSettings(normalized)
      ? await getPaymentSettingsForImport(true)
      : null;
    const importedAt = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const athleteRole = await getOrCreateAthleteRole(tx);

      return await persistLegacyImportRecord({
        tx,
        normalized,
        settings,
        athleteRole,
        importedAt,
        guardianCache: new Map(),
      });
    });

    return {
      success: true,
      athlete: result.athlete,
      enrollment: result.enrollment,
      createdObligations: result.createdObligations,
      preview: plan,
      temporaryPassword:
        process.env.NODE_ENV === "development" ? result.temporaryPassword : undefined,
    };
  },

  async createBatch(payload, audit = {}) {
    const preparedBatch = await prepareLegacyImportBatch(payload, audit);
    const preview = buildBatchPreviewResponse(preparedBatch);

    if (preview.summary.invalidRows > 0) {
      throw new LegacyImportBatchValidationError(
        "La importacion masiva tiene filas con errores. Corrige el archivo antes de continuar.",
        preview
      );
    }

    const settings = preparedBatch.rows.some(
      (row) => row.status === "ready" && requiresPaymentSettings(row.normalized)
    )
      ? await getPaymentSettingsForImport(true)
      : null;

    const importedAt = new Date();

    const createdRows = await prisma.$transaction(async (tx) => {
      const athleteRole = await getOrCreateAthleteRole(tx);
      const guardianCache = new Map();
      const rows = [];

      for (const row of preparedBatch.rows) {
        if (row.status !== "ready") continue;

        const createdRecord = await persistLegacyImportRecord({
          tx,
          normalized: row.normalized,
          settings,
          athleteRole,
          importedAt,
          guardianCache,
        });

        rows.push({
          rowNumber: row.rowNumber,
          athlete: createdRecord.athlete,
          enrollment: createdRecord.enrollment,
          createdObligations: createdRecord.createdObligations,
          temporaryPassword: createdRecord.temporaryPassword,
        });
      }

      return rows;
    });

    return {
      success: true,
      summary: {
        importedRows: createdRows.length,
      },
      rows: createdRows.map((row) => ({
        rowNumber: row.rowNumber,
        athleteId: row.athlete.id,
        enrollmentId: row.enrollment.id,
        obligationsCreated: row.createdObligations.length,
        temporaryPassword:
          process.env.NODE_ENV === "development" ? row.temporaryPassword : undefined,
      })),
      preview,
    };
  },
};

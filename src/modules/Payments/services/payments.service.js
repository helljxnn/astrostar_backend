import { paymentsRepository } from "../repository/payments.repository.js";
import { paymentSettingsRepository } from "../repository/paymentSettings.repository.js";
import prisma from "../../../config/database.js";
import emailService from "../../../services/emailService.js";

// ============================================================================
// CONSTANTES FIJAS DEL NEGOCIO (según especificaciones del cliente)
// ============================================================================
const BUSINESS_CONSTANTS = {
  LATE_FEE_DAILY: 2000,        // Mora diaria FIJA: 2,000 pesos (ACTUALIZADO)
  MAX_LATE_DAYS_MONTHLY: 15,   // Días máximos FIJOS: 15 días
  GRACE_DAYS: 5,               // Días de gracia FIJOS: del 1 al 5 de cada mes
  MAX_LATE_DAYS_CAP: 90,       // Límite máximo para cálculo de mora (90 días)
};

// ============================================================================
// CACHE DE CONFIGURACIÓN (Solo para valores variables)
// ============================================================================
let cachedSettings = null;
let cacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Obtener configuración de pagos con cache inteligente
 */
const getPaymentSettings = async () => {
  const now = Date.now();
  
  // Si no hay cache o expiró, recargar
  if (!cachedSettings || !cacheTimestamp || (now - cacheTimestamp) > CACHE_TTL) {
    cachedSettings = await paymentSettingsRepository.getSettings();
    cacheTimestamp = now;
    
    // Si no existe configuración, crear una por defecto
    if (!cachedSettings) {
      cachedSettings = await paymentSettingsRepository.createInitialSettings();
    }
  }
  
  return cachedSettings;
};

/**
 * Invalidar cache cuando admin actualiza configuración
 */
const invalidateSettingsCache = () => {
  cachedSettings = null;
  cacheTimestamp = null;
};

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Calcula los días de mora basado en fecha actual (ESTÁNDAR EMPRESARIAL)
 * REGLA DE NEGOCIO: Mora continua hasta que se pague correctamente
 */
const resolveLateFeeReferenceDate = (dueEnd, metadata = null) => {
  if (!dueEnd) return null;

  const due = new Date(dueEnd);
  if (Number.isNaN(due.getTime())) return null;

  const configuredStart = metadata?.lateFeeStartsAt
    ? new Date(metadata.lateFeeStartsAt)
    : null;

  if (
    configuredStart &&
    !Number.isNaN(configuredStart.getTime()) &&
    configuredStart > due
  ) {
    return configuredStart;
  }

  return due;
};

const calculateLateDays = (dueEnd, metadata = null) => {
  const now = new Date();
  const due = resolveLateFeeReferenceDate(dueEnd, metadata);

  if (!due) return 0;
  
  if (now <= due) return 0;
  
  const diffTime = now - due;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Calcula los días de mora efectivos, pausando el conteo durante revisión.
 * Reglas:
 * - Desde vencimiento hasta primer upload: cuenta.
 * - Mientras esté PENDING: se congela.
 * - Si RECHAZADO: se congela entre upload y reviewedAt, y luego continúa.
 * - Si APROBADO: se congela desde upload y termina el conteo.
 */
const calculateEffectiveLateDays = (
  dueEnd,
  payments = [],
  now = new Date(),
  metadata = null
) => {
  const due = resolveLateFeeReferenceDate(dueEnd, metadata);
  if (!due) return 0;

  if (now <= due) return 0;

  const sortedPayments = (payments || [])
    .filter((p) => p?.uploadedAt)
    .slice()
    .sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));

  // Si no hay pagos subidos, mora continua hasta hoy
  if (sortedPayments.length === 0) {
    return Math.ceil((now - due) / (1000 * 60 * 60 * 24));
  }

  let cursor = due;
  let lateDays = 0;

  for (const payment of sortedPayments) {
    const uploadedAt = new Date(payment.uploadedAt);
    if (uploadedAt > cursor) {
      lateDays += Math.ceil((uploadedAt - cursor) / (1000 * 60 * 60 * 24));
    }

    const status = String(payment.status || "").toUpperCase();

    if (status === "APPROVED") {
      return Math.max(0, lateDays);
    }

    if (status === "PENDING") {
      return Math.max(0, lateDays);
    }

    if (status === "REJECTED") {
      if (payment.reviewedAt) {
        const reviewedAt = new Date(payment.reviewedAt);
        cursor = reviewedAt > uploadedAt ? reviewedAt : uploadedAt;
        continue;
      }
      // Si falta reviewedAt, asumir que sigue en revisión
      return Math.max(0, lateDays);
    }
  }

  if (now > cursor) {
    lateDays += Math.ceil((now - cursor) / (1000 * 60 * 60 * 24));
  }

  return Math.max(0, lateDays);
};

/**
 * Calcula días de mora para un pago específico basado en fecha de subida
 * Esta función es JUSTA - no cobra mora por demora administrativa
 */
const calculateLateDaysForPayment = (dueEnd, uploadedAt, metadata = null) => {
  const due = resolveLateFeeReferenceDate(dueEnd, metadata);
  if (!due) return 0;
  
  // Si no hay fecha de subida, usar fecha actual (para obligaciones sin pago)
  const referenceDate = uploadedAt ? new Date(uploadedAt) : new Date();
  
  if (referenceDate <= due) return 0;
  
  const diffTime = referenceDate - due;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Calcular días de mora para una obligación basado en PRIMERA subida
 * Esta función es SÚPER JUSTA - no penaliza por rechazos administrativos
 */
const calculateLateDaysForObligation = async (obligationId) => {
  try {
    // Buscar la obligación con todos sus pagos
    const obligation = await prisma.paymentObligation.findUnique({
      where: { id: obligationId },
      include: {
        payments: {
          where: { uploadedAt: { not: null } },
          orderBy: { uploadedAt: 'asc' } // Más temprana primero
        }
      }
    });
    
    if (!obligation) return 0;
    
    // Si no hay pagos subidos, usar fecha actual
    if (obligation.payments.length === 0) {
      return calculateLateDays(obligation.dueEnd, obligation.metadata);
    }
    
    // Usar la PRIMERA subida (más temprana)
    const firstUpload = obligation.payments[0];
    return calculateLateDaysForPayment(
      obligation.dueEnd,
      firstUpload.uploadedAt,
      obligation.metadata
    );
    
  } catch (error) {
return 0;
  }
};

/**
 * Calcula la mora total usando la tarifa diaria de la configuración
 * ✅ REGLA EMPRESARIAL MEJORADA: Mora congelada para atletas inactivos
 * @param {number} lateDays - Días de mora desde vencimiento hasta hoy
 * @param {number} [lateFeeDailyAmount] - Tarifa diaria (lee de BD). Fallback: constante.
 * @param {Object} [athlete] - Datos del atleta (opcional, para validar estado)
 * @param {Object} [enrollment] - Datos de matrícula (opcional, para validar estado)
 * @param {Date} [dueEnd] - Fecha de vencimiento (requerida para mora congelada)
 */
const calculateLateFee = (
  lateDays,
  lateFeeDailyAmount = BUSINESS_CONSTANTS.LATE_FEE_DAILY,
  athlete = null,
  enrollment = null,
  dueEnd = null,
  metadata = null
) => {
  if (lateDays <= 0) return 0;
  
  // ✅ REGLA CRÍTICA: No calcular mora si matrícula vencida
  if (enrollment && enrollment.estado !== 'Vigente') {
    return 0;
  }
  
  // ✅ NUEVA REGLA EMPRESARIAL: Mora congelada para atletas inactivos
  if (athlete && athlete.status !== 'Active') {
    // Si el atleta está inactivo, calcular mora solo hasta la fecha de inactivación
    if (athlete.statusAssignedAt && dueEnd) {
      const inactiveDate = new Date(athlete.statusAssignedAt);
      const due = resolveLateFeeReferenceDate(dueEnd, metadata);
      if (!due) return 0;
      
      // Si se inactivó antes del vencimiento, no hay mora
      if (inactiveDate <= due) {
        return 0;
      }
      
      // Calcular días desde vencimiento hasta inactivación (mora congelada)
      const diffTime = inactiveDate - due;
      const daysUntilInactive = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const cappedDays = Math.min(Math.max(0, daysUntilInactive), BUSINESS_CONSTANTS.MAX_LATE_DAYS_CAP);
      
      return cappedDays * lateFeeDailyAmount;
    }
    
    // Fallback: si no hay fecha de inactivación, no cobrar mora
    return 0;
  }
  
  // Mora normal para atletas activos
  const cappedLateDays = Math.min(lateDays, BUSINESS_CONSTANTS.MAX_LATE_DAYS_CAP);
  return cappedLateDays * lateFeeDailyAmount;
};

/**
 * Genera el periodo actual (YYYY-MM)
 */
const getCurrentPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getPeriodFromDate = (date) => {
  if (!date) return getCurrentPeriod();
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return getCurrentPeriod();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const getNextPeriod = (period) => {
  const [year, month] = String(period || "").split("-").map((part) => parseInt(part, 10));
  if (!year || !month) return getCurrentPeriod();

  const nextDate = new Date(year, month, 1);
  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
};

const isWithinLastWeekOfMonth = (dateValue) => {
  if (!dateValue) return false;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return date.getDate() > (lastDayOfMonth - 7);
};

const getEnrollmentCoveragePeriods = (referenceDate) => {
  const effectiveDate = referenceDate ? new Date(referenceDate) : new Date();
  if (Number.isNaN(effectiveDate.getTime())) {
    return [getCurrentPeriod()];
  }

  const currentPeriod = getPeriodFromDate(effectiveDate);
  const periods = [currentPeriod];

  if (isWithinLastWeekOfMonth(effectiveDate)) {
    periods.push(getNextPeriod(currentPeriod));
  }

  return [...new Set(periods)];
};

const getPeriodBounds = (period) => {
  const [y, m] = (period || '').split('-').map((p) => parseInt(p, 10));
  if (!y || !m) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    return { start, end };
  }
  const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const end = new Date(y, m, 1, 0, 0, 0, 0);
  return { start, end };
};

const isEnrollmentPaymentType = (type) => (
  type === 'ENROLLMENT_INITIAL' || type === 'ENROLLMENT_RENEWAL'
);

const isMonthlyExemptByEnrollment = (obligation) => (
  obligation?.metadata?.exemptByEnrollment === true
);

const buildScholarshipEnrollmentDates = () => {
  const fechaInicio = new Date();
  const fechaVencimiento = new Date(fechaInicio);
  fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1);
  return { fechaInicio, fechaVencimiento };
};

const buildEnrollmentDatesFromReference = (referenceDate) => {
  const fechaInicio = referenceDate ? new Date(referenceDate) : new Date();
  if (Number.isNaN(fechaInicio.getTime())) {
    const now = new Date();
    const fechaVencimiento = new Date(now);
    fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1);
    return { fechaInicio: now, fechaVencimiento };
  }

  const fechaVencimiento = new Date(fechaInicio);
  fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1);
  return { fechaInicio, fechaVencimiento };
};

/**
 * Calcula fechas de vencimiento para mensualidad usando días de gracia fijos
 */
const calculateMonthlyDueDates = async (year, month) => {
  const dueStart = new Date(year, month - 1, 1); // Día 1 del mes
  const dueEnd = new Date(year, month - 1, BUSINESS_CONSTANTS.GRACE_DAYS); // Día 5 fijo
  
  return { dueStart, dueEnd };
};

const parseDateInput = (value, isEnd = false) => {
  if (!value) return null;
  let date;
  if (value instanceof Date) {
    date = new Date(value);
  } else if (typeof value === 'string') {
    const raw = value.trim();
    const isSlashDate = /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw);
    const isIsoDate = /^\d{4}-\d{2}-\d{2}$/.test(raw);
    if (isSlashDate) {
      const [d, m, y] = raw.split('/').map(p => parseInt(p, 10));
      date = new Date(y, (m || 1) - 1, d || 1);
    } else if (isIsoDate) {
      const [y, m, d] = raw.split('-').map(p => parseInt(p, 10));
      date = new Date(y, (m || 1) - 1, d || 1);
    } else {
      return null;
    }
  } else {
    return null;
  }
  if (Number.isNaN(date.getTime())) return null;
  if (isEnd) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date;
};

const normalizeSearchText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const parseSearchNumericValue = (value) => {
  const raw = String(value || '').trim();
  if (!raw || !/\d/.test(raw)) return null;

  const cleaned = raw.replace(/[^\d,.-]/g, '');
  if (!cleaned) return null;

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  let normalized = cleaned;

  if (hasComma && hasDot) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = cleaned.replace(/,/g, '');
    }
  } else if (hasDot) {
    const dotParts = cleaned.split('.');
    if (dotParts.length > 1 && dotParts.every((part, index) => index === 0 || part.length === 3)) {
      normalized = cleaned.replace(/\./g, '');
    }
  } else if (hasComma) {
    const commaParts = cleaned.split(',');
    if (commaParts.length > 1 && commaParts.every((part, index) => index === 0 || part.length === 3)) {
      normalized = cleaned.replace(/,/g, '');
    } else {
      normalized = cleaned.replace(',', '.');
    }
  }

  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
};

const buildDateRange = (dateFrom, dateTo) => {
  const from = parseDateInput(dateFrom, false);
  const to = parseDateInput(dateTo, true);

  if (!from && !to) return null;

  const range = {};
  if (from) range.gte = from;
  if (to) range.lte = to;
  return Object.keys(range).length > 0 ? range : null;
};

const buildPaymentSearchConditions = (search, dateFields = ['uploadedAt']) => {
  const raw = String(search || '').trim();
  if (!raw) return [];

  const normalized = normalizeSearchText(raw);
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const searchOr = [];

  const typeVariants = [];
  if (normalized.includes('mensual')) typeVariants.push('MONTHLY');
  if (normalized.includes('matricula') && normalized.includes('inicial')) {
    typeVariants.push('ENROLLMENT_INITIAL');
  }
  if (normalized.includes('renov')) typeVariants.push('ENROLLMENT_RENEWAL');

  const statusVariants = [];
  if (normalized.includes('aprob')) statusVariants.push('APPROVED');
  if (normalized.includes('rechaz')) statusVariants.push('REJECTED');
  if (normalized.includes('pend')) statusVariants.push('PENDING');

  typeVariants.forEach((type) => {
    searchOr.push({ obligation: { type } });
  });

  statusVariants.forEach((status) => {
    searchOr.push({ status });
  });

  const monthNames = {
    enero: 1,
    febrero: 2,
    marzo: 3,
    abril: 4,
    mayo: 5,
    junio: 6,
    julio: 7,
    agosto: 8,
    septiembre: 9,
    setiembre: 9,
    octubre: 10,
    noviembre: 11,
    diciembre: 12
  };

  const monthEntry = Object.entries(monthNames).find(([name]) => normalized.includes(name));
  const yearMatch = normalized.match(/\b(20\d{2})\b/);
  if (monthEntry) {
    const month = monthEntry[1];
    const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
    const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    searchOr.push({
      obligation: {
        dueStart: { gte: monthStart, lte: monthEnd }
      }
    });
    searchOr.push({
      obligation: {
        dueEnd: { gte: monthStart, lte: monthEnd }
      }
    });
    searchOr.push({
      obligation: {
        period: { contains: `${year}-${String(month).padStart(2, '0')}`, mode: 'insensitive' }
      }
    });
  }

  const searchDate = parseDateInput(raw, false);
  if (searchDate) {
    const from = new Date(searchDate);
    from.setHours(0, 0, 0, 0);
    const to = new Date(searchDate);
    to.setHours(23, 59, 59, 999);

    dateFields.forEach((field) => {
      searchOr.push({
        [field]: { gte: from, lte: to }
      });
    });
  }

  searchOr.push({ obligation: { period: { contains: raw, mode: 'insensitive' } } });

  if (tokens.length > 0) {
    const tokenFilters = tokens.map((term) => ({
      OR: [
        { firstName: { contains: term, mode: 'insensitive' } },
        { middleName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { secondLastName: { contains: term, mode: 'insensitive' } },
        { identification: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } }
      ]
    }));

    searchOr.push({
      athlete: {
        user: tokenFilters.length === 1 ? tokenFilters[0] : { AND: tokenFilters }
      }
    });
  }

  return searchOr;
};

const getObligationPeriodLabel = (obligation) => {
  if (!obligation) return "Pago";

  if (obligation.period) {
    return obligation.period;
  }

  switch (obligation.type) {
    case "ENROLLMENT_INITIAL":
      return "Matrícula inicial";
    case "ENROLLMENT_RENEWAL":
      return "Renovación de matrícula";
    case "MONTHLY":
      if (obligation.dueStart) {
        return new Date(obligation.dueStart).toLocaleDateString("es-CO", {
          month: "long",
          year: "numeric",
        });
      }
      return "Mensualidad";
    default:
      return obligation.type || "Pago";
  }
};

const buildPaymentWhereClause = ({
  status,
  excludeStatus,
  type,
  search,
  dateFrom,
  dateTo,
  dateFields = ['uploadedAt']
}) => {
  const whereClause = {};

  if (status) {
    whereClause.status = status;
  } else if (excludeStatus) {
    whereClause.status = { not: excludeStatus };
  }

  if (type) {
    whereClause.obligation = { type };
  }

  const searchConditions = buildPaymentSearchConditions(search, dateFields);
  if (searchConditions.length > 0) {
    whereClause.AND = [
      ...(whereClause.AND || []),
      { OR: searchConditions }
    ];
  }

  const dateRange = buildDateRange(dateFrom, dateTo);
  if (dateRange) {
    if (dateFields.length === 1) {
      whereClause[dateFields[0]] = dateRange;
    } else {
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: dateFields.map((field) => ({
            [field]: dateRange
          }))
        }
      ];
    }
  }

  return whereClause;
};

const enrichPaymentsForAdminList = async (payments, settings) => {
  return await Promise.all(payments.map(async (payment) => {
    const athlete = await prisma.athlete.findUnique({
      where: { id: payment.athlete.id },
      select: { status: true, statusAssignedAt: true }
    });

    const enrollment = await prisma.enrollment.findFirst({
      where: { athleteId: payment.athlete.id },
      orderBy: { createdAt: 'desc' },
      select: { estado: true, fechaInicio: true, fechaVencimiento: true }
    });

    const relatedPayments = payment.obligation?.payments?.length
      ? payment.obligation.payments
      : [payment];

    const lateDays = calculateEffectiveLateDays(
      payment.obligation?.dueEnd,
      relatedPayments,
      new Date(),
      payment.obligation?.metadata
    );
    const lateFee = calculateLateFee(
      lateDays,
      settings.lateFeeDailyAmount,
      athlete,
      enrollment,
      payment.obligation?.dueEnd,
      payment.obligation?.metadata
    );
    const calculatedAmount = (payment.obligation?.baseAmount || 0) + lateFee;

    return {
      ...payment,
      lateDays,
      lateFee,
      calculatedAmount,
      displayAmount: calculatedAmount,
      obligation: {
        ...payment.obligation,
        daysLate: payment.obligation?.daysLate ?? lateDays,
        lateFeeAmount: payment.obligation?.lateFeeAmount ?? lateFee,
        totalAmount: payment.obligation?.totalAmount ?? calculatedAmount,
        lateDays: payment.obligation?.lateDays ?? lateDays,
        lateFee: payment.obligation?.lateFee ?? lateFee
      }
    };
  }));
};

const matchesPaymentAmountSearch = (payment, numericSearch) => {
  if (numericSearch === null || numericSearch === undefined) return true;

  const baseAmount = Number(payment?.obligation?.baseAmount || 0);
  const lateFeeAmount = Number(payment?.obligation?.lateFeeAmount ?? payment?.lateFee ?? 0);
  const totalAmount = Number(
    payment?.obligation?.totalAmount ??
    payment?.calculatedAmount ??
    payment?.displayAmount ??
    (baseAmount + lateFeeAmount)
  );

  return [baseAmount, lateFeeAmount, totalAmount].some(
    (value) => Math.round(value) === Math.round(numericSearch)
  );
};

const sendPaymentStatusEmail = async (payment, status, rejectionReason = null) => {
  const athleteEmail = payment?.athlete?.user?.email;
  if (!athleteEmail) return;

  const athleteName = `${payment?.athlete?.user?.firstName || ""} ${payment?.athlete?.user?.lastName || ""}`.trim();
  const periodLabel = getObligationPeriodLabel(payment?.obligation);
  const statusText = status === "APPROVED" ? "aprobado" : "rechazado";
  const subject = status === "APPROVED"
    ? "Comprobante de pago aprobado"
    : "Comprobante de pago rechazado";

  const rejectionHtml = rejectionReason
    ? `<p><strong>Motivo:</strong> ${rejectionReason}</p>`
    : "";

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937;">
      <h2 style="margin-bottom: 12px;">Comprobante ${statusText}</h2>
      <p>Hola ${athleteName || "deportista"},</p>
      <p>Tu comprobante de pago para <strong>${periodLabel}</strong> fue ${statusText}.</p>
      ${rejectionHtml}
      <p style="margin-top: 16px;">Si necesitas soporte, responde a este correo.</p>
    </div>
  `;

  const text = `Hola ${athleteName || "deportista"},\nTu comprobante de pago para ${periodLabel} fue ${statusText}.\n${rejectionReason ? `Motivo: ${rejectionReason}\n` : ""}\nSi necesitas soporte, responde a este correo.`;

  await emailService.sendMailWithFallback({
    from: emailService.getDefaultFrom(),
    to: athleteEmail,
    subject,
    html,
    text,
  });
};

export const paymentBusinessRules = {
  getNextPeriod,
  isWithinLastWeekOfMonth,
  getEnrollmentCoveragePeriods,
  buildEnrollmentDatesFromReference,
  resolveLateFeeReferenceDate,
};

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

export const paymentsService = {
  async applyScholarshipEnrollmentBenefits(athleteId) {
    return await prisma.$transaction(async (tx) => {
      const athlete = await tx.athlete.findUnique({
        where: { id: athleteId },
        include: {
          enrollments: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!athlete) {
        throw new Error(`Atleta no encontrado: ${athleteId}`);
      }

      const { fechaInicio, fechaVencimiento } = buildScholarshipEnrollmentDates();

      await tx.paymentObligation.deleteMany({
        where: {
          athleteId,
          type: { in: ['ENROLLMENT_INITIAL', 'ENROLLMENT_RENEWAL', 'MONTHLY'] },
          payments: {
            none: { status: 'APPROVED' }
          }
        }
      });

      const pendingEnrollment = athlete.enrollments.find(
        (enrollment) => enrollment.estado === 'Pending_Payment'
      );

      let resolvedEnrollment = null;

      if (pendingEnrollment) {
        resolvedEnrollment = await tx.enrollment.update({
          where: { id: pendingEnrollment.id },
          data: {
            estado: 'Vigente',
            fechaInicio,
            fechaVencimiento,
            observaciones: pendingEnrollment.observaciones
              ? `${pendingEnrollment.observaciones} | Activada por beca`
              : 'Activada automáticamente por beca'
          }
        });
      } else {
        const activeEnrollment = athlete.enrollments.find(
          (enrollment) => enrollment.estado === 'Vigente'
        );

        if (activeEnrollment) {
          resolvedEnrollment = activeEnrollment;
        } else {
          resolvedEnrollment = await tx.enrollment.create({
            data: {
              athleteId,
              estado: 'Vigente',
              fechaInicio,
              fechaVencimiento,
              observaciones: 'Renovación automática por beca'
            }
          });
        }
      }

      await tx.athlete.update({
        where: { id: athleteId },
        data: {
          status: 'Active',
          currentInscriptionStatus: 'Active'
        }
      });

      return {
        athleteId,
        enrollmentId: resolvedEnrollment?.id || null,
        waivedByScholarship: true
      };
    });
  },

  async handleScholarshipRemoval(athleteId) {
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      include: {
        enrollments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!athlete) {
      throw new Error(`Atleta no encontrado: ${athleteId}`);
    }

    const now = new Date();
    const currentPeriod = getCurrentPeriod();
    const latestEnrollment = athlete.enrollments[0] || null;
    const activeEnrollment = athlete.enrollments.find(
      (enrollment) =>
        enrollment.estado === 'Vigente' &&
        enrollment.fechaInicio <= now &&
        enrollment.fechaVencimiento > now
    );

    if (latestEnrollment?.estado === 'Pending_Payment') {
      const existingInitial = await paymentsRepository.findExistingObligation(
        athleteId,
        'ENROLLMENT_INITIAL'
      );

      if (!existingInitial) {
        return await this.generateInitialEnrollmentObligation(
          athleteId,
          latestEnrollment.id
        );
      }

      return {
        athleteId,
        action: 'initial_enrollment_pending',
        obligationId: existingInitial.id
      };
    }

    if (!activeEnrollment) {
      try {
        const renewal = await this.generateEnrollmentRenewalObligation(athleteId);
        return {
          athleteId,
          action: 'renewal_generated',
          renewal
        };
      } catch (error) {
        if (String(error?.message || '').includes('Ya existe una obligación')) {
          return {
            athleteId,
            action: 'renewal_already_pending'
          };
        }
        throw error;
      }
    }

    const existingMonthly = await paymentsRepository.findExistingObligation(
      athleteId,
      'MONTHLY',
      currentPeriod
    );

    if (existingMonthly) {
      return {
        athleteId,
        action: 'monthly_already_exists',
        obligationId: existingMonthly.id
      };
    }

    const { dueStart, dueEnd } = await calculateMonthlyDueDates(
      now.getFullYear(),
      now.getMonth() + 1
    );
    const settings = await getPaymentSettings();

    const obligation = await paymentsRepository.createObligation({
      athleteId,
      type: 'MONTHLY',
      period: currentPeriod,
      baseAmount: settings.monthlyAmount,
      dueStart,
      dueEnd
    });

    return {
      athleteId,
      action: 'monthly_generated',
      obligationId: obligation.id
    };
  },

  // ============================================================================
  // GENERACIÓN AUTOMÁTICA DE OBLIGACIONES
  // ============================================================================

  /**
   * Generar mensualidades automáticamente (CRON - día 1 de cada mes)
   */
  async generateMonthlyObligations() {
    const now = new Date();
    const currentPeriod = getCurrentPeriod();
    const { dueStart, dueEnd } = await calculateMonthlyDueDates(now.getFullYear(), now.getMonth() + 1);
    const settings = await getPaymentSettings();
    const { start: periodStart, end: periodEnd } = getPeriodBounds(currentPeriod);


    return await prisma.$transaction(async (tx) => {
      // Buscar atletas activos, NO becados, con matrícula vigente Y activa
      const activeAthletes = await tx.athlete.findMany({
        where: {
          status: 'Active',
          isScholarship: false,
          enrollments: {
            some: {
              estado: 'Vigente',
              fechaVencimiento: { gt: now },
              fechaInicio: { lte: now }  // Validar que matrícula ya inició
            }
          }
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              identification: true
            }
          }
        }
      });


      const results = [];

      for (const athlete of activeAthletes) {
        try {
          // Validación adicional de integridad de matrícula
          const enrollment = await tx.enrollment.findFirst({
            where: {
              athleteId: athlete.id,
              estado: 'Vigente',
              fechaVencimiento: { gt: now },
              fechaInicio: { lte: now }
            },
            orderBy: { createdAt: 'desc' }
          });
          
          if (!enrollment) {
            results.push({
              athleteId: athlete.id,
              athleteName: `${athlete.user.firstName} ${athlete.user.lastName}`,
              status: 'skipped',
              reason: 'No tiene matrícula vigente y activa'
            });
            continue;
          }
          
          // Validar consistencia de fechas
          if (enrollment.fechaInicio > enrollment.fechaVencimiento) {
            results.push({
              athleteId: athlete.id,
              athleteName: `${athlete.user.firstName} ${athlete.user.lastName}`,
              status: 'error',
              reason: 'Matrícula con fechas inconsistentes'
            });
            continue;
          }
          
          // Verificar si ya existe obligación para este periodo
          const existing = await paymentsRepository.findExistingObligation(
            athlete.id,
            'MONTHLY',
            currentPeriod
          );

          if (existing) {
            results.push({
              athleteId: athlete.id,
              athleteName: `${athlete.user.firstName} ${athlete.user.lastName}`,
              status: 'skipped',
              reason: 'Ya existe obligación para este periodo'
            });
            continue;
          }

          // Si existe un pago de matrícula (inicial o renovación) enviado en este periodo,
          // no se debe generar mensualidad para el mismo mes.
          const enrollmentPaymentInPeriod = await tx.payment.findFirst({
            where: {
              athleteId: athlete.id,
              status: { in: ['PENDING', 'APPROVED'] },
              uploadedAt: { gte: periodStart, lt: periodEnd },
              obligation: { type: { in: ['ENROLLMENT_INITIAL', 'ENROLLMENT_RENEWAL'] } }
            },
            select: { id: true }
          });

          if (enrollmentPaymentInPeriod) {
            results.push({
              athleteId: athlete.id,
              athleteName: `${athlete.user.firstName} ${athlete.user.lastName}`,
              status: 'skipped',
              reason: 'Matrícula cubre este periodo'
            });
            continue;
          }

          // Crear nueva obligación mensual con configuración dinámica
          await tx.paymentObligation.create({
            data: {
              athleteId: athlete.id,
              type: 'MONTHLY',
              period: currentPeriod,
              baseAmount: settings.monthlyAmount, // ✅ Variable - se congela
              dueStart,
              dueEnd
            }
          });

          results.push({
            athleteId: athlete.id,
            athleteName: `${athlete.user.firstName} ${athlete.user.lastName}`,
            status: 'created',
            period: currentPeriod,
            amount: settings.monthlyAmount // ✅ Dinámico
          });

        } catch (error) {
          results.push({
            athleteId: athlete.id,
            status: 'error',
            error: error.message
          });
        }
      }

      const created = results.filter(r => r.status === 'created').length;
      const skipped = results.filter(r => r.status === 'skipped').length;
      const errors = results.filter(r => r.status === 'error').length;


      return {
        period: currentPeriod,
        created,
        skipped,
        errors,
        details: results
      };
    });
  },

  /**
   * Generar obligación de renovación de matrícula
   */
  async generateEnrollmentRenewalObligation(athleteId) {
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      select: { id: true, isScholarship: true }
    });

    if (athlete?.isScholarship === true) {
      return await this.applyScholarshipEnrollmentBenefits(athleteId);
    }

    const settings = await getPaymentSettings();
    const now = new Date();
    const dueEnd = new Date(now.getTime() + (BUSINESS_CONSTANTS.GRACE_DAYS * 24 * 60 * 60 * 1000));

    // Verificar si ya existe obligación de renovación pendiente
    const existing = await paymentsRepository.findExistingObligation(
      athleteId,
      'ENROLLMENT_RENEWAL'
    );

    if (existing) {
      throw new Error('Ya existe una obligación de renovación de matrícula pendiente');
    }

    return await paymentsRepository.createObligation({
      athleteId,
      type: 'ENROLLMENT_RENEWAL',
      period: null,
      baseAmount: settings.enrollmentAmount,
      dueStart: now,
      dueEnd
    });
  },

  /**
   * Generar obligación de pago inicial de matrícula (nueva matrícula)
   * Se llama cuando la admin crea la matrícula. La matrícula empieza en Pending_Payment.
   */
  async generateInitialEnrollmentObligation(athleteId, enrollmentId) {
    const settings = await getPaymentSettings();
    const now = new Date();
    const dueEnd = new Date(now.getTime() + (BUSINESS_CONSTANTS.GRACE_DAYS * 24 * 60 * 60 * 1000));

    // Verificar que no exista ya una obligación inicial pendiente
    const existing = await paymentsRepository.findExistingObligation(
      athleteId,
      'ENROLLMENT_INITIAL'
    );

    if (existing) {
      throw new Error('Ya existe una obligación de pago inicial de matrícula pendiente');
    }

    return await paymentsRepository.createObligation({
      athleteId,
      type: 'ENROLLMENT_INITIAL',
      period: null,
      baseAmount: settings.enrollmentAmount,
      dueStart: now,
      dueEnd,
      metadata: enrollmentId ? { enrollmentId } : undefined
    });
  },

  // ============================================================================
  // CONSULTA DE ESTADO FINANCIERO
  // ============================================================================

  _buildMonthlyDetails(obligations, athlete, enrollment, settings) {
    let totalMonthlyDebt = 0;
    let totalLateFee = 0;
    let maxDaysLate = 0;
    const details = [];

    for (const obligation of obligations) {
      if (isMonthlyExemptByEnrollment(obligation)) {
        continue;
      }
      const daysLate = calculateEffectiveLateDays(
        obligation.dueEnd,
        obligation.payments,
        new Date(),
        obligation.metadata
      );
      const lateFee = calculateLateFee(
        daysLate,
        settings.lateFeeDailyAmount,
        athlete,
        enrollment,
        obligation.dueEnd,
        obligation.metadata
      );
      const latestPayment = obligation.payments
        ?.filter(p => p?.uploadedAt)
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];

      totalMonthlyDebt += obligation.baseAmount;
      totalLateFee += lateFee;
      maxDaysLate = Math.max(maxDaysLate, daysLate);

      details.push({
        id: obligation.id,
        period: obligation.period,
        baseAmount: obligation.baseAmount,
        daysLate,
        lateFee,
        totalToPay: obligation.baseAmount + lateFee,
        paymentStatus: this.getLatestPaymentStatus(obligation.payments),
        dueStart: obligation.dueStart,
        dueEnd: obligation.dueEnd,
        uploadedAt: latestPayment?.uploadedAt || null,
        reviewedAt: latestPayment?.reviewedAt || null,
        receiptUrl: latestPayment?.receiptUrl || null,
        receiptName: latestPayment?.receiptName || null,
        latestPaymentId: latestPayment?.id || null,
        rejectionReason: latestPayment?.rejectionReason || null
      });
    }

    return {
      details,
      totals: {
        totalMonthlyDebt,
        totalLateFee,
        maxDaysLate
      }
    };
  },

  /**
   * Obtener estado financiero completo de un atleta (MEJORADO)
   * Incluye TODAS las obligaciones pendientes, no solo la actual
   */
  async getAthleteFinancialStatus(athleteId) {
    const now = new Date();
    const currentMonth = getCurrentPeriod();
    const settings = await getPaymentSettings();

    // ✅ Obtener datos del atleta y matrícula para validar estado
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      select: { status: true, statusAssignedAt: true }
    });

    let enrollment = await prisma.enrollment.findFirst({
      where: { athleteId },
      orderBy: { createdAt: 'desc' },
      select: { estado: true, fechaInicio: true, fechaVencimiento: true }
    });

    // Buscar TODAS las obligaciones sin pago aprobado
    const pendingObligations = await paymentsRepository.getAllPendingObligations(athleteId);
    
    // Separar por tipo
    const monthlyObligations = pendingObligations.filter(
      o => o.type === 'MONTHLY' && !isMonthlyExemptByEnrollment(o)
    );
    const enrollmentObligation = pendingObligations.find(
      o => o.type === 'ENROLLMENT_RENEWAL' || o.type === 'ENROLLMENT_INITIAL'
    );
    const latestEnrollmentPayment = enrollmentObligation?.payments
      ?.filter(p => p?.uploadedAt)
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
    
    const monthlyCalc = this._buildMonthlyDetails(monthlyObligations, athlete, enrollment, settings);
    const monthlyDetails = monthlyCalc.details;
    const { totalMonthlyDebt, totalLateFee, maxDaysLate } = monthlyCalc.totals;

    // Buscar mensualidad actual específicamente
    const currentMonthObligation = monthlyDetails.find(m => m.period === currentMonth);

    // ✅ Reparación automática: matrícula inicial aprobada pero sin fechas
    if (
      enrollment &&
      enrollment.estado === 'Vigente' &&
      (!enrollment.fechaInicio || !enrollment.fechaVencimiento)
    ) {
      const approvedInitialPayment = await prisma.payment.findFirst({
        where: {
          athleteId,
          status: 'APPROVED',
          obligation: { type: 'ENROLLMENT_INITIAL' }
        },
        orderBy: { reviewedAt: 'desc' }
      });

      if (approvedInitialPayment) {
        const now = new Date();
        const startDate = approvedInitialPayment.reviewedAt || approvedInitialPayment.uploadedAt || now;
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);

        const latestEnrollment = await prisma.enrollment.findFirst({
          where: { athleteId },
          orderBy: { createdAt: 'desc' }
        });

        if (latestEnrollment) {
          await prisma.enrollment.update({
            where: { id: latestEnrollment.id },
            data: {
              fechaInicio: latestEnrollment.fechaInicio || startDate,
              fechaVencimiento: latestEnrollment.fechaVencimiento || endDate,
              estado: 'Vigente'
            }
          });
        }

        await prisma.athlete.update({
          where: { id: athleteId },
          data: { status: 'Active', currentInscriptionStatus: 'Active' }
        });

        enrollment = await prisma.enrollment.findFirst({
          where: { athleteId },
          orderBy: { createdAt: 'desc' },
          select: { estado: true, fechaInicio: true, fechaVencimiento: true }
        });
      }
    }

    return {
      // Mensualidad actual (para compatibilidad)
      currentMonth: currentMonthObligation || null,
      
      // NUEVO: Todas las mensualidades pendientes
      allMonthlyDebts: monthlyDetails,
      
      // NUEVO: Resumen total
      totalDebt: {
        monthlyAmount: totalMonthlyDebt,
        lateFeeAmount: totalLateFee,
        totalAmount: totalMonthlyDebt + totalLateFee,
        maxDaysLate,
        obligationsCount: monthlyObligations.length
      },
      
      // Estado de matrícula (inicial o renovación)
      enrollment: enrollmentObligation ? {
        needsRenewal: enrollmentObligation.type === 'ENROLLMENT_RENEWAL', // ✅ Solo true para renovaciones
        isInitial: enrollmentObligation.type === 'ENROLLMENT_INITIAL',    // ✅ Nuevo campo
        type: enrollmentObligation.type,                                  // ✅ Tipo explícito
        amount: enrollmentObligation.baseAmount,
        obligationId: enrollmentObligation.id,
        dueDate: enrollmentObligation.dueEnd,
        paymentStatus: this.getLatestPaymentStatus(enrollmentObligation.payments),
        uploadedAt: latestEnrollmentPayment?.uploadedAt || null,
        reviewedAt: latestEnrollmentPayment?.reviewedAt || null,
        receiptUrl: latestEnrollmentPayment?.receiptUrl || null,
        receiptName: latestEnrollmentPayment?.receiptName || null,
        rejectionReason: latestEnrollmentPayment?.rejectionReason || null,
        // NUEVO: Estado actual de la matrícula
        estado: enrollment?.estado || null,
        fechaInicio: enrollment?.fechaInicio || null,
        fechaVencimiento: enrollment?.fechaVencimiento || null
      } : {
        needsRenewal: false,
        isInitial: false,
        // NUEVO: Estado actual de la matrícula (incluso si no hay obligaciones)
        estado: enrollment?.estado || null,
        fechaInicio: enrollment?.fechaInicio || null,
        fechaVencimiento: enrollment?.fechaVencimiento || null
      }
    };
  },

  /**
   * Obtener el estado del último pago de una obligación
   */
  getLatestPaymentStatus(payments) {
    if (!payments || payments.length === 0) return null;
    
    // Buscar pago aprobado
    const approved = payments.find(p => p.status === 'APPROVED');
    if (approved) return 'APPROVED';
    
    // Buscar pago pendiente más reciente
    const pending = payments
      .filter(p => p.status === 'PENDING')
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
    if (pending) return 'PENDING';
    
    // Buscar pago rechazado más reciente
    const rejected = payments
      .filter(p => p.status === 'REJECTED')
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
    if (rejected) return 'REJECTED';
    
    return null;
  },
  /**
   * Obtener historial completo de pagos de un atleta
   */
  async getAthletePaymentHistory(athleteId, filters = {}) {
    try {
      const result = await paymentsRepository.getAthletePaymentHistory(athleteId, filters);
      const settings = await getPaymentSettings();

      // ✅ Obtener datos del atleta para validar estado (mora congelada)
      const athlete = await prisma.athlete.findUnique({
        where: { id: athleteId },
        select: { status: true, statusAssignedAt: true }
      });

      const enrollment = await prisma.enrollment.findFirst({
        where: { athleteId },
        orderBy: { createdAt: 'desc' },
        select: { estado: true, fechaInicio: true, fechaVencimiento: true }
      });

      // Enriquecer cada pago con información calculada
      const enrichedPayments = result.payments.map(payment => {
        const lateDays = calculateEffectiveLateDays(
          payment.obligation.dueEnd,
          [payment],
          new Date(),
          payment.obligation.metadata
        );
        // ✅ Pasar atleta, enrollment y dueEnd para mora congelada
        const lateFee = calculateLateFee(
          lateDays,
          settings.lateFeeDailyAmount,
          athlete,
          enrollment,
          payment.obligation.dueEnd,
          payment.obligation.metadata
        );
        const totalAmount = payment.obligation.baseAmount + lateFee;

        return {
          ...payment,
          // Información calculada
          lateDays,
          lateFee,
          totalAmount,
          // Información de la obligación expandida
          obligation: {
            ...payment.obligation,
            lateDays,
            lateFee,
            totalAmount
          }
        };
      });

      return {
        payments: enrichedPayments,
        pagination: result.pagination
      };
    } catch (error) {
throw new Error('Error al obtener historial de pagos del atleta');
    }
  },

  /**
   * Resumen de mensualidades pendientes por atleta (para listado admin)
   */
  async getMonthlySummaryForAthletes(athleteIds = []) {
    const ids = (athleteIds || [])
      .map((id) => parseInt(id))
      .filter((id) => !Number.isNaN(id));

    if (ids.length === 0) {
      return {};
    }

    const settings = await getPaymentSettings();

    const [athletes, enrollments, obligations] = await Promise.all([
      prisma.athlete.findMany({
        where: { id: { in: ids } },
        select: { id: true, status: true, statusAssignedAt: true }
      }),
      prisma.enrollment.findMany({
        where: { athleteId: { in: ids } },
        orderBy: { createdAt: 'desc' },
        distinct: ['athleteId'],
        select: { athleteId: true, estado: true, fechaInicio: true, fechaVencimiento: true }
      }),
      paymentsRepository.getPendingMonthlyObligationsForAthletes(ids)
    ]);

    const athleteMap = new Map(athletes.map((a) => [a.id, a]));
    const enrollmentMap = new Map(enrollments.map((e) => [e.athleteId, e]));

    const summaryMap = {};
    for (const id of ids) {
      summaryMap[id] = {
        baseAmount: 0,
        lateFeeAmount: 0,
        totalAmount: 0,
        maxDaysLate: 0,
        obligationsCount: 0
      };
    }

    const obligationsByAthlete = new Map();
    for (const obligation of obligations) {
      if (isMonthlyExemptByEnrollment(obligation)) {
        continue;
      }
      if (!obligationsByAthlete.has(obligation.athleteId)) {
        obligationsByAthlete.set(obligation.athleteId, []);
      }
      obligationsByAthlete.get(obligation.athleteId).push(obligation);
    }

    for (const [athleteId, athleteObligations] of obligationsByAthlete.entries()) {
      const athlete = athleteMap.get(athleteId) || null;
      const enrollment = enrollmentMap.get(athleteId) || null;
      const monthlyCalc = this._buildMonthlyDetails(athleteObligations, athlete, enrollment, settings);

      const entry = summaryMap[athleteId];
      if (!entry) continue;
      entry.baseAmount = monthlyCalc.totals.totalMonthlyDebt;
      entry.lateFeeAmount = monthlyCalc.totals.totalLateFee;
      entry.totalAmount = monthlyCalc.totals.totalMonthlyDebt + monthlyCalc.totals.totalLateFee;
      entry.maxDaysLate = monthlyCalc.totals.maxDaysLate;
      entry.obligationsCount = athleteObligations.length;
    }

    return summaryMap;
  },

  /**
   * Historial completo de mensualidades de un atleta (para modal admin)
   */
  async getAthleteMonthlyHistory(athleteId) {
    const settings = await getPaymentSettings();

    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      select: { id: true, status: true, statusAssignedAt: true }
    });

    const enrollment = await prisma.enrollment.findFirst({
      where: { athleteId },
      orderBy: { createdAt: 'desc' },
      select: { estado: true, fechaInicio: true, fechaVencimiento: true }
    });

    const obligations = await prisma.paymentObligation.findMany({
      where: { athleteId, type: 'MONTHLY' },
      include: {
        payments: { orderBy: { uploadedAt: 'desc' } }
      },
      orderBy: { dueStart: 'desc' }
    });

    const filteredObligations = obligations.filter(o => !isMonthlyExemptByEnrollment(o));
    const monthlyCalc = this._buildMonthlyDetails(filteredObligations, athlete, enrollment, settings);
    const history = monthlyCalc.details.map((item) => ({
      id: item.id,
      period: item.period,
      dueStart: item.dueStart,
      dueEnd: item.dueEnd,
      baseAmount: item.baseAmount,
      daysLate: item.daysLate,
      lateFee: item.lateFee,
      totalAmount: item.totalToPay,
      paymentStatus: item.paymentStatus,
      uploadedAt: item.uploadedAt,
      reviewedAt: item.reviewedAt,
      receiptUrl: item.receiptUrl,
      receiptName: item.receiptName,
      rejectionReason: item.rejectionReason
    }));

    return { history };
  },


  // ============================================================================
  // GESTIÓN DE COMPROBANTES
  // ============================================================================

  /**
   * Subir comprobante de pago (MEJORADO - Evita duplicados PENDING)
   */
  async uploadPaymentReceipt(obligationId, athleteId, receiptData) {
    return await prisma.$transaction(async (tx) => {
      // Verificar que la obligación existe y pertenece al atleta
      const obligation = await tx.paymentObligation.findFirst({
        where: {
          id: obligationId,
          athleteId
        }
      });

      if (!obligation) {
        throw new Error('Obligación de pago no encontrada');
      }

      // Verificar si ya hay un pago aprobado
      const approvedPayment = await tx.payment.findFirst({
        where: {
          obligationId,
          status: 'APPROVED'
        }
      });

      if (approvedPayment) {
        throw new Error('Esta obligación ya tiene un pago aprobado');
      }

      // NUEVO: Verificar si ya hay un pago PENDING
      const pendingPayment = await tx.payment.findFirst({
        where: {
          obligationId,
          status: 'PENDING'
        }
      });

      if (pendingPayment) {
        throw new Error('Ya tienes un comprobante pendiente de revisión. Espera la respuesta del administrador antes de subir otro.');
      }

      const payment = await tx.payment.create({
        data: {
          obligationId,
          athleteId,
          receiptUrl: receiptData.url,
          receiptName: receiptData.originalName,
          status: 'PENDING'
        },
        include: { obligation: true }
      });

      return payment;
    });
  },

  /**
   * Obtener pago por ID
   */
  async getPaymentById(paymentId) {
    return await paymentsRepository.getPaymentById(paymentId);
  },

  /**
   * Aprobar pago (MEJORADO - Con transacción y control de concurrencia)
   */
  async approvePayment(paymentId, reviewedBy) {
    return await prisma.$transaction(async (tx) => {
      // Verificar estado actual del pago (control de concurrencia)
      const currentPayment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { obligation: true }
      });

      if (!currentPayment) {
        throw new Error('Pago no encontrado');
      }

      if (currentPayment.status !== 'PENDING') {
        throw new Error(`El pago ya fue ${currentPayment.status.toLowerCase()}. No se puede aprobar.`);
      }

      const reviewedByValue = reviewedBy != null ? parseInt(reviewedBy, 10) : null;
      const payment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: Number.isNaN(reviewedByValue) ? null : reviewedByValue,
          rejectionReason: null
        },
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
        }
      });

      // Manejar lógica post-aprobación según tipo de obligación
      if (payment.obligation.type === 'ENROLLMENT_INITIAL') {
        // Pago inicial: activar la matrícula que estaba en Pending_Payment
        await this._processInitialEnrollmentPayment(tx, payment);
      } else if (payment.obligation.type === 'ENROLLMENT_RENEWAL') {
        // Renovación: crear nueva matrícula por 1 año
        await this._processEnrollmentRenewal(tx, payment);
      }

      // Cubrir mensualidad del mes del envío del comprobante (si aplica)
      if (isEnrollmentPaymentType(payment.obligation.type)) {
        await this._applyEnrollmentMonthlyCoverage(tx, payment);
      }

      // Notificación por email (no bloqueante)
      try {
        await sendPaymentStatusEmail(payment, 'APPROVED');
      } catch {
        // Ignorar fallos de email para no bloquear la aprobación
      }

      return payment;
    });
  },

  /**
   * Rechazar pago (MEJORADO - Con transacción y control de concurrencia)
   */
  async rejectPayment(paymentId, reviewedBy, rejectionReason) {
    return await prisma.$transaction(async (tx) => {
      // Verificar estado actual del pago (control de concurrencia)
      const currentPayment = await tx.payment.findUnique({
        where: { id: paymentId }
      });

      if (!currentPayment) {
        throw new Error('Pago no encontrado');
      }

      if (currentPayment.status !== 'PENDING') {
        throw new Error(`El pago ya fue ${currentPayment.status.toLowerCase()}. No se puede rechazar.`);
      }

      const reviewedByValue = reviewedBy != null ? parseInt(reviewedBy, 10) : null;
      const payment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'REJECTED',
          rejectionReason: rejectionReason ?? null,
          reviewedAt: new Date(),
          reviewedBy: Number.isNaN(reviewedByValue) ? null : reviewedByValue
        },
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
        }
      });

      // Notificación por email (no bloqueante)
      try {
        await sendPaymentStatusEmail(payment, 'REJECTED', rejectionReason);
      } catch {
        // Ignorar fallos de email para no bloquear el rechazo
      }

      return payment;
    });
  },

  // ============================================================================
  // VALIDACIÓN DE ACCESO (MIDDLEWARE)
  // ============================================================================

  /**
   * Verificar si un atleta está bloqueado por pagos
   */
  async checkAthleteAccessRestrictions(athleteId) {
    const overdueObligationsRaw = await paymentsRepository.getOverdueObligations(athleteId);
    const overdueObligations = overdueObligationsRaw.filter(
      (o) => !(o.type === 'MONTHLY' && isMonthlyExemptByEnrollment(o))
    );

    // 1. Matrícula inicial pendiente (bloquea siempre)
    const initialObligation = await prisma.paymentObligation.findFirst({
      where: {
        athleteId,
        type: 'ENROLLMENT_INITIAL',
        payments: { none: { status: 'APPROVED' } }
      }
    });

    if (initialObligation) {
      return {
        restricted: true,
        reason: 'ENROLLMENT_INITIAL_PENDING',
        message: 'Tu matrícula está pendiente de pago inicial',
        obligation: initialObligation
      };
    }

    // 2. Matrícula vencida o no vigente
    const enrollment = await prisma.enrollment.findFirst({
      where: { athleteId, estado: 'Vigente' },
      orderBy: { createdAt: 'desc' }
    });

    if (!enrollment) {
      return {
        restricted: true,
        reason: 'MATRICULA_VENCIDA',
        message: 'Tu matrícula ha vencido. Solo puedes acceder a Gestión de Pagos.'
      };
    }

    // 3. Renovación pendiente (si existe obligación sin pago aprobado)
    const renewalObligation = await prisma.paymentObligation.findFirst({
      where: {
        athleteId,
        type: 'ENROLLMENT_RENEWAL',
        payments: { none: { status: 'APPROVED' } }
      }
    });

    if (renewalObligation) {
      return {
        restricted: true,
        reason: 'ENROLLMENT_PENDING',
        message: 'Tu matrícula anual está pendiente de renovación',
        obligation: renewalObligation
      };
    }

    // Verificar bloqueo por mensualidad (usar la mora MÁS ALTA entre todas las mensualidades vencidas)
    const monthlyOverdueList = overdueObligations.filter(o => o.type === 'MONTHLY');
    if (monthlyOverdueList.length > 0) {
      let maxLateDays = 0;
      for (const obligation of monthlyOverdueList) {
        const lateDays = calculateEffectiveLateDays(
          obligation.dueEnd,
          obligation.payments,
          new Date(),
          obligation.metadata
        );
        if (lateDays > maxLateDays) {
          maxLateDays = lateDays;
        }
      }

      if (maxLateDays >= BUSINESS_CONSTANTS.MAX_LATE_DAYS_MONTHLY) { // ✅ Constante fija
        return {
          restricted: true,
          reason: 'MONTHLY_OVERDUE',
          message: `Tu cuenta está bloqueada por mora en mensualidad. Días de retraso: ${maxLateDays}`,
          lateDays: maxLateDays
        };
      }
    }

    return { restricted: false };
  },

  // ============================================================================
  // GESTIÓN DE PAGOS (ADMIN)
  // ============================================================================

  /**
   * Obtener pagos pendientes de aprobación
   * ✅ CORREGIDO: Ahora calcula mora con las mismas validaciones que getMonthlyPaymentsManagement
   */
  async getPendingPayments(filters = {}) {
    try {
      const { page = 1, limit = 20, type, search, dateFrom, dateTo } = filters;
      const offset = (page - 1) * limit;
      const settings = await getPaymentSettings();
      const numericSearch = parseSearchNumericValue(search);
      const whereClause = buildPaymentWhereClause({
        status: 'PENDING',
        type,
        search,
        dateFrom,
        dateTo,
        dateFields: ['uploadedAt', 'createdAt', 'updatedAt', 'reviewedAt']
      });

      const paymentQuery = {
        where: whereClause,
        include: {
          athlete: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  identification: true,
                  email: true
                }
              }
            }
          },
          obligation: {
            select: {
              id: true,
              type: true,
              period: true,
              baseAmount: true,
              dueStart: true,
              dueEnd: true,
              athleteId: true,
              metadata: true,
              payments: {
                select: {
                  status: true,
                  uploadedAt: true,
                  reviewedAt: true
                }
              }
            }
          }
        },
        orderBy: {
          uploadedAt: 'desc'
        }
      };

      const payments = await prisma.payment.findMany(
        numericSearch !== null
          ? paymentQuery
          : { ...paymentQuery, skip: offset, take: limit }
      );

      const total = numericSearch !== null
        ? payments.length
        : await prisma.payment.count({ where: whereClause });

      const paymentsWithDetails = await enrichPaymentsForAdminList(payments, settings);
      const amountFilteredPayments = numericSearch !== null
        ? paymentsWithDetails.filter((payment) => matchesPaymentAmountSearch(payment, numericSearch))
        : paymentsWithDetails;
      const paginatedPayments = numericSearch !== null
        ? amountFilteredPayments.slice(offset, offset + limit)
        : amountFilteredPayments;
      const resolvedTotal = numericSearch !== null ? amountFilteredPayments.length : total;

      return {
        payments: paginatedPayments,
        pagination: {
          page,
          limit,
          total: resolvedTotal,
          totalPages: Math.ceil(resolvedTotal / limit)
        }
      };
    } catch (error) {
throw new Error('Error al obtener pagos pendientes');
    }
  },

  /**
   * Obtener todos los pagos con filtros (MEJORADO - INCLUYE MORA)
   */
  async getAllPayments(filters = {}) {
    try {
      const { page = 1, limit = 20, status, type, dateFrom, dateTo, excludeStatus, search } = filters;
      const offset = (page - 1) * limit;
      const settings = await getPaymentSettings();
      const numericSearch = parseSearchNumericValue(search);
      const whereClause = buildPaymentWhereClause({
        status,
        excludeStatus,
        type,
        search,
        dateFrom,
        dateTo,
        dateFields: ['reviewedAt', 'updatedAt', 'uploadedAt', 'createdAt']
      });

      const paymentQuery = {
        where: whereClause,
        include: {
          athlete: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  identification: true,
                  email: true
                }
              }
            }
          },
          obligation: {
            select: {
              id: true,
              type: true,
              period: true,
              baseAmount: true,
              dueStart: true,
              dueEnd: true,
              metadata: true,
              payments: {
                select: {
                  status: true,
                  uploadedAt: true,
                  reviewedAt: true
                }
              }
            }
          }
        },
        orderBy: {
          uploadedAt: 'desc'
        }
      };

      const payments = await prisma.payment.findMany(
        numericSearch !== null
          ? paymentQuery
          : { ...paymentQuery, skip: offset, take: limit }
      );

      const total = numericSearch !== null
        ? payments.length
        : await prisma.payment.count({ where: whereClause });

      const paymentsWithCalculatedAmounts = await enrichPaymentsForAdminList(payments, settings);
      const amountFilteredPayments = numericSearch !== null
        ? paymentsWithCalculatedAmounts.filter((payment) => matchesPaymentAmountSearch(payment, numericSearch))
        : paymentsWithCalculatedAmounts;
      const paginatedPayments = numericSearch !== null
        ? amountFilteredPayments.slice(offset, offset + limit)
        : amountFilteredPayments;
      const resolvedTotal = numericSearch !== null ? amountFilteredPayments.length : total;

      return {
        payments: paginatedPayments,
        pagination: {
          page,
          limit,
          total: resolvedTotal,
          totalPages: Math.ceil(resolvedTotal / limit)
        }
      };
    } catch (error) {
throw new Error('Error al obtener pagos');
    }
  },

  /**
   * Aprobar un pago
   */
  async _deprecatedApprovePayment(paymentId, reviewedBy) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: parseInt(paymentId) },
        include: {
          obligation: true,
          athlete: true
        }
      });

      if (!payment) {
        throw new Error('Pago no encontrado');
      }

      if (payment.status !== 'PENDING') {
        throw new Error('Solo se pueden aprobar pagos pendientes');
      }

      // Actualizar el pago
      const updatedPayment = await prisma.payment.update({
        where: { id: parseInt(paymentId) },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: reviewedBy
        }
      });

      // Si es un pago de matrícula inicial o renovación, activar la matrícula
      if (payment.obligation.type === 'ENROLLMENT_INITIAL' || payment.obligation.type === 'ENROLLMENT_RENEWAL') {
        await this._activateEnrollmentAfterPayment(payment.athleteId, payment.obligation.type);
      }

      return updatedPayment;
    } catch (error) {
throw error;
    }
  },

  /**
   * Rechazar un pago
   */
  async _deprecatedRejectPayment(paymentId, reviewedBy, rejectionReason) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: parseInt(paymentId) }
      });

      if (!payment) {
        throw new Error('Pago no encontrado');
      }

      if (payment.status !== 'PENDING') {
        throw new Error('Solo se pueden rechazar pagos pendientes');
      }

      const updatedPayment = await prisma.payment.update({
        where: { id: parseInt(paymentId) },
        data: {
          status: 'REJECTED',
          rejectionReason: rejectionReason ?? null,
          reviewedAt: new Date(),
          reviewedBy: reviewedBy != null ? parseInt(reviewedBy) : null
        }
      });

      return updatedPayment;
    } catch (error) {
throw error;
    }
  },

  /**
   * Activar matrícula después de aprobar pago
   */
  async _deprecatedActivateEnrollmentAfterPayment(athleteId, paymentType) {
    try {
      if (paymentType === 'ENROLLMENT_INITIAL') {
        // Activar matrícula inicial
        const now = new Date();
        const expirationDate = new Date(now);
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);

        // Preferir la matrícula pendiente; si no existe, usar la más reciente sin fechas
        let targetEnrollment = await prisma.enrollment.findFirst({
          where: { athleteId, estado: 'Pending_Payment' },
          orderBy: { createdAt: 'desc' }
        });

        if (!targetEnrollment) {
          targetEnrollment = await prisma.enrollment.findFirst({
            where: {
              athleteId,
              estado: 'Vigente',
              OR: [
                { fechaInicio: null },
                { fechaVencimiento: null }
              ]
            },
            orderBy: { createdAt: 'desc' }
          });
        }

        if (targetEnrollment) {
          await prisma.enrollment.update({
            where: { id: targetEnrollment.id },
            data: {
              estado: 'Vigente',
              // Al aprobar el pago inicial, la vigencia real inicia en este momento.
              fechaInicio: now,
              fechaVencimiento: expirationDate,
              observaciones: 'Activada automáticamente al aprobarse el pago inicial de matrícula'
            }
          });
        }

        // Asegurar estado del atleta y su inscripción actual
        await prisma.athlete.update({
          where: { id: athleteId },
          data: {
            status: 'Active',
            currentInscriptionStatus: 'Active'
          }
        });
      } else if (paymentType === 'ENROLLMENT_RENEWAL') {
        // Crear nueva matrícula para renovación
        const settings = await getPaymentSettings();
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);

        await prisma.enrollment.create({
          data: {
            athleteId: athleteId,
            fechaInicio: startDate,
            fechaVencimiento: endDate,
            estado: 'Vigente'
          }
        });
      }
    } catch (error) {
throw error;
    }
  },

  // ============================================================================
  // GESTIÓN DE CONFIGURACIÓN (NUEVOS MÉTODOS)
  // ============================================================================

  /**
   * Obtener configuración actual de pagos
   */
  async getPaymentSettings() {
    return await getPaymentSettings();
  },

  /**
   * Actualizar configuración de pagos (solo admin)
   */
  async updatePaymentSettings(newSettings) {
    const updated = await paymentSettingsRepository.updateSettings(newSettings);
    invalidateSettingsCache(); // ✅ Invalidar cache
    return updated;
  },

  // ============================================================================
  // GESTIÓN MENSUAL ADMINISTRATIVA (NUEVO - NO AFECTA FUNCIONALIDAD EXISTENTE)
  // ============================================================================

  /**
   * Obtener gestión completa de pagos mensuales para administradores
   * Incluye cálculo de mora, estados y filtros avanzados
   */
  async getMonthlyPaymentsManagement(filters = {}) {
    try {
      const { page = 1, limit = 20, status, search, dateFrom, dateTo } = filters;
      const offset = (page - 1) * limit;
      const now = new Date();
      const settings = await getPaymentSettings();


      // Construir filtros dinámicos
      const whereClause = {
        type: 'MONTHLY'
      };

      // Filtro por estado de pago
      if (status === 'PAID') {
        whereClause.payments = {
          some: { status: 'APPROVED' }
        };
      } else if (status === 'PENDING') {
        whereClause.payments = {
          some: { status: 'PENDING' }
        };
      } else if (status === 'OVERDUE') {
        whereClause.dueEnd = { lt: now };
        whereClause.payments = {
          none: { status: 'APPROVED' }
        };
      } else if (status === 'EXCESSIVE_OVERDUE') {
        const fifteenDaysAgo = new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000));
        whereClause.dueEnd = { lt: fifteenDaysAgo };
        whereClause.payments = {
          none: { status: 'APPROVED' }
        };
      }

      // Filtro por búsqueda (nombre o identificación)
      if (search) {
        whereClause.athlete = {
          user: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { identification: { contains: search, mode: 'insensitive' } }
            ]
          }
        };
      }

      // Filtro por fecha
      if (dateFrom || dateTo) {
        whereClause.dueEnd = {};
        const from = parseDateInput(dateFrom, false);
        const to = parseDateInput(dateTo, true);
        if (from) whereClause.dueEnd.gte = from;
        if (to) whereClause.dueEnd.lte = to;
      }

      // Ejecutar consultas en paralelo para mejor rendimiento
      const [obligations, total] = await Promise.all([
        prisma.paymentObligation.findMany({
          where: whereClause,
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
            },
            payments: {
              orderBy: { uploadedAt: 'desc' },
              select: {
                id: true,
                status: true,
                uploadedAt: true,
                reviewedAt: true,
                receiptUrl: true,
                receiptName: true
              }
            }
          },
          orderBy: [
            { dueEnd: 'desc' },
            { createdAt: 'desc' }
          ],
          skip: offset,
          take: limit
        }),
        prisma.paymentObligation.count({ where: whereClause })
      ]);

      const filteredObligations = obligations.filter(o => !isMonthlyExemptByEnrollment(o));

      // Procesar cada obligación con cálculo de mora
      const obligationsWithDetails = await Promise.all(filteredObligations.map(async (obligation) => {
        const lateDays = calculateEffectiveLateDays(
          obligation.dueEnd,
          obligation.payments,
          new Date(),
          obligation.metadata
        );
        
        // ✅ OBTENER MATRÍCULA ACTUAL PARA VALIDAR ESTADO
        const enrollment = await prisma.enrollment.findFirst({
          where: { athleteId: obligation.athleteId },
          orderBy: { createdAt: 'desc' },
          select: { estado: true, fechaInicio: true, fechaVencimiento: true }
        });
        
        // ✅ CALCULAR MORA CON VALIDACIONES Y MORA CONGELADA PARA INACTIVOS
        const lateFee = calculateLateFee(
          lateDays,
          settings.lateFeeDailyAmount,
          obligation.athlete,
          enrollment,
          obligation.dueEnd,
          obligation.metadata
        );
        const totalAmount = obligation.baseAmount + lateFee;
        
        // Determinar estado de mora
        let moraStatus = 'AL_DIA';
        let moraText = 'Al día';
        let moraColor = 'success';
        
        if (lateDays > 15) {
          moraStatus = 'MORA_EXCESIVA';
          moraText = `${lateDays} días de mora (EXCESIVA)`;
          moraColor = 'danger';
        } else if (lateDays > 0) {
          moraStatus = 'EN_MORA';
          moraText = `${lateDays} días de mora`;
          moraColor = 'warning';
        } else if (lateDays > -5) {
          const diasRestantes = Math.abs(lateDays);
          moraStatus = 'PERIODO_GRACIA';
          moraText = `${diasRestantes} días restantes`;
          moraColor = 'info';
        }

        // Determinar estado de pago
        const latestPayment = obligation.payments[0];
        let paymentStatus = 'SIN_PAGO';
        let paymentText = 'Sin comprobante';
        
        if (latestPayment) {
          switch (latestPayment.status) {
            case 'APPROVED':
              paymentStatus = 'PAGADO';
              paymentText = 'Pagado';
              break;
            case 'PENDING':
              paymentStatus = 'PENDIENTE_REVISION';
              paymentText = 'Pendiente de revisión';
              break;
            case 'REJECTED':
              paymentStatus = 'RECHAZADO';
              paymentText = 'Rechazado';
              break;
          }
        }

        return {
          id: obligation.id,
          athleteId: obligation.athleteId,
          athleteName: `${obligation.athlete.user.firstName} ${obligation.athlete.user.lastName}`,
          athleteIdentification: obligation.athlete.user.identification,
          athleteEmail: obligation.athlete.user.email,
          period: obligation.period,
          baseAmount: obligation.baseAmount,
          lateDays,
          lateFee,
          totalAmount,
          dueStart: obligation.dueStart,
          dueEnd: obligation.dueEnd,
          createdAt: obligation.createdAt,
          
          // Estados calculados
          moraStatus,
          moraText,
          moraColor,
          paymentStatus,
          paymentText,
          
          // Información del pago
          latestPayment: latestPayment ? {
            id: latestPayment.id,
            status: latestPayment.status,
            uploadedAt: latestPayment.uploadedAt,
            reviewedAt: latestPayment.reviewedAt,
            receiptUrl: latestPayment.receiptUrl,
            receiptName: latestPayment.receiptName
          } : null
        };
      }));

      // Calcular estadísticas de resumen
      const summary = {
        totalObligations: total,
        paidCount: obligationsWithDetails.filter(o => o.paymentStatus === 'PAGADO').length,
        pendingCount: obligationsWithDetails.filter(o => o.paymentStatus === 'PENDIENTE_REVISION').length,
        overdueCount: obligationsWithDetails.filter(o => o.moraStatus === 'EN_MORA').length,
        excessiveOverdueCount: obligationsWithDetails.filter(o => o.moraStatus === 'MORA_EXCESIVA').length,
        totalOverdueAmount: obligationsWithDetails
          .filter(o => o.lateDays > 0)
          .reduce((sum, o) => sum + o.lateFee, 0)
      };


      return {
        obligations: obligationsWithDetails,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        summary,
        filters: {
          status,
          search,
          dateFrom,
          dateTo
        }
      };

    } catch (error) {
throw new Error(`Error al obtener gestión mensual: ${error.message}`);
    }
  },

  // ============================================================================
  // MÉTODOS PRIVADOS
  // ============================================================================

  /**
   * Marcar mensualidad del periodo como cubierta por matrícula (según fecha de envío del comprobante)
   */
  async _applyEnrollmentMonthlyCoverage(tx, payment) {
    if (!payment || !isEnrollmentPaymentType(payment.obligation?.type)) return;

    const referenceDate = payment.uploadedAt || payment.reviewedAt || new Date();
    const coveragePeriods = getEnrollmentCoveragePeriods(referenceDate);
    const settings = await getPaymentSettings();

    for (const coveragePeriod of coveragePeriods) {
      let monthlyObligation = await tx.paymentObligation.findFirst({
        where: {
          athleteId: payment.athleteId,
          type: 'MONTHLY',
          period: coveragePeriod
        },
        include: {
          payments: {
            where: { status: 'APPROVED' },
            take: 1
          }
        }
      });

      if (!monthlyObligation) {
        const [year, month] = coveragePeriod.split('-').map((value) => parseInt(value, 10));
        const { dueStart, dueEnd } = await calculateMonthlyDueDates(year, month);

        monthlyObligation = await tx.paymentObligation.create({
          data: {
            athleteId: payment.athleteId,
            type: 'MONTHLY',
            period: coveragePeriod,
            baseAmount: settings.monthlyAmount,
            dueStart,
            dueEnd,
            metadata: {}
          },
          include: {
            payments: {
              where: { status: 'APPROVED' },
              take: 1
            }
          }
        });
      }

      if (!monthlyObligation || (monthlyObligation.payments?.length ?? 0) > 0) {
        continue;
      }

      const coveredPeriods = Array.isArray(monthlyObligation.metadata?.coveredPeriods)
        ? monthlyObligation.metadata.coveredPeriods.filter(Boolean)
        : [];

      const metadata = {
        ...(monthlyObligation.metadata || {}),
        exemptByEnrollment: true,
        exemptReason: 'ENROLLMENT_COVERS_MONTH',
        coveragePeriod,
        coveredPeriods: [...new Set([...coveredPeriods, coveragePeriod])],
        enrollmentPaymentId: payment.id,
        enrollmentPaymentUploadedAt: payment.uploadedAt || null,
        enrollmentPaymentType: payment.obligation?.type || null,
        exemptedAt: new Date(),
        exemptionRule: isWithinLastWeekOfMonth(referenceDate)
          ? 'CURRENT_AND_NEXT_MONTH'
          : 'CURRENT_MONTH_ONLY'
      };

      await tx.paymentObligation.update({
        where: { id: monthlyObligation.id },
        data: { metadata }
      });
    }
  },

  /**
   * Procesar renovación de matrícula después de pago aprobado.
   * Crea una nueva matrícula vigente por 1 año.
   */
  async _processEnrollmentRenewal(tx, payment) {
    const athleteId = payment.athleteId;
    const athlete = await tx.athlete.findUnique({
      where: { id: athleteId },
      select: { id: true, isScholarship: true }
    });

    if (!athlete) {
      throw new Error(`Atleta no encontrado: ${athleteId}`);
    }

    const { fechaInicio, fechaVencimiento } = buildEnrollmentDatesFromReference(
      payment.uploadedAt || payment.reviewedAt || new Date()
    );

    await tx.enrollment.create({
      data: {
        athleteId,
        fechaInicio,
        fechaVencimiento,
        estado: 'Vigente',
        observaciones: athlete.isScholarship === true
          ? 'Renovacion automatica por beca'
          : 'Renovacion automatica por pago aprobado'
      }
    });

    await tx.athlete.update({
      where: { id: athleteId },
      data: { status: 'Active', inactivityReason: null }
    });
  },

  /**
   * Procesar pago inicial de matrícula después de que fue aprobado.
   * Activa la matrícula que estaba en estado Pending_Payment → Vigente.
   */
  async _processInitialEnrollmentPayment(tx, payment) {
    const athleteId = payment.athleteId;
    const { fechaInicio, fechaVencimiento } = buildEnrollmentDatesFromReference(
      payment.uploadedAt || payment.reviewedAt || new Date()
    );

    const pendingEnrollment = await tx.enrollment.findFirst({
      where: { athleteId, estado: 'Pending_Payment' },
      orderBy: { createdAt: 'desc' }
    });

    if (!pendingEnrollment) {
      throw new Error(`No se encontro matricula en Pending_Payment para el atleta ${athleteId}`);
    }

    await tx.enrollment.update({
      where: { id: pendingEnrollment.id },
      data: {
        estado: 'Vigente',
        fechaInicio,
        fechaVencimiento,
        observaciones: pendingEnrollment.observaciones
          ? `${pendingEnrollment.observaciones} | Activada automaticamente al aprobarse el pago inicial de matricula`
          : 'Activada automaticamente al aprobarse el pago inicial de matricula'
      }
    });

    await tx.athlete.update({
      where: { id: athleteId },
      data: { status: 'Active', inactivityReason: null }
    });
  },

  // ============================================================================
  // GESTIÓN MENSUAL ADMINISTRATIVA (NUEVO - NO AFECTA FUNCIONALIDAD EXISTENTE)
  // ============================================================================

  /**
   * Obtener todos los pagos pendientes para reporte (SIN PAGINACIÓN)
   * ✅ CORREGIDO: Ahora calcula mora con las mismas validaciones
   */
  async getPendingPaymentsForReport(filters = {}) {
    try {
      const result = await this.getPendingPayments({
        ...filters,
        page: 1,
        limit: 10000
      });

      return {
        success: true,
        data: result.payments,
        message: `Se encontraron ${result.payments.length} pagos pendientes para el reporte.`,
      };
    } catch (error) {
throw new Error('Error al obtener reporte de pagos pendientes');
    }
  },

  /**
   * Obtener historial completo de pagos para reporte (SIN PAGINACIÓN) - MEJORADO
   */
  async getPaymentHistoryForReport(filters = {}) {
    const result = await this.getAllPayments({
      ...filters,
      dateFrom: filters.dateFrom || filters.startDate,
      dateTo: filters.dateTo || filters.endDate,
      excludeStatus: filters.excludeStatus || 'PENDING',
      page: 1,
      limit: 10000
    });

    return {
      success: true,
      data: result.payments,
      message: `Se encontraron ${result.payments.length} pagos en el historial para el reporte.`,
    };
  },
};



import { jest } from "@jest/globals";

const mockPrisma = {
  $transaction: jest.fn(),
};

const mockPaymentsRepository = {
  getPaymentById: jest.fn(),
};

const mockPaymentSettingsRepository = {
  getSettings: jest.fn(),
  createInitialSettings: jest.fn(),
};

const mockEmailService = {
  sendMailWithFallback: jest.fn(),
  getDefaultFrom: jest.fn(() => "noreply@test.com"),
};

jest.unstable_mockModule("../../../../config/database.js", () => ({
  default: mockPrisma,
}));

jest.unstable_mockModule("../../repository/payments.repository.js", () => ({
  paymentsRepository: mockPaymentsRepository,
}));

jest.unstable_mockModule("../../repository/paymentSettings.repository.js", () => ({
  paymentSettingsRepository: mockPaymentSettingsRepository,
}));

jest.unstable_mockModule("../../../../services/emailService.js", () => ({
  default: mockEmailService,
}));

const { paymentsService } = await import("../payments.service.js");

describe("paymentsService behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPaymentSettingsRepository.getSettings.mockResolvedValue({
      monthlyAmount: 30000,
      enrollmentAmount: 40000,
      lateFeeDailyAmount: 2000,
    });
  });

  test("approvePayment activa matricula inicial desde uploadedAt y aplica cobertura", async () => {
    const paymentRecord = {
      id: 77,
      athleteId: 15,
      status: "APPROVED",
      uploadedAt: new Date("2026-01-30T12:00:00Z"),
      athlete: { user: { email: "athlete@test.com", firstName: "Ana", lastName: "Lopez" } },
      obligation: { type: "ENROLLMENT_INITIAL" },
    };

    const tx = {
      payment: {
        findUnique: jest.fn().mockResolvedValue({
          id: 77,
          athleteId: 15,
          status: "PENDING",
          obligation: { type: "ENROLLMENT_INITIAL" },
        }),
        update: jest.fn().mockResolvedValue(paymentRecord),
      },
      enrollment: {
        findFirst: jest.fn().mockResolvedValue({
          id: 301,
          athleteId: 15,
          estado: "Pending_Payment",
          observaciones: null,
        }),
        update: jest.fn().mockResolvedValue({ id: 301 }),
      },
      athlete: {
        update: jest.fn().mockResolvedValue({ id: 15 }),
      },
      paymentObligation: {
        findFirst: jest.fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null),
        create: jest.fn()
          .mockResolvedValueOnce({ id: 500, metadata: {}, payments: [] })
          .mockResolvedValueOnce({ id: 501, metadata: {}, payments: [] }),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    mockPrisma.$transaction.mockImplementation(async (callback) => callback(tx));

    const result = await paymentsService.approvePayment(77, 9);

    expect(result.status).toBe("APPROVED");
    expect(tx.enrollment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: "Vigente",
          fechaInicio: new Date("2026-01-30T12:00:00Z"),
          fechaVencimiento: new Date("2027-01-30T12:00:00Z"),
        }),
      })
    );
    expect(tx.paymentObligation.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          athleteId: 15,
          type: "MONTHLY",
          period: "2026-01",
          baseAmount: 30000,
        }),
      })
    );
    expect(tx.paymentObligation.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          athleteId: 15,
          type: "MONTHLY",
          period: "2026-02",
          baseAmount: 30000,
        }),
      })
    );
    expect(tx.paymentObligation.update).toHaveBeenCalledTimes(2);
  });

  test("rejectPayment no activa matricula ni cobertura", async () => {
    const tx = {
      payment: {
        findUnique: jest.fn().mockResolvedValue({
          id: 91,
          status: "PENDING",
        }),
        update: jest.fn().mockResolvedValue({
          id: 91,
          status: "REJECTED",
          athlete: { user: { email: "athlete@test.com" } },
          obligation: { type: "ENROLLMENT_INITIAL" },
        }),
      },
    };

    mockPrisma.$transaction.mockImplementation(async (callback) => callback(tx));

    await paymentsService.rejectPayment(91, 4, "Comprobante invalido");

    expect(tx.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "REJECTED",
          rejectionReason: "Comprobante invalido",
        }),
      })
    );
  });

  test("_applyEnrollmentMonthlyCoverage cubre solo el mes actual fuera de ultima semana", async () => {
    const tx = {
      paymentObligation: {
        findFirst: jest.fn().mockResolvedValue({ id: 800, metadata: {}, payments: [] }),
        create: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    await paymentsService._applyEnrollmentMonthlyCoverage(tx, {
      id: 10,
      athleteId: 22,
      uploadedAt: new Date("2026-01-10T12:00:00Z"),
      obligation: { type: "ENROLLMENT_INITIAL" },
    });

    expect(tx.paymentObligation.findFirst).toHaveBeenCalledTimes(1);
    expect(tx.paymentObligation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          metadata: expect.objectContaining({
            coveragePeriod: "2026-01",
            exemptionRule: "CURRENT_MONTH_ONLY",
          }),
        },
      })
    );
  });

  test("_processEnrollmentRenewal crea renovacion por beca desde uploadedAt", async () => {
    const tx = {
      athlete: {
        findUnique: jest.fn().mockResolvedValue({ id: 18, isScholarship: true }),
        update: jest.fn().mockResolvedValue({ id: 18 }),
      },
      enrollment: {
        create: jest.fn().mockResolvedValue({ id: 900 }),
      },
    };

    await paymentsService._processEnrollmentRenewal(tx, {
      athleteId: 18,
      uploadedAt: new Date("2026-04-02T16:30:00Z"),
    });

    expect(tx.enrollment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          athleteId: 18,
          fechaInicio: new Date("2026-04-02T16:30:00Z"),
          fechaVencimiento: new Date("2027-04-02T16:30:00Z"),
          observaciones: "Renovacion automatica por beca",
        }),
      })
    );
  });
});

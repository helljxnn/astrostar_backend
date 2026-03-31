import { jest } from "@jest/globals";

const mockPrisma = {
  $transaction: jest.fn(),
  documentType: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  guardian: {
    findUnique: jest.fn(),
  },
  sportsCategory: {
    findFirst: jest.fn(),
  },
};

const mockPaymentSettingsRepository = {
  getSettings: jest.fn(),
  createInitialSettings: jest.fn(),
};

const mockEmailService = {
  sendAthleteWelcomeEmail: jest.fn(),
};

const mockBcrypt = {
  hash: jest.fn(),
};

jest.unstable_mockModule("../../../../config/database.js", () => ({
  default: mockPrisma,
}));

jest.unstable_mockModule("../../../Payments/repository/paymentSettings.repository.js", () => ({
  paymentSettingsRepository: mockPaymentSettingsRepository,
}));

jest.unstable_mockModule("../../../../services/emailService.js", () => ({
  default: mockEmailService,
}));

jest.unstable_mockModule("bcrypt", () => ({
  default: mockBcrypt,
}));

const { legacyEnrollmentImportService } = await import(
  "../legacyEnrollmentImport.service.js"
);

describe("legacyEnrollmentImportService", () => {
  const expectLocalDate = (dateValue, expectedYear, expectedMonthIndex, expectedDay) => {
    expect(dateValue).toBeInstanceOf(Date);
    expect(dateValue.getFullYear()).toBe(expectedYear);
    expect(dateValue.getMonth()).toBe(expectedMonthIndex);
    expect(dateValue.getDate()).toBe(expectedDay);
  };

  beforeEach(() => {
    jest.resetAllMocks();

    mockPrisma.documentType.findUnique.mockImplementation(({ where }) => {
      if (where?.id === 1) {
        return Promise.resolve({
          id: 1,
          name: "Tarjeta de Identidad",
        });
      }

      if (where?.id === 2 || where?.id === 3) {
        return Promise.resolve({
          id: where.id,
          name: "Cedula de Ciudadania",
        });
      }

      return Promise.resolve(null);
    });
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.guardian.findUnique.mockImplementation(({ where }) => {
      if (where?.id === 5) {
        return Promise.resolve({
          id: 5,
          firstName: "Maria",
          lastName: "Lopez",
          identification: "99887766",
          email: "maria@example.com",
          phone: "3000000001",
          documentTypeId: 2,
          birthDate: new Date("1985-01-10T00:00:00.000Z"),
          address: "Calle 1",
          occupation: "Madre",
        });
      }

      return Promise.resolve(null);
    });
    mockPrisma.sportsCategory.findFirst.mockResolvedValue({
      id: 7,
      nombre: "Juvenil",
    });
    mockPaymentSettingsRepository.getSettings.mockResolvedValue({
      id: 1,
      monthlyAmount: 30000,
      enrollmentAmount: 40000,
      lateFeeDailyAmount: 2000,
    });
    mockPaymentSettingsRepository.createInitialSettings.mockResolvedValue({
      id: 1,
      monthlyAmount: 30000,
      enrollmentAmount: 40000,
      lateFeeDailyAmount: 2000,
    });
    mockBcrypt.hash.mockResolvedValue("hashed-password");
    mockEmailService.sendAthleteWelcomeEmail.mockResolvedValue({ success: true });
  });

  test("preview normaliza relacion, periodos y fecha de corte para mora legacy", async () => {
    const result = await legacyEnrollmentImportService.preview({
      athlete: {
        firstName: "Ana",
        lastName: "Lopez",
        documentTypeId: 1,
        identification: "100200300",
        email: "ANA@example.com",
        phoneNumber: "3000000000",
        birthDate: "2011-02-10",
        guardianId: 5,
        relationship: "Madre",
        categoria: "Juvenil",
        status: "Inactive",
      },
      enrollment: {
        estado: "Vigente",
        fechaInicio: "2025-08-01",
        fechaVencimiento: "2026-07-31",
      },
      financial: {
        monthlyDebtStartPeriod: "2026-01",
        monthlyDebtEndPeriod: "2026-03",
        waiveHistoricalLateFee: true,
      },
      options: {
        cutoverDate: "2026-04-01",
      },
    }, {
      performedBy: 99,
    });

    expect(result.normalized.athlete.email).toBe("ana@example.com");
    expect(result.normalized.athlete.relationship).toBe("Mother");
    expect(result.normalized.monthlyDebtPeriods).toEqual([
      "2026-01",
      "2026-02",
      "2026-03",
    ]);
    expectLocalDate(result.normalized.statusAssignedAt, 2026, 3, 1);
    expect(result.plan.financial.monthlyDebtCount).toBe(3);
    expectLocalDate(new Date(result.plan.financial.lateFeeStartsAt), 2026, 3, 1);
  });

  test("preview rechaza periodos futuros respecto a la fecha de corte", async () => {
    await expect(
      legacyEnrollmentImportService.preview({
        athlete: {
          firstName: "Laura",
          lastName: "Perez",
          documentTypeId: 1,
          identification: "900800700",
          email: "laura@example.com",
          phoneNumber: "3010000000",
          birthDate: "2010-03-01",
          guardianId: 5,
          relationship: "Madre",
        },
        enrollment: {
          estado: "Vigente",
          fechaInicio: "2025-08-01",
          fechaVencimiento: "2026-07-31",
        },
        financial: {
          monthlyDebtPeriods: ["2026-05"],
        },
        options: {
          cutoverDate: "2026-04-01",
        },
      })
    ).rejects.toThrow('El periodo "2026-05" es futuro respecto a la fecha de corte 2026-04.');
  });

  test("preview rechaza una matricula vigente que ya esta vencida en la fecha de corte", async () => {
    await expect(
      legacyEnrollmentImportService.preview({
        athlete: {
          firstName: "Valeria",
          lastName: "Suarez",
          documentTypeId: 2,
          identification: "123123123",
          email: "valeria@example.com",
          phoneNumber: "3012223344",
          birthDate: "2004-05-20",
          categoria: "Juvenil",
        },
        enrollment: {
          estado: "Vigente",
          fechaInicio: "2024-01-01",
          fechaVencimiento: "2025-12-31",
        },
        options: {
          cutoverDate: "2026-04-01",
          requireSportsCategory: true,
        },
      })
    ).rejects.toThrow(
      "Una matricula Vigente no puede estar vencida frente a la fecha de corte."
    );
  });

  test("preview exige acudiente cuando la deportista es menor de edad", async () => {
    await expect(
      legacyEnrollmentImportService.preview({
        athlete: {
          firstName: "Daniela",
          lastName: "Rojas",
          documentTypeId: 1,
          identification: "321321321",
          email: "daniela@example.com",
          phoneNumber: "3001234567",
          birthDate: "2012-09-10",
          categoria: "Juvenil",
        },
        enrollment: {
          estado: "Vigente",
          fechaInicio: "2025-08-01",
          fechaVencimiento: "2026-07-31",
        },
        options: {
          cutoverDate: "2026-04-01",
          requireSportsCategory: true,
        },
      })
    ).rejects.toThrow("Las deportistas menores de edad requieren un acudiente.");
  });

  test("preview mantiene mora historica normal cuando no se condona", async () => {
    const result = await legacyEnrollmentImportService.preview({
      athlete: {
        firstName: "Laura",
        lastName: "Perez",
        documentTypeId: 2,
        identification: "456456456",
        email: "laura2@example.com",
        phoneNumber: "3019998877",
        birthDate: "2001-09-20",
        categoria: "Juvenil",
      },
      enrollment: {
        estado: "Vigente",
        fechaInicio: "2025-08-01",
        fechaVencimiento: "2026-07-31",
      },
      financial: {
        monthlyDebtPeriods: ["2026-01", "2026-02"],
        waiveHistoricalLateFee: false,
      },
      options: {
        cutoverDate: "2026-04-01",
        requireSportsCategory: true,
      },
    });

    expect(result.normalized.lateFeeStartsAt).toBeNull();
    expect(result.plan.financial.lateFeeStartsAt).toBeNull();
  });

  test("create genera saldo inicial sin ENROLLMENT_INITIAL y con metadata legacy", async () => {
    mockPrisma.documentType.findUnique.mockResolvedValueOnce({
      id: 2,
      name: "Cedula de Ciudadania",
    });
    mockPrisma.sportsCategory.findFirst.mockResolvedValueOnce(null);

    const tx = {
      role: {
        findFirst: jest.fn().mockResolvedValue({ id: 4, name: "Deportista" }),
        create: jest.fn(),
      },
      user: {
        create: jest.fn().mockResolvedValue({
          id: 21,
          firstName: "Laura",
          lastName: "Perez",
          email: "laura@example.com",
          identification: "500600700",
        }),
      },
      athlete: {
        create: jest.fn().mockResolvedValue({
          id: 31,
          status: "Active",
          isScholarship: false,
        }),
      },
      enrollment: {
        create: jest.fn().mockResolvedValue({
          id: 41,
          athleteId: 31,
          estado: "Vigente",
          fechaInicio: new Date("2025-08-01T00:00:00.000Z"),
          fechaVencimiento: new Date("2026-07-31T00:00:00.000Z"),
          createdAt: new Date("2026-04-01T00:00:00.000Z"),
        }),
      },
      inscription: {
        create: jest.fn(),
      },
      paymentObligation: {
        create: jest
          .fn()
          .mockResolvedValueOnce({
            id: 51,
            type: "MONTHLY",
            period: "2026-01",
            dueStart: new Date("2026-01-01T00:00:00.000Z"),
            dueEnd: new Date("2026-01-05T23:59:59.999Z"),
          })
          .mockResolvedValueOnce({
            id: 52,
            type: "MONTHLY",
            period: "2026-02",
            dueStart: new Date("2026-02-01T00:00:00.000Z"),
            dueEnd: new Date("2026-02-05T23:59:59.999Z"),
          }),
      },
    };

    mockPrisma.$transaction.mockImplementation(async (callback) => callback(tx));

    const result = await legacyEnrollmentImportService.create({
      athlete: {
        firstName: "Laura",
        lastName: "Perez",
        documentTypeId: 2,
        identification: "500600700",
        email: "laura@example.com",
        phoneNumber: "3010000000",
        birthDate: "2000-09-20",
        status: "Active",
      },
      enrollment: {
        estado: "Vigente",
        fechaInicio: "2025-08-01",
        fechaVencimiento: "2026-07-31",
      },
      financial: {
        monthlyDebtPeriods: ["2026-01", "2026-02"],
        waiveHistoricalLateFee: true,
      },
      options: {
        cutoverDate: "2026-04-01",
        sendWelcomeEmail: false,
      },
    }, {
      performedBy: 123,
    });

    expect(result.success).toBe(true);
    expect(result.createdObligations).toHaveLength(2);
    expect(tx.paymentObligation.create).toHaveBeenCalledTimes(2);
    expect(
      tx.paymentObligation.create.mock.calls.every(
        ([call]) => call.data.type === "MONTHLY"
      )
    ).toBe(true);
    expect(
      tx.paymentObligation.create.mock.calls.some(
        ([call]) => call.data.type === "ENROLLMENT_INITIAL"
      )
    ).toBe(false);
    const firstObligationCall = tx.paymentObligation.create.mock.calls[0][0];
    expect(firstObligationCall.data.athleteId).toBe(31);
    expect(firstObligationCall.data.type).toBe("MONTHLY");
    expect(firstObligationCall.data.baseAmount).toBe(30000);
    expect(firstObligationCall.data.metadata.origin).toBe("LEGACY_IMPORT");
    expect(firstObligationCall.data.metadata.importedBy).toBe(123);
    expect(firstObligationCall.data.metadata.importedDebtPeriod).toBe("2026-01");
    expectLocalDate(firstObligationCall.data.metadata.lateFeeStartsAt, 2026, 3, 1);
    expect(mockEmailService.sendAthleteWelcomeEmail).not.toHaveBeenCalled();
  });

  test("previewBatch detecta filas listas y errores de consistencia", async () => {
    mockPrisma.documentType.findUnique.mockImplementation(({ where }) => {
      if (where?.id === 1) {
        return Promise.resolve({ id: 1, name: "Tarjeta de Identidad" });
      }

      if (where?.id === 3) {
        return Promise.resolve({ id: 3, name: "Cedula de Ciudadania" });
      }

      return Promise.resolve({ id: 2, name: "Cedula de Ciudadania" });
    });
    mockPrisma.sportsCategory.findFirst.mockResolvedValue({
      id: 9,
      nombre: "Juvenil",
    });

    const preview = await legacyEnrollmentImportService.previewBatch({
      options: {
        cutoverDate: "2026-04-01",
        requireSportsCategory: true,
        sendWelcomeEmail: false,
      },
      records: [
        {
          athlete: {
            firstName: "Laura",
            lastName: "Perez",
            documentTypeId: 2,
            identification: "500600700",
            email: "laura@example.com",
            phoneNumber: "3010000000",
            birthDate: "2000-09-20",
            categoria: "Juvenil",
          },
          enrollment: {
            estado: "Vigente",
            fechaInicio: "2025-08-01",
            fechaVencimiento: "2026-07-31",
          },
        },
        {
          athlete: {
            firstName: "Sara",
            lastName: "Lopez",
            documentTypeId: 1,
            identification: "100200300",
            email: "sara@example.com",
            phoneNumber: "3000000000",
            birthDate: "2011-02-10",
            categoria: "Juvenil",
            relationship: "Madre",
          },
          guardian: {
            documentTypeId: 3,
            identification: "99880011",
            firstName: "Patricia",
            lastName: "Lopez",
            email: "patricia@example.com",
            phone: "3000000002",
            birthDate: "1980-05-05",
            address: "Calle 2",
          },
          enrollment: {
            estado: "Vigente",
            fechaInicio: "2025-08-01",
            fechaVencimiento: "2026-07-31",
          },
        },
        {
          athlete: {
            firstName: "Laura",
            lastName: "Otra",
            documentTypeId: 2,
            identification: "500600700",
            email: "otra@example.com",
            phoneNumber: "3011111111",
            birthDate: "2001-02-02",
            categoria: "Juvenil",
          },
          enrollment: {
            estado: "Vigente",
            fechaInicio: "2025-08-01",
            fechaVencimiento: "2026-07-31",
          },
        },
      ],
    });

    expect(preview.summary.totalRows).toBe(3);
    expect(preview.summary.readyRows).toBe(1);
    expect(preview.summary.invalidRows).toBe(2);
  });

  test("createBatch crea acudiente inline en la importación masiva", async () => {
    mockPrisma.documentType.findUnique.mockImplementation(({ where }) => {
      if (where?.id === 1) {
        return Promise.resolve({ id: 1, name: "Tarjeta de Identidad" });
      }

      if (where?.id === 3) {
        return Promise.resolve({ id: 3, name: "Cedula de Ciudadania" });
      }

      return Promise.resolve({ id: 2, name: "Cedula de Ciudadania" });
    });
    mockPrisma.sportsCategory.findFirst.mockResolvedValue({
      id: 9,
      nombre: "Juvenil",
    });

    const tx = {
      role: {
        findFirst: jest.fn().mockResolvedValue({ id: 4, name: "Deportista" }),
        create: jest.fn(),
      },
      guardian: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest
          .fn()
          .mockResolvedValue({
            id: 61,
            firstName: "Patricia",
            lastName: "Lopez",
            identification: "99880011",
            email: "patricia@example.com",
            phone: "3000000002",
            documentTypeId: 3,
            birthDate: new Date("1980-05-05T00:00:00.000Z"),
            address: "Calle 2",
            occupation: null,
          }),
      },
      user: {
        create: jest
          .fn()
          .mockResolvedValueOnce({
            id: 21,
            firstName: "Sara",
            lastName: "Lopez",
            email: "sara@example.com",
            identification: "100200300",
          }),
      },
      athlete: {
        create: jest
          .fn()
          .mockResolvedValueOnce({ id: 31, status: "Active", isScholarship: false }),
      },
      enrollment: {
        create: jest
          .fn()
          .mockResolvedValueOnce({
            id: 41,
            athleteId: 31,
            estado: "Vigente",
            fechaInicio: new Date("2025-08-01T00:00:00.000Z"),
            fechaVencimiento: new Date("2026-07-31T00:00:00.000Z"),
            createdAt: new Date("2026-04-01T00:00:00.000Z"),
          }),
      },
      inscription: {
        create: jest.fn().mockResolvedValue({ id: 71 }),
      },
      paymentObligation: {
        create: jest.fn(),
      },
    };

    mockPrisma.$transaction.mockImplementation(async (callback) => callback(tx));

    const payload = {
      options: {
        cutoverDate: "2026-04-01",
        requireSportsCategory: true,
      },
      records: [
        {
          athlete: {
            firstName: "Sara",
            lastName: "Lopez",
            documentTypeId: 1,
            identification: "100200300",
            email: "sara@example.com",
            phoneNumber: "3000000000",
            birthDate: "2011-02-10",
            categoria: "Juvenil",
            relationship: "Madre",
          },
          guardian: {
            documentTypeId: 3,
            identification: "99880011",
            firstName: "Patricia",
            lastName: "Lopez",
            email: "patricia@example.com",
            phone: "3000000002",
            birthDate: "1980-05-05",
            address: "Calle 2",
          },
          enrollment: {
            estado: "Vigente",
            fechaInicio: "2025-08-01",
            fechaVencimiento: "2026-07-31",
          },
        },
      ],
    };

    const preview = await legacyEnrollmentImportService.previewBatch(payload);
    expect(preview.summary.invalidRows).toBe(0);

    const result = await legacyEnrollmentImportService.createBatch(payload);

    expect(result.summary.importedRows).toBe(1);
    expect(tx.guardian.create).toHaveBeenCalledTimes(1);
    expect(tx.athlete.create.mock.calls[0][0].data.guardianId).toBe(61);
  });
});

import { jest } from "@jest/globals";

const mockRepository = {
  findById: jest.fn(),
  findByIdentification: jest.fn(),
  findByEmail: jest.fn(),
  validateGuardian: jest.fn(),
  update: jest.fn(),
};

const mockEmailService = {
  sendAthleteWelcomeEmail: jest.fn(),
};

const mockBcrypt = {
  hash: jest.fn(),
};

jest.unstable_mockModule("../../repository/athletes.repository.js", () => ({
  AthletesRepository: jest.fn(() => mockRepository),
}));

jest.unstable_mockModule("../../../../services/emailService.js", () => ({
  default: mockEmailService,
}));

jest.unstable_mockModule("bcrypt", () => ({
  default: mockBcrypt,
}));

const { AthletesService } = await import("../athletes.service.js");

describe("AthletesService.updateAthlete", () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AthletesService();
  });

  test("envia el documento nuevo cuando cambian email e identificacion a la vez", async () => {
    mockRepository.findById.mockResolvedValue({
      id: 4,
      userId: 8,
      firstName: "Ana",
      lastName: "Lopez",
      email: "anterior@test.com",
      identification: "OLD123456",
      birthDate: "2000-05-10",
      acudiente: null,
      isScholarship: false,
    });
    mockRepository.findByIdentification.mockResolvedValue(null);
    mockRepository.findByEmail.mockResolvedValue(null);
    mockRepository.update.mockResolvedValue({
      id: 4,
      firstName: "Ana",
      lastName: "Lopez",
    });
    mockBcrypt.hash.mockResolvedValue("hashed-new-document");
    mockEmailService.sendAthleteWelcomeEmail.mockResolvedValue({ success: true });

    const result = await service.updateAthlete(4, {
      identification: "NEW654321",
      email: "nuevo@test.com",
    });

    expect(mockBcrypt.hash).toHaveBeenCalledWith("NEW654321", 10);
    expect(mockRepository.update).toHaveBeenCalledWith(
      4,
      expect.objectContaining({
        identification: "NEW654321",
        email: "nuevo@test.com",
        passwordHash: "hashed-new-document",
      }),
    );
    expect(mockEmailService.sendAthleteWelcomeEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "nuevo@test.com",
        firstName: "Ana",
        lastName: "Lopez",
      }),
      expect.objectContaining({
        email: "nuevo@test.com",
        temporaryPassword: "NEW654321",
      }),
    );
    expect(result.emailSent).toBe(true);
  });

  test("rechaza remover el acudiente de una menor aunque no cambie la fecha de nacimiento", async () => {
    mockRepository.findById.mockResolvedValue({
      id: 6,
      userId: 12,
      firstName: "Sofia",
      lastName: "Perez",
      email: "sofia@test.com",
      identification: "TI123456",
      birthDate: "2012-09-10",
      acudiente: 91,
      isScholarship: false,
    });

    await expect(
      service.updateAthlete(6, { acudiente: null }),
    ).rejects.toThrow("Los menores de edad deben tener un acudiente asignado.");

    expect(mockRepository.update).not.toHaveBeenCalled();
    expect(mockEmailService.sendAthleteWelcomeEmail).not.toHaveBeenCalled();
  });
});

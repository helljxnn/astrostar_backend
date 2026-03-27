import { paymentBusinessRules } from "../payments.service.js";

describe("paymentBusinessRules", () => {
  describe("isWithinLastWeekOfMonth", () => {
    test("detecta fechas dentro de la ultima semana del mes", () => {
      expect(paymentBusinessRules.isWithinLastWeekOfMonth(new Date("2026-01-25T12:00:00Z"))).toBe(true);
      expect(paymentBusinessRules.isWithinLastWeekOfMonth(new Date("2026-01-31T12:00:00Z"))).toBe(true);
    });

    test("excluye fechas antes de la ultima semana del mes", () => {
      expect(paymentBusinessRules.isWithinLastWeekOfMonth(new Date("2026-01-24T12:00:00Z"))).toBe(false);
    });
  });

  describe("getEnrollmentCoveragePeriods", () => {
    test("cubre solo el mes actual cuando el comprobante llega antes de la ultima semana", () => {
      expect(
        paymentBusinessRules.getEnrollmentCoveragePeriods(new Date("2026-01-10T12:00:00Z"))
      ).toEqual(["2026-01"]);
    });

    test("cubre el mes actual y el siguiente cuando el comprobante llega en la ultima semana", () => {
      expect(
        paymentBusinessRules.getEnrollmentCoveragePeriods(new Date("2026-01-30T12:00:00Z"))
      ).toEqual(["2026-01", "2026-02"]);
    });
  });

  describe("buildEnrollmentDatesFromReference", () => {
    test("la vigencia inicia desde la fecha de envio del comprobante", () => {
      const uploadedAt = new Date("2026-01-30T15:45:00Z");
      const { fechaInicio, fechaVencimiento } =
        paymentBusinessRules.buildEnrollmentDatesFromReference(uploadedAt);

      expect(fechaInicio.toISOString()).toBe(uploadedAt.toISOString());
      expect(fechaVencimiento.toISOString()).toBe("2027-01-30T15:45:00.000Z");
    });
  });
});

import { body, param, query, validationResult } from "express-validator";

export const handleDonationValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    return res.status(400).json({
      success: false,
      message: first.msg,
      field: first.path,
      errors: errors.array(),
    });
  }
  next();
};

const allowedTypes = ["ECONOMICA", "ESPECIE", "ALIMENTOS"];
const allowedStatus = [
  "Recibida",
  "EnProceso",
  "Verificada",
  "Ejecutada",
  "Anulada",
];
const allowedFileTypes = ["comprobante", "soporte", "factura", "evidencia"];

const detailValidators = (typeField = "type") =>
  body("details").custom((details, { req }) => {
    const inferredType =
      req.body[typeField] ||
      details?.find((d) => d?.kind)?.kind ||
      details?.[0]?.kind;
    const type = String(inferredType || "").toUpperCase();
    if (!Array.isArray(details) || details.length === 0) {
      throw new Error("Debe enviar al menos un detalle");
    }

    if (!allowedTypes.includes(type)) {
      throw new Error("Tipo de donacion invalido para validar detalles");
    }

    const findDetail = (kind, recordType) =>
      details.find(
        (d) =>
          String(d.kind).toUpperCase() === String(kind).toUpperCase() &&
          String(d.recordType).toLowerCase() === String(recordType).toLowerCase()
      );

    const requirePositive = (value, message) => {
      if (value === undefined || value === null || Number(value) <= 0) {
        throw new Error(message);
      }
    };

    if (type === "ECONOMICA") {
      const payment = findDetail("ECONOMICA", "payment");
      if (!payment) {
        throw new Error(
          "Debe enviar un detalle de pago con monto y canal para la donacion economica"
        );
      }
      requirePositive(payment.amount, "El valor donado debe ser mayor a 0");
      if (!payment.channel) {
        throw new Error("El canal de pago es obligatorio");
      }
    }

    if (type === "ESPECIE") {
      const item = findDetail("ESPECIE", "item");
      if (!item) {
        throw new Error(
          "Debe enviar descripcion, cantidad, clasificacion y metodo de recepcion para la donacion en especie"
        );
      }
      if (!item.description) {
        throw new Error("La descripcion del bien donado es obligatoria");
      }
      requirePositive(item.quantity, "La cantidad debe ser mayor a 0");
      if (!item.classification) {
        throw new Error("La clasificacion del bien es obligatoria");
      }
      if (!item.channel) {
        throw new Error("El metodo de recepcion es obligatorio");
      }
    }

    if (type === "ALIMENTOS") {
      const payment = findDetail("ALIMENTOS", "payment");
      const food = findDetail("ALIMENTOS", "food");
      if (!payment || !food) {
        throw new Error(
          "Debe enviar detalle de pago y detalle de alimentos para donacion de alimentos"
        );
      }
      requirePositive(payment.amount, "El valor donado debe ser mayor a 0");
      if (!payment.channel) {
        throw new Error("El canal de pago es obligatorio");
      }
      requirePositive(food.quantity, "La cantidad de alimentos debe ser mayor a 0");
      if (!food.classification) {
        throw new Error("La clasificacion del alimento es obligatoria");
      }
    }

    return true;
  });

export const donationValidators = {
  list: [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 10000 }).toInt(),
    query("search").optional().isString().trim().isLength({ max: 100 }),
    query("status").optional().isIn(allowedStatus),
    query("type").optional().isIn(allowedTypes),
    query("serviceId").optional().isInt({ min: 1 }).toInt(),
    query("eventId").optional().isInt({ min: 1 }).toInt(),
    query("month")
      .optional()
      .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
      .withMessage("Mes invalido, use formato AAAA-MM"),
  ],

  getById: [param("id").isInt({ min: 1 }).withMessage("ID invalido").toInt()],

  create: [
    body("type")
      .notEmpty()
      .withMessage("El tipo de donacion es obligatorio")
      .isIn(allowedTypes),
    body("donationAt")
      .notEmpty()
      .withMessage("La fecha de donacion es obligatoria")
      .isISO8601()
      .toDate(),
    body("status").optional().isIn(allowedStatus),
    body("anonymous").optional().isBoolean(),
    body("donorSponsorId")
      .if((_, { req }) => req.body.anonymous !== true && req.body.anonymous !== "true")
      .notEmpty()
      .withMessage("El donante/patrocinador es obligatorio")
      .isInt({ min: 1 })
      .withMessage("El donante/patrocinador es invalido")
      .toInt(),
    body("responsibleId")
      .notEmpty()
      .withMessage("El responsable de la donacion es obligatorio")
      .isInt({ min: 1 })
      .withMessage("El responsable de la donacion es invalido")
      .toInt(),
    body("serviceId").optional().isInt({ min: 1 }).toInt(),
    body("eventId").optional().isInt({ min: 1 }).toInt(),
    body("program").optional().isString().trim().isLength({ max: 200 }),
    body("notes").optional().isString().trim().isLength({ max: 500 }),
    body("details")
      .isArray({ min: 1 })
      .withMessage("Debe enviar al menos un detalle"),
    body("details.*.kind").notEmpty().isIn(allowedTypes),
    body("details.*.recordType").notEmpty().isString().trim(),
    body("details.*.description").optional().isString().trim(),
    body("details.*.quantity").optional().isNumeric(),
    body("details.*.amount").optional().isNumeric(),
    body("details.*.channel").optional().isString().trim(),
    body("details.*.classification").optional().isString().trim(),
    body("details.*.expiresAt").optional().isISO8601().toDate(),
    detailValidators("type"),
  ],

  update: [
    param("id").isInt({ min: 1 }).withMessage("ID invalido").toInt(),
    body("status").optional().isIn(allowedStatus),
    body("responsibleId").optional().isInt({ min: 1 }).toInt(),
    body("donorSponsorId").optional().isInt({ min: 1 }).toInt(),
    body("serviceId").optional().isInt({ min: 1 }).toInt(),
    body("eventId").optional().isInt({ min: 1 }).toInt(),
    body("program").optional().isString().trim().isLength({ max: 200 }),
    body("notes").optional().isString().trim().isLength({ max: 500 }),
    body("details").optional().isArray({ min: 1 }),
    body("details.*.kind").optional().isIn(allowedTypes),
    body("details.*.recordType").optional().isString().trim(),
    body("details.*.description").optional().isString().trim(),
    body("details.*.quantity").optional().isNumeric(),
    body("details.*.amount").optional().isNumeric(),
    body("details.*.channel").optional().isString().trim(),
    body("details.*.classification").optional().isString().trim(),
    body("details.*.expiresAt").optional().isISO8601().toDate(),
    detailValidators("type").optional(),
  ],

  changeStatus: [
    param("id").isInt({ min: 1 }).toInt(),
    body("status")
      .notEmpty()
      .withMessage("El estado es obligatorio")
      .isIn(allowedStatus),
    body("reason").optional().isString().trim().isLength({ max: 300 }),
  ],

  uploadFiles: [
    param("id").isInt({ min: 1 }).toInt(),
    query("fileType")
      .optional()
      .isIn(allowedFileTypes)
      .withMessage("fileType invalido"),
  ],

  softDelete: [param("id").isInt({ min: 1 }).toInt()],
};

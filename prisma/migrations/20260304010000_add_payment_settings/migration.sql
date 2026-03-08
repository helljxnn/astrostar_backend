-- CreateTable
CREATE TABLE "payment_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "monthlyAmount" INTEGER NOT NULL,
    "enrollmentAmount" INTEGER NOT NULL,
    "lateFeeDaily" INTEGER NOT NULL,
    "maxLateDaysMonthly" INTEGER NOT NULL,
    "graceDays" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_settings_pkey" PRIMARY KEY ("id")
);

-- Insert default configuration (only values you specified)
INSERT INTO "payment_settings" (
    "id",
    "monthlyAmount", 
    "enrollmentAmount",
    "lateFeeDaily",
    "maxLateDaysMonthly", 
    "graceDays"
) VALUES (
    1,
    50000,  -- Valor por defecto - debe configurarse
    100000, -- Valor por defecto - debe configurarse  
    2000,   -- Especificado por ti
    15,     -- Especificado por ti
    5       -- Valor por defecto - debe configurarse
);
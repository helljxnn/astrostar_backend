-- Remove unnecessary columns from payment_settings
ALTER TABLE "payment_settings" DROP COLUMN IF EXISTS "lateFeeDaily";
ALTER TABLE "payment_settings" DROP COLUMN IF EXISTS "maxLateDaysMonthly";

-- Remove lateFeeDaily from payment_obligations (if it was added)
ALTER TABLE "payment_obligations" DROP COLUMN IF EXISTS "lateFeeDaily";

-- Update default configuration with only variable values
UPDATE "payment_settings" 
SET 
    "monthlyAmount" = 50000,     -- Valor por defecto - configurable
    "enrollmentAmount" = 100000, -- Valor por defecto - configurable  
    "graceDays" = 5              -- Valor por defecto - configurable
WHERE "id" = 1;
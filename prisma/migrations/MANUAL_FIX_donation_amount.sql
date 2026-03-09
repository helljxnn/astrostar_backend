-- EJECUTAR ESTE SCRIPT MANUALMENTE EN LA BASE DE DATOS
-- Detener el servidor backend primero

-- Aumentar la precisión del campo amount en donation_detail
ALTER TABLE "donation_detail" ALTER COLUMN "amount" TYPE DECIMAL(15,2);

-- Verificar el cambio
SELECT column_name, data_type, numeric_precision, numeric_scale 
FROM information_schema.columns 
WHERE table_name = 'donation_detail' AND column_name = 'amount';

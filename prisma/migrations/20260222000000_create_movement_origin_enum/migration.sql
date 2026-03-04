-- Crear ENUM MovementOrigin si no existe
DO $$ BEGIN
    CREATE TYPE "MovementOrigin" AS ENUM (
        'Compra',
        'Donacion',
        'AjustePositivo',
        'AjusteNegativo',
        'UsoEvento',
        'Dano',
        'Perdida',
        'Entrega',
        'ConsumoInterno'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Si la columna origen ya existe como TEXT, convertirla al ENUM
DO $$ BEGIN
    ALTER TABLE "material_movements" 
    ALTER COLUMN "origen" TYPE "MovementOrigin" 
    USING "origen"::"MovementOrigin";
EXCEPTION
    WHEN others THEN null;
END $$;

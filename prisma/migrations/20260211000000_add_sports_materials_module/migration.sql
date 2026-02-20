-- CreateEnum para estados de materiales
DO $$ BEGIN
 CREATE TYPE "MaterialStatus" AS ENUM ('Activo', 'Inactivo');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateEnum para estados de categorías
DO $$ BEGIN
 CREATE TYPE "CategoryStatus" AS ENUM ('Activo', 'Inactivo');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateEnum para tipos de movimiento
DO $$ BEGIN
 CREATE TYPE "MovementType" AS ENUM ('Entrada', 'Baja');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateTable: categories
CREATE TABLE IF NOT EXISTS "categories" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "estado" "CategoryStatus" NOT NULL DEFAULT 'Activo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable: materials
CREATE TABLE IF NOT EXISTS "materials" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "categoria" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "stockActual" INTEGER NOT NULL DEFAULT 0,
    "estado" "MaterialStatus" NOT NULL DEFAULT 'Activo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable: material_movements
CREATE TABLE IF NOT EXISTS "material_movements" (
    "id" SERIAL NOT NULL,
    "materialId" INTEGER NOT NULL,
    "materialNombre" VARCHAR(255) NOT NULL,
    "categoria" VARCHAR(100) NOT NULL,
    "tipoMovimiento" "MovementType" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "origen" VARCHAR(100) NOT NULL,
    "observaciones" TEXT,
    "stockAnterior" INTEGER NOT NULL,
    "stockNuevo" INTEGER NOT NULL,
    "referenceId" INTEGER,
    "referenceType" VARCHAR(50),
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL,
    "createdByName" VARCHAR(255),

    CONSTRAINT "material_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "categories_nombre_key" ON "categories"("nombre");
CREATE INDEX IF NOT EXISTS "idx_category_nombre" ON "categories"("nombre");
CREATE INDEX IF NOT EXISTS "idx_category_estado" ON "categories"("estado");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "unique_material_per_category" ON "materials"("nombre", "categoriaId");
CREATE INDEX IF NOT EXISTS "idx_material_estado" ON "materials"("estado");
CREATE INDEX IF NOT EXISTS "idx_material_categoria" ON "materials"("categoriaId");
CREATE INDEX IF NOT EXISTS "idx_material_nombre" ON "materials"("nombre");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_movement_material" ON "material_movements"("materialId");
CREATE INDEX IF NOT EXISTS "idx_movement_tipo" ON "material_movements"("tipoMovimiento");
CREATE INDEX IF NOT EXISTS "idx_movement_fecha" ON "material_movements"("fecha");

-- AddForeignKey
DO $$ BEGIN
 ALTER TABLE "materials" ADD CONSTRAINT "materials_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
 ALTER TABLE "material_movements" ADD CONSTRAINT "material_movements_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

/*
  Warnings:

  - You are about to drop the column `comprobantePago` on the `enrollments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "enrollments" DROP COLUMN "comprobantePago",
ALTER COLUMN "estado" SET DEFAULT 'Pending_Payment',
ALTER COLUMN "fechaInicio" DROP NOT NULL,
ALTER COLUMN "fechaInicio" DROP DEFAULT,
ALTER COLUMN "fechaVencimiento" DROP NOT NULL;

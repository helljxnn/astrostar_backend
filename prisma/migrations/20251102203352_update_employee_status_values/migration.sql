/*
  Warnings:

  - The values [Active,Disabled,OnVacation,Retired,Deceased] on the enum `EmployeeStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EmployeeStatus_new" AS ENUM ('Activo', 'Licencia', 'Desvinculado', 'Fallecido');
ALTER TABLE "public"."employees" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "employees" ALTER COLUMN "status" TYPE "EmployeeStatus_new" USING ("status"::text::"EmployeeStatus_new");
ALTER TYPE "EmployeeStatus" RENAME TO "EmployeeStatus_old";
ALTER TYPE "EmployeeStatus_new" RENAME TO "EmployeeStatus";
DROP TYPE "public"."EmployeeStatus_old";
ALTER TABLE "employees" ALTER COLUMN "status" SET DEFAULT 'Activo';
COMMIT;

-- AlterTable
ALTER TABLE "employees" ALTER COLUMN "status" SET DEFAULT 'Activo';

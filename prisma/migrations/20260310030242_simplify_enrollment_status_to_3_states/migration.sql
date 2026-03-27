/*
  Warnings:

  - The values [Suspendida,Cancelada] on the enum `EnrollmentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EnrollmentStatus_new" AS ENUM ('Pending_Payment', 'Vigente', 'Vencida');
ALTER TABLE "public"."enrollments" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "enrollments" ALTER COLUMN "estado" TYPE "EnrollmentStatus_new" USING ("estado"::text::"EnrollmentStatus_new");
ALTER TYPE "EnrollmentStatus" RENAME TO "EnrollmentStatus_old";
ALTER TYPE "EnrollmentStatus_new" RENAME TO "EnrollmentStatus";
DROP TYPE "public"."EnrollmentStatus_old";
ALTER TABLE "enrollments" ALTER COLUMN "estado" SET DEFAULT 'Pending_Payment';
COMMIT;

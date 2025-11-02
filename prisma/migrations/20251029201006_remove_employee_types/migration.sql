/*
  Warnings:

  - You are about to drop the column `employeeTypeId` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the `employee_types` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."employees" DROP CONSTRAINT "employees_employeeTypeId_fkey";

-- AlterTable
ALTER TABLE "employees" DROP COLUMN "employeeTypeId";

-- DropTable
DROP TABLE "public"."employee_types";

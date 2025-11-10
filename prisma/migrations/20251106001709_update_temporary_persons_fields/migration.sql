/*
  Warnings:

  - You are about to drop the column `organization` on the `temporary_persons` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "temporary_persons" DROP COLUMN "organization",
ADD COLUMN     "category" TEXT,
ADD COLUMN     "team" TEXT;

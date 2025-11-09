/*
  Warnings:

  - Made the column `identification` on table `temporary_persons` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `temporary_persons` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `temporary_persons` required. This step will fail if there are existing NULL values in that column.
  - Made the column `birthDate` on table `temporary_persons` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address` on table `temporary_persons` required. This step will fail if there are existing NULL values in that column.
  - Made the column `documentTypeId` on table `temporary_persons` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."temporary_persons" DROP CONSTRAINT "temporary_persons_documentTypeId_fkey";

-- AlterTable
ALTER TABLE "temporary_persons" ALTER COLUMN "identification" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "birthDate" SET NOT NULL,
ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "documentTypeId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "temporary_persons" ADD CONSTRAINT "temporary_persons_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "document_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

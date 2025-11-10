/*
  Warnings:

  - A unique constraint covering the columns `[identification]` on the table `temporary_persons` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "temporary_persons_identification_key" ON "temporary_persons"("identification");

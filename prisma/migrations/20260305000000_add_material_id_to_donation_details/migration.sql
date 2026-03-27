-- AlterTable
ALTER TABLE "DonationDetail" ADD COLUMN "material_id" INTEGER;

-- CreateIndex
CREATE INDEX "DonationDetail_material_id_idx" ON "DonationDetail"("material_id");

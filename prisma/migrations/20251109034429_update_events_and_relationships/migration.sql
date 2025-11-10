/*
  Warnings:

  - The `status` column on the `participants` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Service` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceSponsor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Sponsor` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[serviceId,athleteId]` on the table `participants` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[serviceId,teamId]` on the table `participants` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[teamId,athleteId]` on the table `team_members` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[teamId,temporaryPersonId]` on the table `team_members` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[teamId,employeeId]` on the table `team_members` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TeamType" AS ENUM ('Internal', 'External');

-- CreateEnum
CREATE TYPE "TeamMemberRole" AS ENUM ('Player', 'Coach', 'AssistantCoach', 'Captain');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('Registered', 'Confirmed', 'Cancelled', 'Attended');

-- DropForeignKey
ALTER TABLE "public"."Service" DROP CONSTRAINT "Service_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Service" DROP CONSTRAINT "Service_typeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ServiceSponsor" DROP CONSTRAINT "ServiceSponsor_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ServiceSponsor" DROP CONSTRAINT "ServiceSponsor_sponsorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."participants" DROP CONSTRAINT "participants_serviceId_fkey";

-- AlterTable
ALTER TABLE "participants" DROP COLUMN "status",
ADD COLUMN     "status" "ParticipantStatus" NOT NULL DEFAULT 'Registered';

-- AlterTable
ALTER TABLE "team_members" ADD COLUMN     "role" "TeamMemberRole" NOT NULL DEFAULT 'Player';

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "teamType" "TeamType" NOT NULL DEFAULT 'Internal';

-- DropTable
DROP TABLE "public"."Service";

-- DropTable
DROP TABLE "public"."ServiceSponsor";

-- DropTable
DROP TABLE "public"."ServiceType";

-- DropTable
DROP TABLE "public"."Sponsor";

-- CreateTable
CREATE TABLE "services" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'Programado',
    "imageUrl" TEXT,
    "scheduleFile" TEXT,
    "publish" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" INTEGER NOT NULL,
    "typeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_sponsors" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "sponsorId" INTEGER NOT NULL,
    "contributionType" VARCHAR(100),
    "amount" DECIMAL(12,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_sponsors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsors" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "contactEmail" TEXT,
    "phone" TEXT,
    "logoUrl" TEXT,
    "website" TEXT,
    "status" "SponsorStatus" NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_types_name_key" ON "service_types"("name");

-- CreateIndex
CREATE INDEX "service_sponsors_serviceId_idx" ON "service_sponsors"("serviceId");

-- CreateIndex
CREATE INDEX "service_sponsors_sponsorId_idx" ON "service_sponsors"("sponsorId");

-- CreateIndex
CREATE UNIQUE INDEX "service_sponsors_serviceId_sponsorId_key" ON "service_sponsors"("serviceId", "sponsorId");

-- CreateIndex
CREATE UNIQUE INDEX "sponsors_name_key" ON "sponsors"("name");

-- CreateIndex
CREATE INDEX "sponsors_status_idx" ON "sponsors"("status");

-- CreateIndex
CREATE INDEX "participants_serviceId_idx" ON "participants"("serviceId");

-- CreateIndex
CREATE INDEX "participants_athleteId_idx" ON "participants"("athleteId");

-- CreateIndex
CREATE INDEX "participants_teamId_idx" ON "participants"("teamId");

-- CreateIndex
CREATE INDEX "participants_type_idx" ON "participants"("type");

-- CreateIndex
CREATE UNIQUE INDEX "participants_serviceId_athleteId_key" ON "participants"("serviceId", "athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "participants_serviceId_teamId_key" ON "participants"("serviceId", "teamId");

-- CreateIndex
CREATE INDEX "team_members_teamId_idx" ON "team_members"("teamId");

-- CreateIndex
CREATE INDEX "team_members_athleteId_idx" ON "team_members"("athleteId");

-- CreateIndex
CREATE INDEX "team_members_temporaryPersonId_idx" ON "team_members"("temporaryPersonId");

-- CreateIndex
CREATE INDEX "team_members_employeeId_idx" ON "team_members"("employeeId");

-- CreateIndex
CREATE INDEX "team_members_memberType_idx" ON "team_members"("memberType");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_teamId_athleteId_key" ON "team_members"("teamId", "athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_teamId_temporaryPersonId_key" ON "team_members"("teamId", "temporaryPersonId");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_teamId_employeeId_key" ON "team_members"("teamId", "employeeId");

-- CreateIndex
CREATE INDEX "teams_status_idx" ON "teams"("status");

-- CreateIndex
CREATE INDEX "teams_teamType_idx" ON "teams"("teamType");

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "event_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "service_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_sponsors" ADD CONSTRAINT "service_sponsors_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_sponsors" ADD CONSTRAINT "service_sponsors_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "sponsors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

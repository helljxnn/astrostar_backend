-- CreateEnum
CREATE TYPE "ScheduleNoveltyType" AS ENUM ('full', 'time');

-- CreateTable
CREATE TABLE "employee_schedule_novelties" (
    "id" SERIAL NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "ScheduleNoveltyType" NOT NULL DEFAULT 'full',
    "startTime" TEXT,
    "endTime" TEXT,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_schedule_novelties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_schedule_novelties_scheduleId_date_idx" ON "employee_schedule_novelties"("scheduleId", "date");

-- AddForeignKey
ALTER TABLE "employee_schedule_novelties" ADD CONSTRAINT "employee_schedule_novelties_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "employee_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

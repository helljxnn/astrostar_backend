-- DropForeignKey
ALTER TABLE "class_athletes" DROP CONSTRAINT IF EXISTS "class_athletes_classId_fkey";
ALTER TABLE "class_athletes" DROP CONSTRAINT IF EXISTS "class_athletes_athleteId_fkey";
ALTER TABLE "classes" DROP CONSTRAINT IF EXISTS "classes_employeeId_fkey";

-- DropTable
DROP TABLE IF EXISTS "class_athletes";
DROP TABLE IF EXISTS "classes";

-- DropEnum
DROP TYPE IF EXISTS "ClassStatus";
DROP TYPE IF EXISTS "ClassAttendanceStatus";

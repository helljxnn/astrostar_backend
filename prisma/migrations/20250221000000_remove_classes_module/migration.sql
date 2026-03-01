-- DropForeignKey (skip if not exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'class_athletes_classId_fkey') THEN
    ALTER TABLE "class_athletes" DROP CONSTRAINT "class_athletes_classId_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'class_athletes_athleteId_fkey') THEN
    ALTER TABLE "class_athletes" DROP CONSTRAINT "class_athletes_athleteId_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'classes_employeeId_fkey') THEN
    ALTER TABLE "classes" DROP CONSTRAINT "classes_employeeId_fkey";
  END IF;
END $$;

-- DropTable
DROP TABLE IF EXISTS "class_athletes";
DROP TABLE IF EXISTS "classes";

-- DropEnum
DROP TYPE IF EXISTS "ClassStatus";
DROP TYPE IF EXISTS "ClassAttendanceStatus";

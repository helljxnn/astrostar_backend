-- CreateEnum
CREATE TYPE "TeamType" AS ENUM ('Fundacion', 'Temporal');

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "phone" TEXT,
ADD COLUMN     "teamType" "TeamType" NOT NULL DEFAULT 'Temporal';

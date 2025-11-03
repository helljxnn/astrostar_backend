-- CreateEnum
CREATE TYPE "TemporaryPersonType" AS ENUM ('Deportista', 'Entrenador', 'Participante');

-- AlterTable
ALTER TABLE "temporary_persons" ADD COLUMN     "personType" "TemporaryPersonType" NOT NULL DEFAULT 'Participante';

-- AlterEnum
-- Agregar el nuevo valor 'En_curso' al enum EventStatus
ALTER TYPE "EventStatus" ADD VALUE IF NOT EXISTS 'En_curso';

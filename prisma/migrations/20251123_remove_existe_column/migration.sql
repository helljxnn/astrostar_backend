-- AlterTable: Remove existe column from team_members if it exists
ALTER TABLE "team_members" DROP COLUMN IF EXISTS "existe";

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "checklistItems" TEXT,
ADD COLUMN     "recapDone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "zoomLink" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dailyRecapTime" TEXT NOT NULL DEFAULT '18:00';

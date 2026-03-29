-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "videoSeuil1Url" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "blocked" BOOLEAN NOT NULL DEFAULT false;

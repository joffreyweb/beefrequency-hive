-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "engagementAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "engagementText" TEXT,
ADD COLUMN     "fixedDay" TEXT,
ADD COLUMN     "reportsUsed" INTEGER NOT NULL DEFAULT 0;

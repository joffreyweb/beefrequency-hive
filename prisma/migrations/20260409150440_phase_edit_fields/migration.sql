-- AlterTable
ALTER TABLE "ClientPhase" ADD COLUMN     "checkinMode" TEXT NOT NULL DEFAULT 'full',
ADD COLUMN     "customName" TEXT,
ADD COLUMN     "eveningCheckinEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "instructions" TEXT,
ADD COLUMN     "morningCheckinEnabled" BOOLEAN NOT NULL DEFAULT true;

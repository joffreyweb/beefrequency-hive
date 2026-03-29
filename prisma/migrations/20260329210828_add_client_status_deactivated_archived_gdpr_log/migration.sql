-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ClientStatus" ADD VALUE 'DEACTIVATED';
ALTER TYPE "ClientStatus" ADD VALUE 'ARCHIVED';

-- CreateTable
CREATE TABLE "GdprDeletionLog" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "dateInscription" TIMESTAMP(3) NOT NULL,
    "dateSuppression" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminId" TEXT NOT NULL,
    "adminName" TEXT NOT NULL,
    "motif" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GdprDeletionLog_pkey" PRIMARY KEY ("id")
);

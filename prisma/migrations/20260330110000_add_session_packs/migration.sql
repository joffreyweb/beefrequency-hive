-- CreateTable
CREATE TABLE "SessionPack" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "totalSessions" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionPack_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "sessionPackId" TEXT;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_sessionPackId_fkey" FOREIGN KEY ("sessionPackId") REFERENCES "SessionPack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPack" ADD CONSTRAINT "SessionPack_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

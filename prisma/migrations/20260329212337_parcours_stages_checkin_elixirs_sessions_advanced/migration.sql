-- CreateEnum
CREATE TYPE "ChangeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "colisEnvoye" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "colisEnvoyeAt" TIMESTAMP(3),
ADD COLUMN     "detoxStartDate" TIMESTAMP(3),
ADD COLUMN     "produitsRecus" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "produitsRecusAt" TIMESTAMP(3),
ADD COLUMN     "programmeStartDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "changesUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fixedSlotDay" INTEGER,
ADD COLUMN     "fixedSlotTime" TEXT;

-- CreateTable
CREATE TABLE "CheckinElixir" (
    "id" TEXT NOT NULL,
    "dailyCheckinId" TEXT NOT NULL,
    "elixirPrescriptionId" TEXT NOT NULL,
    "taken" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckinElixir_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSlot" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionChangeRequest" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "requestedDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "status" "ChangeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "adminResponse" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionReminder" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CheckinElixir_dailyCheckinId_elixirPrescriptionId_key" ON "CheckinElixir"("dailyCheckinId", "elixirPrescriptionId");

-- AddForeignKey
ALTER TABLE "CheckinElixir" ADD CONSTRAINT "CheckinElixir_dailyCheckinId_fkey" FOREIGN KEY ("dailyCheckinId") REFERENCES "DailyCheckin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckinElixir" ADD CONSTRAINT "CheckinElixir_elixirPrescriptionId_fkey" FOREIGN KEY ("elixirPrescriptionId") REFERENCES "ElixirPrescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionChangeRequest" ADD CONSTRAINT "SessionChangeRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionChangeRequest" ADD CONSTRAINT "SessionChangeRequest_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionReminder" ADD CONSTRAINT "SessionReminder_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

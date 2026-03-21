-- CreateEnum
CREATE TYPE "JourneyTriggerType" AS ENUM ('JOURNEY_DAY', 'BIRTHDAY', 'CUSTOM');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "hdType" TEXT;

-- CreateTable
CREATE TABLE "JourneyMessageTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dayTrigger" INTEGER NOT NULL,
    "triggerType" "JourneyTriggerType" NOT NULL DEFAULT 'JOURNEY_DAY',
    "hdVariants" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JourneyMessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourneyMessageLog" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dayNumber" INTEGER NOT NULL,
    "hdType" TEXT NOT NULL,
    "variantUsed" TEXT NOT NULL,

    CONSTRAINT "JourneyMessageLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "JourneyMessageLog" ADD CONSTRAINT "JourneyMessageLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyMessageLog" ADD CONSTRAINT "JourneyMessageLog_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "JourneyMessageTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

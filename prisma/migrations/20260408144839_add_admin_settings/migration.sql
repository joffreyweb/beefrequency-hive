-- CreateTable
CREATE TABLE "AdminSettings" (
    "id" TEXT NOT NULL,
    "emailReminderSession" BOOLEAN NOT NULL DEFAULT true,
    "emailNewMessage" BOOLEAN NOT NULL DEFAULT true,
    "notifyOverdueTask" BOOLEAN NOT NULL DEFAULT true,
    "defaultSessionDuration" INTEGER NOT NULL DEFAULT 60,
    "sessionBuffer" INTEGER NOT NULL DEFAULT 15,
    "senderEmail" TEXT,
    "emailSignature" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Brussels',
    "language" TEXT NOT NULL DEFAULT 'fr',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSettings_pkey" PRIMARY KEY ("id")
);

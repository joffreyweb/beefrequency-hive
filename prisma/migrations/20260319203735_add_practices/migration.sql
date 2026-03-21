-- CreateEnum
CREATE TYPE "PracticeType" AS ENUM ('BREATHING', 'VIDEO', 'MEDITATION');

-- CreateEnum
CREATE TYPE "PracticeCategory" AS ENUM ('RESPIRATION', 'MEDITATION', 'MOUVEMENT', 'RITUAL');

-- CreateTable
CREATE TABLE "Practice" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "PracticeType" NOT NULL,
    "content" TEXT NOT NULL,
    "category" "PracticeCategory" NOT NULL,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "dayTrigger" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Practice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientPractice" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "lastCompletedAt" TIMESTAMP(3),
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ClientPractice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientPractice_clientId_practiceId_key" ON "ClientPractice"("clientId", "practiceId");

-- AddForeignKey
ALTER TABLE "ClientPractice" ADD CONSTRAINT "ClientPractice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPractice" ADD CONSTRAINT "ClientPractice_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "Practice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

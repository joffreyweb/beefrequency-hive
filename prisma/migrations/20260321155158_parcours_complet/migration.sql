-- CreateEnum
CREATE TYPE "ElixirCategory" AS ENUM ('ACTIVATION', 'INTEGRATION', 'SUPPORT');

-- CreateEnum
CREATE TYPE "ElixirTiming" AS ENUM ('MATIN', 'SOIR', 'JOURNEE', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "ElixirUnit" AS ENUM ('GOUTTES', 'GELULES', 'CAPUCHONS');

-- CreateEnum
CREATE TYPE "PhaseType" AS ENUM ('CYCLE', 'BREAK');

-- CreateEnum
CREATE TYPE "PhaseStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PhaseFrequency" AS ENUM ('DAILY', 'MON_JEU', 'MAR_VEN', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE');

-- CreateEnum
CREATE TYPE "PhasePracticeType" AS ENUM ('BREATHING', 'MEDITATION', 'WRITING', 'MOVEMENT');

-- CreateEnum
CREATE TYPE "PhasePracticeFrequency" AS ENUM ('DAILY', 'SPECIFIC_DAYS');

-- CreateEnum
CREATE TYPE "DreamAnswer" AS ENUM ('OUI', 'NON', 'SAIS_PAS');

-- CreateTable
CREATE TABLE "ElixirLibrary" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "unit" "ElixirUnit" NOT NULL,
    "category" "ElixirCategory" NOT NULL,
    "timing" "ElixirTiming" NOT NULL DEFAULT 'FLEXIBLE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ElixirLibrary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientPhase" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "phaseType" "PhaseType" NOT NULL,
    "phaseNumber" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "PhaseStatus" NOT NULL DEFAULT 'UPCOMING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhaseElixir" (
    "id" TEXT NOT NULL,
    "clientPhaseId" TEXT NOT NULL,
    "elixirLibraryId" TEXT NOT NULL,
    "dose" TEXT,
    "frequency" "PhaseFrequency" NOT NULL DEFAULT 'DAILY',
    "timing" "ElixirTiming" NOT NULL DEFAULT 'FLEXIBLE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhaseElixir_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhasePractice" (
    "id" TEXT NOT NULL,
    "clientPhaseId" TEXT NOT NULL,
    "type" "PhasePracticeType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER,
    "frequency" "PhasePracticeFrequency" NOT NULL DEFAULT 'DAILY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhasePractice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyCheckin" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "phase" "PhaseType" NOT NULL,
    "energyLevel" INTEGER,
    "sleepQuality" INTEGER,
    "sleepType" TEXT,
    "dreamed" "DreamAnswer",
    "dreamNotes" TEXT,
    "morningGratitude" TEXT,
    "freeFeeling" TEXT,
    "pride1" TEXT,
    "pride2" TEXT,
    "pride3" TEXT,
    "gratitudeMoment" TEXT,
    "gratitudeSensation" TEXT,
    "gratitudeRecu" TEXT,
    "gratitudeSoi" TEXT,
    "selfQuality" TEXT,
    "closingSentence" TEXT,
    "elixirTaken" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyCheckin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientPhase_clientId_phaseType_phaseNumber_key" ON "ClientPhase"("clientId", "phaseType", "phaseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCheckin_clientId_date_key" ON "DailyCheckin"("clientId", "date");

-- AddForeignKey
ALTER TABLE "ClientPhase" ADD CONSTRAINT "ClientPhase_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhaseElixir" ADD CONSTRAINT "PhaseElixir_clientPhaseId_fkey" FOREIGN KEY ("clientPhaseId") REFERENCES "ClientPhase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhaseElixir" ADD CONSTRAINT "PhaseElixir_elixirLibraryId_fkey" FOREIGN KEY ("elixirLibraryId") REFERENCES "ElixirLibrary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhasePractice" ADD CONSTRAINT "PhasePractice_clientPhaseId_fkey" FOREIGN KEY ("clientPhaseId") REFERENCES "ClientPhase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCheckin" ADD CONSTRAINT "DailyCheckin_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

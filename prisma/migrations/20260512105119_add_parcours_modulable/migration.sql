-- CreateEnum
CREATE TYPE "ParcoursType" AS ENUM ('LE_PASSAGE', 'NECTAR_CYCLE', 'SEANCE_UNIQUE', 'RESET_6', 'CUSTOM');

-- AlterTable
ALTER TABLE "Client"
  ADD COLUMN "parcoursType" "ParcoursType" NOT NULL DEFAULT 'LE_PASSAGE',
  ADD COLUMN "requiresWelcomeVideo" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "requiresConvention" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "requiresQuestionnaire" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "requiresPhaseVideos" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "requiresMorningCheckin" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "requiresEveningCheckin" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "requiresJournal" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "requiresProgramTimeline" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "InviteToken"
  ADD COLUMN "parcoursType" "ParcoursType" NOT NULL DEFAULT 'LE_PASSAGE',
  ADD COLUMN "requiresWelcomeVideo" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "requiresConvention" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "requiresQuestionnaire" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "requiresPhaseVideos" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "requiresMorningCheckin" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "requiresEveningCheckin" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "requiresJournal" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "requiresProgramTimeline" BOOLEAN NOT NULL DEFAULT true;

-- ════════════════════════════════════════════════════════════════════════
-- LOT P0 — Binding offres complet + questionnaire modulaire par sections
-- 27 mai 2026
--
-- NON DESTRUCTIF + idempotent. N'utilise aucune nouvelle valeur d'enum dans
-- des données (sûr en transaction sur PG ≥ 12 ; prod = PG 14.23).
--
--   + 8 valeurs ParcoursType (DISCOVERY, CYCLES_RUCHE, CEREMONIE_RESET,
--     RUCHE_VIVANTE, SOUVERAINETE, CHAMBRE_REINE, SOS_URGENCE, FIL_RUCHE)
--   + 3 colonnes Client.followUp* (parcours FIL_RUCHE)
--   + table QuestionnaireSection (bibliothèque de sections)
--   + table ClientQuestionnaireSection (réponses client × section)
-- ════════════════════════════════════════════════════════════════════════

-- 1. Nouvelles valeurs d'enum ParcoursType (ADD VALUE IF NOT EXISTS = idempotent, PG12+)
ALTER TYPE "ParcoursType" ADD VALUE IF NOT EXISTS 'DISCOVERY';
ALTER TYPE "ParcoursType" ADD VALUE IF NOT EXISTS 'CYCLES_RUCHE';
ALTER TYPE "ParcoursType" ADD VALUE IF NOT EXISTS 'CEREMONIE_RESET';
ALTER TYPE "ParcoursType" ADD VALUE IF NOT EXISTS 'RUCHE_VIVANTE';
ALTER TYPE "ParcoursType" ADD VALUE IF NOT EXISTS 'SOUVERAINETE';
ALTER TYPE "ParcoursType" ADD VALUE IF NOT EXISTS 'CHAMBRE_REINE';
ALTER TYPE "ParcoursType" ADD VALUE IF NOT EXISTS 'SOS_URGENCE';
ALTER TYPE "ParcoursType" ADD VALUE IF NOT EXISTS 'FIL_RUCHE';

-- 2. Colonnes de suivi continuité (FIL_RUCHE)
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "followUpActive"            BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "followUpSessionsRemaining" INTEGER;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "followUpStartedAt"         TIMESTAMP(3);

-- 3. Bibliothèque de sections de questionnaire
CREATE TABLE IF NOT EXISTS "QuestionnaireSection" (
  "id"        TEXT NOT NULL,
  "slug"      TEXT NOT NULL,
  "title"     TEXT NOT NULL,
  "order"     INTEGER NOT NULL DEFAULT 0,
  "questions" JSONB NOT NULL DEFAULT '[]',
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "QuestionnaireSection_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "QuestionnaireSection_slug_key" ON "QuestionnaireSection"("slug");

-- 4. Réponses client × section
CREATE TABLE IF NOT EXISTS "ClientQuestionnaireSection" (
  "id"          TEXT NOT NULL,
  "clientId"    TEXT NOT NULL,
  "sectionId"   TEXT NOT NULL,
  "answers"     JSONB NOT NULL DEFAULT '{}',
  "completedAt" TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClientQuestionnaireSection_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ClientQuestionnaireSection_clientId_sectionId_key"
  ON "ClientQuestionnaireSection"("clientId", "sectionId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClientQuestionnaireSection_clientId_fkey') THEN
    ALTER TABLE "ClientQuestionnaireSection"
      ADD CONSTRAINT "ClientQuestionnaireSection_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClientQuestionnaireSection_sectionId_fkey') THEN
    ALTER TABLE "ClientQuestionnaireSection"
      ADD CONSTRAINT "ClientQuestionnaireSection_sectionId_fkey"
      FOREIGN KEY ("sectionId") REFERENCES "QuestionnaireSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

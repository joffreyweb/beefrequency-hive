-- ═══════════════════════════════════════════════════════════════════════
-- ÉTAPE 1 — Socle « ClientParcours » (base commune à TOUS les programmes)
-- ADDITIF · NON DESTRUCTIF · IDEMPOTENT
--
-- Ce script crée l'entité de parcours et rattache les données existantes
-- SANS rien supprimer. Aucune lecture applicative ne change à ce stade :
-- l'affichage reste piloté par les colonnes Client. C'est le socle sûr.
--
-- ⚠️ ORDRE D'EXÉCUTION : lancer CE script sur le VPS AVANT de pousser le
--    code (schema.prisma). Raison : `prisma db push` ne crée pas les
--    colonnes de façon fiable sur ce VPS (leçon L140). On crée donc la
--    structure à la main d'abord ; le push suivant sera un no-op.
--
-- À lancer une seule fois (mais relançable sans danger : tout est gardé
-- par IF NOT EXISTS / NOT EXISTS).
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- pour gen_random_uuid()

-- 1) Enum cycle de vie ----------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "ParcoursLifecycle" AS ENUM ('ACTIVE', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Table instance de parcours ------------------------------------------
CREATE TABLE IF NOT EXISTS "ClientParcours" (
  "id"               text PRIMARY KEY,
  "clientId"         text NOT NULL,
  "parcoursType"     "ParcoursType"      NOT NULL DEFAULT 'LE_PASSAGE',
  "detoxStartDate"   timestamp(3),
  "programTotalDays" integer,
  "status"           "ParcoursLifecycle" NOT NULL DEFAULT 'ACTIVE',
  "seq"              integer             NOT NULL DEFAULT 1,
  "startedAt"        timestamp(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt"      timestamp(3),
  "createdAt"        timestamp(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        timestamp(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClientParcours_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ClientParcours_clientId_idx"
  ON "ClientParcours"("clientId");
CREATE INDEX IF NOT EXISTS "ClientParcours_clientId_status_idx"
  ON "ClientParcours"("clientId", "status");

-- 3) FK clientParcoursId sur les 3 tables de suivi (nullable en Étape 1) --
ALTER TABLE "ClientPhase"  ADD COLUMN IF NOT EXISTS "clientParcoursId" text;
ALTER TABLE "DailyCheckin" ADD COLUMN IF NOT EXISTS "clientParcoursId" text;
ALTER TABLE "DetoxDay"     ADD COLUMN IF NOT EXISTS "clientParcoursId" text;

DO $$ BEGIN
  ALTER TABLE "ClientPhase" ADD CONSTRAINT "ClientPhase_clientParcoursId_fkey"
    FOREIGN KEY ("clientParcoursId") REFERENCES "ClientParcours"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "DailyCheckin" ADD CONSTRAINT "DailyCheckin_clientParcoursId_fkey"
    FOREIGN KEY ("clientParcoursId") REFERENCES "ClientParcours"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "DetoxDay" ADD CONSTRAINT "DetoxDay_clientParcoursId_fkey"
    FOREIGN KEY ("clientParcoursId") REFERENCES "ClientParcours"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "ClientPhase_clientParcoursId_idx"
  ON "ClientPhase"("clientParcoursId");
CREATE INDEX IF NOT EXISTS "DailyCheckin_clientParcoursId_idx"
  ON "DailyCheckin"("clientParcoursId");
CREATE INDEX IF NOT EXISTS "DetoxDay_clientParcoursId_idx"
  ON "DetoxDay"("clientParcoursId");

-- 4) BACKFILL : 1 instance par client ayant un parcours -------------------
--    (client avec detoxStartDate OU au moins une ClientPhase).
--    Statut calculé : COMPLETED si la fin théorique est déjà passée.
--    Idempotent : ne recrée pas si le client a déjà une instance.
INSERT INTO "ClientParcours"
  ("id", "clientId", "parcoursType", "detoxStartDate", "programTotalDays",
   "status", "seq", "startedAt", "completedAt", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  c."id",
  c."parcoursType",
  c."detoxStartDate",
  c."programTotalDays",
  CASE
    WHEN c."detoxStartDate" IS NOT NULL
     AND c."detoxStartDate" + (COALESCE(c."programTotalDays", 103) * INTERVAL '1 day') < now()
    THEN 'COMPLETED'::"ParcoursLifecycle"
    ELSE 'ACTIVE'::"ParcoursLifecycle"
  END,
  1,
  COALESCE(c."detoxStartDate", c."createdAt"),
  CASE
    WHEN c."detoxStartDate" IS NOT NULL
     AND c."detoxStartDate" + (COALESCE(c."programTotalDays", 103) * INTERVAL '1 day') < now()
    THEN c."detoxStartDate" + (COALESCE(c."programTotalDays", 103) * INTERVAL '1 day')
    ELSE NULL
  END,
  now(), now()
FROM "Client" c
WHERE (
    c."detoxStartDate" IS NOT NULL
    OR EXISTS (SELECT 1 FROM "ClientPhase" p WHERE p."clientId" = c."id")
  )
  AND NOT EXISTS (SELECT 1 FROM "ClientParcours" cp WHERE cp."clientId" = c."id");

-- 5) Rattachement des enfants à l'instance du client ----------------------
--    En Étape 1, chaque client a exactement 1 instance → jointure non ambiguë.
UPDATE "ClientPhase" ch
  SET "clientParcoursId" = cp."id"
  FROM "ClientParcours" cp
  WHERE cp."clientId" = ch."clientId" AND ch."clientParcoursId" IS NULL;

UPDATE "DailyCheckin" ch
  SET "clientParcoursId" = cp."id"
  FROM "ClientParcours" cp
  WHERE cp."clientId" = ch."clientId" AND ch."clientParcoursId" IS NULL;

UPDATE "DetoxDay" ch
  SET "clientParcoursId" = cp."id"
  FROM "ClientParcours" cp
  WHERE cp."clientId" = ch."clientId" AND ch."clientParcoursId" IS NULL;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════
-- VÉRIFICATIONS (à lancer après le COMMIT — aucune ne doit rien casser)
-- ═══════════════════════════════════════════════════════════════════════

-- V1 · Chaque client à parcours a EXACTEMENT 1 instance (0 ligne attendue) :
-- SELECT c."id", count(cp.*) AS n
--   FROM "Client" c
--   LEFT JOIN "ClientParcours" cp ON cp."clientId" = c."id"
--   WHERE c."detoxStartDate" IS NOT NULL
--      OR EXISTS (SELECT 1 FROM "ClientPhase" p WHERE p."clientId" = c."id")
--   GROUP BY c."id" HAVING count(cp.*) <> 1;

-- V2 · Zéro enfant orphelin parmi les clients ayant une instance :
-- SELECT 'phase'   AS t, count(*) FROM "ClientPhase"  WHERE "clientParcoursId" IS NULL AND "clientId" IN (SELECT "clientId" FROM "ClientParcours")
-- UNION ALL SELECT 'checkin', count(*) FROM "DailyCheckin" WHERE "clientParcoursId" IS NULL AND "clientId" IN (SELECT "clientId" FROM "ClientParcours")
-- UNION ALL SELECT 'detox',   count(*) FROM "DetoxDay"     WHERE "clientParcoursId" IS NULL AND "clientId" IN (SELECT "clientId" FROM "ClientParcours");

-- V3 · État des parcours (Laura doit apparaître en COMPLETED) :
-- SELECT u."name", cp."status", cp."detoxStartDate", cp."programTotalDays", cp."completedAt"
--   FROM "ClientParcours" cp
--   JOIN "Client" c ON c."id" = cp."clientId"
--   JOIN "User" u  ON u."id" = c."userId"
--   ORDER BY cp."status", u."name";

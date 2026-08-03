-- ═══════════════════════════════════════════════════════════════════════
-- ÉTAPE 2B-α — Re-scope des contraintes d'unicité sur l'INSTANCE de parcours
-- ClientPhase : [clientId, phaseType, phaseNumber] → [clientParcoursId, phaseType, phaseNumber]
-- DetoxDay    : [clientId, dayNumber]             → [clientParcoursId, dayNumber]
--
-- Objectif : autoriser un 2e parcours qui réutilise DETOX/0, jour détox 1..10, etc.
-- sans collision avec le parcours précédent.
--
-- ⚠️ ORDRE STRICT pour ne JAMAIS casser le service (swap de contrainte zéro-downtime) :
--   1. Ce PHASE 1 (ADD new) — À LANCER AVANT le git push.
--   2. git push (déploie le code qui upsert sur la nouvelle clé + db push).
--   3. Ce PHASE 2 (DROP old) — À LANCER APRÈS le déploiement vert.
-- Chaque phase est idempotente.
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
-- PHASE 1 — AJOUTER les nouvelles unicités (on garde les anciennes) · AVANT le push
-- ───────────────────────────────────────────────────────────────────────
BEGIN;
DO $$ BEGIN
  ALTER TABLE "ClientPhase"
    ADD CONSTRAINT "ClientPhase_clientParcoursId_phaseType_phaseNumber_key"
    UNIQUE ("clientParcoursId", "phaseType", "phaseNumber");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "DetoxDay"
    ADD CONSTRAINT "DetoxDay_clientParcoursId_dayNumber_key"
    UNIQUE ("clientParcoursId", "dayNumber");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
COMMIT;

-- ───────────────────────────────────────────────────────────────────────
-- PHASE 2 — SUPPRIMER les anciennes unicités · APRÈS le déploiement vert
-- (elles empêchent un 2e parcours de réutiliser les mêmes phaseType/phaseNumber)
-- ───────────────────────────────────────────────────────────────────────
-- BEGIN;
-- ALTER TABLE "ClientPhase" DROP CONSTRAINT IF EXISTS "ClientPhase_clientId_phaseType_phaseNumber_key";
-- ALTER TABLE "DetoxDay"    DROP CONSTRAINT IF EXISTS "DetoxDay_clientId_dayNumber_key";
-- COMMIT;

-- ───────────────────────────────────────────────────────────────────────
-- VÉRIFICATION (après PHASE 2) — doit montrer les nouvelles clés, plus les anciennes
-- ───────────────────────────────────────────────────────────────────────
-- SELECT conname FROM pg_constraint WHERE conrelid = '"ClientPhase"'::regclass AND contype='u';
-- SELECT conname FROM pg_constraint WHERE conrelid = '"DetoxDay"'::regclass AND contype='u';

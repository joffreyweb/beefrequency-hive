-- ════════════════════════════════════════════════════════════════════════
-- LOT 2 — Unification des modèles élixirs + source de date canonique
-- 25 mai 2026
--
-- NON DESTRUCTIF pour les données vivantes : on RENOMME la table catalogue
-- (ElixirLibrary -> Elixir) au lieu de DROP+CREATE, donc les lignes survivent.
--
--   PRÉSERVE  : 11 lignes catalogue (ElixirLibrary -> Elixir, mêmes UUID)
--               52 lignes PhaseElixir (le FK suit automatiquement le rename)
--   SUPPRIME  : ElixirPrescription (0 ligne), ancien Elixir (2 lignes legacy mortes),
--               Client.programmeStartDate (NULL partout — source de date canonique = detoxStartDate)
--   REPOINTE  : CheckinElixir.elixirPrescriptionId -> phaseElixirId (0 ligne)
--
-- Idempotent (re-exécutable sans erreur). Atomicité fournie par le runner :
--   - prisma migrate deploy/dev  -> transaction automatique de Prisma
--   - application manuelle psql   -> `psql --single-transaction -f migration.sql`
-- (Pas de BEGIN/COMMIT explicite pour ne pas entrer en conflit avec la transaction de Prisma.)
-- ════════════════════════════════════════════════════════════════════════

-- 1. Nouveaux champs du catalogue (ajoutés AVANT le rename, tant que la table s'appelle ElixirLibrary)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'ElixirLibrary') THEN
    ALTER TABLE "ElixirLibrary" ADD COLUMN IF NOT EXISTS "isActive"  BOOLEAN      NOT NULL DEFAULT true;
    ALTER TABLE "ElixirLibrary" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- 2. Détacher CheckinElixir de l'ancien ElixirPrescription (avant de droper la table)
ALTER TABLE "CheckinElixir" DROP CONSTRAINT IF EXISTS "CheckinElixir_elixirPrescriptionId_fkey";

-- 3. Supprimer les modèles morts (ElixirPrescription 0 ligne ; ancien Elixir 2 lignes legacy).
--    GARDE-FOU IDEMPOTENCE : on ne droppe "Elixir" QUE tant qu'ElixirLibrary existe encore
--    (état pré-migration, où "Elixir" = l'ancien catalogue legacy). Après le rename,
--    "Elixir" est le catalogue unifié — ce bloc est alors entièrement sauté.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'ElixirLibrary') THEN
    DROP TABLE IF EXISTS "ElixirPrescription" CASCADE;
    DROP TABLE IF EXISTS "Elixir" CASCADE;
  END IF;
END $$;

-- 4. Renommer ElixirLibrary -> Elixir.
--    Le FK "PhaseElixir_elixirLibraryId_fkey" pointe par OID : il suit le rename
--    automatiquement, donc les 52 PhaseElixir restent valides sans toucher leurs lignes.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'ElixirLibrary') THEN
    ALTER TABLE "ElixirLibrary" RENAME TO "Elixir";
  END IF;
END $$;

-- 4b. Aligner le nom de la contrainte PK sur le nouveau nom de table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ElixirLibrary_pkey') THEN
    ALTER TABLE "Elixir" RENAME CONSTRAINT "ElixirLibrary_pkey" TO "Elixir_pkey";
  END IF;
END $$;

-- 5. Repointer CheckinElixir (0 ligne) vers PhaseElixir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'CheckinElixir'
               AND column_name = 'elixirPrescriptionId') THEN
    ALTER TABLE "CheckinElixir" RENAME COLUMN "elixirPrescriptionId" TO "phaseElixirId";
  END IF;
END $$;

ALTER INDEX IF EXISTS "CheckinElixir_dailyCheckinId_elixirPrescriptionId_key"
  RENAME TO "CheckinElixir_dailyCheckinId_phaseElixirId_key";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CheckinElixir_phaseElixirId_fkey') THEN
    ALTER TABLE "CheckinElixir"
      ADD CONSTRAINT "CheckinElixir_phaseElixirId_fkey"
      FOREIGN KEY ("phaseElixirId") REFERENCES "PhaseElixir"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 6. Source de date canonique : supprimer programmeStartDate (NULL pour les 5 clients)
ALTER TABLE "Client" DROP COLUMN IF EXISTS "programmeStartDate";

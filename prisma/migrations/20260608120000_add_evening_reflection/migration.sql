-- Refonte page check-in SOIR (08/06/2026) — nouveau format 9 champs en JSON.
-- Additif et idempotent. Les colonnes SOIR legacy (gratitudeMoment, gratitudeRecu,
-- freeFeeling, selfQuality, pride1-3, etc.) restent inchangées : historique préservé,
-- aucun risque de perte. Rollback possible : DROP COLUMN sans casse côté code après
-- revert du commit applicatif.
ALTER TABLE "DailyCheckin" ADD COLUMN IF NOT EXISTS "eveningReflection" JSONB;

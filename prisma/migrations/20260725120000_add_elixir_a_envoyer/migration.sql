-- Élixir : à envoyer (colis) vs déjà chez le client (pas d'envoi).
-- Additif, idempotent : sûr même si la colonne existe déjà.
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "elixirAEnvoyer" BOOLEAN NOT NULL DEFAULT true;

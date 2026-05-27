-- LOT — 9ème flag : requiresElixirs (gating accès élixirs côté client)
-- Non destructif + idempotent. Défaut true → les clients existants conservent l'accès.
ALTER TABLE "Client"      ADD COLUMN IF NOT EXISTS "requiresElixirs" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "InviteToken" ADD COLUMN IF NOT EXISTS "requiresElixirs" BOOLEAN NOT NULL DEFAULT true;

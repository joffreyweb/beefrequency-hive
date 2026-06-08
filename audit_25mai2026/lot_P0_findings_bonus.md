# LOT P0 — Findings bonus (non corrigés, lecture/note seulement)

**Date :** 27 mai 2026

## 🟡 BONUS-1 — Seed prod : `www-data` ≠ utilisateur réel de l'app

La commande prévue `sudo -u www-data npx tsx ...` **aurait échoué** : l'app `hive` (pm2)
tourne sous l'utilisateur **`ubuntu`**, et `/var/www/hive/.env` appartient à **`ubuntu`**
(probablement non lisible par `www-data`). Le seed a donc été exécuté **en tant que `ubuntu`**
(utilisateur réel de l'app), ce qui est correct. → Pour tout futur script ponctuel en prod :
utiliser `ubuntu`, pas `www-data`.

## 🟡 BONUS-2 — `prisma/seed-questionnaire-sections.ts` ne charge pas dotenv

Le script instancie `new PrismaClient()` sans `import "dotenv/config"`. Lancé via
`npx tsx`, `process.env.DATABASE_URL` n'est pas chargé automatiquement (seul le CLI Prisma
charge `.env`). Contournement appliqué : injection inline `DATABASE_URL=$(...) npx tsx ...`.
→ Amélioration P1 possible : ajouter `import "dotenv/config";` en tête du seed, ou le
brancher sur le runner de seed Prisma (`package.json#prisma.seed`).

## ℹ️ Rappel (déjà documenté, hors P0)
- `RESET_6` reste dans l'enum ParcoursType (legacy, 0 usage) — non retiré (DROP d'une
  valeur d'enum = destructif). Aliasé sur la config CEREMONIE_RESET.
- `OfferType` non modifié : déjà complet en prod (noms `LES_CYCLES_DE_LA_RUCHE`,
  `LA_CHAMBRE_DE_LA_REINE`, `LE_FIL_DE_LA_RUCHE` — différents des cibles abrégées du brief,
  conservés pour ne pas casser les données existantes).

# LOT 2 — Findings bonus (ne pas toucher sans validation)

**Date :** 25 mai 2026 · Relevé pendant MOUVEMENT 1 (audit DB live)

## 🔴 BONUS-1 — Le déploiement GHA utilise `prisma db push --accept-data-loss`

`.github/workflows/deploy.yml:41` exécute à CHAQUE push sur `main` :

```
npx prisma db push --accept-data-loss
```

**Conséquence directe pour le LOT 2 :** une migration nommée (`prisma migrate`) sera
écrasée/contournée par ce `db push` au prochain déploiement. Les deux mécanismes ne
doivent pas cohabiter. Avant d'appliquer la migration en prod (MOUVEMENT 6), il faudra
décider :
- soit remplacer la ligne 41 par `npx prisma migrate deploy` (recommandé),
- soit appliquer la migration manuellement en SSH et garder `db push` (risqué : `--accept-data-loss` peut DROP des colonnes/tables au prochain déploiement).

→ À trancher au MOUVEMENT 2 (PLAN). Ne PAS modifier deploy.yml sans validation Joffrey.

## 🟠 BONUS-2 — `ClientPhase.status` périmé en base

Laura : phase `CYCLE 3` (18 mai → 7 juin) stockée avec `status = UPCOMING` alors
qu'aujourd'hui (25 mai) elle est active. Le code lit déjà l'état réel via les dates
(`/api/client/current-phase` calcule en JS, ignore le `status` stocké). Le champ
`status` stocké est donc une source de vérité morte et trompeuse pour l'admin.
→ Argument fort pour rendre l'état des phases *calculé* à partir de `detoxStartDate`.

## 🟠 BONUS-3 — Double endpoint élixirs incohérent

- `/api/client/elixirs` et `/api/prescriptions` lisent `ElixirPrescription` (0 row) → vides.
- `/api/client/current-phase` lit `PhaseElixir` → `ElixirLibrary` (données réelles).

Le check-in matin (`app/client/checkin/morning/page.tsx`) et la page
`app/client/elixirs/page.tsx` consomment la source VIDE → c'est la cause racine du
"No elixirs prescribed yet" de Laura. À unifier sur une source unique au LOT 2.

## 🟠 BONUS-4 — `CheckinElixir.elixirPrescriptionId` couplé au mauvais modèle

`CheckinElixir` (0 row) référence `ElixirPrescription` par FK. Si on supprime
`ElixirPrescription`, il faut migrer cette FK vers le modèle d'assignation unifié
(ex-`PhaseElixir`). 0 row → migration triviale, mais le schéma et `/api/checkin-elixirs`
doivent suivre.

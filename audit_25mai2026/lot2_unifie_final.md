# LOT 2 UNIFIÉ — Rapport final

**Date :** 25 mai 2026 · **Commit :** `f67ed99` · **Branche :** `main`
**Déploiement prod :** ✅ GHA run 26415042168 (52s) · migration appliquée · pm2 `hive` online

---

## Résumé technique

### DB unifiée — 1 modèle catalogue + 1 source de date canonique
- **Avant :** 3 modèles parallèles — `Elixir` (2 lignes legacy) + `ElixirLibrary` (11, vivant) + `ElixirPrescription` (0, jamais alimenté → bug Laura).
- **Après :** `ElixirLibrary` **renommée `Elixir`** (catalogue unique, 11 lignes préservées) ; assignation = `PhaseElixir` (52 lignes, phase-scopée) ; `Elixir` legacy + `ElixirPrescription` supprimés ; `CheckinElixir.elixirPrescriptionId → phaseElixirId`.
- **Champs ajoutés :** `Elixir.isActive`, `Elixir.updatedAt`.
- **Migration :** `20260525201727_unify_elixirs_and_dates` — SQL manuel **RENAME (non-destructif)** + **idempotent**, validé en DRY RUN (diff structurel vide + préservation des lignes sur structure prod réelle).

### Source de date canonique
- **`Client.detoxStartDate`** = pilote unique des 7 phases (prouvé : phases de Laura = `computePhases(detoxStartDate)` au jour près).
- **`Client.programmeStartDate` supprimé** (NULL pour les 5 clients). Recâblé partout : `parcours`, `timeline`, `prestart-status`, `home`, `dashboard`, `ParcoursStatusBanner`.
- Bug corrigé : `app/api/parcours` calculait sur `startDate` (≠ phases DB) → bascule sur `detoxStartDate`.

### Alignement 103 jours
- Référence : `lib/parcours.ts` `TOTAL_PROGRAM_DAYS = 103` (10 détox + 3×21 + 3×10).
- Corrigés : dashboard admin (93→103, label de phase canonique), `ClientTimeline` (segment Détox ajouté, 93→103), `ParcoursStatusBanner` (90→103).

### Infra
- `deploy.yml` : `prisma db push --accept-data-loss` → **`prisma migrate deploy`** (le db push aurait DROP les 11 lignes catalogue au prochain deploy).
- Historique migrations prod réconcilié : `20260512132038` marquée `--applied` (déjà en prod via db push). Backup pré-migration : `backups/pre_lot2_20260525_184437.sql.gz`.

---

## Changements
- **32 fichiers** · **+332 / −1558 lignes** (net −1226).
- Supprimés : ancien catalogue `Elixir` (API + UI admin), prescriptions (API + sous-onglet), `ElixirForm.tsx`, `lib/stock-utils.ts`.

## Vérifications prod (post-deploy)
| Check | Résultat |
|---|---|
| `prisma migrate status` | Database schema is up to date ✅ |
| `Elixir` / `PhaseElixir` | **11 / 52** (préservés) ✅ |
| `ElixirLibrary` / `ElixirPrescription` | n'existent plus ✅ |
| `Client.programmeStartDate` | supprimé ✅ |
| `Elixir.isActive` + `updatedAt` | présents ✅ |
| `CheckinElixir.phaseElixirId` | présent ✅ |
| Laura : PhaseElixir | **10 intacts** ; CYCLE 3 (actif) = **Cell Core** ✅ |
| `/api/client/elixirs` sans auth | 307 → /login (protégé) ✅ |
| pm2 `hive` | online ✅ |

---

## ⚠️ ACTION JOFFREY — Test Laura

Connecte-toi à la PWA prod : **https://hive.joffreydeleplanque.com**, compte **laura@asklaura.com**, puis ouvre **`/client/elixirs`**.

- **Attendu :** la page affiche **Cell Core** (son élixir de la phase CYCLE 3, active depuis le 18 mai), au lieu de « No elixirs prescribed yet ».
- Vérifie aussi l'accueil `/client/home` (« Élixirs du jour ») : Cell Core a une fréquence **MON_JEU** (lundi/jeudi) — il n'apparaît dans « du jour » que ces jours-là ; sur la page `/client/elixirs` il apparaît tous les jours.

Confirme-moi que Laura voit bien ses élixirs → je passe au **MOUVEMENT 7 (activation des 5 nouveaux clients)**.

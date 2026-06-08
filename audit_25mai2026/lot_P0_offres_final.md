# LOT P0 — Binding offres complet — Rapport final

**Date :** 27 mai 2026 · **Commit :** `871e987` · **Branche :** `main`
**Déploiement :** ✅ GHA run 26494528193 (50s) · `prisma migrate deploy` OK · pm2 `hive` online

## Résumé exécutif

Chaque offre commerciale configure désormais **automatiquement** le parcours technique et toute son expérience (questionnaire, élixirs, check-ins, phases, journal, anniversaire, accès PWA). Fini le défaut `LE_PASSAGE` appliqué à tort à « Session Seuil ».

- **Source unique** : `lib/offer-parcours-binding.ts` — `OFFER_TO_PARCOURS` (14 offres → 13 parcours) + `PARCOURS_CONFIG` (config complète par parcours). `PARCOURS_DEFAULTS` en est dérivé.
- **UI** (`/admin/clients/new`) : au changement d'offre, le parcoursType + 8 flags basculent automatiquement ; badge **« Configuration auto »** / **« Override manuel »** si l'admin force.
- **Garde-fou serveur** : `/api/invite` et `/api/admin/create-client` dérivent le parcours de l'offre si non fourni — impossible de créer un client mal configuré.
- **Blocage PWA** : `onboardingCompleted` posé à la création selon `requiresQuestionnaire(parcoursType)`. Bloquant pour les parcours qui l'exigent (incl. SEANCE_UNIQUE et RUCHE_VIVANTE — décisions 26/05) ; **exempté pour DISCOVERY + SOS_URGENCE**. Réutilise le gate cookie/proxy existant (pas de middleware DB).
- **Questionnaire modulaire (sections)** : tables `QuestionnaireSection` + `ClientQuestionnaireSection` créées ; 11 sections seedées (vides) ; chaque parcours référence sa liste de sections.
- **FIL_RUCHE** : 3 colonnes `Client.followUp*` ajoutées.

## Tests effectués (prod)

| Vérification | Résultat |
|---|---|
| `prisma migrate status` | Database schema is up to date ✅ |
| `enum_range(ParcoursType)` | **13 valeurs** (LE_PASSAGE…FIL_RUCHE) ✅ |
| `COUNT QuestionnaireSection` | **11** (identity…group_dynamic) ✅ |
| `COUNT Client WHERE followUpActive IS NULL` | **0** (default false appliqué aux 5 clients) ✅ |
| Tables `QuestionnaireSection` + `ClientQuestionnaireSection` | présentes ✅ |
| `GET /admin/clients/new` | 307 → login (déployée, protégée, pas 500) ✅ |
| `npm run build` (CI + local) | exit 0 ✅ |
| Binding runtime (local tsx) | SESSION_SEUIL→SEANCE_UNIQUE, CEREMONIE_RESET→CEREMONIE_RESET, LE_PASSAGE_1_1→LE_PASSAGE ✅ |
| reqQuestionnaire : SEANCE_UNIQUE/RUCHE_VIVANTE=true, DISCOVERY/SOS=false | ✅ |

> Le test **interactif** du dropdown (clic → bascule du badge) est du JS client : validé en runtime local, build identique déployé. À confirmer visuellement (ci-dessous).

## Instructions Joffrey — créer un client test sur n'importe quelle offre

1. Va sur **https://hive.joffreydeleplanque.com/admin/clients/new**.
2. Saisis un email (ex. `test+seuil@tonadresse.com` — alias `+` = arrive dans ta boîte).
3. **Choisis une offre** dans le dropdown « Offre » :
   - *Session Seuil* → badge doit afficher **« ✓ Configuration auto — parcours : Séance unique »**
   - *Cérémonie Reset (150€)* → bascule auto vers **« Cérémonie Reset »**
   - *Le Passage 1:1 (3 900€)* → bascule auto vers **« Le Passage 103j »**
4. (Optionnel) Clique dans le **sélecteur de parcours** pour forcer un autre type → le badge passe à **« ⚙ Override manuel »**.
5. Crée l'invitation → le lien généré porte le bon parcours.
6. Comportement PWA attendu après inscription du client :
   - *Conversation exploratoire* / *SOS Urgence VIP* → **accès direct** (pas de questionnaire bloquant).
   - Toutes les autres offres → **redirigé vers l'onboarding** tant que le questionnaire n'est pas rempli.

## Note honnête (P0 vs P1)

Le **formulaire d'onboarding reste unique en P0** (le `ClientIntake` existant fait office de questionnaire bloquant). La **personnalisation par sections** (rendu dynamique des questions propres à chaque parcours, capture dans `ClientQuestionnaireSection`, UI admin d'édition des questions) est **livrable en P1** — la fondation data (tables, 11 sections, binding `questionnaireSections` par parcours) est **déjà en place**.

## Findings bonus
Voir `audit_25mai2026/lot_P0_findings_bonus.md` : seed prod à lancer en `ubuntu` (pas `www-data`) ; seed sans dotenv (contourné).

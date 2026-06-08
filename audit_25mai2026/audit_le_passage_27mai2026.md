# AUDIT « LE PASSAGE 100% OPÉRATIONNEL » — 27 mai 2026
Lecture seule · aucune modification · SELECT only · preuves prod (DB + crontab + curl)
Réf : LOT P0 (871e987) déployé ce matin · LOT 2 (25/05) · audit comms (26/05)

## ⚠️ Constat transversal (bloquant pour « activer les 5 clients »)
- **1 seul client sur 5 a complété l'onboarding** (`ClientIntake` = 1, = Laura). Les 4 autres n'ont **ni prénom fiable, ni birthDate, ni données HD** → anniversaire impossible, perso impossible.
- **marieclaire** : `detoxStartDate` NULL → **0 ClientPhase** → parcours/timeline/élixirs vides. (Déjà signalé LOT 2.)
- Les **ClientPhase ne sont PAS créées automatiquement** : il faut cliquer « Générer le parcours 103 jours » (admin). 4/5 ont 7 phases (28 total) ; marieclaire 0.

---

## PILIER 1 — Inscription complète — 🟡 PARTIEL
**Flow** : `/admin/clients/new` → `POST /api/invite` (crée InviteToken **sans email**, lien manuel) → `/register?token=` → `POST /api/invite/[token]` (crée User+Client) → `/client/onboarding` (ClientIntake) → cookie `onboarding_completed` → `/client`.
**Preuves** : 5 users créés <60j. SMTP `verify()` OK (vérifié 26/05). `ClientIntake` capture bien : firstName, lastName, birthDate, birthTime, birthPlace→birthCity, birthCountry, adresse (postalAddress, addressLine2, city, postalCode, country), phoneNumber, hdType, intention. Cookie posé au submit (`/api/onboarding`) + au login (si `onboardingCompleted`). Page register responsive.
**Problèmes** :
- 🟡 La voie UI principale (`/api/invite`) **n'envoie PAS l'email** — lien à copier/envoyer à la main. (L'email auto existe via `create-client` + `send-invitation`, voies parallèles.)
- 🟡 **4/5 clients n'ont jamais fait l'onboarding** (1 ClientIntake).
**Pour ✅** : (a) brancher l'envoi email auto sur `/api/invite` (réutiliser `sendInvitationEmail`) ; (b) relancer les 4 clients pour compléter l'onboarding.

## PILIER 2 — Timeline 103j / 7 phases — 🟡 PARTIEL
**Preuves** : `detoxStartDate` = source canonique (LOT 2). `computePhases()` (`lib/parcours.ts`, 103j) calcule phases + jour courant en **lecture seule** (pas de cron, robuste). `/api/client/timeline` + `TimelineWidget` affichent « Jour X/103 » + phase + alignés 103j (LOT 2). 4/5 clients = 7 phases (28 total).
**Problèmes** :
- 🟡 **Phases non auto-créées** : génération manuelle via `POST /api/client-phases` (bouton ParcoursSection). Un nouveau client sans ce clic n'a pas de timeline.
- 🔴 **marieclaire** : detox NULL → 0 phase.
- ℹ️ Vérifier que `/api/client-phases` POST calcule bien sur `detoxStartDate` (et pas un autre `programStart`).
**Pour ✅** : (a) auto-générer les 7 ClientPhase quand `detoxStartDate` est posé (dans `parcours-stage`) ; (b) fixer la date détox de marieclaire.

## PILIER 3 — Check-ins matin + soir — 🟡 PARTIEL
**Preuves** : modèle unique **`DailyCheckin`** (1 row/jour, champs matin `energyLevel`/`morningGratitude`/`morningPhotoPath` + soir `gratitudeMoment`/`gratitudeSensation`/`gratitudeRecu`/`gratitudeSoi`/`eveningPhotoPath` + `elixirTaken`). Pages `/client/checkin/morning` + `/evening`. API `/api/daily-checkin` + `/api/checkin/status`. Vue admin `/api/admin/daily-checkins` + cockpit `last-checkins`. **Usage réel** : 13 check-ins (Laura 12, dernier 27/05 ; yasmine 1). → le cœur **fonctionne end-to-end**.
**Problème** :
- 🔴 **Aucun rappel** (pas de web-push, pas d'email « check-in non rempli à 21h »). L'engagement repose sur l'ouverture spontanée.
**Pour ✅** : implémenter un rappel (web-push PWA ou email quotidien conditionnel).

## PILIER 4 — Élixirs — ✅ MARCHE (hors rappels)
**Preuves** : modèle unifié `Elixir` (**11**) + assignation `PhaseElixir` (**52**) (LOT 2). Admin assigne par phase via `ParcoursSection`. Client voit ses élixirs (`/client/elixirs` + « élixirs du jour » sur l'accueil, recâblés LOT 2). Laura voit Cell Core (vérifié 25/05).
**Problème** :
- 🔴 **Aucun rappel de prise** (cron/push). Affichage in-app passif uniquement.
**Pour ✅** (engagement) : rappel de prise (même canal que P3).

## PILIER 5 — Journal — ✅ MARCHE (0 usage)
**Preuves** : `JournalEntry` + routes `/api/journal` (GET/POST) + `/api/journal/[id]` (PATCH/DELETE) + `/api/journal/upload`. UI `/client/journal`. Lecture admin (onglet Journal de `ClientProfileTabs`, filtre `isPrivate`). **0 entrée en prod** (jamais utilisé, mais code complet et fonctionnel).
**Pour ✅** : rien de cassé ; éventuellement encourager l'usage (lien depuis l'accueil/check-in).

## PILIER 6 — Messages automatiques (journey) — 🔴 ABSENT/DORMANT
**Preuves** : `journey-messages/process` = **307** (proxy bloque, **pas dans `publicPaths`**) + `requireAdmin` + **aucun cron** + **0 `JourneyMessageTemplate`** + **0 log**. Triggers codés = `JOURNEY_DAY` (dayTrigger) uniquement ; BIRTHDAY désactivé ; **pas de trigger entrée-de-phase ni fin-de-parcours**. Calcule le jour sur **`startDate`** (≠ `detoxStartDate`) → désaligné.
**Pour ✅** : (a) exposer l'endpoint (`publicPaths` + `x-cron-secret` comme les autres crons) ; (b) cron quotidien ; (c) créer les templates J7/J14/J21/entrée-phase ; (d) corriger `startDate`→`detoxStartDate`.

## PILIER 7 — RDV (séances) — 🟡 PARTIEL
**Preuves** : modèles `Session` + `Appointment`. Emails confirmation (`/api/booking/[token]`, `/api/admin/appointments`) — code présent. **Rappel J-2** (`session-reminders`, cron horaire) **réparé + vérifié 25/05** (envoi email OK). Calendrier client + `/admin/sessions` présents.
**Problèmes** :
- 🟡 **0 Session et 0 Appointment en prod** → flux jamais exercé avec de vraies données.
- 🟡 **Recap post-séance** : généré par `actions/sync` (type RECAP) mais le cron `actions/sync` est **BIRTHDAY-only** et **aucun code n'appelle le sync complet** → recap **non généré automatiquement** (0 PendingAction RECAP).
- 🔴 Pas de rappel J-1 (fenêtre 48h uniquement), pas d'email « merci séance ».
**Pour ✅** : (a) planifier les 1ères séances des clients ; (b) déclencher le sync RECAP (cron complet ou appel dashboard).

## PILIER 8 — Anniversaire admin J-7 + J-1 — 🟡 PARTIEL
**Preuves** : cron `actions/sync` actif (quotidien **5h UTC = 7h Paris**, BIRTHDAY only) — réparé 25/05, endpoint 200, exécution vérifiée. Logique J-1 (« demain ») + J-7 (« dans 7 jours ») dans le code.
**Problèmes** :
- 🟡 **1 seul client sur 5 a `birthDate`** (via ClientIntake) → anniversaire **possible pour 1 seul**.
- ℹ️ Notif = `PendingAction` type BIRTHDAY (pas de table AdminNotification). **0 actuellement** (aucun anniversaire dans la fenêtre + 4 clients sans date).
**Pour ✅** : compléter l'onboarding des 4 clients (→ birthDate). Le mécanisme lui-même est ✅.

## PILIER 9 — Célébration J+103 + Souveraineté — 🔴 ABSENT
**Preuves** : **aucun** template d'email de célébration, **aucun** trigger J+103, **aucune** logique de crédit **-800€** (grep `800/crédit/souverain` → rien de pertinent), **aucun** upgrade path implémenté. `SOUVERAINETE` n'existe que comme valeur d'enum offre/parcours + label.
**Pour ✅** : (a) template email célébration ; (b) détection J+103 (cron ou lecture) ; (c) constante crédit 800€ + logique de conversion 30j ; (d) parcours d'upgrade vers Souveraineté.

---

## Matrice de synthèse

| # | Pilier | Statut | Cœur fonctionnel | Manque principal |
|---|---|---|---|---|
| 1 | Inscription | 🟡 | flow + SMTP OK | email auto sur /api/invite ; 4/5 onboarding non fait |
| 2 | Timeline 103j/7 phases | 🟡 | calcul + UI OK | phases non auto-créées ; marieclaire 0 |
| 3 | Check-ins matin/soir | 🟡 | capture + admin OK (Laura 12) | aucun rappel |
| 4 | Élixirs | ✅ | assign + affichage OK | aucun rappel de prise |
| 5 | Journal | ✅ | code complet | 0 usage (non cassé) |
| 6 | Messages auto (journey) | 🔴 | — | 0 template, 0 cron, 307, startDate |
| 7 | RDV / séances | 🟡 | confirmation + rappel J-2 OK | 0 séance ; recap non auto |
| 8 | Anniversaire | 🟡 | cron OK | 4/5 sans birthDate |
| 9 | Célébration J+103 / Souveraineté | 🔴 | — | tout absent (email, trigger, crédit, upgrade) |

**Score : 2 ✅ · 5 🟡 · 2 🔴**

## Crons actifs (crontab VPS)
- `0 * * * *` session-reminders (rappel séance J-2) — ✅ réparé 25/05
- `*/5 * * * *` caldav webhook (sync agenda) — ✅ réparé 25/05
- `0 5 * * *` actions/sync (anniversaire BIRTHDAY only) — ✅ 25/05
- ❌ **aucun cron** pour journey-messages (P6) ni sync complet RECAP (P7)

## Ordre de correction recommandé (proposition, à arbitrer par Joffrey)
1. 🔴 **P1/P8 data** — faire compléter l'onboarding aux 4 clients + fixer detox marieclaire (débloque P2, P8 d'un coup, sans code).
2. 🟡 **P2** — auto-générer les ClientPhase à la pose de `detoxStartDate` (petit, fiabilise tout nouveau client).
3. 🟡 **P1** — email d'invitation auto sur `/api/invite`.
4. 🔴 **P6** — réveiller les messages parcours (proxy + cron + templates + fix date) si l'expérience en dépend.
5. 🟡 **P3/P4** — canal de rappel (push/email) check-in + élixir.
6. 🟡 **P7** — déclencher le recap + planifier les séances.
7. 🔴 **P9** — célébration J+103 + crédit 800€ + upgrade Souveraineté (chantier produit dédié).

## Verdict global
Le socle **data** (parcours, élixirs, check-ins, journal) est **sain et fonctionnel** post-LOT 2/P0 — Laura le prouve (12 check-ins, élixirs visibles, 7 phases). Mais « Le Passage 100% opérationnel » est bloqué par : (1) l'**onboarding non complété par 4/5 clients** (impact cascade P1/P2/P8), (2) les **automatisations dormantes** (messages parcours P6, recap P7, rappels P3/P4), (3) la **fin de parcours P9 inexistante**. Aucune régression introduite par les lots précédents. La priorité #1 ne nécessite **aucun code** : compléter les données des 5 clients.

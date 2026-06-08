# AUDIT COMMUNICATIONS PAR OFFRE RÉELLE — 26 mai 2026
Lecture seule · aucune modification · aucun envoi · preuves prod (DB + crontab + logs)

## ⚠️ Constat structurant (à lire avant tout)

**L'offre (`offerType`) ne pilote AUCUNE communication.** Le comportement parcours/comms est piloté par **`parcoursType` + 8 flags** (`requiresMorningCheckin`, `requiresProgramTimeline`, …), choisis **indépendamment** de l'offre dans la page d'invitation (`app/admin/clients/new`). Il n'existe **aucun binding offre → parcoursType** dans le code.

- Dans la dropdown d'invitation, `parcoursType` **défaut = `LE_PASSAGE`** quel que soit l'offre choisie → si l'admin ne change pas, **toute offre déclenche un parcours 103 jours complet** (même une "Session Seuil").
- `app/admin/clients/new` → `POST /api/invite` crée **seulement un InviteToken** (offerType + parcoursType + flags). **Aucun email envoyé** (lien `/register?token=` à transmettre manuellement). User/Client créés au `/register`.
- Une 2ᵉ voie existe (`/api/admin/create-client`) qui, elle, crée User+Client+InviteToken **et envoie l'email** (si SMTP) + génère les phases **seulement si `isLegacy`**.

**Conséquence : la "matrice par offre" est en réalité une matrice par `parcoursType`+flags.** Elle est fournie ci-dessous avec le parcoursType *probable* par offre (convention métier, **non appliquée par le code**).

## Les 12 offres réelles + binding code

| # | Label public (UI) | Enum `OfferType` | parcoursType par défaut | Durée parcours | Déclenche parcours ? |
|---|---|---|---|---|---|
| 1 | Conversation exploratoire privée | `CONVERSATION_EXPLORATOIRE` | LE_PASSAGE* | — | non (séance découverte) |
| 2 | Session Seuil | `SESSION_SEUIL` | LE_PASSAGE* | — | non (séance unique) |
| 3 | Le Nectar Cycle (600€) | `LE_NECTAR_CYCLE` | LE_PASSAGE* | 3 séances si NECTAR_CYCLE | partiel |
| 4 | **Le Passage 1:1 (3 900€)** | `LE_PASSAGE_1_1` | LE_PASSAGE | **103 j** | **oui — les 5 clients réels** |
| 5 | Les Cycles de la Ruche (1 200€) | `LES_CYCLES_DE_LA_RUCHE` | LE_PASSAGE* | variable | selon réglage |
| 6 | Cérémonie Reset (150€) | `CEREMONIE_RESET` | LE_PASSAGE* | 6 séances si RESET_6 | partiel |
| 7 | La Ruche Vivante (75€) | `LA_RUCHE_VIVANTE` | LE_PASSAGE* | abonnement | non |
| 8 | Souveraineté (15 000€) | `SOUVERAINETE` | LE_PASSAGE* | premium | selon réglage |
| 9 | La Chambre de la Reine | `LA_CHAMBRE_DE_LA_REINE` | LE_PASSAGE* | — | selon réglage |
| 10 | SOS · Urgence VIP | `SOS_URGENCE_VIP` | LE_PASSAGE* | — | non |
| 11 | Le Fil de la Ruche | `LE_FIL_DE_LA_RUCHE` | LE_PASSAGE* | abonnement | non |
| 12 | Parcours personnalisé | `PARCOURS_PERSONNALISE` | CUSTOM | sur-mesure | selon réglage |

\* = **défaut technique `LE_PASSAGE`** non corrigé par offre. Le bon parcoursType doit être réglé **à la main** par l'admin à l'invitation. parcoursType réels en base : `LE_PASSAGE`(103j, allTrue), `NECTAR_CYCLE`(3 séances), `SEANCE_UNIQUE`, `RESET_6`(6 séances), `CUSTOM`(allFalse). Legacy enum : `HIVE_EXPERIENCE`, `THE_PASSAGE`.

> **Note** : "Parcours personnalisé" (#12) est **absent** de la dropdown `OFFER_OPTIONS` (11 offres listées) ; il s'obtient via le sélecteur de parcoursType (CUSTOM).

## Canaux réels (3, + affichage passif)

| Canal | Implémentation | Usage |
|---|---|---|
| **Email** | `lib/mailer.ts` (Infomaniak SMTP, `transporter`) — `verify()` OK | invitations, RDV, questionnaire, rappels séance, réactivation |
| **Message in-app** | `prisma.message` → `/client/messages` | journey messages, messagerie admin↔client, demande réassort élixir |
| **PendingAction admin** | `lib/notifications.ts` `notifyAdmin()` + `actions/sync` | dashboard "À traiter" |
| Affichage passif | DayMessage (50, aléatoire), TimelineWidget, élixirs du jour | in-app, non notifié |

🔴 **Aucun web-push** (pourtant PWA) : aucun rappel poussé au client (check-in, élixir, séance) — tout dépend de l'ouverture de l'app.

## Inventaire des systèmes (code · déclencheur · canal · auto ? · statut prod)

| Sys | Système | Fichier | Déclencheur | Canal | Statut RÉEL (preuve DB) |
|---|---|---|---|---|---|
| A1 | Invitation (lien) | `/api/invite` | admin (UI new) | — | 🟡 **aucun email** (lien manuel) ; 9 InviteToken (4 utilisés) |
| A2 | Invitation (email) | `create-client` + `send-invitation` | admin | Email | ✅ codé, SMTP OK (try/catch) |
| A3 | Email PWA (post-onboarding) | `onboarding/route.ts:169` `sendPWAEmail` | onboarding complété | Email | 🟡 codé ; 1 seul ClientIntake → peu déclenché |
| A4 | Questionnaire d'entrée | `send-questionnaire` + `questionnaire-entry` | admin / client | Email + PendingAction | 🟡 codé ; 1 intake complété |
| A5 | Charte / produits envoyés/reçus | flags `parcours-stage` + `elixir-received` | client/admin (in-app) | in-app + notifyAdmin | ✅ in-app (pas d'email dédié) |
| B1 | Messages parcours (J7/J14/J21, phases) | `journey-messages/process` | **aucun cron** + `requireAdmin` + hors `publicPaths` | Message in-app | 🔴 **0 template, 0 log, jamais déclenché** ; calcule sur `startDate` (≠ detox) |
| B2 | Auto-assignation pratiques (dayTrigger) | `journey-messages/process` | idem B1 | in-app | 🔴 jamais déclenché (même route morte) |
| B3 | Rappels élixirs quotidiens | — | — | — | ❌ **inexistant** (élixirs affichés in-app seulement) |
| B4 | Notif check-in matin/soir | — | flag `requiresMorningCheckin` (gating UI) | — | ❌ **aucune notif** (check-in passif) |
| B5 | Timeline jour-par-jour | `TimelineWidget` / `client/timeline` | flag `requiresProgramTimeline` | in-app passif | ✅ affichage (detoxStartDate) |
| C1 | Confirmation RDV / booking | `booking/[token]`, `admin/appointments` | event prise RDV | Email | ✅ codé (SMTP OK) |
| C2 | Rappel séance J-2 (48h) | `session-reminders` (cron horaire) | **cron ✅ depuis fix proxy 25/05** | Email | 🟡 **opérationnel mais 0 historique** (cron bloqué avant-hier) ; couvre Session 48h + Appointment 47-48h |
| C3 | Rappel séance J-1 (24h) | — | — | — | ❌ **non implémenté** (fenêtre 48h uniquement) |
| C4 | "Merci pour la séance" | — | — | — | ❌ inexistant |
| C5 | Annul./report RDV | `appointments/[id]/cancel|reschedule` | event client | Email + notifyAdmin | ✅ codé |
| D1 | Anniversaire J-7 / "demain" (admin) | `actions/sync` (cron quotidien) | **cron ✅ depuis 25/05, BIRTHDAY only** | PendingAction | 🟡 actif mais **n'a d'effet que pour 1 client sur 5** (seul à avoir `birthDate`) ; 0 historique |
| D2 | Message anniversaire au client | `journey-messages/process` (désactivé) | — | — | ❌ **désactivé** (commentaire explicite) |
| E1 | Célébration fin de parcours | — | — | — | ❌ inexistant |
| E2 | Suivi 30/60/90j post-parcours | — | — | — | ❌ inexistant |
| E3 | Réactivation / next step | `admin/send-reactivation-email` | **admin manuel** | Email | 🟡 codé, manuel uniquement (pas d'auto) |
| F1 | Dashboard "À traiter" (RECAP/SESSION/SYMPTOM/DOCUMENT) | `actions/sync` | **aucun appelant auto** (cron = BIRTHDAY only ; 0 caller dashboard) | PendingAction | 🔴 **quasi jamais généré** (0 RECAP/SESSION/… en base) |
| F2 | Notif événements client (annul, réassort, questionnaire, onboarding) | `notifyAdmin` | event client | PendingAction | ✅ event-driven (3 CUSTOM en base) |
| F3 | Email notif urgence admin | — | — | — | ❌ pas d'email vers admin (tout via PendingAction) |
| G1 | Newsletter | `admin/newsletter/campaigns/[id]/send` | admin manuel | Email | 🟡 codé ; 1 abonné, 1 campagne |

## Matrice OFFRE × SYSTÈME

Légende : ✅ actif & prouvé · 🟡 codé/opérationnel mais ~0 historique · 🔴 codé mais jamais déclenché · ❌ manquant · n/a non pertinent.
*(Statut = état réel du système ; la colonne "parcours" suppose le parcoursType par défaut de chaque offre.)*

| Offre | A2 Invit. email | A3 PWA | A4 Quest. | B1 Msg parcours | B5 Timeline | C1 Conf. RDV | C2 Rappel 48h | C5 Annul/report | D1 Annivers. | E3 Réactiv. | F2 Notif admin |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 Conversation explor. | ✅ | 🟡 | n/a | 🔴 | n/a* | ✅ | 🟡 | ✅ | 🟡 | 🟡 | ✅ |
| 2 Session Seuil | ✅ | 🟡 | n/a | 🔴 | n/a* | ✅ | 🟡 | ✅ | 🟡 | 🟡 | ✅ |
| 3 Le Nectar Cycle | ✅ | 🟡 | 🟡 | 🔴 | 🟡* | ✅ | 🟡 | ✅ | 🟡 | 🟡 | ✅ |
| 4 **Le Passage 1:1** | ✅ | 🟡 | ✅(1/5) | 🔴 | ✅ | ✅ | 🟡 | ✅ | 🟡(1/5) | 🟡 | ✅ |
| 5 Cycles de la Ruche | ✅ | 🟡 | 🟡 | 🔴 | 🟡* | ✅ | 🟡 | ✅ | 🟡 | 🟡 | ✅ |
| 6 Cérémonie Reset | ✅ | 🟡 | 🟡 | 🔴 | 🟡* | ✅ | 🟡 | ✅ | 🟡 | 🟡 | ✅ |
| 7 La Ruche Vivante | ✅ | 🟡 | n/a | 🔴 | n/a* | ✅ | 🟡 | ✅ | 🟡 | 🟡 | ✅ |
| 8 Souveraineté | ✅ | 🟡 | 🟡* | 🔴 | 🟡* | ✅ | 🟡 | ✅ | 🟡 | 🟡 | ✅ |
| 9 Chambre de la Reine | ✅ | 🟡 | 🟡* | 🔴 | 🟡* | ✅ | 🟡 | ✅ | 🟡 | 🟡 | ✅ |
| 10 SOS Urgence VIP | ✅ | 🟡 | n/a | 🔴 | n/a* | ✅ | 🟡 | ✅ | 🟡 | 🟡 | ✅ |
| 11 Le Fil de la Ruche | ✅ | 🟡 | n/a | 🔴 | n/a* | ✅ | 🟡 | ✅ | 🟡 | 🟡 | ✅ |
| 12 Parcours personnalisé | ✅ | 🟡 | 🟡* | 🔴 | 🟡* | ✅ | 🟡 | ✅ | 🟡 | 🟡 | ✅ |

\* dépend des flags réglés à la main (défaut UI = `LE_PASSAGE` allTrue pour toutes → en pratique tout est "activé" tant que l'admin ne restreint pas).

**Lecture clé** : les colonnes ne varient quasiment PAS d'une offre à l'autre — parce que rien n'est gaté par l'offre. Les vraies différences sont : B1 (🔴 partout), C2 (🟡 partout, neuf), D1 (🟡, 1 client), et le fait que **B3/B4/C3/C4/E1/E2/D2 sont ❌ pour TOUTES les offres**.

## Crons actifs et preuve d'exécution

| Cron | Fréquence | Endpoint | État |
|---|---|---|---|
| session-reminders | horaire (`0 * * * *`) | `/api/session-reminders` | ✅ joignable depuis fix proxy (25/05) ; envoi vérifié end-to-end hier ; **0 SessionReminder historique** (était bloqué avant) |
| caldav webhook | /5 min | `/api/caldav/webhook` | ✅ joignable depuis fix proxy ; sync agenda |
| actions/sync | quotidien `0 5 * * *` (7h Paris) | `/api/actions/sync` | ✅ BIRTHDAY-only ; **0 BIRTHDAY historique** |
| journey-messages/process | **AUCUN** | — | 🔴 jamais planifié → messages parcours morts |

Logs 24h : pas de trace de requête cron (l'app ne log pas les requêtes entrantes), seulement `[mailer] SMTP config`. Endpoints confirmés 200 hier.

## Tables d'historique en prod (preuves)

| Table | Volume | Lecture |
|---|---|---|
| `Message` | **1** (tag NULL, 22/04) | messagerie quasi inutilisée ; **0 message JOURNEY** |
| `JourneyMessageTemplate` | **0** | aucun template → B1 ne peut rien envoyer même avec un cron |
| `JourneyMessageLog` | **0** | jamais d'envoi parcours |
| `PendingAction` | 3 (CUSTOM only ; 1 ouverte) | seul `notifyAdmin` a produit ; **0 RECAP/SESSION/SYMPTOM/DOCUMENT/BIRTHDAY** |
| `SessionReminder` | **0** | aucun rappel séance jamais envoyé |
| `Appointment.reminderSent=true` | **0 / 4** | aucun rappel RDV envoyé |
| `InviteToken` | 9 (4 utilisés, 5 ouverts) | invitations créées |
| `ClientIntake` (avec birthDate) | **1 / 1** | **seul 1 client sur 5 a complété l'intake** → anniversaire possible pour 1 seul |
| `DayMessage` | 50 | pool sagesse in-app actif |
| `NewsletterSubscriber` / `Campaign` | 1 / 1 | embryonnaire |

**Les 5 clients réels** : tous `LE_PASSAGE_1_1` / parcours `LE_PASSAGE` / flags allTrue. **Les 11 autres offres ont 0 client.**

## Actions critiques avant activation des 5 nouveaux clients

🔴 **P1 — Messages de parcours morts (B1/B2)** : `journey-messages/process` n'a aucun cron, exige une session admin, est hors `publicPaths`, et **0 template existe**. Aucun message J7/J14/J21 ni message de phase ne partira. Si l'expérience "Le Passage" repose dessus → à activer (cron + exposition proxy + création des templates) + corriger le calcul `startDate`→`detoxStartDate`.

🔴 **P2 — Intake/birthDate manquant pour 4/5 clients** : seul 1 client a un `ClientIntake`. Sans intake, pas de birthDate (anniversaire impossible), pas de prénom fiable, pas de données HD. Les 5 nouveaux devront compléter l'onboarding/intake, sinon la moitié des comms personnalisées tombent à plat.

🟠 **P3 — Dashboard "À traiter" non alimenté automatiquement (F1)** : `actions/sync` n'est appelé par aucun code au chargement du dashboard, et le cron est BIRTHDAY-only. RECAP/SESSION/SYMPTOM/DOCUMENT ne se génèrent jamais. Décider d'un déclencheur (cron complet ou appel dashboard).

🟠 **P4 — Aucun rappel poussé client** : pas de web-push, pas de rappel check-in (B4), pas de rappel élixir (B3), pas de rappel séance J-1 (C3). L'engagement repose 100% sur l'ouverture spontanée de l'app.

🟡 **P5 — Invitation email incohérente (A1 vs A2)** : la voie UI principale (`/api/invite`) n'envoie PAS d'email (lien manuel). S'assurer d'utiliser `create-client`/`send-invitation` pour un envoi automatique, ou aligner.

🟡 **P6 — parcoursType défaut = LE_PASSAGE pour toutes les offres** : un client "Session Seuil" ou "Conversation" reçoit un parcours 103j complet si l'admin ne change pas le sélecteur. Risque d'incohérence d'expérience.

🟡 **P7 — Pas d'automatisation fin de parcours / suivi (E1/E2)** : célébration et relances 30/60/90j inexistantes ; réactivation manuelle seulement.

## Verdict global

- **Couverture moyenne réelle** : ~**25-30%** des comms attendues sont effectivement actives. La majorité est soit ❌ inexistante (push, rappels client, fin de parcours, J-1, merci-séance), soit 🔴 codée-mais-morte (messages parcours, dashboard sync), soit 🟡 neuve-sans-historique (rappels séance, anniversaire).
- **Ce qui marche vraiment (✅)** : emails événementiels (invitation via create-client, confirmation/annulation RDV, questionnaire), notifications admin sur événement client (`notifyAdmin`), affichages in-app (timeline, élixirs, day-message), SMTP.
- **Top 3 offres les mieux couvertes** : identiques car non gaté par offre — **#4 Le Passage 1:1** (seule réellement peuplée + flags complets), puis toute offre réglée en LE_PASSAGE. La "couverture" vient du parcoursType, pas de l'offre.
- **Top 3 offres les plus risquées** : **toutes les offres courtes** (#1 Conversation, #2 Session Seuil, #10 SOS VIP) qui, par défaut UI, héritent d'un parcours 103j inadapté ; et **#12 Parcours personnalisé** (CUSTOM = allFalse → quasi aucune comms).
- **Le vrai sujet n'est pas "par offre"** : c'est (1) brancher les systèmes dormants (journey messages, sync dashboard), (2) garantir l'intake de chaque client, (3) décider d'un canal de rappel poussé. Ces 3 leviers comptent plus que toute différenciation par offre.

> Bugs/risques notés, **non corrigés** (lecture seule) : calcul `startDate` vs `detoxStartDate` dans `journey-messages/process` ; défaut parcoursType LE_PASSAGE pour toutes offres ; `/api/invite` sans email.

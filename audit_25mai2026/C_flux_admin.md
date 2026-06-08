# RAPPORT C — Flux Admin PWA

**Date :** 25 mai 2026
**Périmètre analysé :** `app/api/admin/*` + `app/admin/*` + `components/admin/*`
**Agent :** C

---

## 🔴 Findings CRITIQUES

| # | Fichier:ligne | Description | Impact | Recommandation |
|---|---|---|---|---|
| C1 | `app/api/admin/clients/[clientId]/hd/route.ts:5-16` | GET sans aucune vérification d'auth (pas de `requireAdmin`, pas de check token). N'importe quel visiteur non authentifié peut récupérer `clientName` + `hdData` (carte Human Design brute) en connaissant un `clientId`. | Fuite RGPD : exposition publique des données HD nominatives de tous les clients. | Ajouter `await requireAdmin()` en tête de GET, comme partout ailleurs. Le POST a déjà le check ; harmoniser. |
| C2 | `app/api/admin/clients/[clientId]/hd/analyze/route.ts:47-55` | Appel `fetch("https://api.anthropic.com/v1/messages", …)` SANS header `x-api-key` ni `anthropic-version`. La requête sera rejetée par l'API (401) — la route ne marche pas. | Feature « Analyse IA Human Design » silencieusement cassée — l'admin clique, rien ne se passe (réponse vide). | Utiliser le SDK `Anthropic` déjà importé ailleurs (`lib/synthesis.ts:3`) avec `process.env.ANTHROPIC_API_KEY`, ou ajouter les headers manquants. |
| C3 | `app/api/admin/session-notes/route.ts` (entier) | Aucune vérification que le `sessionId`/`appointmentId` cible appartient bien à un client existant. Aussi : pas de limite de taille sur `content`. En POST sans `existing`, on crée une note dont **les deux** FK (`sessionId`, `appointmentId`) sont à null si l'appelant n'envoie rien (le `if (!sessionId && !appointmentId)` protège, mais on peut envoyer `sessionId="inexistant"`). | Notes orphelines en base + risque qu'un admin colle une note sur la mauvaise séance par typo d'ID. | Vérifier l'existence de la séance ciblée (`prisma.session.findUnique` / `prisma.appointment.findUnique`) avant create/update + max 50 000 chars. |
| C4 | `app/api/admin/prospects/[id]/convert/route.ts:25-37` | `tempPassword` généré côté admin et **renvoyé en clair** dans la réponse JSON ; `prospect.email` utilisé tel quel sans `.toLowerCase().trim()` (alors que `create-client/route.ts:24` le fait). De plus, **aucun check d'existence préalable** de `User` avec cet email → P2002 non capturé → 500 brut. | Mots de passe en clair dans logs/réseau ; collision email → erreur 500 non gérée. | Normaliser l'email, vérifier l'absence d'`User` existant, hasher + envoyer le mot de passe via `sendInvitationEmail`, ne pas le retourner. |
| C5 | `app/api/admin/newsletter/campaigns/[id]/send/route.ts:14-122` | L'envoi est **synchrone dans la requête HTTP** : boucle `for` avec `await sleep(1000)` entre batches de 50. Pour 1 000 abonnés → 20+ s. Sur VPS / Next 14 dev mode = timeout. De plus, **race condition** : statut passé à `"sending"` seulement APRÈS création de la liste filtrée — un double-clic envoie 2× la campagne avant le check `status === "sending"`. | Risque envois doublons, requête qui tombe en timeout côté reverse-proxy → statut reste `"sending"` à jamais. | Marquer `"sending"` AVANT toute lecture (en `update` avec `where: { status: { not: "sending" } }` pour atomicité), basculer en job (cron `/api/cron/send-campaigns` déjà existant ailleurs ?). |
| C6 | `app/api/admin/clients/[clientId]/route.ts:104-146` | DELETE supprime le `User` en cascade (donc Client + journal + check-ins + messages + prescriptions). Le log RGPD est créé AVANT la suppression — bon. MAIS : aucune transaction. Si `prisma.user.delete` échoue après `gdprDeletionLog.create`, on a un log RGPD orphelin sans suppression effective. | Incohérence audit RGPD : un log peut affirmer une suppression qui n'a jamais eu lieu. | Envelopper `gdprDeletionLog.create` + `user.delete` + `inviteToken.deleteMany` dans `prisma.$transaction([...])`. |
| C7 | `lib/auth.ts:4-6` | `JWT_SECRET` a un fallback hardcodé `"fallback_secret_do_not_use_in_production"`. Si la var d'env manque, l'app boot **silencieusement** avec ce secret connu → tous les JWT signés par cette installation sont forgeable par n'importe qui ayant lu le repo. | Compromission totale de l'auth admin et client. | Faire `throw new Error("JWT_SECRET manquant")` au boot (validation à l'import) si la var n'est pas définie. Aujourd'hui `getSession()` retournerait des sessions valides issues d'un secret public. |

---

## 🟠 Findings IMPORTANTS

| # | Fichier:ligne | Description | Impact | Recommandation |
|---|---|---|---|---|
| C8 | `app/api/admin/session-packs/[id]/route.ts:14, 26` | PATCH appelle `await request.json()` deux fois. Le deuxième `request.json()` jette toujours (body stream consumed). La branche « modifier le pack » (totalSessions / notes) est **morte** silencieusement (catch `=> ({})` → `data` vide → no-op). | Joffrey ne peut pas modifier `totalSessions` ou `notes` d'un pack via cette route. | Lire le body une seule fois en haut, dispatcher en JS sur les champs présents. |
| C9 | `app/admin/clients/[clientId]/page.tsx:187` | `serializedClient = JSON.parse(JSON.stringify(client))` passe l'ENTIER objet Client (y compris `client.notes` marqué « ADMIN ONLY — jamais exposé côté client » dans `schema.prisma:104`, + `hdFullData`, `astroData`, `baziData`, `numerologyData`) en props vers `ClientProfileTabs` (composant `"use client"`). Comme la route est protégée par `app/admin/layout.tsx` (admin only), pas de fuite vers un client réel — mais ces données sont sérialisées dans le HTML du `__NEXT_DATA__` envoyé sur le réseau. | Données sensibles dans la réponse HTML (cache navigateur, proxy, screenshots…). | Faire un `select` Prisma explicite limité aux champs UI + un `pick` des champs avant `JSON.stringify`. Ne jamais sérialiser `notes`, `hdFullData`, `astroData`, `baziData`, `numerologyData` quand ils ne sont pas affichés dans le contexte courant. |
| C10 | `app/api/admin/create-client/route.ts:109` vs `app/api/admin/clients/[clientId]/send-invitation/route.ts:53` | Deux conventions d'URL d'invitation différentes : `${baseUrl}/invite/${token}` à la création, `${baseUrl}/register?token=${token}` au renvoi. La page client (`app/admin/clients/[clientId]/page.tsx:184`) utilise aussi `/register?token=`. | Confusion UX : le 1er lien envoyé par email pointe vers `/invite/X`, les suivants vers `/register?token=X`. Si l'une des deux pages a un bug, l'expérience diverge. | Choisir une seule convention (probablement `/register?token=...` puisque c'est la plus utilisée) et l'appliquer partout. |
| C11 | `app/api/admin/create-client/route.ts:55-92` | `prisma.user.create` puis `prisma.client.create` puis `prisma.inviteToken.create` SANS transaction. Si l'un des trois échoue, on laisse un `User` orphelin sans `Client` (le code après suppose que tout passe). | États incohérents en DB ; un email peut devenir « bloqué » (User existant sans Client) → futures invitations rejetées par P2002. | Envelopper user+client (+ inviteToken si possible) dans `prisma.$transaction([...])`. Garder kDrive/email hors transaction (effets de bord externes). |
| C12 | `app/api/admin/appointments/route.ts:108-130` | Logique de lien `sessionPackId` : si plusieurs `sessionPack` existent pour le client, on prend `findFirst` ordre `paidAt: desc` puis on vérifie `_sum.totalSessions > totalUsed`. La quantité restante est globale, mais le pack lié à l'RDV est uniquement le plus récent. | Comptabilité imprécise : un RDV est lié à un pack qui n'a peut-être plus de séance disponible (le check porte sur la somme tous packs). En cas de pack ancien encore actif, le RDV est mal imputé. | Soit consolider en un seul pack par client, soit choisir le pack `paidAt asc` (FIFO) le plus ancien encore non saturé. |
| C13 | `app/admin/clients/page.tsx:9-17` | `findMany` sur **tous** les clients sans filter `status`, avec `include` (donc tous les champs Client : `notes`, `hdFullData`, JSON de cartes…) chargés en mémoire avant la projection. Pour 100+ clients avec cartes générées, plusieurs MB chargés à chaque vue La Ruche. | Performance dégradée, charge DB, mémoire serveur. | Remplacer `include` par `select` explicite (id, user.name, user.email, offerType, status, language, startDate, analysis.status, questionnaireEntry.status, _count). |
| C14 | `app/api/admin/session-notes/route.ts` (modèle) | Modèle Prisma `SessionNote` (schema:1071) est lu/écrit **uniquement** ici (vérifié via grep). PostSessionModal (`components/admin/PostSessionModal.tsx:57`) le POST. **Bon point :** aucune route non-admin n'y accède. **Mais** : `ClientProfileTabs > SessionsTab` (`app/admin/clients/[clientId]/ClientProfileTabs.tsx:952`) affiche `session.notes` (champ du modèle Session, pas SessionNote). Ces `session.notes` (Session.notes) sont admin-only en pratique, mais **passés au composant client** via `serializedClient.sessions`. | Idem C9 : ces notes sortent dans le HTML envoyé au navigateur de l'admin (pas de fuite vers le client réel, mais sensibles). | Sélection explicite + redaction si l'onglet n'est pas affiché. |
| C15 | `app/api/admin/clients/[clientId]/send-questionnaire/route.ts:63` | `const { sendInvitationEmail } = await import(...)` importé mais **jamais utilisé** (seulement `transporter` est utilisé en ligne 74). Le mail envoyé est un `text` simple, sans HTML/branding, sans bouton CTA, sans bloc PWA, alors que `sendInvitationEmail` propose tout ce template. | Email questionnaire reçu par les clients est minimaliste, sans charte BeeFrequency. | Soit utiliser une fonction dédiée `sendQuestionnaireEmail` avec un template HTML cohérent, soit retirer l'import mort. |
| C16 | `app/api/admin/clients/[clientId]/booking-token/route.ts:48-58` | Email envoyé en `text:` only (pas de HTML). Aucun bouton, juste un lien brut. | UX dégradée — différent du standard utilisé par `sendInvitationEmail`. | Créer `sendBookingEmail` dans `lib/mailer.ts`, harmoniser le template. |
| C17 | `app/api/admin/newsletter/campaigns/[id]/send/route.ts:8` | `BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://hive.joffreydeleplanque.com"`. Autres routes utilisent `NEXT_PUBLIC_BASE_URL` (cf. `send-invitation/route.ts:52`, `booking-token/route.ts:32`, `send-questionnaire/route.ts:58`). | Lien unsubscribe peut pointer vers la mauvaise URL en cas de domaine alternatif (preview, staging). | Standardiser sur `NEXT_PUBLIC_BASE_URL` partout. |
| C18 | `app/api/admin/clients/[clientId]/parcours-stage/route.ts:46-54` | `parseInt(body.totalSessions) || 0` : si Joffrey envoie `0` volontairement (legitime), le `|| 0` est OK ; mais `parseInt("foo")` → NaN → `|| 0` = 0. Pas de validation `Number.isFinite`. Idem `usedSessionsManual`. | Donnée invalide silencieusement remplacée par 0 — Joffrey pense avoir mis 10 séances, finit avec 0. | Valider explicitement et retourner 400 sur input non numérique. |
| C19 | `components/admin/AnalysisSection.tsx:223` | Appelle `/api/analysis/generate` (hors `/api/admin/*`). Selon contexte d'audit (Agent C scope), cette route doit avoir un `requireAdmin`. À vérifier par Agent A/B. | Si non protégé, fuite analyse IA. | Hors scope direct ; signaler à synthèse. |
| C20 | `app/api/admin/cockpit/last-checkins/route.ts` | Cette route renvoie tous les clients actifs + 1 dernier check-in chacun. Mais elle est **jamais appelée** par le dashboard : le dashboard charge directement en SSR depuis `app/admin/dashboard/page.tsx:51-103` puis passe les données au widget. Code mort. | Maintenance. | Soit utiliser la route et alléger la SSR, soit supprimer la route. |

---

## 🟡 Findings MINEURS

| # | Fichier:ligne | Description | Impact | Recommandation |
|---|---|---|---|---|
| C21 | `app/api/admin/prospects/ai-analyze/route.ts:7-22` | Endpoint POST renvoie un placeholder JSON statique. Pas un bug, mais expose la roadmap publique. | Cosmétique. | Renvoyer 501 Not Implemented ou retirer la route jusqu'à implémentation. |
| C22 | `app/admin/dashboard/page.tsx:32-145` | Bloc de 95 lignes de logique de calcul TZ + 10 requêtes Prisma en parallèle dans le composant page. Non factorisé. | Lisibilité, testabilité. | Extraire dans `lib/dashboard-data.ts` ou des Server Actions. |
| C23 | `app/api/admin/tasks/route.ts:25-49` | Pas de validation que `clientId`/`sessionId`/`appointmentId` existent réellement. Insertion silencieuse possible avec FK invalide → P2003 brut. | Erreur 500 non gérée. | Valider l'existence ou capturer P2003 → 400 explicite. |
| C24 | `app/api/admin/modules/[id]/route.ts:40-48` | Upsert des `days` en boucle `for await` (N+1). | Performances négligeables (modules courts), mais idiom impur. | `Promise.all([])` ou `createMany` + `updateMany`. |
| C25 | `app/api/admin/programs/[id]/route.ts:44-49` | `deleteMany` puis boucle `create` pour remplacer la séquence des modules — non transactionnel : si une création échoue, on se retrouve avec un programme aux modules partiellement supprimés. | Corruption programme. | Wrapper dans `prisma.$transaction([])`. |
| C26 | `app/api/admin/settings/route.ts:28` | `dailyRecapTime` est stocké sur le `User` admin (legacy) plus sur `AdminSettings`. Mix de modèles pour un même setting. | Dette technique. | Migrer vers `AdminSettings` exclusivement. |
| C27 | `app/api/admin/clients/[clientId]/route.ts:46-57` | Validation `FLAG_KEYS` : si un flag est envoyé avec `null`, le check `typeof provided !== "boolean"` rejette correctement, mais le message d'erreur n'indique pas quels flags sont valides. | UX dev. | Lister `FLAG_KEYS` dans le message. |
| C28 | `components/admin/PostSessionModal.tsx:86-98` | Si `appointmentId` ET `sessionId` sont absents, le bouton « Enregistrer » réussit silencieusement sans rien marquer comme COMPLETED. | Edge-case rare. | Désactiver le bouton si aucun ID. |
| C29 | `app/admin/clients/[clientId]/page.tsx:175-184` | `inviteLink` cherche un token actif non expiré, mais si le client existe déjà avec compte créé (pas un nouvel invité), un lien d'invitation actif reste en base et est affiché. | Joffrey voit un lien « inviter » pour un client déjà actif. | Filtrer aussi sur `client.user.lastLoginAt == null` ou marquer le token usedAt après création du compte. |
| C30 | `app/api/admin/clients-list/route.ts:14` | Renvoie `user.email` pour tous les clients. Utilisé pour un dropdown agenda. | Pas critique mais email non nécessaire pour un dropdown id+name. | Retirer `email` du select. |
| C31 | `app/api/admin/appointments/[id]/route.ts:55` | Si `body.scheduledAt` reschedule mais `brusselsHour` calculé n'utilise pas `hour12: false` (déjà à `hour12: false` ligne 48-50, OK). Petite asymmétrie : `brusselsMinute` n'a pas `hour12: false` ligne 51-54 (sans incidence pour les minutes). | Cosmétique. | Aligner les options. |
| C32 | `app/api/admin/inactive-clients/route.ts:18` | Filtre `onboardingCompleted: true` — mais `daysSince = 999` pour les clients sans activité (compte comme « rouge »). Un client juste onboardé sans check-in encore = relance immédiate. | Faux positifs. | Ajouter un délai depuis `createdAt` (ex: > 7 jours). |
| C33 | `app/api/admin/generate-cartes/route.ts:15` | `.catch(console.error)` : log serveur uniquement, l'admin n'est jamais notifié si la génération échoue. | UX. | Stocker un statut d'erreur sur Client (déjà partiellement fait via `hdFullData.error` cf. `cartes-status/route.ts:28`). |
| C34 | `components/admin/Sidebar.tsx:31` | Le bouton Logout fail silencieusement si `/api/auth/logout` retourne erreur (catch vide, juste `setLoggingOut(false)`). | UX. | Toaster une erreur. |
| C35 | `app/api/admin/webui-queue/route.ts:21` | PATCH sans validation : `id` peut être manquant → `update({where: {id: undefined}})` qui jette. | Erreur 500. | Valider `id` non vide → 400. |

---

## ✅ Observations factuelles (sans gravité)

- 53 routes API admin protégées par `requireAdmin` de manière cohérente, **sauf** `clients/[clientId]/hd/route.ts` (cf. C1).
- Le check `requireAdmin` est centralisé dans `lib/api-utils.ts` — bonne pratique.
- `getSession()` (lib/auth.ts:53) lit le cookie `token` httpOnly — pas de localStorage, bon.
- Le modèle `SessionNote` (notes de séance privées) n'est exposé via aucune route non-admin. Vérifié par grep global.
- `ClientNotes` (notes internes Joffrey) sauvegardées via `/api/clients/[id]` PATCH (lib/auth.ts → requireAdmin) — admin-only, OK.
- Suppression client crée un `gdprDeletionLog` (RGPD-friendly) avec motif obligatoire côté UI (cf. `ClientActions.tsx:34`).
- Modale suppression à 2 étapes + retape du nom client — bon garde-fou.
- Cockpit dashboard expose `client.notes` ? Vérifié : non, seulement nom/dates/élixirs/RDV — pas de fuite.
- Email d'invitation utilise un template HTML complet avec bloc PWA (lib/mailer.ts:141) — soigné.
- Push web : **aucune dépendance `web-push` détectée**. Le système de notification admin est uniquement basé sur `PendingAction` (DB) + emails SMTP. Pas de risque push.
- Notifications admin (PendingAction) créées via `lib/notifications.ts` — fire-and-forget propre, log d'erreur seulement.
- Validation d'amplitude RDV (≤ 23h00 Brussels) bien implémentée dans `appointments/route.ts:55-72` et `appointments/[id]/route.ts:43-60`.
- DELETE appointment annule Zoom + CalDAV avant la suppression — comportement attendu.
- DELETE client supprime aussi `InviteToken` lié à l'email (`clients/[clientId]/route.ts:142`) — propre.
- ClientProfileTabs est **fully client-side** (`"use client"`) → toutes les données dans `serializedClient` passent dans `__NEXT_DATA__` du HTML. C'est OK puisque seul l'admin atteint cette page, mais cf. C9.
- `app/admin/layout.tsx:14` redirige vers `/login` si `session.role !== "ADMIN"` — bon gating.
- Layout charge 3 compteurs en parallèle (Promise.all) — perf OK.
- Newsletter campaigns supportent désinscription via footer email (`/api/newsletter/unsubscribe`) — conforme RGPD.

---

## 📊 Statistiques

- Fichiers lus : 50 routes/pages/composants ouverts
- Routes analysées : 53 routes API `/api/admin/*` parcourues
- Lignes de code parcourues : ~5 800
- Bugs détectés : 7 🔴 / 13 🟠 / 15 🟡

---

## 🤔 À clarifier avec Joffrey

- 🟡 À CLARIFIER AVEC JOFFREY — Le mot de passe temporaire généré dans `prospects/[id]/convert` (C4) est-il jamais consulté/envoyé au prospect par Joffrey manuellement, ou est-ce un oubli ? Hypothèse : oubli — il faut soit l'envoyer par email, soit forcer un flow d'invitation (token).
- 🟡 À CLARIFIER AVEC JOFFREY — La route `/api/admin/cockpit/last-checkins` (C20) semble morte. Hypothèse : ancienne version remplacée par SSR dans `dashboard/page.tsx`. À supprimer.
- 🟡 À CLARIFIER AVEC JOFFREY — Deux conventions d'URL d'invitation (`/invite/X` vs `/register?token=X`, cf. C10). Laquelle est la canonique ? Hypothèse : `/register?token=` puisque utilisée 2 fois sur 3.
- 🟡 À CLARIFIER AVEC JOFFREY — Le rapport admin envoie-t-il vraiment un email récap quotidien (`dailyRecapTime` dans User + AdminSettings, C26) ? Si oui, où est le cron ? Pas trouvé dans `/api/admin`.
- 🟡 À CLARIFIER AVEC JOFFREY — Quel est le volume cible newsletter (C5) ? Si > 200 abonnés, la route synchrone devient bloquante.

---

## 📝 Note de l'agent pour la synthèse Phase 2

Les notes de séance (`SessionNote`) sont bien isolées en base (aucune lecture côté client confirmée par grep). En revanche, les **« notes admin »** sur le modèle Client (`client.notes`) et les sessions historiques (`Session.notes`) sont sérialisées INTÉGRALEMENT en props vers un composant `"use client"` — pas de fuite vers un user CLIENT puisque la page est gardée par le layout admin, mais ces secrets transitent dans le HTML du SSR (cf. C9, C14). Le risque réel #1 reste C1 (GET `/api/admin/clients/[clientId]/hd` public) et C7 (fallback JWT_SECRET hardcodé) — à patcher en priorité absolue avant la prochaine mise en prod.

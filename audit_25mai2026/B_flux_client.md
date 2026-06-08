# RAPPORT B — Flux Client PWA

**Date :** 25 mai 2026
**Périmètre analysé :** app/api/client/* + app/client/* + components/client/*
**Agent :** B

---

## 🔴 Findings CRITIQUES

| # | Fichier:ligne | Description | Impact | Recommandation |
|---|---|---|---|---|
| C1 | `app/client/elixirs/page.tsx:40` + `app/api/prescriptions/route.ts:47-55` | La page "Mes élixirs" lit `/api/prescriptions` (table `ElixirPrescription` legacy) et n'affiche JAMAIS les `PhaseElixir` assignés via l'admin Parcours. Un élixir assigné à Laura via PhaseElixir apparaît sur `/client/home` UNIQUEMENT pendant la phase active et UNIQUEMENT le jour correspondant à la fréquence, jamais sur la page dédiée. | Désalignement total client/admin : l'admin gère les élixirs dans Parcours mais le client cherche sur "Mes élixirs" et voit "No elixirs prescribed yet". | Unifier : soit lire les `PhaseElixir` dans `/api/prescriptions`, soit créer un endpoint qui agrège PhaseElixir + ElixirPrescription. |
| C2 | `app/client/journal/page.tsx:71` + `app/api/journal/route.ts:60` | La page journal client fait `fetch("/api/journal")` sans param → la route retourne par défaut `isPrivate: false` (ligne 60 : `const isPrivate = isPrivateParam === "true"`). Le client ne voit jamais SES PROPRES entrées privées sur sa page journal. | Le client peut créer une entrée privée (toggle ligne 382) mais elle disparaît immédiatement. Confusion totale, perte apparente de données. Le badge "Private" ligne 428 est du code mort. | Soit retourner les deux types pour le client (fusionner private + non-private quand `session.role === "CLIENT"`), soit ajouter un toggle UI privé/partagé dans la page. |
| C3 | `app/client/checkin/morning/page.tsx:51` + `:115` | Le check-in matin liste les élixirs via `/api/client/elixirs` (table `ElixirPrescription`) et envoie `elixirPrescriptionId` à `/api/checkin-elixirs`. Les `PhaseElixir` actifs (système Parcours en production) ne sont JAMAIS proposés à cocher. | Laura ne peut pas cocher ses élixirs Phase pris le matin → données check-in faussées, tracking impossible. | Aligner le check-in sur PhaseElixir, ou agréger les deux sources. |

## 🟠 Findings IMPORTANTS

| # | Fichier:ligne | Description | Impact | Recommandation |
|---|---|---|---|---|
| I1 | `app/api/client/questionnaire-entry/route.ts:112` | `clientName` est référencé dans le callback `notifyAdmin` BEFORE sa déclaration ligne 120 (closure capture). Le code "marche par accident" car le callback s'exécute dans un microtask après l'init de la const. | Fragile, si on ajoute un `await` synchrone avant ligne 120 ça casserait. Notification admin peut perdre le nom. | Déclarer `clientName` AVANT le `notifyAdmin` callback. |
| I2 | `app/client/onboarding/page.tsx:46-48` (commentaire) | Le commentaire dit "Step 5" implicite mais il n'y a que 4 steps (Welcome, Personal, Charter, Video). Le scope d'audit demande "5 étapes" — désalignement entre cahier des charges et code. | Confusion sur le nombre d'étapes attendues. Audit incohérent avec spec. | 🟡 À CLARIFIER AVEC JOFFREY : 4 ou 5 étapes attendues ? |
| I3 | `app/client/onboarding/page.tsx:53-156` | L'onboarding utilise localStorage (clé `hive_onboarding_state`) pour persister + `popstate` listener manuel. En cas de purge du storage (Safari ITP 7j, mode privé), tout est perdu, l'utilisateur recommence step 1 sans avertissement. | Mauvais UX silencieux sur iOS Safari après 7 jours d'inactivité. | Sauver l'état serveur-side (PATCH partiel sur ClientIntake) ou avertir l'utilisateur. |
| I4 | `app/api/client/elixir-received/route.ts:56-63` | `import("@/lib/notifications").then(...)` fire-and-forget AVEC `clientName` qui est défini avant — OK ici — mais la promesse n'est jamais awaitée. Si elle rejette autrement que via `.catch`, erreur silencieuse. | Notifications admin peuvent disparaître sans trace côté logs. | `await notifyAdmin(...)` ou catch + log structuré. |
| I5 | `app/api/client/checkin/upload/route.ts:31-33` | Le fallback `file.type.startsWith("image/")` accepte n'importe quel type image — y compris ceux non listés (svg+xml, tiff). Pas de contrôle de contenu binaire (magic bytes). | Upload potentiel de SVG malveillant (XSS si servi inline) ou fichier mal formé. | Restreindre strictement à `ALLOWED_MIME` sans fallback. |
| I6 | `app/api/client/uploads/[...path]/route.ts:74` | `Cache-Control: private, max-age=300` met en cache 5 min côté navigateur. Si un client est déconnecté, qu'un autre se connecte sur le même appareil, la photo peut être servie depuis le cache. | Fuite de photo entre comptes sur appareil partagé. | `Cache-Control: private, no-store` ou utiliser un nonce dans l'URL. |
| I7 | `app/client/elixirs/page.tsx:62-68` | Le bouton "Order" envoie un message texte hardcodé en EN ("Hi Joffrey, I would like to reorder..."). Pas de gestion langue FR. | Message envoyé toujours en anglais même si client FR. | Utiliser `useLanguage()` + `t()`. |
| I8 | `app/api/client/elixir-order/route.ts:69-75` | `prisma.client.update` met `colisEnvoye=true` SI l'email part avec succès. Aucune vérification que l'admin a effectivement préparé. Le client peut spammer le formulaire avec adresses différentes ; chaque appel renvoie un mail. | Pas de rate limiting, pas d'idempotency, statut peut être triggered sans intention admin. | Idempotency (skip si `colisEnvoye=true`) + rate-limit (1/jour). |
| I9 | `lib/parcours-client.ts:81-100` | La détection `hasMorning`/`hasEvening` est basée sur "au moins un champ non null". Si le client a fait un check-in matin partiel et un soir, les deux booleans seront true et le hash de jour utilise `c.date` (UTC), pas `dateKeyParis`. Possible mismatch jour matin (UTC) vs jour soir (Paris) en bordure de fuseau. | Possible duplication ou disparition d'un check-in en bordure de jour (23h-01h). | Utiliser `dateKeyParis(c.date)` partout pour cohérence. |
| I10 | `app/client/checkin/morning/page.tsx:32` | `getHour()` est appelée hors `useEffect` → en SSR/hydration, peut différer entre serveur/client (TZ serveur ≠ TZ navigateur). React peut afficher "Closed" puis "Open" après hydration. | Flash UI + warning hydration mismatch potentiel. | Encapsuler dans `useEffect` + `useState`. |

## 🟡 Findings MINEURS

| # | Fichier:ligne | Description | Impact | Recommandation |
|---|---|---|---|---|
| M1 | `app/client/onboarding/page.tsx:3` | `useRef` importé mais jamais utilisé. | Lint warning. | Retirer l'import. |
| M2 | `components/client/CharteEngagement.tsx` vs `components/onboarding/CharteEngagement.tsx` | Deux composants `CharteEngagement` avec signatures différentes (booking utilise `client/`, onboarding utilise `onboarding/`). | Confusion maintenabilité, duplication potentielle. | Unifier ou renommer (`CharteEngagementBooking`, `CharteEngagementOnboarding`). |
| M3 | `components/onboarding/CharteEngagement.tsx.backup` | Fichier .backup commité dans le repo. | Pollution repo. | Supprimer le `.backup`. |
| M4 | `app/api/client/elixirs/route.ts:36-40` | Le mapping retourne `{ id, name, dosage }` mais l'interface dans `app/client/elixirs/page.tsx:11-28` attend bien plus (description, duration, quantity, etc.) → données de `/api/client/elixirs` insuffisantes mais inutilisées car la page lit `/api/prescriptions`. | Endpoint inutile ou sous-utilisé. Code mort. | Soit consommer l'endpoint, soit le supprimer. |
| M5 | `app/api/client/timeline/route.ts:73-77` | `globalDay` peut être recalculé deux fois (ligne 71 puis 73), valeur finale dépend de l'ordre. | Logique fragile. | Refactorer en une expression unique. |
| M6 | `app/client/home/page.tsx:355` | `client.isLegacy` accédé sans vérification du schema — propriété existe mais pas typée dans le include. | Type safety. | Ajouter dans `select`/typage. |
| M7 | `app/api/client/me/flags/route.ts:13` | Erreur `"Client introuvable"` retournée en 404, mais le client EST authentifié — pourrait être 500 (incohérence DB). | Code statut imprécis. | 500 ou 409 avec message clair. |
| M8 | `app/client/checkin/morning/page.tsx:128-133` | Le `catch` swallow + `finally { goNext() }` → en cas d'erreur réseau, l'utilisateur passe au step "done" sans rien sauvegarder. | Perte silencieuse de données check-in. | Afficher erreur, NE PAS passer au step suivant. |
| M9 | `components/client/InstallPwaSection.tsx` | Référencé nulle part dans `app/client/*/page.tsx`. Composant orphelin. | Code mort. | Vérifier l'usage ou retirer. |
| M10 | `app/api/client/photos/route.ts:14` | `interface PhotoItem` déclare `isPrivate?: boolean` optionnel, mais le client peut filtrer/marquer ces photos → admin pourrait y accéder via `/api/client/uploads/[...path]/` si elle est admin. | Cf. ligne 47 du route uploads — admin a accès libre à toutes les photos clients (y compris privées). | 🟡 À CLARIFIER : admin doit-elle voir les photos privées ? Politiquement ambigu. |

## ✅ Observations factuelles (sans gravité)

- `requireClient()` vérifie systématiquement le flag `user.blocked` → bonne pratique cohérente.
- `app/client/layout.tsx` enforce `session.role === "CLIENT"` + redirige sur `/blocked` si nécessaire. Solide.
- `PreStartGuard` gère 3 états (questionnaire PENDING/IN_PROGRESS/SUBMITTED) avec accès partiel intelligent.
- Admin routes (`app/api/clients/[id]`, `app/admin/journal/page.tsx`, `app/admin/clients/[clientId]/page.tsx`, `app/api/journal/route.ts`) appliquent toutes `where: { isPrivate: false }` → pas de leak d'entrées privées vers admin via ces canaux.
- `app/api/client/uploads/[...path]/route.ts` vérifie path traversal (`..`, `\0`, `/`) + ownership (clientId in path === client.id du session). Solide.
- Pas de service worker, pas de push notifications dans le code (`grep ServiceWorker|PushManager|VAPID` → 0 résultats). PWA = install-only (A2HS via `beforeinstallprompt`).
- `lib/notifications.ts` crée des `PendingAction` en DB (notification interne admin), pas de notifications client.
- `app/client/sessions/page.tsx:42` exclut explicitement `notes, checklistItems, recapDone` du select → privacy correcte.
- `app/api/client/session-packs/route.ts:21` n'inclut `select: { totalSessions: true }` — exclut explicitement montants/notes.
- 4 endpoints email (`elixir-order`, `elixir-received`, `questionnaire-entry POST`, `questionnaire/[responseId] POST`, `appointments/[id]/cancel`, `appointments/[id]/reschedule`) envoient des notifications SMTP à `process.env.FROM_EMAIL`. Tous catch silencieusement les erreurs SMTP — résilience OK mais pas de logs structurés.
- Onboarding step 1=Welcome, 2=Personal (10 champs), 3=Charter, 4=Video. Steps 3 et 4 conditionnels selon `flags.requiresConvention` et `flags.requiresWelcomeVideo`.

## 📊 Statistiques

- Fichiers lus : 32 (24 routes API + 8 pages/composants client + 3 libs partagées)
- Routes analysées : 24 routes `app/api/client/*` + 5 routes connexes (`/api/prescriptions`, `/api/journal`, `/api/client-phases/*`, `/api/onboarding`, `/api/clients/[id]`)
- Lignes de code parcourues : ~5 800 (approximatif)
- Bugs détectés : 3 🔴 / 10 🟠 / 10 🟡

## 🤔 À clarifier avec Joffrey

1. **Onboarding 4 vs 5 étapes** : Le scope d'audit mentionne "5 étapes". Le code en a 4 (Welcome, Personal, Charter, Video). La step "Welcome" compte-t-elle ? Y a-t-il une étape supprimée ?
2. **Élixirs : un seul système ou deux ?** : Le code mélange `ElixirPrescription` (legacy, page `/client/elixirs`) et `PhaseElixir` (nouveau, page home + admin Parcours). Faut-il migrer/unifier ou garder en parallèle ?
3. **Journal privé** : Le client doit-il voir ses propres entrées privées dans `/client/journal` ? Actuellement non (bug C2). Si oui, faut-il un onglet "Privées" séparé ou tout fusionner ?
4. **Photos privées accessibles à l'admin** : `/api/client/uploads/[...path]` accorde un accès admin libre à toutes les photos (y compris journal entries privées avec photo). Intentionnel ?
5. **Push notifications** : Mentionnées dans le scope ("Notifications push : code en place, déclencheurs, fallback") — AUCUN code de push (pas de service worker, pas de VAPID, pas de subscription). Confusion avec les notifications email + DB `PendingAction` ?

## 📝 Note de l'agent pour la synthèse Phase 2

**Trace élixir CLIENT vs ADMIN (Laura, PhaseElixir) :**

ADMIN assigne un élixir via `POST /api/client-phases/{id}/elixirs` → crée `PhaseElixir(clientPhaseId, elixirLibraryId, dose, frequency, timing, notes)`. Visible dans `components/admin/ParcoursSection.tsx` (table phase + vue semaine).

CLIENT consulte :
- `/client/home` (server) : `prisma.clientPhase.findMany` + `phaseElixirs: { include: elixirLibrary }`, filtre `isElixirDayMatch(pe.frequency, today)` → affiche bloc "Élixirs du jour". UNIQUEMENT pendant la phase active ET jour matchant.
- `/client/elixirs` (page principale "Mes élixirs") : `fetch("/api/prescriptions")` → table `ElixirPrescription`, IGNORE complètement `PhaseElixir`. Affiche "No elixirs prescribed yet" même si l'admin a assigné via PhaseElixir.
- `/client/checkin/morning` : `fetch("/api/client/elixirs")` → table `ElixirPrescription`, IGNORE PhaseElixir → impossible de cocher "j'ai pris mon élixir Phase".

**Conclusion :** deux systèmes parallèles non unifiés. Bug C1+C3 critique pour Laura (cliente Legacy active utilisant le système Parcours). À PRIORISER si Laura a déjà des PhaseElixir assignés.

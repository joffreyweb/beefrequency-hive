# RAPPORT A — DB & Cohérence Schéma

**Date :** 25 mai 2026
**Périmètre analysé :** prisma/schema.prisma + données Laura
**Agent :** A

> ⚠️ Accès DB live : `psql` bloqué par la sandbox (permission denied même en mode dégradé). Aucune requête SELECT n'a pu être exécutée. Toutes les conclusions concernant Laura sont déduites du schéma + de la logique métier (`detoxStartDate = 2026-03-07`, Cycle 3 démarré 18 mai 2026 = J+72 depuis 7 mars, parfaitement cohérent avec `PHASE_DEFINITIONS` dans `lib/parcours.ts`).

---

## 🔴 Findings CRITIQUES

| # | Fichier:ligne | Description | Impact | Recommandation |
|---|---|---|---|---|
| 1 | `prisma/schema.prisma:218-230` + `:626-639` | Deux modèles parallèles `Elixir` et `ElixirLibrary` coexistent sans FK ni vue unifiée. `ElixirPrescription` pointe sur `Elixir`, `PhaseElixir` pointe sur `ElixirLibrary`. | Catalogue dédoublé : un élixir mis à jour côté Library n'a aucun effet sur les prescriptions existantes (et inversement). Stock, dosage, nom peuvent diverger. Impossible de cross-référencer un élixir Détox (PhaseElixir) avec sa prescription/consommation (CheckinElixir). | Migrer vers un seul modèle (`Elixir` enrichi des colonnes `unit/category/timing` d'`ElixirLibrary`) + FK unique depuis `ElixirPrescription` ET `PhaseElixir`. Garder l'ancien modèle en alias pour la migration. |
| 2 | `prisma/schema.prisma:653-677` + `lib/parcours.ts:43-67` | `ClientPhase.status` (enum `PhaseStatus`) est initialisé une seule fois lors du `create` via `computePhases()` et n'est JAMAIS remis à jour ensuite. Aucun cron, aucun trigger, aucun appel `update` sur ce champ dans le code (recherche `clientPhase.update` ne renvoie que `PATCH /api/client-phases/[id]` qui touche `customName/instructions/checkins` uniquement). | Pour Laura aujourd'hui 25 mai : le row `ClientPhase` "Cycle 3" en DB peut encore avoir `status='UPCOMING'` si les phases ont été créées avant le 7 mars 2026 ; la phase "DETOX" peut encore être `status='ACTIVE'` en DB. Toute requête qui filtre `WHERE status='ACTIVE'` renvoie un résultat incohérent. Le runtime contourne via du calcul JS sur les dates (`current-phase/route.ts:33`, `client/home/page.tsx:84`), mais le champ DB devient un mensonge. | Soit (a) supprimer le champ `status` du modèle (calculer toujours côté code), soit (b) ajouter un cron quotidien qui recompute et persiste, soit (c) une vue calculée. Option (a) la plus propre. |
| 3 | `app/api/client/elixir-received/route.ts:46-53` + `app/api/admin/clients/[clientId]/parcours-stage/route.ts:37-43` | Le flux "Produits reçus" écrit UNIQUEMENT `detoxStartDate`, jamais `programmeStartDate`. Le PATCH admin permet d'écrire les deux indépendamment, sans contrainte. | Les 2 dates dérivent : pour Laura non-legacy, `programmeStartDate` reste NULL, donc `prestart-status/route.ts:60` renvoie `programmeStarted: false` à perpétuité même quand le programme tourne depuis 79 jours. Tout consommateur qui se fie à `programmeStartDate` (banner admin ligne 48, fallback timeline ligne 49) reçoit `null` et bascule sur `detoxStartDate` — fonctionne par accident, fragile. | Soit supprimer `programmeStartDate` (redondant avec `detoxStartDate + 10j`), soit le calculer automatiquement (`detoxStartDate + 10j`) dans une migration + le maintenir via trigger ou hook Prisma. |
| 4 | `app/admin/dashboard/page.tsx:228-234` vs `lib/parcours.ts:30-40` | Le dashboard admin code en dur les bornes de cycle : Cycle 1 = jours 1-21, Break 1 = 22-31, Cycle 2 = 32-52, Break 2 = 53-62, Cycle 3 = 63-83, Break 3 = >83. La référence `PHASE_DEFINITIONS` dit : Détox 1-10, Cycle 1 = 11-31, Break 1 = 32-41, Cycle 2 = 42-62, Break 2 = 63-72, Cycle 3 = 73-93, Break 3 = 94-103. | Pour Laura à J+80 (25 mai) : le dashboard affichera "Cycle 3 / semaine 3" alors que la vraie phase est Cycle 3 J8/21 (semaine 2). Affichage admin trompeur. Aussi : dashboard total = 93 jours, parcours.ts total = 103 jours. | Importer `PHASE_DEFINITIONS` ou `getActivePhaseInfo()` depuis `lib/parcours` et supprimer la logique dupliquée du dashboard. |
| 5 | `app/api/parcours/route.ts:29-30` | `computePhases(client.startDate)` utilise `Client.startDate` (date de création par défaut `now()`) au lieu de `detoxStartDate` ou `programmeStartDate`. | Pour tout client non-legacy, `startDate` = date de signup (≠ démarrage parcours). Les phases recalculées côté API renvoient des dates fausses (décalées du nombre de jours entre signup et envoi des produits). Incohérent avec `timeline/route.ts` qui utilise `programmeStartDate || detoxStartDate`. | Remplacer par `client.detoxStartDate || client.programmeStartDate || client.startDate` (même fallback que les autres endpoints). |
| 6 | `prisma/schema.prisma:154-155` + `102` + multiples usages | 5 sources de date de démarrage coexistent sans contrat : `Client.startDate` (défaut now()), `Client.detoxStartDate`, `Client.programmeStartDate`, `ClientPhase.startDate` (1 par phase), `ClientProgram.startDate`. Aucune contrainte ne garantit que `ClientPhase[0].startDate == detoxStartDate`. | Les fichiers consommateurs utilisent des priorités différentes : `admin/clients/[clientId]/page.tsx:154` = `detox || programme`, `client/timeline/route.ts:49` = `programme || detox`, `client/home/page.tsx:96` = `detox || programme`, `client/sessions/page.tsx:59` = `client.startDate` seul. Calculs "Jour X/103" potentiellement divergents entre pages. | Centraliser dans `lib/parcours.ts` une fonction `getProgramStartDate(client)` avec une priorité unique documentée. Migrer tous les consommateurs. |

## 🟠 Findings IMPORTANTS

| # | Fichier:ligne | Description | Impact | Recommandation |
|---|---|---|---|---|
| 1 | `components/admin/ParcoursStatusBanner.tsx:92-106` | Le bouton "Modifier date depart" appelle `PATCH /api/client-phases` qui écrit `detoxStartDate` (route.ts:122-126). L'UI étiquette ça "date de depart du programme". | Confusion sémantique : admin pense modifier la date programme (90j), modifie en fait la date détox (J1 du parcours global). Pour Laura : un changement = recalcul de tout, y compris la détox déjà accomplie. | Distinguer 2 boutons (détox vs programme) ou clarifier le label, et écrire dans les 2 champs si une seule source de vérité doit subsister. |
| 2 | `prisma/schema.prisma:67-89` (`User.email`) | `User.email String @unique` — la contrainte Postgres `@unique` est case-sensitive. Le code (`api/auth/login`, `api/admin/create-client/route.ts:31-36`) fait des `findFirst` avec `mode: "insensitive"` côté Prisma — ne s'appuie PAS sur l'index. | Possible collision : insertion `Laura@asklaura.com` ET `laura@asklaura.com` admise par la contrainte DB ; le code applicatif normalise désormais (commit b2d4589) mais des doublons hérités peuvent exister. Lookup app est full-scan (pas d'index utilisable en `LOWER(email)`). | Migration : ajouter `CREATE UNIQUE INDEX user_email_lower_idx ON "User"(LOWER(email))` ; ou citext ; ou normaliser email au store (déjà fait au write, audit existant). |
| 3 | `prisma/schema.prisma:1001-1009` | `BookingToken.clientId` est un `String` sans relation Prisma — pas de FK Postgres, pas de cascade. | Suppression d'un Client (RGPD ou autre) laisse des tokens de booking orphelins exploitables jusqu'à `expiresAt`. | Ajouter `client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)`. |
| 4 | `prisma/schema.prisma:141-147` (`Client.prospectId`, `visitorProfileId`, `referredBy`) + `1351-1352` (`Prospect.clientId`) + `1432-1433` (`VisitorProfile.prospectId/clientId`) | Tous ces "FK" CRM sont des `String?` libres, aucune relation Prisma, aucune contrainte DB. | Intégrité référentielle inexistante. Conversion prospect → client → archivage RGPD peut casser les liens silencieusement. Les `Json` `history`/`aiInsights` non typés. | Ajouter les relations Prisma proprement (avec `onDelete: SetNull` pour les liens souples). |
| 5 | `prisma/schema.prisma:813-822` | `OpenWebuiQueue.client` (line 821) — relation sans `onDelete`. Par défaut Prisma = `Restrict`. | Suppression Client bloquée tant qu'il reste des items en queue. Conflit potentiel avec le `GdprDeletionLog`. | Mettre `onDelete: Cascade` (les recaps n'ont plus de sens sans le client). |
| 6 | `prisma/schema.prisma:1193-1202` | `ProgramModule.module` (line 1198) — relation sans `onDelete`, alors que `ClientModule.module:1160` et `ModuleDay.module:1169` sont `Cascade`. | Incohérence : supprimer un Module bloque tant qu'il est dans un Program, mais détruit les ClientModule (perte historique client). | Aligner : `onDelete: Restrict` partout (préserver historique) OU `Cascade` partout selon la politique choisie. |
| 7 | `prisma/schema.prisma:31-47` (`OfferType`) | L'enum contient des valeurs marquées `// Legacy values` (`HIVE_EXPERIENCE`, `THE_PASSAGE`) toujours actives. | Pas de garde sur ces valeurs, elles peuvent être ressélectionnées à l'insertion ; les `OFFER_LABELS` doivent rester en phase. | Renommer `_DEPRECATED_HIVE_EXPERIENCE` ou retirer après vérification qu'aucun Client ne les porte. |
| 8 | `prisma/schema.prisma:653-677` (`ClientPhase`) | `phaseNumber Int` sans contrainte de domaine. La convention est : DETOX → 0, CYCLE → 1-3, BREAK → 1-3, mais rien ne l'impose au niveau DB. | Possibilité de `DETOX/2`, `CYCLE/0`, etc. Le `@@unique([clientId, phaseType, phaseNumber])` n'empêche pas l'invalidité, juste la duplication. | Ajouter un `CHECK` SQL custom ou un enum dédié par phaseType. |
| 9 | `prisma/schema.prisma:991` (`SessionPack.amount`) | `Float` pour de l'argent. | Erreurs d'arrondi cumulatives, classique. | Migrer en `Decimal @db.Decimal(10,2)`. |
| 10 | `prisma/schema.prisma:1204-1231` (`ClientProgram`) | `status String @default("active")` — enum métier non typé, valeurs en clair dans le commentaire. Idem `Session.fixedSlotDay` (Int sans contrainte 0-6), `AdminSlot.dayOfWeek` (Int sans contrainte). | Pas de garde-fou DB : `status='ACTIF'` ou `status='Active'` accepté → bug silencieux. | Convertir en enum Prisma (`ClientProgramStatus`). |

## 🟡 Findings MINEURS

| # | Fichier:ligne | Description | Impact | Recommandation |
|---|---|---|---|---|
| 1 | `prisma/schema.prisma:132` | `usedSessionsManual @map("usedSessions")` — nom Prisma ≠ nom colonne. | Migration côté requêtes SQL directes (psql, dumps) demande de garder le mapping en tête. | Renommer la colonne via migration pour éliminer le mapping. |
| 2 | `prisma/schema.prisma:165-168` | Champs `hdFullData/astroData/baziData/numerologyData` en `Json?` à la racine du Client. | Pas de typage, pas de versionnage, croissance row Postgres. | Extraire dans une table `ClientCartesData` 1-1 dédiée. |
| 3 | `prisma/schema.prisma:754` (`DailyCheckin.date @db.Date`) | OK pour le typage, mais l'upsert (`api/daily-checkin/route.ts:73-82`) passe un `Date` JS normalisé à minuit local serveur. | Si le serveur change de timezone (Europe/Paris vs UTC sur VPS Hetzner), la "date" du check-in peut basculer d'un jour à l'autre lors de la deserialisation. | Normaliser explicitement en UTC `YYYY-MM-DD` avant insert, ou stocker le `timezone` du Client (champ existe ligne 110) pour calcul. |
| 4 | `prisma/schema.prisma:67-89` (`User`) | Pas d'`@@index([role])`, pas d'`@@index([lastSeenAt])` — utiles pour les dashboards admin. | Coût négligeable aujourd'hui (faible volume), grandira. | Ajouter en cas de slow query. |
| 5 | `prisma/schema.prisma:889-895` (`SabianSymbol`) | `id Int @id` sans `@default(autoincrement())`. | Suppose des seed externes. | Confirmer process de seed (ou ajouter autoincrement si vide). |
| 6 | `prisma/schema.prisma:1453-1474` (`AdminSettings`) | Pas de contrainte "singleton" : peut contenir N rows. Tout le code suppose un seul. | Race condition à la 1re lecture si N rows. | Forcer singleton avec `id @default("singleton")` ou row fixe + unique. |
| 7 | `prisma/migrations/20260330081115` + `20260330081147` | Deux migrations consécutives `add_appointments_booking` à 30s d'intervalle, même nom. | Confusion historique, indique un retravail à chaud. | Documenter (ou consolider en migration unique si pas encore deployée en prod — mais elle l'est). |

## ✅ Observations factuelles (sans gravité)

- Schema = 1474 lignes, ~50 modèles, ~20 enums — taille raisonnable.
- 46 migrations historisées, première = 19 mars 2026, dernière = 12 mai 2026.
- 25 contraintes `@unique` ou `@@unique` — couverture correcte des identifiants métier.
- 4 `@@index` explicites (`ClientModule.clientId`, `FunnelEvent.sessionId/email/step`, `ProspectActivity.prospectId`) — peu pour la taille du schéma, mais Prisma crée implicitement des index sur les FK.
- Toutes les relations Client→sous-tables critiques (JournalEntry, DailyCheckin, ClientPhase, ElixirPrescription, etc.) sont `onDelete: Cascade` — bonne hygiène RGPD.
- `GdprDeletionLog` existe et capture (clientId, name, email, date) — preuve de suppression conservée séparément, conforme.
- Pour Laura : avec `detoxStartDate = 2026-03-07` + `PHASE_DEFINITIONS`, Cycle 3 démarre le **2026-03-07 + 72 jours = 2026-05-18** → parfaitement cohérent avec "Cycle 3 démarré 18 mai 2026" confirmé par Joffrey. Le 25 mai = J+80 du programme, Cycle 3 J8/21.

## 📊 Statistiques

- Fichiers lus : 14 (schema.prisma + 13 fichiers app/api/components)
- Routes analysées : 10 (timeline, client-phases, parcours-stage, create-client, elixir-received, parcours, current-phase, prestart-status, client/program, admin/clients/[id]/programs)
- Lignes de code parcourues : ~2 500 (approximatif)
- Bugs détectés : 6 🔴 / 10 🟠 / 7 🟡

## 🤔 À clarifier avec Joffrey

- `Client.startDate` vs `detoxStartDate` vs `programmeStartDate` : quelle est la source de vérité officielle pour "Jour X/103" ? La doc métier dit `detoxStartDate` = pilote (confirmé pour Laura), mais le code n'est pas unanime.
- `programmeStartDate` est-il un champ vivant (calculé via `detoxStartDate + 10j` ou rempli manuellement à la fin de la détox) ou un vestige à supprimer ?
- `Elixir` vs `ElixirLibrary` : lequel garder ? Quelle migration de données pour les `ElixirPrescription` historiques (catalogue `Elixir`) vers le nouveau (`ElixirLibrary`) ?
- Politique cycle 3 : 21 jours strict (PHASE_DEFINITIONS) ou 30 jours comme suggéré par dashboard:228 (Cycle 1 = 1-21 sans détox initiale) ? La vraie structure produit doit être tranchée.
- Total parcours : 93 jours (dashboard, ParcoursStatusBanner sublabel `J${detoxDay}/10` puis `J${programmeDay}/90`) ou 103 jours (lib/parcours.ts + timeline/route.ts) ?
- `ClientPhase.status` enum vivant ou champ figé sans mise à jour ? Décider et appliquer.

## 📝 Note de l'agent pour la synthèse Phase 2

La dette `Elixir/ElixirLibrary` et le triple champ date `startDate/detoxStartDate/programmeStartDate` sont les deux racines de tous les bugs visibles ailleurs. Toute amélioration UX cliente sans consolidation préalable du modèle de date pilote sera fragile. La logique parcours 103j est correcte dans `lib/parcours.ts` mais ignorée par `app/admin/dashboard/page.tsx` qui maintient sa propre logique 93j divergente.

# SYNTHÈSE — Audit BeeFrequency Hive

**Date :** 25 mai 2026
**Phase :** 1 — Constats factuels (aucune recommandation d'action, c'est Joffrey qui décide en Phase 2)
**Périmètre :** PWA Hive (port 3001), site vitrine joffreydeleplanque.com (port 3002), VPS Infomaniak `ubuntu@83.228.246.147`, DB PostgreSQL, crons, SMTP Infomaniak

---

## 📋 Compteurs par rapport

| Rapport | Titre | 🔴 | 🟠 | 🟡 | Total |
|---|---|---|---|---|---|
| [A](A_db_schema.md) | DB & Cohérence Schéma Prisma | **6** | 10 | 7 | 23 |
| [B](B_flux_client.md) | Flux Client PWA | **3** | 10 | 10 | 23 |
| [C](C_flux_admin.md) | Flux Admin PWA | **7** | 13 | 15 | 35 |
| [D](D_automatismes_anniversaire.md) | Automatismes, Crons & Anniversaire | **3** | 7 | 8 | 18 |
| [E](E_infrastructure_vps.md) | Infrastructure VPS | **2** | 6 | 8 | 16 |
| [F](F_site_vitrine.md) | Site vitrine joffreydeleplanque.com | **3** | 7 | 8 | 18 |
| **TOTAL** | | **24 🔴** | **53 🟠** | **56 🟡** | **133** |

---

## 🚨 Top 5 bugs CRITIQUES toutes catégories confondues

| Rang | Rapport | Fichier:ligne | Description courte | Pourquoi c'est en top 5 |
|---|---|---|---|---|
| **#1** | C — C7 | `lib/auth.ts:4-6` | `JWT_SECRET` a un fallback hardcodé `"fallback_secret_do_not_use_in_production"`. Si la var d'env disparaît, l'app boot silencieusement avec un secret connu publiquement. | **Compromission totale** : un attaquant lisant le repo peut forger n'importe quel JWT admin/client. Risque maximal, scénario réaliste (drift `.env`). |
| **#2** | C — C1 | `app/api/admin/clients/[clientId]/hd/route.ts:5-16` | Route GET sans `requireAdmin` : exposition publique des données Human Design nominatives de tous les clients pour qui connaît un `clientId`. | **Fuite RGPD immédiate**, exploitable sans authentification. Données nominales + carte HD. |
| **#3** | F — #2 | `app/api/contact-voice/route.ts:19-24` | Messages vocaux des prospects sauvegardés dans `public/voice-messages/${Date.now()}.webm` → URL publique devinable (timestamp ms brute-forçable). | **Fuite RGPD** sur données comportementales sensibles (audio, voix). Exploitable en quelques jours de brute-force. |
| **#4** | A — #1 + B — C1/C3 + C cohérence | `prisma/schema.prisma:218-230,626-639` + `app/client/elixirs/page.tsx:40` + `app/client/checkin/morning/page.tsx:51` | Deux modèles `Elixir` / `ElixirLibrary` parallèles sans FK ; le client lit `ElixirPrescription` (legacy) tandis que l'admin écrit dans `PhaseElixir` (Parcours). Résultat : tout élixir assigné via Parcours est **invisible** côté client (page « Mes élixirs », check-in matin). | **Bug métier majeur frappant Laura aujourd'hui** : ses élixirs Cycle 3 sont assignés par l'admin mais inexistants pour elle hors home page filtrée. Cause technique identifiée et documentée (voir verdict ci-dessous). |
| **#5** | D — #1 + D — #2 | `app/api/actions/sync/route.ts` + `app/api/journey-messages/process/route.ts` | Les **deux** endpoints les plus stratégiques (alimentation cockpit « À faire » admin ; envoi des messages de parcours J+1/J+3/J+7/J+14/J+21) n'ont **aucun déclencheur** : pas de cron, pas de bouton UI, pas de hook serveur. | **Features perçues comme automatiques mais inertes** : alertes anniversaire, stock élixirs, recap post-séance, messages de parcours HD-personnalisés — rien ne s'envoie. Joffrey croit avoir un système, il n'a que des coquilles vides. |

**Mention spéciale** : `prisma db push --accept-data-loss` en prod (rapport E — C2) — bombe à retardement silencieuse pour la cohérence DB ; à chaque deploy, possibilité de perte de données non-loggée. Score équivalent à un Top-5 mais latent.

---

## 🎂 VERDICT — Notification anniversaire

### **N'EXISTE PAS côté client. TRACES PARTIELLES côté admin (inerte).**

**Décomposition factuelle :**

| Canal | Statut | Preuve |
|---|---|---|
| Email anniversaire au client | **N'EXISTE PAS** | 0 template dans `lib/mailer.ts`, 0 `transporter.sendMail` référençant anniversary/birthday |
| Message in-app anniversaire au client | **DÉSACTIVÉ EXPLICITEMENT** | Commentaire `app/api/journey-messages/process/route.ts:133-134` : « Les messages BIRTHDAY ne sont plus envoyés automatiquement » + filtre `triggerType === "JOURNEY_DAY"` ligne 82-85 qui exclut BIRTHDAY |
| Push notification anniversaire | **N'EXISTE PAS** | 0 dépendance `web-push`, pas de service worker, pas de VAPID branché (la clé `NEXT_PUBLIC_VAPID_PUBLIC_KEY` est présente en env mais aucun code ne s'en sert) |
| Template seed BIRTHDAY | **N'EXISTE PAS** | `prisma/seed-journey-templates.ts:92` : « Anniversaire géré manuellement via PendingAction — pas de template auto » |
| Enum DB + UI admin BIRTHDAY | **PRÉSENTS MAIS INACTIFS** | `enum PendingActionType { … BIRTHDAY }` (schema.prisma:426), select UI dans `app/admin/journey-messages/page.tsx:489` — Joffrey peut créer un template BIRTHDAY qui ne sera JAMAIS envoyé |
| Logique anniversaire admin (alerte cockpit J-1 / J-7) | **CODÉE MAIS INERTE** | `app/api/actions/sync/route.ts:165-221` détecte les anniversaires, mais l'endpoint n'est **appelé nulle part** (ni cron VPS, ni UI, ni hook). Pour Joffrey, cela signifie : aucune alerte anniversaire ne s'affiche jamais dans le dashboard. |

**Conséquence opérationnelle** : si Joffrey pense recevoir une alerte anniversaire 7 jours avant l'anniv de Laura, c'est faux. Il ne reçoit rien, et Laura non plus.

---

## 🌿 VERDICT — Élixirs invisibles côté client

### **CAUSE TECHNIQUE IDENTIFIÉE — deux systèmes parallèles non unifiés.**

**Architecture actuelle (état des lieux objectif) :**

| Côté | Lit / Écrit | Modèle utilisé | Endpoint | Page |
|---|---|---|---|---|
| ADMIN assigne | Écrit | `PhaseElixir` → `ElixirLibrary` | `POST /api/client-phases/{id}/elixirs` | `components/admin/ParcoursSection.tsx` |
| CLIENT — Home | Lit | `ClientPhase.phaseElixirs` + filtre `isElixirDayMatch()` | SSR direct `prisma.clientPhase.findMany` | `/client/home` (visible UNIQUEMENT pendant la phase active ET le jour matchant la fréquence) |
| CLIENT — Page « Mes élixirs » | Lit | `ElixirPrescription` (ancien modèle, jamais alimenté par l'admin) | `GET /api/prescriptions` | `/client/elixirs` — affiche « No elixirs prescribed yet » |
| CLIENT — Check-in matin | Lit | `ElixirPrescription` | `GET /api/client/elixirs` | `/client/checkin/morning` — case à cocher absente pour les PhaseElixir |

**Trace pour Laura (cliente Cycle 3, élixirs assignés via Parcours admin) :**

1. Joffrey assigne un élixir à la phase « Cycle 3 » de Laura via l'UI admin → row crée dans `PhaseElixir(clientPhaseId=…, elixirLibraryId=…, dose, frequency, timing)`.
2. Laura ouvre `/client/elixirs` (page principale dédiée) → l'app fait `fetch /api/prescriptions` → query `prisma.elixirPrescription.findMany` → résultat vide car l'admin n'a jamais écrit dans `ElixirPrescription` → UI affiche « No elixirs prescribed yet ».
3. Laura ouvre `/client/checkin/morning` → mêmes requêtes sur `ElixirPrescription` → pas de case à cocher → impossible de logger « j'ai pris mon élixir ce matin ».
4. Laura ouvre `/client/home` à 8h du matin un jour de fréquence matchante → SSR `prisma.clientPhase.findMany` avec `phaseElixirs.include.elixirLibrary` → bloc « Élixirs du jour » s'affiche correctement, mais éphémère et conditionnel.

**Cause racine identifiée** (rapport A finding #1) : deux modèles Prisma `Elixir` et `ElixirLibrary` coexistent sans FK ; deux tables de jointure `ElixirPrescription` (→ Elixir) et `PhaseElixir` (→ ElixirLibrary) ; aucun pont applicatif n'agrège les deux.

**Pas une régression récente** : c'est une dette architecturale héritée du basculement vers le système Parcours sans migration des consommateurs front (page Mes élixirs, check-in matin, page prescriptions admin).

---

## 📌 Points à clarifier avec Joffrey (transverses, hors recommandations Phase 2)

Ces points reviennent dans plusieurs rapports — utiles à trancher AVANT toute Phase 2 :

1. **Total parcours : 93 jours ou 103 jours ?** Dashboard admin code 93j, `lib/parcours.ts` code 103j. Affichages divergents (rapport A finding #4).
2. **`Client.startDate` vs `detoxStartDate` vs `programmeStartDate` : laquelle est la source de vérité officielle** pour le calcul « Jour X/103 » ? Les pages ne sont pas unanimes (rapport A finding #5/#6).
3. **Onboarding : 4 ou 5 étapes ?** Le brief mentionne 5, le code en a 4 (rapport B I2).
4. **Système élixirs : unification ou cohabitation acceptée ?** (rapports A & B).
5. **Notification anniversaire : à réactiver, à supprimer, ou à laisser dormante ?** (rapport D).
6. **Toggles `AdminSettings` (rapport D I4)** : Joffrey veut-il vraiment les contrôles `emailReminderSession` / `emailNewMessage` / `notifyOverdueTask`, sachant qu'ils sont **persistés mais jamais lus** par le code ?
7. **Site vitrine — voice-messages déjà reçus** : les audios stockés dans `public/voice-messages/` depuis le 24 avril sont-ils encore présents sur le VPS ? Si oui, ils sont **publiquement accessibles** via URL devinable (rapport F #2).
8. **`prisma db push --accept-data-loss`** : Joffrey a-t-il conscience du risque ? (rapport E C2).

---

## 🧭 Cartographie rapide des risques par catégorie

| Catégorie | Nombre 🔴 | Rapports concernés |
|---|---|---|
| **Sécurité / Auth** | 4 | C7 (JWT fallback), C1 admin (GET HD public), C4 (mot de passe en clair), F#1 (anti-spam absent) |
| **Fuites RGPD** | 3 | C1 admin (HD), F#2 (voice messages), I6 client (cache photos partagées) |
| **Cohérence DB / Schéma** | 4 | A#1 (Elixir vs ElixirLibrary), A#2 (status figé), A#5 (startDate), A#6 (5 sources de date) |
| **Features inertes / mortes** | 3 | D#1 (actions/sync), D#2 (journey-messages/process), D#3 (template BIRTHDAY admin) |
| **Élixirs cassés côté client** | 2 | B-C1 (/client/elixirs), B-C3 (check-in matin) |
| **Infra / Deploy** | 2 | E-C1 (secrets cron en clair), E-C2 (db push --accept-data-loss) |
| **Comptabilité / Métier** | 1 | A#4 (dashboard 93j vs 103j) + B-C2 (journal privé invisible au client) |

---

## 📁 Fichiers produits

```
audit_25mai2026/
├── A_db_schema.md                  (6🔴 / 10🟠 / 7🟡)
├── B_flux_client.md                (3🔴 / 10🟠 / 10🟡)
├── C_flux_admin.md                 (7🔴 / 13🟠 / 15🟡)
├── D_automatismes_anniversaire.md  (3🔴 / 7🟠 / 8🟡)
├── E_infrastructure_vps.md         (2🔴 / 6🟠 / 8🟡)
├── F_site_vitrine.md               (3🔴 / 7🟠 / 8🟡)
└── SYNTHESE.md                     (ce fichier)
```

**Phase 2** : décisions priorisation par Joffrey, planification fix-it. La présente synthèse ne propose **aucune action** — uniquement des constats vérifiables et reproductibles à partir du code + de l'état VPS au 25 mai 2026.

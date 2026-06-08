# RAPPORT D — Automatismes, Crons & Recherche Anniversaire

**Date :** 25 mai 2026
**Périmètre analysé :** `lib/mailer.ts`, `lib/notifications.ts`, tous les `app/api/**/route.ts` envoyant un email ou exposant un endpoint cron, crontab utilisateur VPS (`ubuntu@83.228.246.147`), `prisma/schema.prisma`, `prisma/seed-journey-templates.ts`, `prisma/seed-practices.ts`, `.github/workflows/deploy.yml`, settings `AdminSettings`.
**Agent :** D

---

## 🎯 VERDICT ANNIVERSAIRE

**Conclusion factuelle :** TRACES PARTIELLES — fonctionnalité **codée mais désactivée pour le client**.

Il existe **bel et bien** une logique anniversaire dans le code, mais elle ne déclenche **AUCUNE notification au client**. Elle est restreinte à une **alerte admin** sur le dashboard… et même cette alerte **ne tourne pas en cron** : elle ne s'exécute que si quelqu'un appelle manuellement `POST /api/actions/sync`.

**Preuves exhaustives (chaque occurrence + statut) :**

| Fichier:ligne | Nature | Statut |
|---|---|---|
| `prisma/schema.prisma:426` | `enum PendingActionType { … BIRTHDAY }` | Actif (type en DB) |
| `prisma/schema.prisma:524` | `enum JourneyTriggerType { JOURNEY_DAY, BIRTHDAY, CUSTOM }` | Actif (type en DB) |
| `prisma/schema.prisma:531` | Commentaire : `dayTrigger Int // … ou 0 pour BIRTHDAY` | Cohérent avec enum |
| `prisma/migrations/20260319203429_add_birthday_action_type/migration.sql:2` | `ALTER TYPE "PendingActionType" ADD VALUE 'BIRTHDAY';` | Migration appliquée |
| `prisma/migrations/20260319202502_add_journey_messages/migration.sql:2` | `CREATE TYPE "JourneyTriggerType" AS ENUM ('JOURNEY_DAY', 'BIRTHDAY', 'CUSTOM');` | Migration appliquée |
| `app/api/actions/sync/route.ts:165-221` | Bloc `// --- f) BIRTHDAY ---` : crée des `PendingAction` type BIRTHDAY pour anniversaire J-1 et J-7 (admin) | **Code présent et fonctionnel, MAIS l'endpoint `/api/actions/sync` n'est appelé par aucun cron ni aucun composant** (voir Findings 🔴-1) |
| `app/api/journey-messages/process/route.ts:82-85` | `templates.filter(t => t.triggerType === "JOURNEY_DAY")` | Le filtre exclut `BIRTHDAY` |
| `app/api/journey-messages/process/route.ts:133-134` | Commentaire explicite : `// Les messages BIRTHDAY ne sont plus envoyés automatiquement. Les anniversaires sont gérés via PendingAction (alertes dashboard).` | **Désactivation volontaire et documentée** |
| `prisma/seed-journey-templates.ts:92` | Commentaire : `// Anniversaire géré manuellement via PendingAction — pas de template auto` | Aucun template BIRTHDAY n'est seedé |
| `app/admin/journey-messages/page.tsx:36, 385-387, 489` | UI admin propose `BIRTHDAY` dans le select de création de template | **L'admin peut créer un template BIRTHDAY mais il ne sera JAMAIS envoyé** (Finding 🔴-2) |
| `lib/mailer.ts` (intégral) | Aucun template d'email anniversaire (`sendInvitationEmail`, `sendPWAEmail`, `sendReactivationEmail` uniquement) | Aucun email anniversaire codé |
| `app/admin/clients/[clientId]/ClientProfileTabs.tsx:1388` | `<Stat label="Birthday" value={num.birthday} />` | Affichage numérologie (jour de naissance numérologique), pas une notif |
| `lib/numerology.ts:55-66` | `// Birthday Number` + `birthday: sumDigits(d)` | Calcul numérologique uniquement |
| `lib/astrology.ts:132-159` | `calculateSolarReturn` / `calculateTransits` | Calculs astro uniquement |
| `lib/bazi.ts:34`, `lib/humandesign.ts:95-100` | Utilisation de `birthDate` | Calcul BaZi/HD uniquement |
| `lib/generateCartes.ts:30-60` | Pipeline complet cartes Astro/HD/BaZi/Numero | Utilise `birthDate` uniquement pour cartes |
| `app/api/onboarding/route.ts:55-113` | Saisie / persistance `birthDate` | Onboarding uniquement |
| `app/client/onboarding/page.tsx:22, 39, 186, 207, 389-394` | Formulaire saisie `birthDate` | UI onboarding uniquement |
| `app/api/analysis/generate/route.ts:70-94` | Passage de `birthDate` au LLM | Génération analyse IA |

**Verdict détaillé pour Joffrey :**

1. **Notif email anniversaire client** → **N'EXISTE PAS**. Aucun template, aucun `transporter.sendMail` ne référence anniversary/birthday/anniversaire. Aucune route ne déclenche d'email basé sur `birthDate.month === today.month && birthDate.day === today.day`.
2. **Message in-app anniversaire client** → **DÉSACTIVÉ**. Le commentaire `// Les messages BIRTHDAY ne sont plus envoyés automatiquement` confirme qu'une version précédente existait peut-être, mais a été retirée. Le seed ne crée aucun template BIRTHDAY (seul J+1/3/7/10/14/17/21 existent).
3. **Alerte admin anniversaire** → **CODÉE MAIS INERTE**. Logique présente dans `actions/sync/route.ts` qui détecte anniversaire J-1 et J-7, mais l'endpoint n'est **jamais appelé** : ni cron VPS, ni `fetch` côté UI, ni hook. Donc même cette alerte admin ne se matérialise pas.

---

## 📋 Inventaire des crons actifs

Source : `crontab -l` sur `ubuntu@83.228.246.147` (lu via SSH read-only). **Aucun cron root**, **aucun timer systemd applicatif** (uniquement les timers OS Ubuntu : certbot, apt-daily, logrotate, etc.).

| # | Cron | Fréquence | Cible | Action | État |
|---|---|---|---|---|---|
| 1 | `0 * * * *` | Toutes les heures à :00 | `POST https://hive.joffreydeleplanque.com/api/session-reminders` (header `x-cron-secret:9338`) | Envoie rappels email aux sessions/appointments dans 48h | Actif |
| 2 | `*/5 * * * *` | Toutes les 5 minutes | `GET https://hive.joffreydeleplanque.com/api/caldav/webhook?action=sync&secret=BeeFreq2026Webhook` | Pull les events Radicale vers `CalendarEvent` (sync calendrier perso → bloqués agenda) | Actif |

**Crons MANQUANTS (endpoints existants jamais déclenchés) :**

| Endpoint | Rôle prévu | Statut |
|---|---|---|
| `POST /api/journey-messages/process` | Envoyer messages parcours J+1, J+3, J+7, J+10, J+14, J+17, J+21 (auto-création `Message` JOURNEY) + auto-assigner pratiques selon `dayTrigger` | **Aucun cron, aucun appel UI auto** — nécessite déclenchement manuel admin (commentaire l.27 : "Peut être appelé par un admin ou un cron"). En pratique : **aucun déclencheur trouvé dans le code** |
| `POST /api/actions/sync` | Générer PendingAction (RECAP, ELIXIR, SESSION, SYMPTOM, DOCUMENT, **BIRTHDAY**, CUSTOM) | **Aucun caller** dans tout le repo |

---

## 📧 Inventaire des templates email

**Helpers centralisés dans `lib/mailer.ts`** (3 templates HTML stylés + transporter brut) :

| Template | Fichier:ligne | Déclencheur | Destinataire |
|---|---|---|---|
| Invitation (HTML stylé + bloc PWA) | `lib/mailer.ts:141-208` `sendInvitationEmail` | Admin crée client (`app/api/admin/create-client/route.ts:114`) OU renvoi manuel (`app/api/admin/clients/[clientId]/send-invitation/route.ts:56`) | Client |
| PWA install (HTML stylé) | `lib/mailer.ts:214-272` `sendPWAEmail` | Onboarding terminé une fois (`app/api/onboarding/route.ts:166-181`, garde-fou `pwaEmailSent`) | Client |
| Relance douce / inactivité (HTML stylé) | `lib/mailer.ts:278-338` `sendReactivationEmail` | Action manuelle admin via widget `InactiveClientsWidget` → `POST /api/admin/send-reactivation-email` | Client |

**Emails inline (texte brut, pas de helper) — déclenchés par événement applicatif :**

| # | Sujet (FR/EN) | Fichier:ligne | Déclencheur | Destinataire |
|---|---|---|---|---|
| 1 | "Réinitialisation de mot de passe" | `app/api/auth/forgot-password/route.ts:42` | `POST /api/auth/forgot-password` (formulaire login) | Client |
| 2 | "Ta session est confirmée" / "Your session is confirmed" | `app/api/booking/[token]/route.ts:132` | Client confirme via lien magique booking | Client |
| 3 | "Choisis ton créneau de session" | `app/api/admin/clients/[clientId]/booking-token/route.ts:41-52` | Admin génère un lien booking | Client |
| 4 | "Ton questionnaire BeeFrequency est prêt" | `app/api/admin/clients/[clientId]/send-questionnaire/route.ts:66-77` | Admin envoie questionnaire | Client |
| 5 | "Ta session est confirmée" | `app/api/admin/appointments/route.ts:174-191` | Admin crée appointment (si flag `sendEmail !== false`) | Client |
| 6 | "Session annulée" / "Session reprogrammée" | `app/api/admin/appointments/[id]/route.ts:111-141` | Admin update appointment (CANCELLED ou nouveau scheduledAt) | Client |
| 7 | "Séance confirmée — {date}" | `app/api/sessions/route.ts:144` | Admin crée Session (ancien modèle) | Client |
| 8 | "Rappel : ta session du …" / "Reminder: your session …" | `app/api/session-reminders/route.ts:50-64` | **Cron horaire** (Session ancien modèle, sessions dans 48h sans rappel) | Client |
| 9 | "Rappel : ta session demain" / "Reminder: your session tomorrow" | `app/api/session-reminders/route.ts:99-113` | **Cron horaire** (Appointment, 47-48h avant, flag `reminderSent=false`) | Client |
| 10 | `Élixirs reçus — {client}` | `app/api/client/elixir-received/route.ts:71` | Client clique "j'ai reçu" | Admin |
| 11 | `Commande élixirs — {client}` | `app/api/client/elixir-order/route.ts:44` | Client envoie adresse livraison | Admin |
| 12 | `Questionnaire soumis — {client}` (intake) | `app/api/client/questionnaire-entry/route.ts:125` | Client soumet questionnaire d'entrée | Admin |
| 13 | `{client} a complété son questionnaire {type}` (pre-start/follow-up) | `app/api/client/questionnaire/[responseId]/route.ts:109` | Client soumet questionnaire pré/post | Admin |
| 14 | `❌ Annulation RDV — {client}` | `app/api/client/appointments/[id]/cancel/route.ts:57` | Client annule RDV | Admin |
| 15 | `⚠️ Changement avec pénalité — {client}` / `🔄 Demande de changement — {client}` | `app/api/client/appointments/[id]/reschedule/route.ts:72-80` | Client demande reschedule | Admin |
| 16 | Newsletter (subject = `campaign.subject`) | `app/api/admin/newsletter/campaigns/[id]/send/route.ts:83` | Admin clique "envoyer campagne" (batch 50/s) | Liste abonnés newsletter |

**Total : 19 templates email distincts** (3 HTML helpers + 16 inline).

**Templates email anniversaire :** 0.

---

## 🔴 Findings CRITIQUES

| # | Fichier:ligne | Description | Impact | Recommandation |
|---|---|---|---|---|
| 1 | `app/api/actions/sync/route.ts:1-294` | L'endpoint qui sync TOUTES les `PendingAction` (RECAP, ELIXIR, SESSION, SYMPTOM, DOCUMENT, BIRTHDAY, CUSTOM-templates HD) n'est **appelé nulle part** : aucun cron VPS, aucun fetch côté UI, aucun hook serveur. Le dashboard ne fait que `prisma.pendingAction.findMany` (page.tsx:64) — il lit ce qui existe mais ne déclenche jamais le sync. Conséquence : les alertes anniversaire J-1/J-7, stock bas critique, sessions à planifier, récaps oubliés ne se créent jamais automatiquement. | Joffrey croit avoir un cockpit "à faire" auto-alimenté, mais il ne contient que les notifications fire-and-forget poussées via `notifyAdmin()` (élixirs reçus, onboarding terminé, questionnaire soumis, annulations RDV). Les alertes anniversaire, stock élixir, session overdue, recap post-séance n'apparaîtront jamais. | (a) Ajouter une 3ᵉ ligne au crontab : `0 6 * * * curl -X POST https://hive.joffreydeleplanque.com/api/actions/sync -H "x-cron-secret:…"` (1x/jour 6h du matin). (b) Sécuriser la route avec `x-cron-secret` (actuellement protégée par `requireAdmin` → un cron HTTP ne passe pas). (c) Documenter dans `seed-journey-templates.ts` et dashboard. |
| 2 | `app/api/journey-messages/process/route.ts:27` + crontab VPS | L'endpoint qui envoie les messages parcours J+1, J+3, J+7, J+14, J+17, J+21 (commentaire : "Peut être appelé par un admin ou un cron") n'a **aucun déclencheur**. Aucune ligne crontab, aucun bouton admin trouvé dans `app/admin/journey-messages/page.tsx` (qui ne CRUD que les templates, jamais le moteur d'envoi). | **Tous les messages de parcours templatisés (et les pratiques auto-assignées via `dayTrigger`) ne s'envoient JAMAIS**. Le travail de rédaction HD-variants (6 variantes × 7 templates) ne sert à rien tant que ce moteur n'est pas branché. | (a) Ajouter au crontab : `5 9 * * * curl -X POST https://hive.joffreydeleplanque.com/api/journey-messages/process -H "x-cron-secret:…"` (1x/jour 9h05). (b) Remplacer `requireAdmin()` par auth via `x-cron-secret` (sinon le cron retourne 401). (c) Loguer chaque exécution. |
| 3 | `app/api/journey-messages/process/route.ts:82-85` + `app/admin/journey-messages/page.tsx:489` | L'admin UI laisse créer des templates avec `triggerType: BIRTHDAY` (option visible dans le select), mais le moteur `process/route.ts` filtre `t.triggerType === "JOURNEY_DAY"` et ignore les BIRTHDAY (commentaire explicite l.133). | Faux espoir : Joffrey peut créer un template "Anniversaire HD-personnalisé", l'activer, et il ne sera **jamais** envoyé. Aucune indication UI. | Soit (a) **retirer l'option BIRTHDAY** du select (cohérence avec l'intention documentée "géré via PendingAction"), soit (b) réimplémenter la logique BIRTHDAY dans le moteur (calcul `bd.getMonth/getDate === today`) ET envoyer comme `Message` tag JOURNEY ou par email. À trancher avec Joffrey. |

## 🟠 Findings IMPORTANTS

| # | Fichier:ligne | Description | Impact | Recommandation |
|---|---|---|---|---|
| 4 | `prisma/schema.prisma:1452-1474` + `app/admin/settings/page.tsx` + `app/api/admin/settings/route.ts:41-43` | Les trois toggles `emailReminderSession`, `emailNewMessage`, `notifyOverdueTask` sont **persistés** en DB (`AdminSettings`) et **affichés** côté UI, mais **jamais lus** par le code de service. Aucun `prisma.adminSettings.findFirst()` n'est appelé en dehors de la route settings elle-même. | Settings fantômes : Joffrey peut décocher "Email rappel séance 48h" et les emails partent quand même. Faux sentiment de contrôle. | Soit (a) **brancher** ces flags dans `session-reminders/route.ts` (skip si false), dans le futur cron `journey-messages/process` (skip messages email-like), et dans `notifyAdmin()` (skip création PendingAction). Soit (b) **retirer** les toggles inopérants de l'UI pour ne pas tromper l'utilisateur. |
| 5 | Crontab VPS — secrets en clair | `x-cron-secret:9338` (4 chiffres, brute-force trivial) et `secret=BeeFreq2026Webhook` (statique, jamais rotaté). | Déjà couvert par sous-agent E ; mais critique pour le scope D car ces deux crons sont les SEULS automatismes serveur. Si le secret fuite, n'importe qui peut faire spammer les clients via `session-reminders` (DoS email Infomaniak → bannissement IP réputation). | Voir rapport E. Migrer vers secrets 32+ chars sourcés depuis `.env`. |
| 6 | `app/api/session-reminders/route.ts:3` | Import mort : `import { sendInvitationEmail } from "@/lib/mailer";` jamais utilisé dans le fichier (le fichier appelle `transporter.sendMail` directement). | Code mort, lint warning. Symptôme d'un refactor partiel. | Supprimer la ligne 3. |
| 7 | `app/api/session-reminders/route.ts:9-12` | Garde-fou bypassable : `if (authHeader !== process.env.CRON_SECRET && process.env.CRON_SECRET)` → si `CRON_SECRET` n'est pas défini en env, la route devient **publique** (pas de 401). N'importe qui peut alors POST sur l'endpoint et déclencher l'envoi des rappels en boucle. | Bug logique sécurité : un `.env` corrompu / variable manquante = exposition. | Inverser la logique : `if (!process.env.CRON_SECRET || authHeader !== process.env.CRON_SECRET) return 401;` (deny by default). |
| 8 | `app/api/session-reminders/route.ts:18-87` | La route exécute en parallèle 2 boucles : (a) `Session` (ancien modèle, table `session`) et (b) `Appointment` (nouveau modèle, table `appointment`). Coexistence des deux systèmes → risque de double envoi si une session a été migrée vers appointment sans nettoyage. | Risque double email "Rappel ta session du …" envoyé au client si données sont dupliquées entre `Session` et `Appointment`. | Confirmer avec Joffrey si `Session` (ancien modèle) est encore utilisé. Sinon retirer la 1ère boucle. |
| 9 | `lib/mailer.ts:6-13` | `console.log("[mailer] SMTP config: …", { user: process.env.SMTP_USER, passExists: !!smtpPass, passVar: … })` au top-level du module → log au démarrage du serveur (pm2) avec `SMTP_USER` en clair dans les logs PM2/journald. | Fuite passive de l'identifiant SMTP dans les logs serveur. Pas de mot de passe, mais l'utilisateur SMTP est sensible (souvent = email admin). | Wrapper le log dans `if (process.env.NODE_ENV !== "production")` ou retirer. |
| 10 | `app/api/journey-messages/process/route.ts:181-185` | `catch { return 500 }` muet — l'erreur n'est jamais logguée. | Quand le futur cron sera branché, debug impossible. | `catch (err) { console.error("[journey-messages/process]", err); … }`. |

## 🟡 Findings MINEURS

| # | Fichier:ligne | Description | Impact | Recommandation |
|---|---|---|---|---|
| 11 | `lib/mailer.ts:28` vs `app/api/auth/forgot-password/route.ts:37` | `FROM_EMAIL` par défaut diffère : `admin@beefrequency.com` dans mailer, `info@joffreydeleplanque.com` dans forgot-password. | Incohérence cosmétique : le client reçoit reset-password depuis `info@…` mais tout le reste depuis `admin@…`. Risque de confusion + score spam (deux from différents pour même domaine). | Centraliser via `mailFrom()` helper dans mailer.ts. |
| 12 | `app/api/client/appointments/[id]/cancel/route.ts:54-65` et `reschedule/route.ts:77-91` | Email admin envoyé via `from: "Hive" <adminEmail>` avec `to: adminEmail` → l'admin reçoit un email "from Hive to admin@…" qui peut être marqué spam (self-reply). | Risque que les notifs critiques (annulation tardive avec pénalité) finissent en spam admin. | Utiliser `from: mailFrom()` (FROM_NAME + FROM_EMAIL) avec un `replyTo` admin. |
| 13 | `app/api/session-reminders/route.ts:22, 81` | Filtre `reminders: { none: { type: "EMAIL" } }` pour Session, `reminderSent: false` pour Appointment → **2 mécaniques différentes** pour le même besoin (idempotence). | Maintenance ; pas de bug immédiat. | Unifier : créer `Appointment.reminders[]` ou utiliser le flag boolean partout. |
| 14 | `app/api/journey-messages/process/route.ts:97` | `JSON.parse(template.hdVariants)` sans try/catch → si un admin sauve un JSON invalide via UI, **l'ensemble du cron crash** et aucun client ne reçoit ses messages parcours. | Single point of failure. | Wrapper dans try/catch comme l.240-250 de `actions/sync/route.ts`. |
| 15 | `.github/workflows/deploy.yml:38-44` | Le workflow GitHub Actions fait `rm -rf .next && npm install && npx prisma generate && npx prisma db push --accept-data-loss && npm run build && pm2 restart` à chaque push. `db push --accept-data-loss` est dangereux en prod (perte silencieuse si drift schema vs migrations). | Risque de perte de données silencieuse. | Remplacer par `npx prisma migrate deploy` (joue uniquement les migrations versionnées). |
| 16 | `app/api/caldav/webhook/route.ts:18` | `if (!secret) return false;` → si `CALDAV_WEBHOOK_SECRET` n'est pas défini en env, **toutes les requêtes retournent 401**. Bonne pratique (deny by default), inverse de la route session-reminders. Mentionné comme exemple positif. | Aucun — observation favorable, à généraliser. | Aligner `session-reminders` sur ce pattern (cf. Finding 🟠-7). |
| 17 | `prisma/seed-journey-templates.ts:97-102` | `upsert({ where: { id: tmpl.title }, … })` → `id` est un uuid auto, jamais égal à `title`. Donc le `upsert` **CRÉE TOUJOURS** un nouveau template à chaque run du seed → duplication potentielle. | Re-seed = templates dupliqués → moteur enverrait 2x le même message si Finding 🔴-2 résolu. | Utiliser `findFirst({ where: { title } })` puis create si absent, ou ajouter `@@unique([title])` au model `JourneyMessageTemplate`. |
| 18 | `app/api/admin/newsletter/campaigns/[id]/send/route.ts:6-12` | Batch 50 mails avec `BATCH_DELAY_MS = 1000` (1s entre batches). Infomaniak limite ~30 mails/seconde mais surtout 200 destinataires/heure pour les comptes standards. | Si liste > 200 abonnés actifs, risque de blocage SMTP Infomaniak. | Sous-agent E couvre l'infra ; mais à monitorer. |

## ✅ Observations factuelles

- Aucune référence à `webPush`, `PushSubscription`, `FCM`, `firebase`, `OneSignal`, `serviceWorker.pushManager` dans le code applicatif. **La PWA n'envoie aucune push notification** — seuls email + UI banners + dashboard PendingAction.
- Aucun modèle `Notification` dans Prisma (le seul match est `notification String?` dans un autre contexte ligne 1174, sans rapport).
- Aucun timer systemd applicatif sur le VPS — uniquement timers OS Ubuntu (apt-daily, certbot, logrotate, fstrim, etc.).
- Aucun cron root, uniquement cron utilisateur `ubuntu`.
- Le modèle `SessionReminder` (schema.prisma:880) sert d'idempotence pour le cron `/api/session-reminders` (uniquement pour Sessions, pas Appointments).
- Le flag `pwaEmailSent` (schema.prisma:106) sert d'idempotence pour `sendPWAEmail` au moment du onboarding.
- Le helper `notifyAdmin()` (`lib/notifications.ts:16-44`) est utilisé pour 4 événements fire-and-forget : onboarding terminé, élixirs reçus, questionnaire soumis, annulation/reschedule RDV. C'est aujourd'hui la **seule alimentation effective** du cockpit "À faire" du dashboard.
- Pas de Sentry/Bugsnag/observability : les erreurs des crons sont silencieuses (catch sans log dans plusieurs routes).

## 📊 Statistiques

- Fichiers lus : 22
- Crons trouvés : 2 actifs (session-reminders, caldav/webhook sync) + 2 endpoints cron-ready non branchés (journey-messages/process, actions/sync)
- Templates email trouvés : 19 (3 helpers HTML stylés + 16 inline texte)
- Occurrences `birthDate` : 26 (toutes pour cartes HD/Astro/BaZi/Numerology + onboarding + IA — **aucune pour notification client**)
- Occurrences `BIRTHDAY` (enum/code) : 12 (toutes inertes pour le client : enum DB, UI admin, code PendingAction non syncé, commentaires de désactivation)
- Bugs détectés : **3 🔴 / 7 🟠 / 8 🟡**

## 🤔 À clarifier avec Joffrey

- **Notif anniversaire client** : était-ce une fonctionnalité voulue ? Si oui, faut-il (a) la réactiver côté `Message` (in-app), (b) créer un template email dédié dans `lib/mailer.ts`, ou (c) garder uniquement l'alerte admin (à condition de brancher le cron `actions/sync`) ?
- **Moteur de messages parcours J+1/3/7/14/21** : Joffrey utilise-t-il vraiment ces messages auto ? Si oui, le cron `journey-messages/process` doit être ajouté URGEMMENT (rien ne tourne aujourd'hui).
- **Cockpit "À faire" dashboard** : Joffrey voit-il aujourd'hui des actions BIRTHDAY / SESSION overdue / RECAP / ELIXIR stock bas ? Si non, c'est la preuve directe que `actions/sync` n'est jamais appelé.
- **Ancien modèle `Session` vs nouveau `Appointment`** : peut-on supprimer la 1ère boucle de `session-reminders/route.ts` ?
- **Settings `AdminSettings`** : Joffrey veut-il vraiment contrôler ces 3 toggles, ou les retirer (puisqu'inopérants) ?
- **Bonus musique J7 / J14 / J21** : seul `app/client/programme/page.tsx:147` mentionne `// Load J7 music if day 7/14/21`. C'est de l'affichage client, **pas une notification**. Confirme-t-on qu'il n'y a aucune notif jalon à ces dates ?
- **Rappel séance 48h** : confirmé fonctionnel via cron horaire (Finding 🔴 N°1 n'affecte pas ce point). Bug potentiel : double envoi si Session ET Appointment coexistent pour le même créneau (cf. Finding 🟠-8).

## 📝 Note de l'agent pour la synthèse Phase 2

**Verdict anniversaire : N'EXISTE PAS côté client** — uniquement une alerte admin codée mais inerte (cron jamais branché). 3 crons critiques attendus côté serveur : seulement 2 actifs, les 2 plus stratégiques (`journey-messages/process` = messages J+1/3/7/14/21, `actions/sync` = alimentation cockpit À faire) **n'ont aucun déclencheur**. SMTP Infomaniak OK, 19 templates email recensés, settings notifications du dashboard admin sont fantômes (persistés mais jamais lus).

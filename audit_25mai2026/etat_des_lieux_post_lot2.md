# ÉTAT DES LIEUX RÉEL POST-LOT 2
Date : 25 mai 2026 · Lecture seule (aucune modification) · Prod = `hive.joffreydeleplanque.com` (pm2 `hive`, port 3001)

| # | Flux | Statut RÉEL en prod | Preuve | Action requise |
|---|---|---|---|---|
| 1 | **SMTP** | ✅ Marche | Vars `SMTP_*` présentes ; `transporter.verify()` → **SMTP_OK** (mail.infomaniak.com) ; logs montrent `[mailer] SMTP config` + envois invitations | Aucune |
| 2 | **Onboarding nouveau client** | ✅ Marche | Flux = invitation (pas de `/register` public). `app/api/invite/route.ts` + `app/invite/` + `app/api/onboarding/route.ts` présents. **0 référence morte** (Elixir/ElixirPrescription/programmeStartDate) dans auth/invite/onboarding | Aucune |
| 3 | **Création client admin** | ✅ Marche | `app/api/admin/create-client/route.ts` : crée User + Client + InviteToken ; **email en try/catch → un échec SMTP ne casse pas la création** ; 0 réf morte. ⚠️ `detoxStartDate` + 7 ClientPhase générés **uniquement si `isLegacy=true`** (by-design : un client standard démarre sans phases tant que la date détox n'est pas posée) | Aucune (mais cf. MOUVEMENT 7 : poser detoxStartDate pour activer le parcours) |
| 4 | **Check-in matin élixirs** | ✅ Marche | `app/client/checkin/morning/page.tsx:51` lit `/api/client/elixirs` (recâblé sur **PhaseElixir**) ; `:115` poste **`phaseElixirId`** (plus de `elixirPrescriptionId`). Aucun pointeur vers du vide | Aucune |
| 5 | **Endpoints critiques** | 🟡 Partiel | GET `/api/client/elixirs`, `/profile`, `/admin/clients`, `/auth/me`, `/parcours` → **307** (redirect login, protégés) ✅. **POST `/api/auth/login` sans body → 500** (attendu 400) : `await request.json()` throw sur body vide → `catch` (l.137) → 500. Pré-existant, route non touchée par le LOT 2, sans impact sur les vrais logins | Mineur/non bloquant : envelopper `request.json()` pour renvoyer 400 |
| 6 | **Logs erreurs récentes** | 🟡 Partiel | Seule erreur récurrente : `Failed to find Server Action "x"/"1"` = clients avec une page **périmée** (ancien déploiement) qui re-soumettent une Server Action après redeploy. Transitoire, se résout au rechargement. **Aucune erreur liée au refactor élixirs/dates** (pas d'`undefined`, pas de crash Prisma) | Aucune (normal post-deploy ; les onglets ouverts se rechargeront) |
| 7 | **Cohérence DB 5 clients** | 🟡 Partiel | benjamin (detox 20/04, 7 phases, 29 élixirs) ✅ · gina (18/05, 7, 8) ✅ · laura (07/03, 7, 10) ✅ · yasmine (02/05, 7, 5) ✅ · **marieclaire = detoxStartDate NULL, 0 phase, 0 élixir** ❌. Intégrité FK **parfaite** : 0 PhaseElixir orphelin, 0 FK Elixir cassée, 0 CheckinElixir orphelin | **marieclaire** : poser `detoxStartDate` + générer ses 7 phases si elle doit avoir un parcours |
| 8 | **Anniversaire (cron)** | ❌ Pas automatique | Crontab VPS = 2 jobs : session-reminders (horaire) + caldav sync (5 min). **Aucun cron pour `/api/actions/sync`**. La logique BIRTHDAY (`app/api/actions/sync` sections f) crée une PendingAction **uniquement quand Joffrey ouvre le dashboard admin** (qui déclenche le POST sync). Pas de notification automatique/planifiée | Si "activer pour tout nouveau client" = besoin d'un **cron quotidien** sur l'endpoint de sync (ou endpoint dédié) |

## Verdict global

- **Flux ✅ pleinement opérationnels : 4/8** — SMTP, Onboarding, Création client admin, Check-in matin élixirs
- **Flux 🟡 partiels : 3/8** — Endpoints (login 500 sur body vide), Logs (Server Action périmée transitoire), Cohérence DB (marieclaire)
- **Flux ❌ : 1/8** — Anniversaire non automatique (dépend de l'ouverture du dashboard)

### Le LOT 2 lui-même : sain
Aucune régression introduite. Intégrité référentielle post-migration parfaite (0 orphelin/0 FK cassée). Les endpoints répondent (307, jamais 500 sur les flux refactorés). Check-in et page élixirs pointent bien sur PhaseElixir.

### Actions critiques AVANT d'accueillir un nouveau client
1. **marieclaire** (`marieclairetoubeau@yahoo.fr`) : `detoxStartDate` NULL → 0 phase → parcours/élixirs/accueil **vides** pour elle. Décider : lui poser une date détox + générer ses 7 phases, OU la laisser en attente assumée. (Pré-existant, indépendant du LOT 2.)
2. **Anniversaire** : trancher si la notif doit être **automatique**. Aujourd'hui elle n'apparaît que quand le dashboard admin est ouvert. Pour "activer pour tout nouveau client", ajouter un cron quotidien (ex. `/api/actions/sync` ou endpoint anniversaire dédié).
3. **(Mineur, non bloquant)** `POST /api/auth/login` renvoie 500 au lieu de 400 sur body vide/malformé — robustesse à corriger un jour, sans urgence (les vrais logins envoient un body valide).

> Note sécurité (hors périmètre) : la crontab VPS contient des secrets en clair (`x-cron-secret`, `secret=` du webhook caldav). Redactés dans ce rapport. À considérer pour un durcissement ultérieur.

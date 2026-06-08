# CRON ANNIVERSAIRE — Findings bonus (ne pas toucher sans validation)

**Date :** 25 mai 2026 · Relevé pendant l'install du cron anniversaire.

## 🔴 BONUS-1 — Le proxy d'auth bloque TOUS les endpoints cron (307 → /login)

`proxy.ts` (ex-middleware) redirige vers `/login` toute route absente de `publicPaths`
et sans cookie `token`. Or **aucun** endpoint cron n'y figure :

```
publicPaths = ["/login","/register","/invite","/api/invite","/api/auth/login",
  "/blocked","/client/booking","/api/booking","/api/availability","/forgot-password",
  "/reset-password","/api/auth/forgot-password","/api/auth/reset-password",
  "/api/newsletter/unsubscribe","/api/public-uploads/journal"]
```

Tests prod (avec leur secret) :
- `POST /api/session-reminders` → **307** (bloqué)
- `GET  /api/caldav/webhook?action=sync` → **307** (bloqué)
- `POST /api/actions/sync` → **307** (bloqué)

**Conséquence :** les crons existants `session-reminders` (rappels séance, horaire) et
`caldav/webhook` (synchro agenda, /5 min) **ne s'exécutent pas** : le `curl ... > /dev/null`
de la crontab avale la redirection 307, le travail réel n'a jamais lieu.

→ Impact probable : **les emails de rappel de séance ne partent pas** et **l'agenda caldav
ne se synchronise pas** automatiquement. À confirmer/corriger hors périmètre de cette mission.

## ✅ Correctif requis pour le cron anniversaire

Ajouter `/api/actions/sync` à `publicPaths` dans `proxy.ts`. La route reste protégée :
elle valide elle-même le `x-cron-secret` (ou une session admin). "Public" = exempté du
middleware-cookie, pas exempté d'auth.

Si Joffrey le souhaite, le même correctif (ajout à `publicPaths`) débloquerait aussi
`/api/session-reminders` et `/api/caldav/webhook` — mais c'est hors périmètre « cron
anniversaire » → non touché ici, en attente de décision.

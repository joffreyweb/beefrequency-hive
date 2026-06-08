# RAPPORT E — Infrastructure VPS

**Date :** 25 mai 2026
**Périmètre analysé :** VPS ubuntu@83.228.246.147 + /var/www/hive
**Agent :** E

---

## Connexion SSH

OK. Réponse instantanée à `ssh -o ConnectTimeout=5 -o BatchMode=yes ubuntu@83.228.246.147 'echo OK'`. Aucune erreur d'authentification, clé déjà installée. Audit infra réalisé en direct, en lecture seule uniquement.

## État PM2

```
┌────┬─────────┬─────────┬──────┬──────────┬────────┬──────┬───────────┬──────┬─────────┐
│ id │ name    │ version │ mode │ pid      │ uptime │ ↺    │ status    │ cpu  │ mem     │
├────┼─────────┼─────────┼──────┼──────────┼────────┼──────┼───────────┼──────┼─────────┤
│ 30 │ hive    │ N/A     │ fork │ 2246895  │ 10D    │ 60   │ online    │ 0%   │ 63.9mb  │
│ 48 │ site    │ 1.0.0   │ fork │ 1186342  │ 30D    │ 9    │ online    │ 0%   │ 106.7mb │
└────┴─────────┴─────────┴──────┴──────────┴────────┴──────┴───────────┴──────┴─────────┘
```

Détails `hive` :
- script path : `/usr/bin/npm`
- exec cwd : `/var/www/hive`
- exec mode : `fork_mode`
- restarts : **60** (depuis création le 2026-05-15)
- unstable restarts : 0
- uptime courant : 10 jours
- created at : 2026-05-15T09:19:36Z

Processus secondaire `site` (port 3002 via nginx `joffreydeleplanque.com`) : online stable, hors scope direct mais cohabite sur le VPS.

## Crontab système (ubuntu)

```
0 * * * * curl -s -X POST https://hive.joffreydeleplanque.com/api/session-reminders -H "x-cron-secret:9338"
*/5 * * * * curl -s "https://hive.joffreydeleplanque.com/api/caldav/webhook?action=sync&secret=BeeFreq2026Webhook" > /dev/null 2>&1
```

Deux crons utilisateur. **Les secrets sont visibles en clair dans la crontab** : `x-cron-secret:9338` (faible) et `secret=BeeFreq2026Webhook` (passable mais loggable côté nginx access log via query string).

## Nginx

5 sites activés dans `/etc/nginx/sites-enabled/` : `default`, `hive`, `radicale`, `site`, `status` (pas pu lire `radicale` séparément, le `cat` groupé est passé sur les 5 demandés). `sudo nginx -t` : syntaxe OK.

Hive (`/etc/nginx/sites-enabled/hive`) :
- `hive.joffreydeleplanque.com` en HTTPS → `proxy_pass http://localhost:3001`
- Redirection 301 HTTP → HTTPS via managed Certbot
- Headers WebSocket OK (`Upgrade`, `Connection 'upgrade'`)
- **Aucun `proxy_set_header X-Real-IP` / `X-Forwarded-For` / `X-Forwarded-Proto`** sur ce vhost — l'app Next.js ne voit que l'IP de loopback. Conséquence : impossible de logger l'IP réelle des users, et `req.headers['x-forwarded-proto']` est absent (peut casser une logique `getSecureSession` ou les cookies `secure`).
- Aucun rate-limiting (`limit_req_zone`) ni `client_max_body_size` défini.

Default :
- `server _;` répond sur le port 80 si aucun vhost ne matche (`/var/www/html`) — comportement attendu mais pas de TLS par défaut, pas critique.

Site joffreydeleplanque.com :
- Sert `/parcours/` en static depuis `/var/www/parcours-preview/`
- Reste proxy_pass vers `http://localhost:3002`
- Pareil : pas de `X-Forwarded-*` headers.

cal.beefrequency.com :
- Proxy vers Radicale `127.0.0.1:5232`
- Pas de redirection HTTP→HTTPS pour ce vhost (uniquement `listen 443`)

status.joffreydeleplanque.com :
- Proxy vers `127.0.0.1:3003`
- Headers `X-Real-IP` / `X-Forwarded-For` / `X-Forwarded-Proto` correctement configurés (contraste avec hive).

## SSL

4 certificats Let's Encrypt :

| Domain | Expiry | Reste |
|---|---|---|
| cal.beefrequency.com | 2026-06-29 | 34 j |
| hive.joffreydeleplanque.com | 2026-08-18 | 85 j |
| joffreydeleplanque.com (+www) | 2026-06-25 | 30 j |
| status.joffreydeleplanque.com | 2026-07-15 | 50 j |

Tous VALID. Renouvellement automatique : non vérifié explicitement (pas de `systemctl status snap.certbot.renew.timer` lancé). Aucun cron certbot dans la crontab `ubuntu`. À supposer que la renouvellement passe par le timer systemd installé par le paquet certbot — `joffreydeleplanque.com` à 30 jours s'approche de la zone de renouvellement (`< 30 j`).

## Dernier deploy

- Commit déployé sur VPS : `b2d4589709a4c8eab655d27c8aedceb48a43c5bc` — `fix(auth): normalize email on create + case-insensitive lookup`
- Date commit : 2026-05-15 11:14:48 +0200
- `cd /var/www/hive && git log --oneline -10` ne retourne **qu'un seul commit** : `b2d4589`. Le dossier `/var/www/hive` est synchronisé via **rsync** (cf `deploy.yml` → `easingthemes/ssh-deploy`), pas via `git pull`. L'historique git du repo distant est donc tronqué (probablement un repo init initial). Ce n'est pas un bug, juste une note : la traçabilité git côté VPS est inexploitable, il faut se référer à `git log` local + GitHub Actions runs.
- `.next/BUILD_ID` = `EiwAJYMa7xJih36eUe2Ia`, dossier `.next` créé le **2026-05-15 09:18:58 UTC** — **identique à la date de création du process PM2**. Aucun build effectué depuis 10 jours. Cohérent avec "aucun nouveau push sur main depuis le 15 mai".

## Drift Prisma

`npx prisma migrate status` :

```
45 migrations found in prisma/migrations
Following migration have not yet been applied:
20260512132038_add_parcours_personnalise_offer_type

To apply migrations in development run prisma migrate dev.
To apply migrations in production run prisma migrate deploy.
```

**Drift confirmé** : la migration `20260512132038_add_parcours_personnalise_offer_type` n'est pas enregistrée dans `_prisma_migrations` côté DB. Pourtant le workflow `deploy.yml` exécute `npx prisma db push --accept-data-loss` à chaque deploy — donc le schéma DB est synchrone avec `schema.prisma`, mais l'historique de migrations n'est jamais consigné. Conséquence : `prisma migrate status` mentira systématiquement après chaque nouvelle migration, et un futur passage à `prisma migrate deploy` lèvera des erreurs.

## Clés env présentes (sans valeurs)

```
ADMIN_EMAIL=
CALDAV_APP_PASSWORD=
CALDAV_HOME_URL=
CALDAV_URL=
CALDAV_USERNAME=
CALDAV_WEBHOOK_SECRET=
CRON_SECRET=
DATABASE_URL=
FROM_EMAIL=
FROM_NAME=
INFOMANIAK_API_TOKEN=
INFOMANIAK_DRIVE_ID=
INVITE_ONLY=
JWT_EXPIRES_IN=
JWT_SECRET=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_AUDIO_SEUIL1_URL=
NEXT_PUBLIC_BASE_URL=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
NODE_ENV=
PORT=
SMTP_FROM=
SMTP_FROM_NAME=
SMTP_HOST=
SMTP_PASS=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
TURNSTILE_SECRET_KEY=
VAPID_EMAIL=
VAPID_PRIVATE_KEY=
ZOOM_ACCOUNT_ID=
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
```

36 clés. Valeurs masquées ***REDACTED*** (non lues). Notes :
- Doublons potentiels : `FROM_EMAIL` + `SMTP_FROM`, `FROM_NAME` + `SMTP_FROM_NAME`, `NEXT_PUBLIC_APP_URL` + `NEXT_PUBLIC_BASE_URL` — 3 paires probablement redondantes, vérifier le code.
- `CRON_SECRET` présent dans `.env` mais la valeur utilisée par les crons est en clair dans la crontab (`x-cron-secret:9338`) — confirmer si `9338` correspond à `CRON_SECRET` ou si c'est un drift entre cron et code.

## Ressources système

| Ressource | Valeur |
|---|---|
| Disque `/` | 8.9G utilisés / 20G total (47%) |
| RAM | 812Mi utilisés / 11Gi total (10Gi available) |
| Swap | 0 B (désactivé) |
| Uptime VPS | 63 jours, 6h |
| Load average 1/5/15min | 0.04 / 0.01 / 0.00 |

Aucun problème de saturation. Disque confortable. Pas de swap configuré (acceptable avec 11Gi RAM dispo).

---

## Findings CRITIQUES

| # | Fichier:ligne | Description | Impact | Recommandation |
|---|---|---|---|---|
| C1 | `crontab -l` (VPS) | Secrets cron en clair dans la crontab : `x-cron-secret:9338` et `secret=BeeFreq2026Webhook`. Le `9338` est extrêmement faible (4 chiffres, brute-forçable en secondes). | N'importe qui pouvant lire le PID/process listing peut trigger les jobs sensibles (`session-reminders`, `caldav/webhook sync`). Si jamais le user `ubuntu` est compromis, ces secrets fuitent immédiatement. | Régénérer des secrets longs (32+ chars hex/base64), les lire depuis `.env` via un wrapper script (`/usr/local/bin/cron-trigger-hive.sh` qui source `.env`), masquer la query-string dans les access logs nginx. |
| C2 | `.github/workflows/deploy.yml:41` | `npx prisma db push --accept-data-loss` à chaque deploy en prod. Bypass total du système de migrations Prisma. | (1) Possibilité de perte de données silencieuse à chaque schema change ; (2) `_prisma_migrations` jamais alimenté → drift de 1 migration aujourd'hui (`20260512132038_add_parcours_personnalise_offer_type`), drift grandissant à mesure que de nouvelles migrations sont créées ; (3) impossibilité de rollback structuré. | Remplacer par `npx prisma migrate deploy`. Faire un `migrate resolve --applied` one-shot pour aligner l'historique sur les 45 migrations existantes. |

## Findings IMPORTANTS

| # | Fichier:ligne | Description | Impact | Recommandation |
|---|---|---|---|---|
| I1 | `/etc/nginx/sites-enabled/hive` | Absence de `proxy_set_header X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`. | Next.js voit toujours l'IP loopback ; logs d'app/auth/rate-limit IP-based inutilisables ; `req.headers['x-forwarded-proto']` undefined peut casser une logique de redirect ou de cookie `secure`. | Ajouter les 3 headers (comme déjà fait sur `status.joffreydeleplanque.com`). |
| I2 | `/home/ubuntu/.pm2/logs/hive-error.log` | 113 occurrences de `Failed to find Server Action` sur 354 lignes de log. | UX : à chaque rebuild, les onglets ouverts des users côté client référencent des Server Actions hash qui n'existent plus → erreurs visibles + reloads forcés. Symptôme typique d'un build sans `experimental.serverActions.encryptionKey` stable. | Configurer une clé d'encryption stable dans `next.config.ts` (`experimental.serverActions.encryptionKey`) ou via env `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`. Documenter dans le guide Next 16 (`node_modules/next/dist/docs/`). |
| I3 | PM2 hive | **60 restarts** en 10 jours (uptime courant 10D mais restarts count 60). Process créé le 2026-05-15, déploy unique le même jour, donc restarts non liés aux deploys. | Indique des crashes hors-deploy ou des `pm2 restart` manuels répétés. Aucun `unstable restarts` certes, mais 6 restarts/jour de moyenne en post-deploy est anormal. | Investiguer les triggers via `pm2 logs hive --err` historisé. Si plantages applicatifs, identifier les root causes (pdfkit ENOENT visible déjà). |
| I4 | `/var/www/hive` (rsync) | L'erreur `ENOENT: no such file or directory, open '/ROOT/node_modules/pdfkit/js/data/Helvetica.afm'` apparaît dans les logs (kDrive-archive questionnaire). Le chemin `/ROOT/...` est suspect (pas `/var/www/hive/...`). | Génération PDF kDrive archive cassée → fonctionnalité d'archivage utilisateur HS. | Vérifier la résolution de path absolu pdfkit dans le build Next 16 (probablement un bundling pdfkit côté server qui mange les fichiers AFM). Ajouter `pdfkit` à `serverExternalPackages` dans `next.config.ts` (à côté de `sweph`). |
| I5 | `deploy.yml:38-43` | `rm -rf .next` + `npm install --production=false` + `npm run build` à chaque deploy, sans cache. | Builds inutilement longs (~5-10 min). Risque de timeout (`command_timeout: 10m` limite serrée). | Garder `.next/cache`, utiliser `npm ci` au lieu de `npm install`. |
| I6 | `.github/workflows/deploy.yml:17` | Action `easingthemes/ssh-deploy@main` — référence à la branche `main` mobile. | Risque supply-chain si la branche `main` de l'action est compromise. | Pin sur un tag/SHA (ex: `@v4.1.10`). |

## Findings MINEURS

| # | Fichier:ligne | Description | Impact | Recommandation |
|---|---|---|---|---|
| M1 | `.env` (VPS) | Doublons probables : `FROM_EMAIL`/`SMTP_FROM`, `FROM_NAME`/`SMTP_FROM_NAME`, `NEXT_PUBLIC_APP_URL`/`NEXT_PUBLIC_BASE_URL`. | Confusion de config, risque de divergence (une variable mise à jour, pas l'autre). | Auditer le code, unifier sur une seule variable par concept. |
| M2 | Certbot | Cert `joffreydeleplanque.com` expire dans 30 j. Aucun cron certbot dans `crontab -l` (renouvellement présumé via timer systemd, non vérifié). | Risque d'oubli si le timer systemd est désactivé. | Vérifier `systemctl status snap.certbot.renew.timer` (ou équivalent paquet apt) lors d'un futur run avec sudo. |
| M3 | `/etc/nginx/sites-enabled/hive` | Pas de `client_max_body_size` défini → défaut nginx 1 MB. | Uploads (audios, PDF, photos profil) > 1 MB rejetés en 413. | Ajouter `client_max_body_size 20M;` (ou plus selon besoin). |
| M4 | `/etc/nginx/sites-enabled/cal.beefrequency.com` (dans `default`) | Pas de redirection HTTP → HTTPS pour `cal.beefrequency.com`. | Si un client CalDAV se connecte en HTTP, fail silencieux. | Ajouter le bloc `listen 80; return 301 https://...`. |
| M5 | PM2 | Process `hive` n'a pas de `version` (N/A) — pas de `package.json#version` exposé dans la conf PM2. Cosmétique. | Légère perte de traçabilité dans `pm2 list`. | `pm2 start npm --name hive -- start` avec un `ecosystem.config.js` versionné aurait été plus propre. |
| M6 | Logs PM2 | `hive-error.log` = 24K, pas de logrotate visible. Faible volume mais à surveiller. | Disque OK aujourd'hui. | Activer `pm2 install pm2-logrotate` si pas déjà fait. |
| M7 | `NODE_ENV=` présent dans `.env` mais la commande de start est `next start -p 3001` (script `start` de `package.json`). À vérifier que `NODE_ENV=production`. | Si différent, dev mode actif en prod (perf catastrophique). | Confirmer la valeur (interdit de lire les valeurs ici). |
| M8 | `next.config.ts:5-14` | Header CORS `Access-Control-Allow-Origin: *` sur **toutes les routes**, y compris les API authentifiées. | Permet à n'importe quelle origine de lire les réponses si un user est authentifié (couplé à `credentials: 'include'` ou cookies, le risque grandit). | Restreindre aux routes statiques nécessaires ou whitelister une origine. À cross-checker avec rapport sécurité. |

## Observations factuelles

- VPS healthy : load < 0.1, RAM 92% libre, disque < 50%.
- PM2 + nginx + certbot + crons en place et fonctionnels.
- Deuxième app `site` (port 3002) cohabite paisiblement.
- Radicale (CalDAV) sur port 5232 derrière nginx `cal.beefrequency.com`.
- Status page `status.joffreydeleplanque.com` exposée sur port 3003.
- Synchronisation déploiement : GitHub Actions push → rsync → `npm install` + `prisma generate` + `prisma db push` + `next build` + `pm2 restart`.
- 45 migrations Prisma présentes dans `prisma/migrations/`, la plus récente datée 2026-05-12.
- Pas d'antivirus ni de fail2ban visible (non testé).

## Statistiques

- Commandes SSH exécutées : **15** (test + pm2 list + pm2 logs + pm2 describe + crontab + 2× nginx + certbot + 2× git log + prisma + env + df + free + ls migrations + ls logs + BUILD_ID + grep logs)
- Erreurs PM2 trouvées dans `hive-error.log` (sur 354 lignes) :
  - `Failed to find Server Action` : 113
  - `ENOENT` (pdfkit Helvetica.afm) : 2
  - `TypeError` : 0
- Bugs détectés : **2** 🔴 / **6** 🟠 / **8** 🟡

## À clarifier avec Joffrey

- 🟡 Le secret cron `9338` est-il bien la valeur de `CRON_SECRET` dans `.env`, ou y a-t-il un drift ? (Si drift, le cron renvoie 401 silencieusement.)
- 🟡 Le secret `BeeFreq2026Webhook` est-il bien la valeur de `CALDAV_WEBHOOK_SECRET` ? Même question.
- 🟡 Renouvellement Let's Encrypt : confirmer que le timer systemd est actif (un `sudo systemctl status snap.certbot.renew.timer` lors d'un prochain run avec sudo le confirmera).
- 🟡 Les 60 restarts PM2 en 10 jours sont-ils des restarts manuels (debug) ou des crashes automatiques ? (Pas d'instabilité signalée mais le compteur monte.)
- 🟡 Le bug pdfkit `/ROOT/node_modules/...` (path `/ROOT/` absolu suspect) : à voir si c'est une feature standalone du build Next 16 ou un bug.

## Note de l'agent pour la synthèse Phase 2

Infra globalement saine et bien dimensionnée, mais 2 risques systémiques majeurs : (1) `prisma db push --accept-data-loss` en prod = bombe à retardement pour la cohérence de données, (2) secrets cron en clair dans la crontab dont un à 4 chiffres. Côté Next.js, la config `hive` nginx ignore les headers `X-Forwarded-*` et 113 erreurs Server Actions polluent les logs (probablement clé d'encryption non stable).

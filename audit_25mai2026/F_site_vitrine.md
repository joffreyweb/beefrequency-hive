# RAPPORT F — Site vitrine joffreydeleplanque.com

**Date :** 25 mai 2026
**Périmètre analysé :** ~/beefrequency-ds (re-exécuté par l'orchestrateur — le sous-agent F initial avait été bloqué par l'isolation sandbox)
**Agent :** F (re-run depuis le main agent, accès lecture confirmé)

---

## 📂 Existence du repo

Présent : `/Users/joffreydeleplanque/beefrequency-ds` — Next.js 14.2 standalone, TypeScript, Tailwind v4 (via `@tailwindcss/postcss`), PM2 port 3002 en prod (`joffreydeleplanque.com`).

## 🔐 Gate / middleware

**Statut : DÉSACTIVÉE** (confirmé par `CLAUDE.md` du repo : « Site public (gate désactivée 24/4) »).
Le code de gate existe encore : `app/api/auth-site/route.ts` (vérif `SITE_PASSWORD` → cookie `site_access` 7 jours).
**Aucun fichier `middleware.ts`** à la racine ni dans `app/` → la route POST `/api/auth-site` est orpheline : aucun garde-fou ne consomme le cookie, et aucun composant UI n'appelle ce endpoint.

## ✉️ Formulaire /conversation

- **Page** : `app/conversation/page.tsx` (wrapper `LanguageProvider` + `ConversationFlow`)
- **Flow** : `components/ConversationFlow.tsx` — 4 étapes (step 0 → 3), choix `WrittenForm` OU `VoiceForm` à l'étape 2
- **Route API écrit** : `app/api/contact/route.ts` → `POST /api/contact` (JSON)
- **Route API vocal** : `app/api/contact-voice/route.ts` → `POST /api/contact-voice` (multipart)
- **SMTP** : `lib/mailer.ts` — nodemailer, `mail.infomaniak.com:587`, `secure: false` (STARTTLS implicite)
- **Anti-spam** : **AUCUN** (pas de Turnstile, pas de hCaptcha, pas de rate-limit, pas de honeypot)
- **Validation côté serveur** : minimale (`email` et `firstName` présents → 400 sinon ; aucun format check)

## 🤐 Cohérence communication externe (règles §14 INSTRUCTIONS)

- **Mentions de prix** : NON (grep `prix|price|gratuit|free` sur `app/` + `components/` + `lib/content.ts` → 0 résultat)
- **Divulgation alvéoles** : NON (grep `alvéole|alveole` → 0 résultat)
- **Mentions élixir / module / détox / programme interne** : NON — la seule occurrence de « cycle » est `THE NECTAR CYCLE` (nom public du parcours, non lié à la structure 103 jours)
- **CTA unique** : « Enter the conversation » → `/conversation` ✅
- **Respect §14** : ✅ cohérent

## 🚢 Déploiement

- GitHub Actions `.github/workflows/deploy.yml` — sur `push main`
- Build standalone → rsync vers `/var/www/site-joffrey/` avec `--exclude='.env' --exclude='node_modules'` ✅
- Restart PM2 : `pm2 delete site || true ; PORT=3002 pm2 start server.js --name site ; pm2 save ; pm2 restart site --update-env` (delete+start = ~1s downtime à chaque deploy)

---

## 🔴 Findings CRITIQUES

| # | Fichier:ligne | Description | Impact | Recommandation |
|---|---|---|---|---|
| 1 | `app/api/contact/route.ts:4-36` | Endpoint public sans anti-spam, sans rate-limit, sans honeypot, sans CAPTCHA. | Spam massif garanti dès indexation par les bots (quelques jours à quelques heures). | Ajouter Cloudflare Turnstile + rate-limit IP (5 req/h) + champ honeypot. |
| 2 | `app/api/contact-voice/route.ts:19-24` | Fichier audio sauvegardé dans `public/voice-messages/${Date.now()}.webm` → servi statiquement par Next.js sous une URL devinable. | Tout message vocal d'une cliente est lisible par quiconque devine le timestamp (~brute-force sur quelques jours) — fuite RGPD. | Stocker hors `/public` (ex: `/var/data/voice-messages/` non servi) OU nom crypto-aléatoire + suppression après envoi du mail. |
| 3 | `app/api/contact-voice/route.ts:8-15` | Aucune validation taille / MIME du fichier audio uploadé (cast `as File` direct). | Upload-DoS : un attaquant peut uploader un fichier de plusieurs GB nommé `.webm` → saturation disque VPS. | Refuser si `audio.size > 5_000_000` ; vérifier `audio.type === "audio/webm"`. |

## 🟠 Findings IMPORTANTS

| # | Fichier:ligne | Description | Impact | Recommandation |
|---|---|---|---|---|
| 1 | `app/api/contact-voice/route.ts:6-43` | Même problème que finding critique #1 : zéro anti-spam sur le endpoint vocal. | Spam via upload audio (et donc fichiers binaires sur disque). | Même mitigation que critique #1. |
| 2 | `lib/mailer.ts:14` | `MAIL_TO = process.env.SMTP_USER!` — non-null assertion sans validation au démarrage. | Si `SMTP_USER` absent du `.env` de prod, crash runtime à la première requête (pas au boot, donc détection tardive). | Valider la présence des env vars au boot (throw explicite si absent). |
| 3 | `app/api/auth-site/route.ts:6` | Comparaison `password !== process.env.SITE_PASSWORD` non timing-safe. | Timing attack théorique (bénin tant que la gate est désactivée). | `crypto.timingSafeEqual` si la gate doit être réactivée. |
| 4 | `app/api/auth-site/route.ts` (entier) | Route gate orpheline : gate désactivée, aucun middleware ne consomme le cookie `site_access`, mais le endpoint reste exposé. | Surface d'attaque inutile + confusion pour un futur dev. | Soit supprimer la route, soit réactiver la gate via un `middleware.ts`. |
| 5 | `app/api/contact/route.ts:9` | Validation serveur très faible : pas de regex email, pas de longueur max sur `message`. | Email malformé accepté (échouera côté SMTP) ; `message` peut faire plusieurs MB. | Ajouter Zod sur le body, plafonner `message` à 5000 chars. |
| 6 | `components/WrittenForm.tsx:50-95` | Aucun champ honeypot caché dans le formulaire HTML. | Les bots remplissent tous les champs visibles ; un honeypot intercepte 80–90 % du spam basique pour 5 lignes de code. | Ajouter `<input name="website" type="text" tabIndex={-1} className="hidden" />` et rejeter côté API si non vide. |
| 7 | `lib/mailer.ts:3-11` | Pas d'option `family: 4` (alors que le brief Joffrey mentionne `family: 4` pour SMTP Infomaniak). | Sur certains réseaux IPv6 défaillants, la connexion SMTP peut hang. | 🟡 À CLARIFIER — peut-être que la note du brief ne concernait que la PWA Hive. À aligner si même comportement attendu. |

## 🟡 Findings MINEURS

| # | Fichier:ligne | Description | Impact | Recommandation |
|---|---|---|---|---|
| 1 | `.gitignore` | `public/voice-messages/` non listé. | Risque de commit accidentel des audios des clientes. | Ajouter `public/voice-messages/` au `.gitignore`. |
| 2 | `app/api/contact-voice/route.ts:21` | Aucun cleanup des fichiers audio après envoi du mail. | Le dossier grossit indéfiniment → saturation disque à terme. | Cron de purge > 30 jours OU suppression immédiate après `sendMail`. |
| 3 | `components/WrittenForm.tsx:18-25` | `fd.get(...)` cast direct sans `String(... ?? "")`. | Laxisme TS, pas un bug runtime. | Wrap avec `String(fd.get(...) ?? "")`. |
| 4 | `app/api/contact/route.ts:32` | `console.error("Contact error:", err)` — log non-structuré. | Difficile à filtrer dans `pm2 logs site`. | Préfixer `[SITE][CONTACT]` ou logger JSON. |
| 5 | `.github/workflows/deploy.yml:48-53` | `pm2 delete && pm2 start` à chaque deploy ≈ 1s de downtime. | Site inaccessible 1s à chaque push main. | Remplacer par `pm2 reload site --update-env` (zero-downtime en cluster mode). |
| 6 | `next.config.mjs:5` | `images: { unoptimized: true }` activé. | Pas d'optimisation Next/Image → poids inutile si `<Image />` est utilisé. | Réévaluer si la propriété est encore nécessaire. |
| 7 | `app/api/contact/route.ts:13-29` | Pas de timeout sur `transporter.sendMail()`. | Si SMTP Infomaniak hang, la requête HTTP hang aussi (loader infini côté client). | Ajouter `connectionTimeout: 10000, socketTimeout: 10000` au transporter. |
| 8 | `lib/mailer.ts` | Transporter créé au import (singleton) sans `verify()` au démarrage. | Une mauvaise config SMTP n'est révélée qu'au premier envoi. | Optionnel : `transporter.verify()` au boot avec log. |

## ✅ Observations factuelles (sans gravité)

- Stack minimaliste : 8 fichiers source TS/TSX, 3 routes API, 6 composants. Surface d'attaque très réduite.
- Aucune dépendance lourde (pas de CMS, pas de DB, pas de NextAuth, pas de framework de form).
- Tailwind v4 + `@tailwindcss/postcss` (config moderne, pas de `tailwind.config.ts` à la racine).
- Le repo respecte parfaitement la séparation avec la PWA Hive : aucune référence croisée, aucun shared package.
- `lib/content.ts` lourd (textes S1-S7 EN+FR) mais correctement isolé.
- Footer / mentions légales / RGPD : **non détectés** dans les sections auditées (à creuser en Phase 2 — peuvent être dans `lib/content.ts` non lu intégralement).
- Le commentaire de CLAUDE.md sur Tailwind cassé en prod (`px-6 md:px-16 mx-auto max-w-5xl`) n'a pas pu être vérifié sans build prod live.

## 📊 Statistiques

- Fichiers lus : 14 (CLAUDE.md, package.json, next.config.mjs, .gitignore, deploy.yml, layout.tsx, conversation/page.tsx, ConversationFlow.tsx, WrittenForm.tsx, VoiceForm.tsx, mailer.ts, auth-site/route.ts, contact/route.ts, contact-voice/route.ts)
- Routes analysées : 3 (`/api/contact`, `/api/contact-voice`, `/api/auth-site`)
- Pages analysées : 3 (home, parcours, conversation)
- Lignes de code parcourues : ~600
- Bugs détectés : **3 🔴 / 7 🟠 / 8 🟡**

## 🤔 À clarifier avec Joffrey

- La gate était-elle prévue pour rester désactivée définitivement, ou est-ce temporaire ? Si définitif → supprimer `/api/auth-site` et `SITE_PASSWORD`.
- Les messages vocaux reçus depuis le 24 avril sont-ils encore présents dans `public/voice-messages/` sur le VPS ? Si oui, ils sont **actuellement accessibles publiquement** via URL devinable.
- L'option `family: 4` mentionnée dans le brief concerne-t-elle ce repo ou seulement la PWA Hive ?
- Existe-t-il des pages de mentions légales / politique de confidentialité ? Non détectées dans les sections auditées.

## 📝 Note de l'agent pour la synthèse Phase 2

**Priorité #1** : fuite RGPD potentielle sur `public/voice-messages/` — audios stockés dans un dossier servi statiquement avec nom basé sur `Date.now()` (devinable). À vérifier en SSH sur le VPS via le rapport E.

**Priorité #2** : zéro anti-spam sur deux endpoints publics — le formulaire ne tient pas une semaine face à des bots dès indexation. Honeypot + Turnstile = quelques heures de dev.

**Bonne nouvelle** : cohérence comms externe parfaite. Aucun terme interne (prix, alvéoles, élixirs, modules) ne fuite. La règle « jamais prix, jamais alvéoles » est respectée.

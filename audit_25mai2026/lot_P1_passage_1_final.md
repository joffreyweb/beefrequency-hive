# LOT P1-PASSAGE-1 — Fondations client test — Rapport final

**Date :** 27 mai 2026 · **Commit :** `b143b3c` · **Branche :** `main`
**Déploiement :** ✅ GHA run 78024486094 (1m10s) · code-only (pas de migration) · pm2 `hive` online

## Résumé
Deux frictions de l'audit du 27/05 corrigées pour qu'un nouveau client se crée et s'onboarde de bout en bout sans action manuelle :
- **P1** — L'email d'invitation **part automatiquement** à la création d'une invitation (`/api/invite`).
- **P2** — Les **7 phases (103j) se créent automatiquement** dès que `detoxStartDate` est posée (par l'admin OU par le client qui confirme « j'ai reçu »).

## Changements (4 fichiers, +40 lignes + helper)
- **`lib/parcours-phases.ts`** (NOUVEAU) — `ensureClientPhases(clientId)` : crée les 7 phases si `PARCOURS_CONFIG[parcoursType].hasPhases` + `detoxStartDate` posée + 0 phase existante. **Idempotent**, réutilise `computePhases`.
- **`app/api/invite/route.ts`** — `sendInvitationEmail()` après création du token, en **try/catch** + champ `emailSent`.
- **`app/api/admin/clients/[clientId]/parcours-stage/route.ts`** — appelle `ensureClientPhases` si `detoxStartDate` posée (try/catch) + `phasesCreated`.
- **`app/api/client/elixir-received/route.ts`** — appelle `ensureClientPhases` après pose de la détox (try/catch).

## Tests effectués (prod)

| Test | Résultat |
|---|---|
| Déploiement GHA + pm2 | ✅ online · `migrate status` up to date (code-only) |
| **P2 création** : client jetable LE_PASSAGE + detox → `ensureClientPhases` | ✅ `created:7` · phases : DETOX0 CYCLE1 BREAK1 CYCLE2 BREAK2 CYCLE3 BREAK3 |
| **P2 idempotence** : 2ᵉ appel | ✅ `created:0, reason:phases_existantes` · toujours 7 phases |
| **P2 cleanup** | ✅ client de test supprimé |
| **P1 email** : `sendInvitationEmail` (chemin exact de `/api/invite`, `.env` chargé) | ✅ email d'invitation envoyé vers `joffrey.web+invitetest@protonmail.com` |

> 📬 Un email d'invitation de test est dans ta boîte (`joffrey.web+invitetest@protonmail.com`) — tu peux le supprimer.

## Instructions Joffrey — créer ton client test sur Le Passage

1. **https://hive.joffreydeleplanque.com/admin/clients/new** → email du client + offre **« Le Passage 1:1 »** (badge « Configuration auto — parcours : Le Passage 103j »). Crée l'invitation.
   → **L'email part automatiquement** au client (vérifie qu'il le reçoit). Si jamais il n'arrive pas, le lien reste affiché à l'écran (fallback).
2. Le client clique le lien → `/register` → définit son mot de passe → **onboarding** (formulaire ClientIntake : prénom, naissance, adresse, HD…) → accède à la PWA.
3. **Démarrage du parcours** (2 voies, les deux créent les 7 phases automatiquement) :
   - le client confirme **« J'ai reçu mes élixirs »** dans la PWA → détox démarre le lundi suivant → **7 phases auto** ; **ou**
   - tu poses la **date de détox** depuis la fiche client (bandeau parcours) → **7 phases auto**.
4. Vérifie la timeline « Jour X / 103 » côté client.

## Garanties
- **Fallback email** : un échec SMTP ne bloque jamais la création de l'invitation (lien copiable).
- **Idempotence phases** : jamais de doublon ; aucun effet sur un parcours sans phases (DISCOVERY, SOS…) ; aucune régression sur les 4 clients qui ont déjà leurs 7 phases.
- **Non-bloquant** : les hooks sont en try/catch → ne cassent pas l'action admin/client.

## Findings
`audit_25mai2026/lot_P1_passage_1_findings.md` : scripts tsx ponctuels en prod doivent charger `.env` (gotcha de test, app non concernée) ; `emailSent`/`phasesCreated` exposés mais pas encore affichés en UI.

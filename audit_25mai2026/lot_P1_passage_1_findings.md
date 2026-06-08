# LOT P1-PASSAGE-1 — Findings bonus

**Date :** 27 mai 2026

## 🟡 BONUS-1 — Scripts tsx ponctuels en prod : charger `.env` explicitement

Premier test P1 échoué (`ECONNREFUSED 127.0.0.1:465`) : un script `npx tsx` n'auto-charge
**pas** `.env` (seul Next le fait pour l'app). Le `transporter` de `lib/mailer` se construit
donc sans config SMTP → connexion par défaut localhost:465 refusée. **L'app déployée n'est
pas concernée** (Next charge `.env`). Correctif harnais : `import "dotenv/config";` en tête
du script (ou exporter les vars SMTP). À retenir pour tout futur script tsx ponctuel en prod
(cf. [[project_lot2_infra_notes]] BONUS-2 similaire sur le seed).

## ℹ️ Note — `emailSent` / `phasesCreated` exposés mais non affichés
Les réponses de `/api/invite` (`emailSent`) et `parcours-stage` (`phasesCreated`) exposent
désormais ces champs, mais l'UI admin ne les affiche pas encore. Amélioration UX possible :
badge « ✅ Email envoyé » / « ⚠️ Email non parti — copiez le lien » sur la page d'invitation.
Non bloquant (le lien reste toujours affiché comme fallback).

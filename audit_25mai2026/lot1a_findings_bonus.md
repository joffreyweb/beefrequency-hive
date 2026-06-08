# LOT 1a — Findings BONUS (non corrigés, hors périmètre)

**Date :** 25 mai 2026
**Contexte :** Pendant l'exécution de LOT 1a (fix `lib/auth.ts` + `app/api/admin/clients/[clientId]/hd/route.ts`), un check `grep -r "fallback_secret"` a révélé une seconde occurrence du fallback hardcodé `"fallback_secret_do_not_use_in_production"` dans un fichier hors périmètre. Règle inviolable du brief : « tu NE touches QUE les 2 fichiers ciblés ». Donc je note ici, sans toucher.

---

## ✅ BONUS-1 — Même fallback JWT_SECRET dupliqué dans `proxy.ts:4-6` — **RÉSOLU dans LOT 1a**

> **MISE À JOUR 25 mai 2026** : suite à la décision de Joffrey pendant la phase REVIEW, le fichier `proxy.ts` a été inclus dans le commit final du LOT 1a. Le même pattern (`throw if !process.env.JWT_SECRET`) a été appliqué. Le `grep -r "fallback_secret"` retourne maintenant 0 match dans tout le repo (hors node_modules/.next/.git/audit_25mai2026). Trace conservée ci-dessous pour historique.

---

## 🔴 BONUS-1 (description historique avant résolution)

**Fichier :** `/Users/joffreydeleplanque/beefrequency-hive/proxy.ts` (middleware Next.js, exporté sous le nom `proxy`)

**Code actuel (lignes 4-6) :**
```ts
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback_secret_do_not_use_in_production"
);
```

**Pourquoi c'est aussi critique que C7 (corrigé dans LOT 1a) :**
- `proxy.ts` est le **middleware Next.js** (configuré via `export const config = { matcher: ... }` ligne 103-105) qui s'exécute sur **chaque requête** entrante.
- Il vérifie le JWT (`jwtVerify(token, JWT_SECRET)` ligne 59) et fait toutes les redirections d'auth (login, /admin gate, /client gate, onboarding gate, redirection racine selon rôle).
- Si `process.env.JWT_SECRET` est absent au boot et que `lib/auth.ts` throw (comportement post-LOT 1a), le serveur ne démarre pas — donc en pratique cette occurrence-ci n'est jamais effective tant que le LOT 1a est en place. **MAIS** la duplication même du fallback constitue toujours :
  1. Un signal de design dangereux (deux fichiers maintiennent leur propre version du même secret).
  2. Une trace dans le repo public (si exposé). Le secret est searchable, donc le simple fait qu'il existe en clair en deux endroits réduit la confiance.
  3. Un risque de drift : si demain un dev modifie le fallback dans `proxy.ts` sans toucher `lib/auth.ts`, ou inversement.

**Correction proposée (à intégrer dans un futur LOT) :**
```ts
const jwtSecretString = process.env.JWT_SECRET;
if (!jwtSecretString) {
  throw new Error("[FATAL] JWT_SECRET environment variable is required");
}
const JWT_SECRET = new TextEncoder().encode(jwtSecretString);
```

Identique au fix de `lib/auth.ts`. Même throw → le middleware refusera de boot si la var manque. Cohérent.

**Encore mieux (refactor plus profond, non bloquant)** : extraire un helper partagé `lib/jwt-secret.ts` qui exporte le `Uint8Array` une seule fois, et l'importer depuis `lib/auth.ts` ET `proxy.ts`. Évite tout risque de drift futur. Hors-scope LOT 1a.

---

## 🟡 BONUS-2 — Réponse 403 vs 401 sur le POST `/api/admin/clients/[clientId]/hd`

**Constaté pendant LOT 1a, déjà mentionné dans les SPECS.**

Avant LOT 1a, le POST retournait `401` (« Non autorisé ») pour TOUS les cas non-admin (pas de token OU role différent d'ADMIN). Après LOT 1a, le pattern canonique `requireAdmin()` (lib/api-utils.ts:6-11) retourne :
- `401` si pas de session (« Non authentifié »)
- `403` si session existe mais role ≠ ADMIN (« Accès interdit »)

**Impact :** comportement HTTP **plus correct** sémantiquement (401 vs 403 ont un sens distinct), mais constitue un **micro-changement d'API** pour un consommateur qui parserait spécifiquement « status === 401 » sur le POST HD. Aucun consommateur connu — ce endpoint est uniquement appelé via l'UI admin (qui ne distingue pas 401/403, gère via redirect login). À noter pour traçabilité.

---

## Conclusion

**État final LOT 1a** : 3 fichiers modifiés (`lib/auth.ts`, `proxy.ts`, `app/api/admin/clients/[clientId]/hd/route.ts`). Aucun fallback `"fallback_secret_do_not_use_in_production"` ne subsiste dans le repo. BONUS-1 (initialement identifié comme hors-périmètre) a été remonté dans le scope du LOT 1a sur décision de Joffrey à la phase REVIEW. BONUS-2 (changement sémantique 401→403 sur le POST HD) reste valide sans action requise.

**Pistes pour LOT futurs** (non urgent) : extraire un helper partagé `lib/jwt-secret.ts` qui exporte le `Uint8Array` une seule fois, et l'importer depuis `lib/auth.ts` ET `proxy.ts`. Évite tout risque de drift futur sur la lecture/validation du secret. Hors-scope sécurité immédiat.

"use client";

import { useState } from "react";

interface Props {
  clientId: string;
  hasActiveParcours: boolean;
  currentStatus: string | null; // "ACTIVE" | "COMPLETED" | null
}

// Cycle de vie du parcours (refonte Parcours — Étape 2B-β).
// - Parcours actif → bouton « Clôturer le parcours » (le passe en terminé, sans couper l'accès).
// - Aucun parcours actif → bouton « Démarrer un nouveau parcours » (crée une instance neuve,
//   l'ancienne reste archivée et consultable).
export default function ParcoursLifecycleActions({
  clientId,
  hasActiveParcours,
  currentStatus,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(action: "close" | "restart") {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/parcours`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Échec de l'opération");
        setLoading(false);
        return;
      }
      window.location.reload();
    } catch {
      setError("Erreur réseau");
      setLoading(false);
    }
  }

  function onClose() {
    if (
      confirm(
        "Clôturer le parcours actuel ?\n\nIl passera en « terminé » (toujours consultable dans l'historique). Le client garde l'accès complet à son compte — aucun module n'est coupé.",
      )
    ) {
      call("close");
    }
  }

  function onRestart() {
    if (
      confirm(
        "Démarrer un NOUVEAU parcours ?\n\nLe parcours précédent est archivé et conservé intégralement (phases, élixirs, check-ins). Un nouveau parcours vierge démarre — tu poseras sa date de départ ensuite.",
      )
    ) {
      call("restart");
    }
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      {hasActiveParcours ? (
        <button
          onClick={onClose}
          disabled={loading}
          className="px-3 py-1.5 border border-or-pale text-brun-mid text-xs font-ui uppercase tracking-wider rounded-sharp hover:border-or-sacre hover:text-or-sacre transition-colors disabled:opacity-50"
        >
          {loading ? "…" : "Clôturer le parcours"}
        </button>
      ) : (
        <button
          onClick={onRestart}
          disabled={loading}
          className="px-3 py-1.5 bg-or-sacre text-white text-xs font-ui uppercase tracking-wider rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-50"
        >
          {loading ? "…" : "Démarrer un nouveau parcours"}
        </button>
      )}

      {currentStatus === "COMPLETED" && !hasActiveParcours && (
        <span className="text-xs font-ui text-brun-mid/50">
          Dernier parcours terminé — archivé et consultable.
        </span>
      )}

      {error && <span className="text-xs font-ui text-red-600">{error}</span>}
    </div>
  );
}

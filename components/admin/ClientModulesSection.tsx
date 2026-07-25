"use client";

import { useState } from "react";
import { EDITABLE_FLAG_KEYS, getDefaultsForParcoursType, type ParcoursFlags } from "@/lib/parcours-defaults";
import type { ParcoursType } from "@prisma/client";
import { FLAG_LABELS } from "@/lib/parcours-labels";

// Section éditable "Modules actifs" sur la fiche client — 9 toggles.
// Chaque bascule PATCH /api/admin/clients/[clientId] (route générique sur FLAG_KEYS).
export default function ClientModulesSection({
  clientId,
  parcoursType,
  initialFlags,
  elixirAEnvoyer: initialElixirAEnvoyer = true,
}: {
  clientId: string;
  parcoursType: ParcoursType;
  initialFlags: ParcoursFlags;
  elixirAEnvoyer?: boolean;
}) {
  const [flags, setFlags] = useState<ParcoursFlags>(initialFlags);
  const [elixirAEnvoyer, setElixirAEnvoyer] = useState<boolean>(initialElixirAEnvoyer);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  // Élixir : à envoyer (colis) ou déjà chez le client (pas d'envoi).
  async function setElixirEnvoi(next: boolean) {
    if (next === elixirAEnvoyer) return;
    const prev = elixirAEnvoyer;
    setElixirAEnvoyer(next); // optimiste
    setSaving("__elixir__");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elixirAEnvoyer: next }),
      });
      if (!res.ok) throw new Error();
      setMsg("Enregistré ✓");
      setTimeout(() => setMsg(""), 2500);
    } catch {
      setElixirAEnvoyer(prev); // rollback
      setMsg("Échec de l'enregistrement");
      setTimeout(() => setMsg(""), 3000);
    } finally {
      setSaving(null);
    }
  }

  async function toggle(key: keyof ParcoursFlags) {
    const next = !flags[key];
    setFlags((f) => ({ ...f, [key]: next })); // optimiste
    setSaving(key);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: next }),
      });
      if (!res.ok) throw new Error();
      setMsg("Enregistré ✓");
      setTimeout(() => setMsg(""), 2500);
    } catch {
      setFlags((f) => ({ ...f, [key]: !next })); // rollback si échec
      setMsg("Échec de l'enregistrement");
      setTimeout(() => setMsg(""), 3000);
    } finally {
      setSaving(null);
    }
  }

  async function resetToDefaults() {
    if (!confirm("Réinitialiser les modules selon le type de parcours ? Les cases actuelles seront écrasées.")) return;
    const defaults = getDefaultsForParcoursType(parcoursType);
    const editable: Partial<ParcoursFlags> = {};
    for (const k of EDITABLE_FLAG_KEYS) editable[k] = defaults[k];
    setFlags((f) => ({ ...f, ...editable })); // optimiste
    setSaving("__reset__");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editable),
      });
      if (!res.ok) throw new Error();
      setMsg("Réinitialisé selon le parcours ✓");
      setTimeout(() => setMsg(""), 2500);
    } catch {
      setFlags(initialFlags); // rollback grossier
      setMsg("Échec de la réinitialisation");
      setTimeout(() => setMsg(""), 3000);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider">Modules actifs</h2>
        <div className="flex items-center gap-3">
          {msg && (
            <span className={`text-xs font-ui ${msg.startsWith("Échec") ? "text-red-600" : "text-foret"}`}>{msg}</span>
          )}
          <button
            type="button"
            onClick={resetToDefaults}
            disabled={saving !== null}
            className="text-xs font-ui text-or-sacre hover:text-ambre-vif transition-colors disabled:opacity-50"
          >
            Réinitialiser selon le parcours
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {EDITABLE_FLAG_KEYS.map((key) => (
          <label
            key={key}
            className="flex items-center gap-2 text-sm font-ui text-brun-chaud cursor-pointer select-none"
          >
            <input
              type="checkbox"
              checked={flags[key]}
              disabled={saving === key}
              onChange={() => toggle(key)}
              className="w-4 h-4 accent-or-sacre disabled:opacity-50"
            />
            <span>{FLAG_LABELS[key]}</span>
          </label>
        ))}
      </div>

      {/* Sous-réglage Élixir — visible seulement si le module Élixir est actif */}
      {flags.requiresElixirs && (
        <div className="mt-4 pt-4 border-t border-or-pale/40">
          <p className="text-xs font-caps uppercase tracking-wider text-brun-mid mb-2">Élixir — envoi</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setElixirEnvoi(true)}
              disabled={saving === "__elixir__"}
              className={`px-3 py-1.5 rounded-[8px] text-sm font-ui border transition-colors disabled:opacity-50 ${
                elixirAEnvoyer
                  ? "bg-or-sacre text-white border-or-sacre"
                  : "bg-cire-chaude text-brun-mid border-or-pale hover:border-or-sacre"
              }`}
            >
              À envoyer (colis)
            </button>
            <button
              type="button"
              onClick={() => setElixirEnvoi(false)}
              disabled={saving === "__elixir__"}
              className={`px-3 py-1.5 rounded-[8px] text-sm font-ui border transition-colors disabled:opacity-50 ${
                !elixirAEnvoyer
                  ? "bg-foret text-white border-foret"
                  : "bg-cire-chaude text-brun-mid border-or-pale hover:border-foret"
              }`}
            >
              Déjà chez le client — pas d'envoi
            </button>
          </div>
          <p className="text-xs font-ui text-brun-mid/50 mt-2">
            {elixirAEnvoyer
              ? "Le client confirme son adresse, un email de commande t'est envoyé, puis il suit le colis."
              : "Aucun envoi ni email : l'élixir est considéré déjà livré. Il te reste à fixer la date de démarrage."}
          </p>
        </div>
      )}

      <p className="text-xs font-ui text-brun-mid/50 mt-3">
        Modification immédiate — pilote l'affichage côté client (PWA).
      </p>
    </div>
  );
}

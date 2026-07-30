"use client";

import { useState } from "react";
import { EDITABLE_FLAG_KEYS, getDefaultsForParcoursType, type ParcoursFlags } from "@/lib/parcours-defaults";
import type { ParcoursType } from "@prisma/client";
import { FLAG_LABELS, PARCOURS_TYPE_OPTIONS } from "@/lib/parcours-labels";

// Section éditable "Modules actifs" sur la fiche client — 9 toggles.
// Chaque bascule PATCH /api/admin/clients/[clientId] (route générique sur FLAG_KEYS).
export default function ClientModulesSection({
  clientId,
  parcoursType: initialParcoursType,
  initialFlags,
  elixirAEnvoyer: initialElixirAEnvoyer = true,
}: {
  clientId: string;
  parcoursType: ParcoursType;
  initialFlags: ParcoursFlags;
  elixirAEnvoyer?: boolean;
}) {
  const [parcoursType, setParcoursType] = useState<ParcoursType>(initialParcoursType);
  const [flags, setFlags] = useState<ParcoursFlags>(initialFlags);
  const [elixirAEnvoyer, setElixirAEnvoyer] = useState<boolean>(initialElixirAEnvoyer);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  // Changement de type de parcours → PATCH + pré-coche les modules par défaut du type.
  async function changeParcoursType(next: ParcoursType) {
    if (next === parcoursType) return;
    const prevType = parcoursType;
    const prevFlags = flags;
    const defaults = getDefaultsForParcoursType(next);
    const editable: Partial<ParcoursFlags> = {};
    for (const k of EDITABLE_FLAG_KEYS) editable[k] = defaults[k];
    setParcoursType(next); // optimiste
    setFlags((f) => ({ ...f, ...editable }));
    setSaving("__type__");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parcoursType: next, ...editable }),
      });
      if (!res.ok) throw new Error();
      setMsg("Type de parcours mis à jour ✓");
      setTimeout(() => setMsg(""), 2500);
    } catch {
      setParcoursType(prevType); // rollback
      setFlags(prevFlags);
      setMsg("Échec du changement de type");
      setTimeout(() => setMsg(""), 3000);
    } finally {
      setSaving(null);
    }
  }

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
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider">Type de parcours &amp; modules actifs</h2>
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

      {/* Type de parcours — seul éditeur (le doublon de l'onglet Parcours a été retiré) */}
      <div className="mb-4">
        <label htmlFor="parcoursTypeSel" className="block text-xs font-caps uppercase tracking-wider text-brun-mid mb-1.5">
          Type de parcours
        </label>
        <select
          id="parcoursTypeSel"
          value={parcoursType}
          onChange={(e) => changeParcoursType(e.target.value as ParcoursType)}
          disabled={saving !== null}
          className="w-full px-3 py-2.5 bg-creme-sacree border border-or-pale rounded-[8px] text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors disabled:opacity-50"
        >
          {PARCOURS_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <p className="text-xs font-ui text-brun-mid/50 mt-1.5">
          Changer le type pré-coche les modules par défaut. Tu peux ensuite ajuster ci-dessous.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {EDITABLE_FLAG_KEYS
          .map((key) => (
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

      {/* Sous-réglage Élixir — visible dès que le module Élixirs est actif (tous parcours, CUSTOM compris) */}
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

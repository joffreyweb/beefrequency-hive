"use client";

import { useState } from "react";
import { FLAG_KEYS, type ParcoursFlags } from "@/lib/parcours-defaults";
import { FLAG_LABELS } from "@/lib/parcours-labels";

// Section éditable "Modules actifs" sur la fiche client — 9 toggles.
// Chaque bascule PATCH /api/admin/clients/[clientId] (route générique sur FLAG_KEYS).
export default function ClientModulesSection({
  clientId,
  initialFlags,
}: {
  clientId: string;
  initialFlags: ParcoursFlags;
}) {
  const [flags, setFlags] = useState<ParcoursFlags>(initialFlags);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

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

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider">Modules actifs</h2>
        {msg && (
          <span className={`text-xs font-ui ${msg.startsWith("Échec") ? "text-red-600" : "text-foret"}`}>{msg}</span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {FLAG_KEYS.map((key) => (
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
      <p className="text-xs font-ui text-brun-mid/50 mt-3">
        Modification immédiate — pilote l'affichage côté client (PWA).
      </p>
    </div>
  );
}

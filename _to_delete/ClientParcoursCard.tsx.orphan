"use client";

import { useState } from "react";
import ParcoursTypeSelector from "./ParcoursTypeSelector";
import { FLAG_KEYS, type ParcoursFlags } from "@/lib/parcours-defaults";
import type { ParcoursType } from "@prisma/client";

interface ClientParcoursCardProps {
  clientId: string;
  initialParcoursType: ParcoursType;
  initialFlags: ParcoursFlags;
}

export default function ClientParcoursCard({
  clientId,
  initialParcoursType,
  initialFlags,
}: ClientParcoursCardProps) {
  const [parcoursType, setParcoursType] = useState<ParcoursType>(initialParcoursType);
  const [flags, setFlags] = useState<ParcoursFlags>(initialFlags);
  const [savedParcoursType, setSavedParcoursType] = useState<ParcoursType>(initialParcoursType);
  const [savedFlags, setSavedFlags] = useState<ParcoursFlags>(initialFlags);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isDirty =
    parcoursType !== savedParcoursType ||
    FLAG_KEYS.some((k) => flags[k] !== savedFlags[k]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parcoursType, ...flags }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Échec de la mise à jour");
        return;
      }

      setSavedParcoursType(parcoursType);
      setSavedFlags({ ...flags });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <ParcoursTypeSelector
        parcoursType={parcoursType}
        flags={flags}
        onChange={(next) => {
          setParcoursType(next.parcoursType);
          setFlags(next.flags);
          setError(null);
          setSuccess(false);
        }}
        disabled={saving}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-ui min-h-[1rem]">
          {error && <span className="text-red-600">{error}</span>}
          {success && <span className="text-foret">Modifications enregistrées</span>}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="px-5 py-2 text-sm font-ui bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}

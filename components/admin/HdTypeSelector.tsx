"use client";

import { useState } from "react";

// Labels lisibles pour les types HD
const HD_TYPE_LABELS: Record<string, string> = {
  GENERATOR: "Générateur",
  MANIFESTING_GENERATOR: "Générateur Manifestant",
  MANIFESTOR: "Manifesteur",
  PROJECTOR: "Projecteur",
  REFLECTOR: "Réflecteur",
};

interface HdTypeSelectorProps {
  clientId: string;
  currentHdType: string | null;
}

// Sélecteur de type Human Design — permet à l'admin de modifier le type HD d'un client
export default function HdTypeSelector({
  clientId,
  currentHdType,
}: HdTypeSelectorProps) {
  const [value, setValue] = useState(currentHdType || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleChange(newValue: string) {
    setValue(newValue);
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hdType: newValue || null }),
      });

      if (res.ok) {
        setSaved(true);
        // Masque la confirmation après 2 secondes
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // Erreur silencieuse
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        disabled={saving}
        className="w-full px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors disabled:opacity-40"
      >
        <option value="">Non défini</option>
        {Object.entries(HD_TYPE_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      {saved && (
        <p className="text-xs text-foret font-ui mt-1">
          Type HD enregistré
        </p>
      )}
    </div>
  );
}

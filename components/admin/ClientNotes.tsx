"use client";

import { useState, useCallback } from "react";

interface ClientNotesProps {
  clientId: string;
  initialNotes: string;
}

// Notes internes éditables pour un client — sauvegarde au blur ou via bouton
export default function ClientNotes({ clientId, initialNotes }: ClientNotesProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sauvegarde les notes via PATCH /api/clients/[id]
  const saveNotes = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        setSaved(true);
        // Masque le message "sauvegardé" après 2 secondes
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // Erreur silencieuse — l'utilisateur peut réessayer
    } finally {
      setSaving(false);
    }
  }, [clientId, notes]);

  return (
    <div className="space-y-2">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={saveNotes}
        rows={6}
        placeholder="Notes internes (non visibles par le client)..."
        className="w-full px-3 py-2.5 bg-cire-chaude border border-or-pale rounded-sm text-brun-chaud font-ui font-light text-sm focus:outline-none focus:border-or-sacre transition-colors duration-200 resize-y"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={saveNotes}
          disabled={saving}
          className="px-4 py-2 bg-or-sacre text-white font-ui text-xs uppercase tracking-wider rounded-sharp hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50"
        >
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </button>
        {saved && (
          <span className="text-foret text-xs font-ui">Sauvegardé</span>
        )}
      </div>
    </div>
  );
}

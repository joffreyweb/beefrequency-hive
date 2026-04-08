"use client";

import { useState } from "react";

interface AgendaZoomButtonProps {
  sessionId: string;
  initialZoomLink: string | null;
  type?: "session" | "appointment";
}

// Bouton Zoom dans l'agenda — prominent si lien existant, ajout inline sinon
export default function AgendaZoomButton({
  sessionId,
  initialZoomLink,
  type = "session",
}: AgendaZoomButtonProps) {
  const [zoomLink, setZoomLink] = useState(initialZoomLink);
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);

  // Sauvegarder le lien Zoom
  async function handleSave() {
    if (!inputValue.trim()) return;
    setSaving(true);
    try {
      const url = type === "appointment"
        ? `/api/admin/appointments/${sessionId}`
        : `/api/sessions/${sessionId}`;
      const body = type === "appointment"
        ? { zoomJoinUrl: inputValue.trim() }
        : { zoomLink: inputValue.trim() };
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setZoomLink(inputValue.trim());
        setEditing(false);
      }
    } catch {
      // Erreur silencieuse
    } finally {
      setSaving(false);
    }
  }

  // Si un lien existe → bouton prominent
  if (zoomLink) {
    return (
      <a
        href={zoomLink}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 px-3 py-1.5 text-[11px] font-ui uppercase tracking-wider bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors duration-150"
      >
        Rejoindre Zoom
      </a>
    );
  }

  // Mode édition — champ inline
  if (editing) {
    return (
      <div className="shrink-0 flex items-center gap-1.5">
        <input
          type="url"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="https://zoom.us/j/..."
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          className="w-44 px-2 py-1 text-[11px] font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre transition-colors"
        />
        <button
          onClick={handleSave}
          disabled={saving || !inputValue.trim()}
          className="text-[10px] font-ui text-or-sacre hover:text-ambre-vif disabled:opacity-40 transition-colors"
        >
          {saving ? "..." : "OK"}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="text-[10px] font-ui text-brun-mid/40 hover:text-brun-mid transition-colors"
        >
          ×
        </button>
      </div>
    );
  }

  // Pas de lien → bouton muted pour ajouter
  return (
    <button
      onClick={() => setEditing(true)}
      className="shrink-0 text-[11px] font-ui text-brun-mid/40 hover:text-or-sacre transition-colors duration-150"
    >
      Ajouter le lien
    </button>
  );
}

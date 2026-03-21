"use client";

import { useState } from "react";
import DailyFocusForm from "./DailyFocusForm";

interface Focus {
  id: string;
  dayFrom: number;
  dayTo: number;
  title: string;
  message: string;
}

interface DailyFocusSectionProps {
  clientId: string;
  initialFocuses: Focus[];
}

export default function DailyFocusSection({
  clientId,
  initialFocuses,
}: DailyFocusSectionProps) {
  const [focuses, setFocuses] = useState(initialFocuses);
  const [showForm, setShowForm] = useState(false);

  // Recharge les focus après ajout
  async function handleSuccess() {
    try {
      const res = await fetch(`/api/daily-focus?clientId=${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setFocuses(data.focuses);
      }
    } catch {
      // Erreur silencieuse
    }
    setShowForm(false);
  }

  // Supprime un focus
  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/daily-focus/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFocuses((prev) => prev.filter((f) => f.id !== id));
      }
    } catch {
      // Erreur silencieuse
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider">
          Focus du jour ({focuses.length})
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-ui bg-or-sacre text-creme-sacree px-3 py-1 rounded-sharp hover:bg-ambre-vif transition-colors"
        >
          {showForm ? "Annuler" : "Ajouter"}
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-5 mb-3">
          <DailyFocusForm clientId={clientId} onSuccess={handleSuccess} />
        </div>
      )}

      {/* Liste des focus */}
      {focuses.length === 0 ? (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
          <p className="text-sm text-brun-mid/60 font-ui">Aucun focus.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {focuses.map((focus) => (
            <div
              key={focus.id}
              className="bg-cire-chaude border border-or-pale rounded-sm p-4"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-ui text-brun-mid/60">
                  Jours {focus.dayFrom}-{focus.dayTo}
                </span>
                <button
                  onClick={() => handleDelete(focus.id)}
                  className="text-xs font-ui text-brun-mid/40 hover:text-red-600 transition-colors"
                >
                  Supprimer
                </button>
              </div>
              <p className="text-sm font-ui text-brun-chaud font-medium">
                {focus.title}
              </p>
              <p className="text-sm font-ui text-brun-mid mt-1 whitespace-pre-wrap">
                {focus.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

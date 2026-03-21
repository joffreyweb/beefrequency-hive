"use client";

import { useState } from "react";
import RecommendationForm from "./RecommendationForm";

interface Recommendation {
  id: string;
  dayFrom: number;
  dayTo: number;
  slot: string;
  title: string;
  content: string;
}

interface RecommendationSectionProps {
  clientId: string;
  initialRecommendations: Recommendation[];
}

export default function RecommendationSection({
  clientId,
  initialRecommendations,
}: RecommendationSectionProps) {
  const [recommendations, setRecommendations] = useState(initialRecommendations);
  const [showForm, setShowForm] = useState(false);

  // Recharge les recommandations après ajout
  async function handleSuccess() {
    try {
      const res = await fetch(`/api/recommendations?clientId=${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations);
      }
    } catch {
      // Erreur silencieuse
    }
    setShowForm(false);
  }

  // Supprime une recommandation
  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/recommendations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRecommendations((prev) => prev.filter((r) => r.id !== id));
      }
    } catch {
      // Erreur silencieuse
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider">
          Recommandations quotidiennes ({recommendations.length})
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
          <RecommendationForm clientId={clientId} onSuccess={handleSuccess} />
        </div>
      )}

      {/* Liste des recommandations */}
      {recommendations.length === 0 ? (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
          <p className="text-sm text-brun-mid/60 font-ui">
            Aucune recommandation.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((reco) => (
            <div
              key={reco.id}
              className="bg-cire-chaude border border-or-pale rounded-sm p-4"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-ui text-brun-mid/60">
                    Jours {reco.dayFrom}-{reco.dayTo}
                  </span>
                  <span className="text-xs font-ui bg-or-sacre/10 text-or-sacre px-2 py-0.5 rounded-sharp">
                    {reco.slot === "MORNING" ? "Matin" : "Soir"}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(reco.id)}
                  className="text-xs font-ui text-brun-mid/40 hover:text-red-600 transition-colors"
                >
                  Supprimer
                </button>
              </div>
              <p className="text-sm font-ui text-brun-chaud font-medium">
                {reco.title}
              </p>
              <p className="text-sm font-ui text-brun-mid mt-1 whitespace-pre-wrap">
                {reco.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

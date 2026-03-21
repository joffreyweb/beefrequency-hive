"use client";

import { useState } from "react";
import AssignRecommendationForm from "./AssignRecommendationForm";

// Labels français pour les catégories
const CATEGORY_LABELS: Record<string, string> = {
  EAU: "Eau",
  COMPLEMENTS: "Compléments",
  OUTILS: "Outils",
  SOINS: "Soins",
  APITHERAPIE: "Apithérapie",
  AUTRE: "Autre",
};

// Couleurs de badge par catégorie
const CATEGORY_COLORS: Record<string, string> = {
  EAU: "bg-blue-100 text-blue-700",
  COMPLEMENTS: "bg-green-100 text-foret",
  OUTILS: "bg-orange-100 text-orange-700",
  SOINS: "bg-pink-100 text-pink-700",
  APITHERAPIE: "bg-or-sacre/15 text-or-sacre",
  AUTRE: "bg-brun-mid/10 text-brun-mid",
};

interface ClientRecommendation {
  id: string;
  note: string | null;
  createdAt: string;
  recommendation: {
    id: string;
    title: string;
    category: string;
    url: string;
  };
}

interface ClientRecommendationsSectionProps {
  clientId: string;
  initialRecommendations: ClientRecommendation[];
}

export default function ClientRecommendationsSection({
  clientId,
  initialRecommendations,
}: ClientRecommendationsSectionProps) {
  const [recommendations, setRecommendations] = useState(
    initialRecommendations
  );
  const [showForm, setShowForm] = useState(false);

  // Recharger les recommandations après une action
  async function reload() {
    try {
      const res = await fetch(
        `/api/recommendations/client?clientId=${clientId}`
      );
      const data = await res.json();
      setRecommendations(data.clientRecommendations ?? []);
    } catch {
      console.error("Erreur lors du rechargement des recommandations");
    }
  }

  // Supprimer une attribution
  async function handleDelete(id: string) {
    if (!confirm("Retirer cette recommandation du client ?")) return;
    try {
      const res = await fetch(`/api/recommendations/client/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRecommendations((prev) => prev.filter((r) => r.id !== id));
      }
    } catch {
      console.error("Erreur lors de la suppression");
    }
  }

  // Callback après attribution réussie
  function handleAssignSuccess() {
    setShowForm(false);
    reload();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider">
          Recommandations personnalisées ({recommendations.length})
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 text-xs font-ui bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors duration-150"
        >
          {showForm ? "Annuler" : "Attribuer une recommandation"}
        </button>
      </div>

      {/* Formulaire d'attribution */}
      {showForm && (
        <AssignRecommendationForm
          clientId={clientId}
          onSuccess={handleAssignSuccess}
        />
      )}

      {/* Liste des recommandations attribuées */}
      {recommendations.length === 0 ? (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
          <p className="text-sm text-brun-mid/60 font-ui">
            Aucune recommandation personnalisée.
          </p>
        </div>
      ) : (
        <div className="space-y-2 mt-3">
          {recommendations.map((cr) => (
            <div
              key={cr.id}
              className="bg-cire-chaude border border-or-pale rounded-sm p-4 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {/* Titre */}
                  <span className="text-sm font-ui text-brun-chaud">
                    {cr.recommendation.title}
                  </span>
                  {/* Badge catégorie */}
                  <span
                    className={`text-xs font-caps uppercase px-2 py-0.5 rounded-sharp ${CATEGORY_COLORS[cr.recommendation.category] ?? CATEGORY_COLORS.AUTRE}`}
                  >
                    {CATEGORY_LABELS[cr.recommendation.category] ?? cr.recommendation.category}
                  </span>
                </div>
                {/* Note personnalisée */}
                {cr.note && (
                  <p className="text-xs font-ui text-brun-mid/70 mt-1">
                    Note : {cr.note}
                  </p>
                )}
              </div>
              {/* Bouton supprimer */}
              <button
                onClick={() => handleDelete(cr.id)}
                className="px-3 py-1.5 text-xs font-ui text-red-600 border border-red-200 rounded-sharp hover:bg-red-50 transition-colors duration-150 shrink-0"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

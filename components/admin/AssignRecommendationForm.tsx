"use client";

import { useEffect, useState } from "react";

// Labels français pour les catégories
const CATEGORY_LABELS: Record<string, string> = {
  EAU: "Eau",
  COMPLEMENTS: "Compléments",
  OUTILS: "Outils",
  SOINS: "Soins",
  APITHERAPIE: "Apithérapie",
  AUTRE: "Autre",
};

// Liste ordonnée des catégories
const CATEGORIES = [
  "EAU",
  "COMPLEMENTS",
  "OUTILS",
  "SOINS",
  "APITHERAPIE",
  "AUTRE",
] as const;

interface Recommendation {
  id: string;
  title: string;
  category: string;
}

interface AssignRecommendationFormProps {
  clientId: string;
  onSuccess: () => void;
}

export default function AssignRecommendationForm({
  clientId,
  onSuccess,
}: AssignRecommendationFormProps) {
  const [catalogue, setCatalogue] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Charger le catalogue au montage
  useEffect(() => {
    async function loadCatalogue() {
      try {
        const res = await fetch("/api/recommendations/catalogue");
        const data = await res.json();
        setCatalogue(data.recommendations ?? []);
      } catch {
        console.error("Erreur lors du chargement du catalogue");
      } finally {
        setLoading(false);
      }
    }
    loadCatalogue();
  }, []);

  // Grouper par catégorie pour le select
  const grouped = CATEGORIES.reduce(
    (acc, cat) => {
      const items = catalogue.filter((r) => r.category === cat);
      if (items.length > 0) acc[cat] = items;
      return acc;
    },
    {} as Record<string, Recommendation[]>
  );

  // Attribuer la recommandation au client
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/recommendations/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          recommendationId: selectedId,
          note: note || null,
        }),
      });
      if (res.ok) {
        setSelectedId("");
        setNote("");
        onSuccess();
      }
    } catch {
      console.error("Erreur lors de l'attribution");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm font-ui text-brun-mid/60 py-2">
        Chargement du catalogue...
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-creme-sacree border border-or-pale rounded-sm p-4 space-y-4 mt-3"
    >
      {/* Sélection de la recommandation, groupée par catégorie */}
      <div>
        <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
          Recommandation
        </label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          required
          className="w-full px-3 py-2 text-sm font-ui bg-white border border-or-pale rounded-sharp text-brun-chaud focus:outline-none focus:border-or-sacre"
        >
          <option value="">Sélectionner...</option>
          {Object.entries(grouped).map(([cat, items]) => (
            <optgroup key={cat} label={CATEGORY_LABELS[cat]}>
              {items.map((rec) => (
                <option key={rec.id} value={rec.id}>
                  {rec.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Note personnalisée (optionnelle) */}
      <div>
        <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
          Note personnalisée (optionnel)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Note spécifique pour ce client..."
          className="w-full px-3 py-2 text-sm font-ui bg-white border border-or-pale rounded-sharp text-brun-chaud focus:outline-none focus:border-or-sacre resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !selectedId}
        className="px-4 py-2 text-sm font-ui bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50"
      >
        {submitting ? "Attribution..." : "Attribuer"}
      </button>
    </form>
  );
}

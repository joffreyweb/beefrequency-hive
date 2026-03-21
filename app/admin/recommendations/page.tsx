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

// Couleurs de badge par catégorie
const CATEGORY_COLORS: Record<string, string> = {
  EAU: "bg-blue-100 text-blue-700",
  COMPLEMENTS: "bg-green-100 text-foret",
  OUTILS: "bg-orange-100 text-orange-700",
  SOINS: "bg-pink-100 text-pink-700",
  APITHERAPIE: "bg-or-sacre/15 text-or-sacre",
  AUTRE: "bg-brun-mid/10 text-brun-mid",
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

type Category = (typeof CATEGORIES)[number];

interface Recommendation {
  id: string;
  title: string;
  description: string;
  url: string;
  category: Category;
  imageUrl: string | null;
  isGlobal: boolean;
  createdAt: string;
}

// Formulaire vide par défaut
const EMPTY_FORM = {
  title: "",
  description: "",
  url: "",
  category: "AUTRE" as Category,
  imageUrl: "",
  isGlobal: false,
};

export default function RecommendationsCataloguePage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulaire d'ajout
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Édition inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  // Chargement initial
  useEffect(() => {
    fetchRecommendations();
  }, []);

  async function fetchRecommendations() {
    try {
      const res = await fetch("/api/recommendations/catalogue");
      const data = await res.json();
      setRecommendations(data.recommendations ?? []);
    } catch {
      console.error("Erreur lors du chargement des recommandations");
    } finally {
      setLoading(false);
    }
  }

  // Créer une recommandation
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/recommendations/catalogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          imageUrl: form.imageUrl || null,
        }),
      });
      if (res.ok) {
        setForm(EMPTY_FORM);
        setShowForm(false);
        await fetchRecommendations();
      }
    } catch {
      console.error("Erreur lors de la création");
    } finally {
      setSubmitting(false);
    }
  }

  // Modifier une recommandation
  async function handleUpdate(id: string) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/recommendations/catalogue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          imageUrl: editForm.imageUrl || null,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        await fetchRecommendations();
      }
    } catch {
      console.error("Erreur lors de la mise à jour");
    } finally {
      setSubmitting(false);
    }
  }

  // Supprimer une recommandation
  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette recommandation ?")) return;
    try {
      const res = await fetch(`/api/recommendations/catalogue/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchRecommendations();
      }
    } catch {
      console.error("Erreur lors de la suppression");
    }
  }

  // Passer en mode édition
  function startEdit(rec: Recommendation) {
    setEditingId(rec.id);
    setEditForm({
      title: rec.title,
      description: rec.description,
      url: rec.url,
      category: rec.category,
      imageUrl: rec.imageUrl ?? "",
      isGlobal: rec.isGlobal,
    });
  }

  // Grouper par catégorie
  const grouped = CATEGORIES.reduce(
    (acc, cat) => {
      const items = recommendations.filter((r) => r.category === cat);
      if (items.length > 0) acc[cat] = items;
      return acc;
    },
    {} as Record<Category, Recommendation[]>
  );

  // Rendu d'un formulaire (création ou édition)
  function renderFormFields(
    values: typeof EMPTY_FORM,
    onChange: (values: typeof EMPTY_FORM) => void
  ) {
    return (
      <>
        {/* Titre */}
        <div>
          <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
            Titre
          </label>
          <input
            type="text"
            value={values.title}
            onChange={(e) => onChange({ ...values, title: e.target.value })}
            required
            className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp text-brun-chaud focus:outline-none focus:border-or-sacre"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
            Description
          </label>
          <textarea
            value={values.description}
            onChange={(e) =>
              onChange({ ...values, description: e.target.value })
            }
            required
            rows={3}
            className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp text-brun-chaud focus:outline-none focus:border-or-sacre resize-none"
          />
        </div>

        {/* URL */}
        <div>
          <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
            URL
          </label>
          <input
            type="url"
            value={values.url}
            onChange={(e) => onChange({ ...values, url: e.target.value })}
            required
            className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp text-brun-chaud focus:outline-none focus:border-or-sacre"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Catégorie */}
          <div>
            <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
              Catégorie
            </label>
            <select
              value={values.category}
              onChange={(e) =>
                onChange({ ...values, category: e.target.value as Category })
              }
              className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp text-brun-chaud focus:outline-none focus:border-or-sacre"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          {/* Image URL (optionnel) */}
          <div>
            <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
              Image URL (optionnel)
            </label>
            <input
              type="url"
              value={values.imageUrl}
              onChange={(e) =>
                onChange({ ...values, imageUrl: e.target.value })
              }
              className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp text-brun-chaud focus:outline-none focus:border-or-sacre"
            />
          </div>
        </div>

        {/* isGlobal */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={values.isGlobal}
            onChange={(e) =>
              onChange({ ...values, isGlobal: e.target.checked })
            }
            className="rounded-sharp border-or-pale text-or-sacre focus:ring-or-sacre"
          />
          <span className="text-sm font-ui text-brun-chaud">
            Visible par tous les clients
          </span>
        </label>
      </>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm font-ui text-brun-mid/60">Chargement...</p>
      </div>
    );
  }

  return (
    <div>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-light text-brun-chaud">
          Recommandations
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm font-ui bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors duration-150"
        >
          {showForm ? "Annuler" : "Ajouter une recommandation"}
        </button>
      </div>

      {/* Formulaire de création */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-cire-chaude border border-or-pale rounded-sm p-5 mb-8 space-y-4"
        >
          <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-2">
            Nouvelle recommandation
          </h2>
          {renderFormFields(form, setForm)}
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm font-ui bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50"
          >
            {submitting ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      )}

      {/* Liste groupée par catégorie */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
          <p className="text-sm text-brun-mid/60 font-ui">
            Aucune recommandation dans le catalogue.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {(Object.entries(grouped) as [Category, Recommendation[]][]).map(
            ([category, items]) => (
              <section key={category}>
                <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-3">
                  {CATEGORY_LABELS[category]} ({items.length})
                </h2>
                <div className="space-y-3">
                  {items.map((rec) =>
                    editingId === rec.id ? (
                      /* Mode édition inline */
                      <div
                        key={rec.id}
                        className="bg-cire-chaude border border-or-sacre rounded-sm p-5 space-y-4"
                      >
                        <h3 className="font-caps text-xs text-or-sacre uppercase tracking-wider">
                          Modification
                        </h3>
                        {renderFormFields(editForm, setEditForm)}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdate(rec.id)}
                            disabled={submitting}
                            className="px-4 py-2 text-sm font-ui bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50"
                          >
                            {submitting ? "Enregistrement..." : "Enregistrer"}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-4 py-2 text-sm font-ui text-brun-mid border border-or-pale rounded-sharp hover:bg-creme-sacree transition-colors duration-150"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Mode affichage */
                      <div
                        key={rec.id}
                        className="bg-cire-chaude border border-or-pale rounded-sm p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Badge catégorie + badge global */}
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className={`text-xs font-caps uppercase px-2 py-0.5 rounded-sharp ${CATEGORY_COLORS[rec.category]}`}
                              >
                                {CATEGORY_LABELS[rec.category]}
                              </span>
                              {rec.isGlobal && (
                                <span className="text-xs font-caps uppercase px-2 py-0.5 rounded-sharp bg-foret/10 text-foret">
                                  Global
                                </span>
                              )}
                            </div>

                            {/* Titre */}
                            <h3 className="text-sm font-ui text-brun-chaud font-normal mb-1">
                              {rec.title}
                            </h3>

                            {/* Description tronquée */}
                            <p className="text-sm font-ui text-brun-mid/70 mb-2">
                              {rec.description.length > 100
                                ? rec.description.slice(0, 100) + "..."
                                : rec.description}
                            </p>

                            {/* Lien */}
                            <a
                              href={rec.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-ui text-or-sacre hover:text-ambre-vif underline transition-colors duration-150"
                            >
                              {rec.url}
                            </a>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => startEdit(rec)}
                              className="px-3 py-1.5 text-xs font-ui text-brun-mid border border-or-pale rounded-sharp hover:bg-creme-sacree transition-colors duration-150"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => handleDelete(rec.id)}
                              className="px-3 py-1.5 text-xs font-ui text-red-600 border border-red-200 rounded-sharp hover:bg-red-50 transition-colors duration-150"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            )
          )}
        </div>
      )}
    </div>
  );
}

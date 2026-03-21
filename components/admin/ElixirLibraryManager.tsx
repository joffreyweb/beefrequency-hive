"use client";

import { useState, useEffect } from "react";

interface ElixirLib {
  id: string;
  name: string;
  description: string;
  dosage: string;
  unit: string;
  category: string;
  timing: string;
  notes: string | null;
  _count: { phaseElixirs: number };
}

const CATEGORY_LABELS: Record<string, string> = {
  ACTIVATION: "Activation",
  INTEGRATION: "Intégration",
  SUPPORT: "Support",
};

const TIMING_LABELS: Record<string, string> = {
  MATIN: "Matin",
  SOIR: "Soir",
  JOURNEE: "Journée",
  FLEXIBLE: "Flexible",
};

const UNIT_LABELS: Record<string, string> = {
  GOUTTES: "Gouttes",
  GELULES: "Gélules",
  CAPUCHONS: "Capuchons",
};

const CATEGORY_COLORS: Record<string, string> = {
  ACTIVATION: "bg-or-sacre/10 text-or-sacre",
  INTEGRATION: "bg-foret/10 text-foret",
  SUPPORT: "bg-ambre-vif/10 text-ambre-profond",
};

export default function ElixirLibraryManager() {
  const [elixirs, setElixirs] = useState<ElixirLib[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dosage, setDosage] = useState("");
  const [unit, setUnit] = useState("GOUTTES");
  const [category, setCategory] = useState("ACTIVATION");
  const [timing, setTiming] = useState("FLEXIBLE");
  const [notes, setNotes] = useState("");

  async function loadElixirs() {
    try {
      const url = filter === "ALL" ? "/api/elixir-library" : `/api/elixir-library?category=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setElixirs(data.elixirs ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadElixirs();
  }, [filter]);

  function resetForm() {
    setEditId(null);
    setName("");
    setDescription("");
    setDosage("");
    setUnit("GOUTTES");
    setCategory("ACTIVATION");
    setTiming("FLEXIBLE");
    setNotes("");
  }

  function startEdit(e: ElixirLib) {
    setEditId(e.id);
    setName(e.name);
    setDescription(e.description);
    setDosage(e.dosage);
    setUnit(e.unit);
    setCategory(e.category);
    setTiming(e.timing);
    setNotes(e.notes || "");
    setShowForm(true);
  }

  async function handleSave() {
    if (!name.trim() || !dosage.trim()) return;
    setSaving(true);

    const payload = { name: name.trim(), description: description.trim(), dosage: dosage.trim(), unit, category, timing, notes: notes.trim() || null };

    try {
      const url = editId ? `/api/elixir-library/${editId}` : "/api/elixir-library";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        resetForm();
        setShowForm(false);
        await loadElixirs();
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cet élixir de la bibliothèque ?")) return;
    try {
      const res = await fetch(`/api/elixir-library/${id}`, { method: "DELETE" });
      if (res.ok) setElixirs((prev) => prev.filter((e) => e.id !== id));
    } catch {
      // silent
    }
  }

  if (loading) {
    return <p className="text-sm font-ui text-brun-mid/60 py-8">Chargement...</p>;
  }

  return (
    <div>
      {/* Filtre catégorie */}
      <div className="flex items-center gap-2 mb-6">
        {["ALL", "ACTIVATION", "INTEGRATION", "SUPPORT"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-ui uppercase tracking-[0.06em] transition-all duration-150 ${
              filter === cat
                ? "bg-or-sacre text-white"
                : "text-brun-mid hover:text-brun-chaud bg-cire-chaude"
            }`}
          >
            {cat === "ALL" ? "Tous" : CATEGORY_LABELS[cat]}
          </button>
        ))}

        <div className="flex-1" />

        <button
          onClick={() => {
            if (showForm) { resetForm(); setShowForm(false); }
            else { resetForm(); setShowForm(true); }
          }}
          className="px-4 py-2 text-sm font-ui bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors duration-150"
        >
          {showForm ? "Annuler" : "Nouvel élixir"}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-6 mb-6">
          <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-4">
            {editId ? "Modifier l'élixir" : "Nouvel élixir"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Nom</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre"
                placeholder="Nom de l'élixir" />
            </div>
            <div>
              <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Dosage</label>
              <input type="text" value={dosage} onChange={(e) => setDosage(e.target.value)}
                className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre"
                placeholder="Ex: 20 gouttes" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre resize-none"
              placeholder="Description de l'élixir" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Unité</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre">
                {Object.entries(UNIT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Catégorie</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre">
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Timing</label>
              <select value={timing} onChange={(e) => setTiming(e.target.value)}
                className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre">
                {Object.entries(TIMING_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Notes</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre"
              placeholder="Notes optionnelles" />
          </div>

          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving || !name.trim() || !dosage.trim()}
              className="px-5 py-2 text-sm font-ui bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50">
              {saving ? "Enregistrement..." : editId ? "Mettre à jour" : "Créer"}
            </button>
          </div>
        </div>
      )}

      {/* Liste */}
      {elixirs.length === 0 ? (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-8 text-center">
          <p className="text-sm text-brun-mid/60 font-ui">Aucun élixir dans la bibliothèque.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {elixirs.map((elixir) => (
            <div key={elixir.id} className="bg-cire-chaude border border-or-pale rounded-sm p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-ui text-brun-chaud">{elixir.name}</span>
                    <span className={`text-xs font-caps uppercase px-2 py-0.5 rounded-sharp ${CATEGORY_COLORS[elixir.category]}`}>
                      {CATEGORY_LABELS[elixir.category]}
                    </span>
                    <span className="text-xs font-caps uppercase px-2 py-0.5 rounded-sharp bg-brun-mid/10 text-brun-mid">
                      {TIMING_LABELS[elixir.timing]}
                    </span>
                  </div>
                  <p className="text-xs font-ui text-brun-mid/70 mt-1">{elixir.description}</p>
                  <div className="flex gap-3 mt-1.5 text-xs font-ui text-brun-mid/50">
                    <span>{elixir.dosage} · {UNIT_LABELS[elixir.unit]}</span>
                    {elixir._count.phaseElixirs > 0 && (
                      <span>{elixir._count.phaseElixirs} assignation{elixir._count.phaseElixirs > 1 ? "s" : ""}</span>
                    )}
                  </div>
                  {elixir.notes && (
                    <p className="text-xs font-ui text-or-sacre/70 italic mt-1">{elixir.notes}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(elixir)}
                    className="px-3 py-1.5 text-xs font-ui text-or-sacre border border-or-pale rounded-sharp hover:bg-or-sacre/10 transition-colors duration-150">
                    Modifier
                  </button>
                  <button onClick={() => handleDelete(elixir.id)}
                    className="px-3 py-1.5 text-xs font-ui text-red-600 border border-red-200 rounded-sharp hover:bg-red-50 transition-colors duration-150">
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

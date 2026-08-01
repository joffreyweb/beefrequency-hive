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

// Libellés « intégrés » : affichent joliment les valeurs historiques (stockées en
// MAJUSCULES) ET amorcent les listes déroulantes. Les valeurs sont désormais LIBRES :
// via « + Autre… », Joffrey ajoute/renomme ses propres unités/catégories/timings/dosages.
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
  Activation: "bg-or-sacre/10 text-or-sacre",
  Intégration: "bg-foret/10 text-foret",
  Support: "bg-ambre-vif/10 text-ambre-profond",
};

// Repli d'affichage : un code connu → sa version jolie ; sinon la valeur telle quelle.
const lbl = (map: Record<string, string>, v: string) => (v ? map[v] ?? v : v);
const uniq = (arr: string[]) => Array.from(new Set(arr.filter((x) => x && x.trim())));

const OTHER = "__OTHER__";

// Menu déroulant + option « + Autre… » : on choisit dans la liste (zéro faute de frappe),
// ou on saisit une nouvelle valeur qui sera ensuite proposée à son tour.
function SelectOrAdd({
  value,
  onChange,
  options,
  addPlaceholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  addPlaceholder: string;
}) {
  const known = options.includes(value);
  const inputCls =
    "w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre";
  return (
    <>
      <select
        value={known ? value : OTHER}
        onChange={(e) => onChange(e.target.value === OTHER ? "" : e.target.value)}
        className={inputCls}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        <option value={OTHER}>+ Autre… (saisir)</option>
      </select>
      {!known && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={addPlaceholder}
          autoFocus
          className={inputCls + " mt-2"}
        />
      )}
    </>
  );
}

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
  const [unit, setUnit] = useState("Gouttes");
  const [category, setCategory] = useState("Activation");
  const [timing, setTiming] = useState("Flexible");
  const [notes, setNotes] = useState("");

  async function loadElixirs() {
    try {
      const res = await fetch("/api/elixir-library");
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
  }, []);

  function resetForm() {
    setEditId(null);
    setName("");
    setDescription("");
    setDosage("");
    setUnit("Gouttes");
    setCategory("Activation");
    setTiming("Flexible");
    setNotes("");
  }

  function startEdit(e: ElixirLib) {
    setEditId(e.id);
    setName(e.name);
    setDescription(e.description);
    setDosage(e.dosage);
    // Normalisation à l'ouverture : éditer un élixir historique nettoie sa valeur.
    setUnit(lbl(UNIT_LABELS, e.unit));
    setCategory(lbl(CATEGORY_LABELS, e.category));
    setTiming(lbl(TIMING_LABELS, e.timing));
    setNotes(e.notes || "");
    setShowForm(true);
  }

  async function handleSave() {
    if (!name.trim() || !dosage.trim() || !description.trim() || !unit.trim() || !category.trim()) return;
    setSaving(true);

    const payload = {
      name: name.trim(),
      description: description.trim(),
      dosage: dosage.trim(),
      unit: unit.trim(),
      category: category.trim(),
      timing: timing.trim() || "Flexible",
      notes: notes.trim() || null,
    };

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

  // Listes déroulantes = valeurs intégrées + toutes celles déjà utilisées (normalisées).
  const unitOptions = uniq([...Object.values(UNIT_LABELS), ...elixirs.map((e) => lbl(UNIT_LABELS, e.unit))]);
  const categoryOptions = uniq([...Object.values(CATEGORY_LABELS), ...elixirs.map((e) => lbl(CATEGORY_LABELS, e.category))]);
  const timingOptions = uniq([...Object.values(TIMING_LABELS), ...elixirs.map((e) => lbl(TIMING_LABELS, e.timing))]);
  const dosageOptions = uniq(elixirs.map((e) => e.dosage));

  const filterButtons = ["ALL", ...categoryOptions];
  const shown = filter === "ALL" ? elixirs : elixirs.filter((e) => lbl(CATEGORY_LABELS, e.category) === filter);

  return (
    <div>
      {/* Filtre catégorie (intégrées + celles réellement utilisées) */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {filterButtons.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-ui uppercase tracking-[0.06em] transition-all duration-150 ${
              filter === cat
                ? "bg-or-sacre text-white"
                : "text-brun-mid hover:text-brun-chaud bg-cire-chaude"
            }`}
          >
            {cat === "ALL" ? "Tous" : cat}
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
              <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
                Nom <span className="text-red-600">*</span>
              </label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre"
                placeholder="Nom de l'élixir" />
            </div>
            <div>
              <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
                Dosage <span className="text-red-600">*</span>
              </label>
              <SelectOrAdd value={dosage} onChange={setDosage} options={dosageOptions} addPlaceholder="Ex : 20 gouttes, 1/2 carré…" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
              Description <span className="text-red-600">*</span>
            </label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre resize-none"
              placeholder="Description de l'élixir" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
            <div>
              <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
                Unité <span className="text-red-600">*</span>
              </label>
              <SelectOrAdd value={unit} onChange={setUnit} options={unitOptions} addPlaceholder="Nouvelle unité (ex : demi carré)…" />
            </div>
            <div>
              <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
                Catégorie <span className="text-red-600">*</span>
              </label>
              <SelectOrAdd value={category} onChange={setCategory} options={categoryOptions} addPlaceholder="Nouvelle catégorie…" />
            </div>
            <div>
              <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Timing</label>
              <SelectOrAdd value={timing} onChange={setTiming} options={timingOptions} addPlaceholder="Nouveau timing…" />
            </div>
          </div>
          <p className="text-[11px] font-ui text-brun-mid/50 italic mb-4">
            Choisis dans la liste, ou « + Autre… » pour ajouter une nouvelle valeur (elle sera proposée ensuite).
          </p>

          <div className="mb-4">
            <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Notes</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre"
              placeholder="Notes optionnelles" />
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-ui text-brun-mid/60">
              <span className="text-red-600">*</span> champs requis
            </p>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim() || !dosage.trim() || !description.trim() || !unit.trim() || !category.trim()}
              className="px-5 py-2 text-sm font-ui bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Enregistrement..." : editId ? "Mettre à jour" : "Créer"}
            </button>
          </div>
        </div>
      )}

      {/* Liste */}
      {shown.length === 0 ? (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-8 text-center">
          <p className="text-sm text-brun-mid/60 font-ui">Aucun élixir dans la bibliothèque.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((elixir) => (
            <div key={elixir.id} className="bg-cire-chaude border border-or-pale rounded-sm p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-ui text-brun-chaud">{elixir.name}</span>
                    <span className={`text-xs font-caps uppercase px-2 py-0.5 rounded-sharp ${CATEGORY_COLORS[lbl(CATEGORY_LABELS, elixir.category)] ?? "bg-brun-mid/10 text-brun-mid"}`}>
                      {lbl(CATEGORY_LABELS, elixir.category)}
                    </span>
                    <span className="text-xs font-caps uppercase px-2 py-0.5 rounded-sharp bg-brun-mid/10 text-brun-mid">
                      {lbl(TIMING_LABELS, elixir.timing)}
                    </span>
                  </div>
                  <p className="text-xs font-ui text-brun-mid/70 mt-1">{elixir.description}</p>
                  <div className="flex gap-3 mt-1.5 text-xs font-ui text-brun-mid/50">
                    <span>{elixir.dosage} · {lbl(UNIT_LABELS, elixir.unit)}</span>
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

"use client";

import { useEffect, useState } from "react";

// Labels français pour les catégories
const CATEGORY_LABELS: Record<string, string> = {
  RESPIRATION: "Respiration",
  MEDITATION: "Méditation",
  MOUVEMENT: "Mouvement",
  RITUAL: "Rituel",
};

// Labels français pour les types
const TYPE_LABELS: Record<string, string> = {
  BREATHING: "Respiration",
  VIDEO: "Vidéo",
  MEDITATION: "Méditation",
};

// Émoji par type
const TYPE_EMOJI: Record<string, string> = {
  BREATHING: "🫁",
  VIDEO: "🎬",
  MEDITATION: "🧘",
};

// Options d'animation pour le type BREATHING
const ANIMATION_OPTIONS = ["circle", "wave", "box"] as const;

interface Practice {
  id: string;
  title: string;
  description: string;
  type: string;
  content: string;
  category: string;
  isGlobal: boolean;
  dayTrigger: number | null;
  createdAt: string;
  updatedAt: string;
  _count: { clientPractices: number };
}

// Contenu parsé pour BREATHING
interface BreathingContent {
  pattern: [number, number, number, number];
  cycles: number;
  guidanceText: string;
  animationType: "circle" | "wave" | "box";
}

// Contenu parsé pour VIDEO
interface VideoContent {
  url: string;
  duration: number;
}

// Convertir une URL YouTube watch en URL embed
function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    // youtube.com/watch?v=xxx → youtube.com/embed/xxx
    if (
      (u.hostname === "www.youtube.com" || u.hostname === "youtube.com") &&
      u.pathname === "/watch"
    ) {
      const videoId = u.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    // youtu.be/xxx → youtube.com/embed/xxx
    if (u.hostname === "youtu.be") {
      const videoId = u.pathname.slice(1);
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
  } catch {
    // URL invalide, on retourne telle quelle
  }
  return url;
}

export default function PracticesPage() {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Champs du formulaire
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("BREATHING");
  const [category, setCategory] = useState("RESPIRATION");
  const [isGlobal, setIsGlobal] = useState(false);
  const [dayTrigger, setDayTrigger] = useState<string>("");

  // Champs BREATHING
  const [inhale, setInhale] = useState(4);
  const [holdIn, setHoldIn] = useState(4);
  const [exhale, setExhale] = useState(4);
  const [holdOut, setHoldOut] = useState(4);
  const [cycles, setCycles] = useState(4);
  const [guidanceText, setGuidanceText] = useState("");
  const [animationType, setAnimationType] = useState<"circle" | "wave" | "box">("circle");

  // Champs VIDEO
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState(5);

  // Chargement des pratiques
  async function loadPractices() {
    try {
      const res = await fetch("/api/practices");
      const data = await res.json();
      setPractices(data.practices ?? []);
    } catch {
      console.error("Erreur lors du chargement des pratiques");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPractices();
  }, []);

  // Réinitialiser le formulaire
  function resetForm() {
    setEditId(null);
    setTitle("");
    setDescription("");
    setType("BREATHING");
    setCategory("RESPIRATION");
    setIsGlobal(false);
    setDayTrigger("");
    setInhale(4);
    setHoldIn(4);
    setExhale(4);
    setHoldOut(4);
    setCycles(4);
    setGuidanceText("");
    setAnimationType("circle");
    setVideoUrl("");
    setVideoDuration(5);
  }

  // Remplir le formulaire pour édition
  function startEdit(practice: Practice) {
    setEditId(practice.id);
    setTitle(practice.title);
    setDescription(practice.description);
    setType(practice.type);
    setCategory(practice.category);
    setIsGlobal(practice.isGlobal);
    setDayTrigger(practice.dayTrigger?.toString() ?? "");

    try {
      const content = JSON.parse(practice.content);
      if (practice.type === "BREATHING") {
        const c = content as BreathingContent;
        setInhale(c.pattern?.[0] ?? 4);
        setHoldIn(c.pattern?.[1] ?? 0);
        setExhale(c.pattern?.[2] ?? 4);
        setHoldOut(c.pattern?.[3] ?? 0);
        setCycles(c.cycles ?? 4);
        setGuidanceText(c.guidanceText ?? "");
        setAnimationType(c.animationType ?? "circle");
      } else if (practice.type === "VIDEO") {
        const c = content as VideoContent;
        setVideoUrl(c.url ?? "");
        setVideoDuration(c.duration ?? 5);
      }
    } catch {
      // Contenu JSON invalide, on ignore
    }

    setShowForm(true);
  }

  // Sauvegarder (créer ou modifier)
  async function handleSave() {
    if (!title.trim() || !description.trim()) return;

    setSaving(true);

    // Construire le contenu JSON selon le type
    let content: BreathingContent | VideoContent | undefined;
    if (type === "BREATHING") {
      content = {
        pattern: [inhale, holdIn, exhale, holdOut],
        cycles,
        guidanceText,
        animationType,
      };
    } else if (type === "VIDEO") {
      content = {
        url: toEmbedUrl(videoUrl),
        duration: videoDuration,
      };
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      type,
      category,
      isGlobal,
      dayTrigger: dayTrigger ? parseInt(dayTrigger, 10) : null,
      content: content ?? {},
    };

    try {
      const url = editId ? `/api/practices/${editId}` : "/api/practices";
      const method = editId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        resetForm();
        setShowForm(false);
        await loadPractices();
      }
    } catch {
      console.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  // Supprimer une pratique
  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette pratique ?")) return;

    try {
      const res = await fetch(`/api/practices/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPractices((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      console.error("Erreur lors de la suppression");
    }
  }

  // Grouper les pratiques par catégorie
  const grouped = practices.reduce<Record<string, Practice[]>>((acc, p) => {
    const cat = p.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

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
          Pratiques
        </h1>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              resetForm();
              setShowForm(true);
            }
          }}
          className="px-4 py-2 text-sm font-ui bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors duration-150"
        >
          {showForm ? "Annuler" : "Nouvelle pratique"}
        </button>
      </div>

      {/* Formulaire de création / édition */}
      {showForm && (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-6 mb-8">
          <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-4">
            {editId ? "Modifier la pratique" : "Nouvelle pratique"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Titre */}
            <div>
              <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
                Titre
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre"
                placeholder="Nom de la pratique"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre"
              >
                <option value="BREATHING">Respiration</option>
                <option value="VIDEO">Vidéo</option>
                <option value="MEDITATION">Méditation</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre resize-none"
              placeholder="Description de la pratique"
            />
          </div>

          {/* Catégorie */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
                Catégorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre"
              >
                <option value="RESPIRATION">Respiration</option>
                <option value="MEDITATION">Méditation</option>
                <option value="MOUVEMENT">Mouvement</option>
                <option value="RITUAL">Rituel</option>
              </select>
            </div>

            {/* Jour déclencheur */}
            <div>
              <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
                Jour déclencheur (optionnel)
              </label>
              <input
                type="number"
                value={dayTrigger}
                onChange={(e) => setDayTrigger(e.target.value)}
                className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre"
                placeholder="Ex: 7"
                min={0}
              />
            </div>

            {/* Toggle global */}
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isGlobal}
                  onChange={(e) => setIsGlobal(e.target.checked)}
                  className="accent-or-sacre"
                />
                <span className="text-sm font-ui text-brun-chaud">
                  Pratique globale
                </span>
              </label>
            </div>
          </div>

          {/* Champs spécifiques BREATHING */}
          {type === "BREATHING" && (
            <div className="border-t border-or-pale/50 pt-4 mb-4">
              <p className="text-xs font-caps text-brun-mid uppercase tracking-wider mb-3">
                Paramètres de respiration
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-ui text-brun-mid mb-1">
                    Inspire (s)
                  </label>
                  <input
                    type="number"
                    value={inhale}
                    onChange={(e) => setInhale(parseInt(e.target.value, 10) || 0)}
                    min={0}
                    className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre"
                  />
                </div>
                <div>
                  <label className="block text-xs font-ui text-brun-mid mb-1">
                    Retient (s)
                  </label>
                  <input
                    type="number"
                    value={holdIn}
                    onChange={(e) => setHoldIn(parseInt(e.target.value, 10) || 0)}
                    min={0}
                    className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre"
                  />
                </div>
                <div>
                  <label className="block text-xs font-ui text-brun-mid mb-1">
                    Expire (s)
                  </label>
                  <input
                    type="number"
                    value={exhale}
                    onChange={(e) => setExhale(parseInt(e.target.value, 10) || 0)}
                    min={0}
                    className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre"
                  />
                </div>
                <div>
                  <label className="block text-xs font-ui text-brun-mid mb-1">
                    Retient (s)
                  </label>
                  <input
                    type="number"
                    value={holdOut}
                    onChange={(e) => setHoldOut(parseInt(e.target.value, 10) || 0)}
                    min={0}
                    className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-ui text-brun-mid mb-1">
                    Cycles
                  </label>
                  <input
                    type="number"
                    value={cycles}
                    onChange={(e) => setCycles(parseInt(e.target.value, 10) || 1)}
                    min={1}
                    className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre"
                  />
                </div>
                <div>
                  <label className="block text-xs font-ui text-brun-mid mb-1">
                    Animation
                  </label>
                  <select
                    value={animationType}
                    onChange={(e) =>
                      setAnimationType(e.target.value as "circle" | "wave" | "box")
                    }
                    className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre"
                  >
                    {ANIMATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-ui text-brun-mid mb-1">
                  Texte de guidage
                </label>
                <textarea
                  value={guidanceText}
                  onChange={(e) => setGuidanceText(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre resize-none"
                  placeholder="Instructions pour guider la respiration..."
                />
              </div>
            </div>
          )}

          {/* Champs spécifiques VIDEO */}
          {type === "VIDEO" && (
            <div className="border-t border-or-pale/50 pt-4 mb-4">
              <p className="text-xs font-caps text-brun-mid uppercase tracking-wider mb-3">
                Paramètres vidéo
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-ui text-brun-mid mb-1">
                    URL de la vidéo
                  </label>
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="text-xs font-ui text-brun-mid/50 mt-1">
                    Les URLs YouTube sont auto-converties en embed
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-ui text-brun-mid mb-1">
                    Durée (minutes)
                  </label>
                  <input
                    type="number"
                    value={videoDuration}
                    onChange={(e) =>
                      setVideoDuration(parseInt(e.target.value, 10) || 1)
                    }
                    min={1}
                    className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bouton sauvegarder */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || !title.trim() || !description.trim()}
              className="px-5 py-2 text-sm font-ui bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : editId ? "Mettre à jour" : "Créer la pratique"}
            </button>
          </div>
        </div>
      )}

      {/* Liste groupée par catégorie */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
          <p className="text-sm text-brun-mid/60 font-ui">
            Aucune pratique pour le moment.
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <section key={cat} className="mb-8">
            <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-3">
              {CATEGORY_LABELS[cat] ?? cat} ({items.length})
            </h2>
            <div className="space-y-3">
              {items.map((practice) => (
                <div
                  key={practice.id}
                  className="bg-cire-chaude border border-or-pale rounded-sm p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Ligne titre avec badges */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-base" title={TYPE_LABELS[practice.type]}>
                          {TYPE_EMOJI[practice.type]}
                        </span>
                        <span className="text-sm font-ui text-brun-chaud font-normal">
                          {practice.title}
                        </span>
                        <span className="text-xs font-caps uppercase px-2 py-0.5 rounded-sharp bg-brun-mid/10 text-brun-mid">
                          {TYPE_LABELS[practice.type]}
                        </span>
                        <span className="text-xs font-caps uppercase px-2 py-0.5 rounded-sharp bg-or-sacre/10 text-or-sacre">
                          {CATEGORY_LABELS[practice.category]}
                        </span>
                        {practice.isGlobal && (
                          <span className="text-xs font-caps uppercase px-2 py-0.5 rounded-sharp bg-foret/10 text-foret">
                            Global
                          </span>
                        )}
                        {practice.dayTrigger !== null && (
                          <span className="text-xs font-caps uppercase px-2 py-0.5 rounded-sharp bg-blue-100 text-blue-700">
                            J+{practice.dayTrigger}
                          </span>
                        )}
                      </div>

                      {/* Description tronquée */}
                      <p className="text-xs font-ui text-brun-mid/70 mt-1 line-clamp-2">
                        {practice.description}
                      </p>

                      {/* Compteur assignations */}
                      {practice._count.clientPractices > 0 && (
                        <p className="text-xs font-ui text-brun-mid/50 mt-1">
                          {practice._count.clientPractices} client
                          {practice._count.clientPractices > 1 ? "s" : ""} assigné
                          {practice._count.clientPractices > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => startEdit(practice)}
                        className="px-3 py-1.5 text-xs font-ui text-or-sacre border border-or-pale rounded-sharp hover:bg-or-sacre/10 transition-colors duration-150"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(practice.id)}
                        className="px-3 py-1.5 text-xs font-ui text-red-600 border border-red-200 rounded-sharp hover:bg-red-50 transition-colors duration-150"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

"use client";

import { useState } from "react";

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

interface Practice {
  id: string;
  title: string;
  type: string;
  category: string;
}

interface ClientPractice {
  id: string;
  practiceId: string;
  practice: Practice;
  assignedAt: string;
  completedCount: number;
  lastCompletedAt: string | null;
  note: string | null;
  isActive: boolean;
}

interface AvailablePractice {
  id: string;
  title: string;
  type: string;
  category: string;
  description: string;
}

interface ClientPracticesSectionProps {
  clientId: string;
  initialPractices: ClientPractice[];
}

export default function ClientPracticesSection({
  clientId,
  initialPractices,
}: ClientPracticesSectionProps) {
  const [practices, setPractices] = useState(initialPractices);
  const [showAssign, setShowAssign] = useState(false);
  const [available, setAvailable] = useState<AvailablePractice[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [selectedPracticeId, setSelectedPracticeId] = useState("");
  const [assignNote, setAssignNote] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Recharger les pratiques assignées
  async function reload() {
    try {
      const res = await fetch(`/api/client-practices?clientId=${clientId}`);
      const data = await res.json();
      setPractices(data.clientPractices ?? []);
    } catch {
      console.error("Erreur lors du rechargement des pratiques");
    }
  }

  // Charger les pratiques disponibles pour assignation
  async function loadAvailable() {
    setLoadingAvailable(true);
    try {
      const res = await fetch("/api/practices");
      const data = await res.json();
      setAvailable(data.practices ?? []);
    } catch {
      console.error("Erreur lors du chargement des pratiques disponibles");
    } finally {
      setLoadingAvailable(false);
    }
  }

  // Ouvrir le formulaire d'assignation
  function openAssignForm() {
    setShowAssign(true);
    loadAvailable();
    setSelectedPracticeId("");
    setAssignNote("");
  }

  // Assigner une pratique au client
  async function handleAssign() {
    if (!selectedPracticeId) return;

    setAssigning(true);
    try {
      const res = await fetch("/api/client-practices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          practiceId: selectedPracticeId,
          note: assignNote.trim() || null,
        }),
      });

      if (res.ok) {
        setShowAssign(false);
        setSelectedPracticeId("");
        setAssignNote("");
        await reload();
      }
    } catch {
      console.error("Erreur lors de l'assignation");
    } finally {
      setAssigning(false);
    }
  }

  // Toggle pause / activer
  async function handleToggleActive(cp: ClientPractice) {
    try {
      const res = await fetch(`/api/client-practices/${cp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !cp.isActive }),
      });

      if (res.ok) {
        setPractices((prev) =>
          prev.map((p) =>
            p.id === cp.id ? { ...p, isActive: !p.isActive } : p
          )
        );
      }
    } catch {
      console.error("Erreur lors du changement de statut");
    }
  }

  // Retirer une pratique
  async function handleRemove(id: string) {
    if (!confirm("Retirer cette pratique du client ?")) return;

    try {
      const res = await fetch(`/api/client-practices/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPractices((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      console.error("Erreur lors de la suppression");
    }
  }

  // Filtrer les pratiques déjà assignées de la liste des disponibles
  const assignedIds = new Set(practices.map((p) => p.practiceId));
  const filteredAvailable = available.filter((p) => !assignedIds.has(p.id));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider">
          Pratiques ({practices.length})
        </h2>
        <button
          onClick={() => (showAssign ? setShowAssign(false) : openAssignForm())}
          className="px-3 py-1.5 text-xs font-ui bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors duration-150"
        >
          {showAssign ? "Annuler" : "Assigner une pratique"}
        </button>
      </div>

      {/* Formulaire d'assignation */}
      {showAssign && (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-4 mb-4">
          {loadingAvailable ? (
            <p className="text-sm font-ui text-brun-mid/60">Chargement...</p>
          ) : filteredAvailable.length === 0 ? (
            <p className="text-sm font-ui text-brun-mid/60">
              Toutes les pratiques sont déjà assignées.
            </p>
          ) : (
            <div className="space-y-3">
              {/* Sélection de la pratique */}
              <div>
                <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
                  Pratique
                </label>
                <select
                  value={selectedPracticeId}
                  onChange={(e) => setSelectedPracticeId(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre"
                >
                  <option value="">Sélectionner une pratique...</option>
                  {filteredAvailable.map((p) => (
                    <option key={p.id} value={p.id}>
                      {TYPE_EMOJI[p.type]} {p.title} ({TYPE_LABELS[p.type]})
                    </option>
                  ))}
                </select>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
                  Note (optionnelle)
                </label>
                <input
                  type="text"
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre"
                  placeholder="Note personnalisée..."
                />
              </div>

              {/* Bouton assigner */}
              <div className="flex justify-end">
                <button
                  onClick={handleAssign}
                  disabled={!selectedPracticeId || assigning}
                  className="px-4 py-2 text-xs font-ui bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50"
                >
                  {assigning ? "Assignation..." : "Assigner"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Liste des pratiques assignées */}
      {practices.length === 0 ? (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
          <p className="text-sm text-brun-mid/60 font-ui">
            Aucune pratique assignée.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {practices.map((cp) => (
            <div
              key={cp.id}
              className={`bg-cire-chaude border rounded-sm p-4 flex items-start justify-between gap-4 ${
                cp.isActive ? "border-or-pale" : "border-or-pale/40 opacity-60"
              }`}
            >
              <div className="flex-1 min-w-0">
                {/* Titre + badge type */}
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-base" title={TYPE_LABELS[cp.practice.type]}>
                    {TYPE_EMOJI[cp.practice.type]}
                  </span>
                  <span className="text-sm font-ui text-brun-chaud">
                    {cp.practice.title}
                  </span>
                  <span className="text-xs font-caps uppercase px-2 py-0.5 rounded-sharp bg-brun-mid/10 text-brun-mid">
                    {TYPE_LABELS[cp.practice.type]}
                  </span>
                  {!cp.isActive && (
                    <span className="text-xs font-caps uppercase px-2 py-0.5 rounded-sharp bg-red-100 text-red-600">
                      En pause
                    </span>
                  )}
                </div>

                {/* Note */}
                {cp.note && (
                  <p className="text-xs font-ui text-brun-mid/70 mt-1">
                    Note : {cp.note}
                  </p>
                )}

                {/* Stats */}
                <div className="flex gap-4 mt-2 text-xs font-ui text-brun-mid/50">
                  <span>
                    {cp.completedCount} réalisation
                    {cp.completedCount > 1 ? "s" : ""}
                  </span>
                  {cp.lastCompletedAt && (
                    <span>
                      Dernière :{" "}
                      {new Date(cp.lastCompletedAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  )}
                  <span>
                    Assignée le{" "}
                    {new Date(cp.assignedAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleToggleActive(cp)}
                  className="px-3 py-1.5 text-xs font-ui text-or-sacre border border-or-pale rounded-sharp hover:bg-or-sacre/10 transition-colors duration-150"
                >
                  {cp.isActive ? "Pause" : "Activer"}
                </button>
                <button
                  onClick={() => handleRemove(cp.id)}
                  className="px-3 py-1.5 text-xs font-ui text-red-600 border border-red-200 rounded-sharp hover:bg-red-50 transition-colors duration-150"
                >
                  Retirer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";

interface ChecklistItem {
  text: string;
  done: boolean;
}

interface EndSessionModalProps {
  sessionId: string;
  onClose: () => void;
  onDone: () => void;
}

// Modal de fin de session — notes, checklist, et bouton terminer
export default function EndSessionModal({
  sessionId,
  onClose,
  onDone,
}: EndSessionModalProps) {
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Ajouter un élément à la checklist
  function addItem() {
    const text = newItem.trim();
    if (!text) return;
    setItems([...items, { text, done: false }]);
    setNewItem("");
  }

  // Basculer l'état d'un élément de la checklist
  function toggleItem(index: number) {
    setItems(
      items.map((item, i) =>
        i === index ? { ...item, done: !item.done } : item
      )
    );
  }

  // Supprimer un élément de la checklist
  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  // Terminer la session via PATCH
  async function handleSubmit() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          notes: notes.trim() || null,
          checklistItems: JSON.stringify(items),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erreur lors de la mise à jour");
        return;
      }

      onDone();
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  // Ajouter avec Entrée
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-6 max-w-lg w-full mx-4">
        <h2 className="font-display text-xl text-brun-chaud mb-4">
          Notes de session
        </h2>

        {error && (
          <p className="text-sm text-red-600 font-ui bg-red-50 px-3 py-2 rounded-sharp mb-4">
            {error}
          </p>
        )}

        {/* Textarea pour les notes */}
        <div className="mb-4">
          <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Notes privées sur la session..."
            className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre transition-colors resize-y"
          />
        </div>

        {/* Section checklist */}
        <div className="mb-6">
          <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-2">
            Checklist
          </label>

          {/* Éléments existants */}
          {items.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleItem(index)}
                    className="accent-or-sacre"
                  />
                  <span
                    className={`text-sm font-ui flex-1 ${
                      item.done
                        ? "line-through text-brun-mid/50"
                        : "text-brun-chaud"
                    }`}
                  >
                    {item.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-xs text-brun-mid/40 hover:text-red-500 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Ajouter un élément */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nouvel élément..."
              className="flex-1 px-3 py-1.5 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre transition-colors"
            />
            <button
              type="button"
              onClick={addItem}
              className="px-3 py-1.5 text-sm font-caps bg-or-sacre/10 text-or-sacre rounded-sharp hover:bg-or-sacre/20 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-caps uppercase tracking-wider text-brun-mid border border-or-pale rounded-sharp hover:bg-creme-sacree transition-colors duration-150"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-caps uppercase tracking-wider bg-or-sacre text-brun-chaud rounded-sharp hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50"
          >
            {loading ? "En cours..." : "Terminer la session"}
          </button>
        </div>
      </div>
    </div>
  );
}

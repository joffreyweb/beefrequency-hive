"use client";

import { useState } from "react";

interface RecommendationFormProps {
  clientId: string;
  onSuccess: () => void;
}

export default function RecommendationForm({
  clientId,
  onSuccess,
}: RecommendationFormProps) {
  const [dayFrom, setDayFrom] = useState("");
  const [dayTo, setDayTo] = useState("");
  const [slot, setSlot] = useState("MORNING");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          dayFrom: Number(dayFrom),
          dayTo: Number(dayTo),
          slot,
          title,
          content,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erreur lors de la création");
        return;
      }

      // Réinitialise le formulaire
      setDayFrom("");
      setDayTo("");
      setSlot("MORNING");
      setTitle("");
      setContent("");
      onSuccess();
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-ui text-brun-mid mb-1">
            Jour début
          </label>
          <input
            type="number"
            min="1"
            value={dayFrom}
            onChange={(e) => setDayFrom(e.target.value)}
            required
            className="w-full border border-or-pale rounded-sm px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree focus:outline-none focus:border-or-sacre"
          />
        </div>
        <div>
          <label className="block text-xs font-ui text-brun-mid mb-1">
            Jour fin
          </label>
          <input
            type="number"
            min="1"
            value={dayTo}
            onChange={(e) => setDayTo(e.target.value)}
            required
            className="w-full border border-or-pale rounded-sm px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree focus:outline-none focus:border-or-sacre"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-ui text-brun-mid mb-1">
          Créneau
        </label>
        <select
          value={slot}
          onChange={(e) => setSlot(e.target.value)}
          className="w-full border border-or-pale rounded-sm px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree focus:outline-none focus:border-or-sacre"
        >
          <option value="MORNING">Matin</option>
          <option value="EVENING">Soir</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-ui text-brun-mid mb-1">
          Titre
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border border-or-pale rounded-sm px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree focus:outline-none focus:border-or-sacre"
        />
      </div>

      <div>
        <label className="block text-xs font-ui text-brun-mid mb-1">
          Contenu
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={3}
          className="w-full border border-or-pale rounded-sm px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree focus:outline-none focus:border-or-sacre"
        />
      </div>

      {error && (
        <p className="text-sm font-ui text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="bg-or-sacre text-creme-sacree font-ui text-sm px-4 py-2 rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-50"
      >
        {saving ? "Enregistrement..." : "Ajouter"}
      </button>
    </form>
  );
}

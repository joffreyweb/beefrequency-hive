"use client";

import { useState } from "react";

interface Elixir {
  id: string;
  name: string;
  description: string;
  dosage: string;
  duration: string;
  stock: number;
}

interface ElixirFormProps {
  onSuccess: () => void;
  elixir?: Elixir; // Si fourni, mode édition
}

// Formulaire de création / édition d'un élixir
export default function ElixirForm({ onSuccess, elixir }: ElixirFormProps) {
  const isEdit = !!elixir;

  const [name, setName] = useState(elixir?.name ?? "");
  const [description, setDescription] = useState(elixir?.description ?? "");
  const [dosage, setDosage] = useState(elixir?.dosage ?? "");
  const [duration, setDuration] = useState(elixir?.duration ?? "");
  const [stock, setStock] = useState(elixir?.stock ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = isEdit ? `/api/elixirs/${elixir.id}` : "/api/elixirs";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, dosage, duration, stock }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erreur lors de l'enregistrement");
        return;
      }

      onSuccess();
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 font-ui bg-red-50 px-3 py-2 rounded-sharp">
          {error}
        </p>
      )}

      {/* Nom */}
      <div>
        <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
          Nom
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre transition-colors"
          placeholder="Nom de l'élixir"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre transition-colors resize-none"
          placeholder="Description de l'élixir"
        />
      </div>

      {/* Dosage et Durée */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
            Dosage
          </label>
          <input
            type="text"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre transition-colors"
            placeholder="Ex: 3 gouttes 2x/jour"
          />
        </div>
        <div>
          <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
            Durée
          </label>
          <input
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre transition-colors"
            placeholder="Ex: 21 jours"
          />
        </div>
      </div>

      {/* Stock */}
      <div>
        <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
          Stock
        </label>
        <input
          type="number"
          value={stock}
          onChange={(e) => setStock(parseInt(e.target.value, 10) || 0)}
          min={0}
          className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre transition-colors"
        />
      </div>

      {/* Bouton submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2.5 text-sm font-caps uppercase tracking-wider bg-or-sacre text-brun-chaud rounded-sharp hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50"
      >
        {loading
          ? "Enregistrement..."
          : isEdit
            ? "Modifier l'élixir"
            : "Ajouter l'élixir"}
      </button>
    </form>
  );
}

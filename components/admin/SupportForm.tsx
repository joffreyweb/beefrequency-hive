"use client";

import { useState } from "react";

interface SupportFormProps {
  clientId: string;
  onSuccess: () => void;
}

// Formulaire d'ajout de support pour un client
export default function SupportForm({ clientId, onSuccess }: SupportFormProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"MUSIC" | "VIDEO" | "PDF" | "LINK">("LINK");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/supports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          title,
          type,
          url,
          description: description || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erreur lors de la création");
        return;
      }

      // Réinitialiser le formulaire et notifier le parent
      setTitle("");
      setType("LINK");
      setUrl("");
      setDescription("");
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
        <p className="text-sm font-ui text-red-600 bg-red-50 px-3 py-2 rounded-sharp">
          {error}
        </p>
      )}

      {/* Titre */}
      <div>
        <label className="block font-caps text-xs text-brun-mid uppercase tracking-wider mb-1">
          Titre
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 bg-creme-sacree border border-or-pale rounded-sharp text-sm font-ui text-brun-chaud placeholder:text-brun-mid/40 focus:outline-none focus:border-or-sacre"
          placeholder="Nom du support"
        />
      </div>

      {/* Type */}
      <div>
        <label className="block font-caps text-xs text-brun-mid uppercase tracking-wider mb-1">
          Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "MUSIC" | "VIDEO" | "PDF" | "LINK")}
          className="w-full px-3 py-2 bg-creme-sacree border border-or-pale rounded-sharp text-sm font-ui text-brun-chaud focus:outline-none focus:border-or-sacre"
        >
          <option value="MUSIC">Musique</option>
          <option value="VIDEO">Vidéo</option>
          <option value="PDF">PDF</option>
          <option value="LINK">Lien</option>
        </select>
      </div>

      {/* URL */}
      <div>
        <label className="block font-caps text-xs text-brun-mid uppercase tracking-wider mb-1">
          URL
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          className="w-full px-3 py-2 bg-creme-sacree border border-or-pale rounded-sharp text-sm font-ui text-brun-chaud placeholder:text-brun-mid/40 focus:outline-none focus:border-or-sacre"
          placeholder="https://..."
        />
      </div>

      {/* Description (optionnelle) */}
      <div>
        <label className="block font-caps text-xs text-brun-mid uppercase tracking-wider mb-1">
          Description (optionnelle)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 bg-creme-sacree border border-or-pale rounded-sharp text-sm font-ui text-brun-chaud placeholder:text-brun-mid/40 focus:outline-none focus:border-or-sacre resize-none"
          placeholder="Description du support..."
        />
      </div>

      {/* Bouton submit */}
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-or-sacre text-creme-sacree rounded-sharp text-sm font-ui hover:bg-ambre-vif transition-colors disabled:opacity-50"
      >
        {loading ? "Ajout..." : "Ajouter le support"}
      </button>
    </form>
  );
}

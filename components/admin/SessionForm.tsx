"use client";

import { useState } from "react";

interface ClientOption {
  id: string;
  user: { name: string };
}

interface SessionFormProps {
  clients: ClientOption[];
  onSuccess: () => void;
}

// Formulaire de création d'une session
export default function SessionForm({ clients, onSuccess }: SessionFormProps) {
  const [clientId, setClientId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState("60");
  const [type, setType] = useState<"ONLINE" | "PRESENTIAL" | "CEREMONY">(
    "ONLINE"
  );
  const [zoomLink, setZoomLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          scheduledAt,
          duration: parseInt(duration, 10),
          type,
          ...(zoomLink.trim() && { zoomLink: zoomLink.trim() }),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erreur lors de la création");
        return;
      }

      // Réinitialiser le formulaire
      // Réinitialiser tous les champs
      setClientId("");
      setScheduledAt("");
      setDuration("60");
      setType("ONLINE");
      setZoomLink("");
      onSuccess();
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  // Labels lisibles pour les types de session
  const typeLabels: Record<string, string> = {
    ONLINE: "En ligne",
    PRESENTIAL: "Présentiel",
    CEREMONY: "Cérémonie",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 font-ui bg-red-50 px-3 py-2 rounded-sharp">
          {error}
        </p>
      )}

      {/* Client */}
      <div>
        <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
          Client
        </label>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          required
          className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre transition-colors"
        >
          <option value="">Sélectionner un client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.user.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date et heure */}
      <div>
        <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
          Date et heure
        </label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          required
          className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre transition-colors"
        />
      </div>

      {/* Lien Zoom — prominent, juste après la date */}
      <div>
        <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
          Lien Zoom
        </label>
        <input
          type="url"
          value={zoomLink}
          onChange={(e) => setZoomLink(e.target.value)}
          placeholder="https://zoom.us/j/..."
          className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre transition-colors"
        />
        <p className="text-[10px] font-ui text-brun-mid/40 mt-1">
          Optionnel — le client verra un bouton &quot;Rejoindre la séance&quot;
        </p>
      </div>

      {/* Durée et Type */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
            Durée (min)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
            min={15}
            step={15}
            className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
            Type
          </label>
          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value as "ONLINE" | "PRESENTIAL" | "CEREMONY")
            }
            className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre transition-colors"
          >
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bouton submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2.5 text-sm font-caps uppercase tracking-wider bg-or-sacre text-brun-chaud rounded-sharp hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50"
      >
        {loading ? "Création..." : "Planifier la session"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";

// Options d'offres disponibles
const OFFER_OPTIONS = [
  { value: "HIVE_EXPERIENCE", label: "Hive Experience" },
  { value: "THE_PASSAGE", label: "The Passage" },
  { value: "SOUVERAINETE", label: "Souveraineté" },
];

export default function InviteClientPage() {
  const [email, setEmail] = useState("");
  const [offerType, setOfferType] = useState("HIVE_EXPERIENCE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  // Envoie l'invitation via POST /api/invite
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInviteLink("");
    setLoading(true);

    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, offerType }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la création de l'invitation");
        return;
      }

      // Affiche le lien d'invitation généré
      setInviteLink(data.inviteLink);
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Retour à la liste */}
      <Link
        href="/admin/clients"
        className="text-sm font-ui text-brun-mid/60 hover:text-or-sacre transition-colors duration-150 mb-6 inline-block"
      >
        &larr; Retour aux clients
      </Link>

      <h1 className="font-display text-3xl font-light text-brun-chaud mb-8">
        Inviter un client
      </h1>

      <div className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Erreur */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 py-2 px-3 rounded-sm">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-ui font-light text-brun-mid uppercase tracking-wider mb-1.5"
            >
              Email du client
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-cire-chaude border border-or-pale rounded-sm text-brun-chaud font-ui font-light text-sm focus:outline-none focus:border-or-sacre transition-colors duration-200"
              placeholder="client@email.com"
            />
          </div>

          {/* Type d'offre */}
          <div>
            <label
              htmlFor="offerType"
              className="block text-xs font-ui font-light text-brun-mid uppercase tracking-wider mb-1.5"
            >
              Offre
            </label>
            <select
              id="offerType"
              value={offerType}
              onChange={(e) => setOfferType(e.target.value)}
              className="w-full px-3 py-2.5 bg-cire-chaude border border-or-pale rounded-sm text-brun-chaud font-ui font-light text-sm focus:outline-none focus:border-or-sacre transition-colors duration-200"
            >
              {OFFER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Bouton envoi */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-or-sacre text-white font-ui text-xs uppercase tracking-[0.06em] rounded-sharp hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer l'invitation"}
          </button>
        </form>

        {/* Lien d'invitation généré */}
        {inviteLink && (
          <div className="mt-8 bg-cire-chaude border border-or-pale rounded-sm p-5">
            <p className="font-caps text-xs text-brun-mid uppercase tracking-wider mb-2">
              Lien d&apos;invitation
            </p>
            <p className="text-sm font-ui text-foret break-all bg-creme-sacree px-3 py-2 rounded-sharp select-all">
              {inviteLink}
            </p>
            <p className="text-xs font-ui text-brun-mid/50 mt-2">
              Ce lien expire dans 7 jours. Envoyez-le au client.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

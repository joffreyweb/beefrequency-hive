"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";

const COUNTRIES = [
  "France", "Belgique", "Suisse", "Luxembourg", "Canada",
  "Maroc", "Tunisie", "Côte d'Ivoire", "Sénégal", "Cameroun",
  "Allemagne", "Espagne", "Italie", "Pays-Bas", "Portugal",
  "Royaume-Uni", "États-Unis", "Brésil", "Autre",
];

export default function PreStartPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const T = (key: { EN: string; FR: string }) => key[lang];

  const [step, setStep] = useState<"form" | "success">("form");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("France");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pré-remplir depuis l'intake si disponible
  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.intake) {
          if (data.intake.postalAddress) setStreet(data.intake.postalAddress);
          if (data.intake.city) setCity(data.intake.city);
          if (data.intake.postalCode) setPostalCode(data.intake.postalCode);
          if (data.intake.country) setCountry(data.intake.country);
        }
      })
      .catch(() => {});
  }, []);

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/client/elixir-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ street, city, postalCode, country }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }

      setStep("success");
    } catch {
      setError(
        T({
          EN: "Connection error — try again later",
          FR: "Erreur de connexion — réessaie plus tard",
        })
      );
    } finally {
      setLoading(false);
    }
  }

  if (step === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-foret/10 flex items-center justify-center mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2D5A3D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>

        <h1 className="font-display text-2xl text-brun-chaud mb-3">
          {T({
            EN: "Order sent!",
            FR: "Commande envoyée !",
          })}
        </h1>

        <p className="font-ui text-sm text-brun-mid max-w-xs mb-8">
          {T({
            EN: "You'll receive your elixirs within 5-7 days. We'll notify you when the package is on its way.",
            FR: "Tu recevras tes élixirs sous 5-7 jours. Nous te préviendrons quand le colis sera en route.",
          })}
        </p>

        <button
          onClick={() => router.push("/client/home")}
          className="px-6 py-3 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors"
        >
          {T({ EN: "Back to home", FR: "Retour à l'accueil" })}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-2xl text-brun-chaud">
          {T({
            EN: "Order your elixirs",
            FR: "Commander tes élixirs",
          })}
        </h1>
        <p className="font-ui text-sm text-brun-mid mt-2">
          {T({
            EN: "Confirm your delivery address so we can send your elixirs.",
            FR: "Confirme ton adresse de livraison pour que nous puissions t'envoyer tes élixirs.",
          })}
        </p>
      </div>

      <form onSubmit={handleOrder} className="space-y-4">
        {/* Rue */}
        <div>
          <label className="block text-xs font-ui text-brun-mid uppercase tracking-wider mb-1.5">
            {T({ EN: "Street address", FR: "Rue" })}
          </label>
          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            required
            className="w-full px-3 py-2.5 bg-cire-chaude border border-or-pale rounded-sm text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors"
            placeholder={T({ EN: "123 Main Street", FR: "123 rue Exemple" })}
          />
        </div>

        {/* Ville + Code postal */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-ui text-brun-mid uppercase tracking-wider mb-1.5">
              {T({ EN: "Postal code", FR: "Code postal" })}
            </label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-cire-chaude border border-or-pale rounded-sm text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors"
              placeholder="75001"
            />
          </div>
          <div>
            <label className="block text-xs font-ui text-brun-mid uppercase tracking-wider mb-1.5">
              {T({ EN: "City", FR: "Ville" })}
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-cire-chaude border border-or-pale rounded-sm text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors"
              placeholder={T({ EN: "Paris", FR: "Paris" })}
            />
          </div>
        </div>

        {/* Pays */}
        <div>
          <label className="block text-xs font-ui text-brun-mid uppercase tracking-wider mb-1.5">
            {T({ EN: "Country", FR: "Pays" })}
          </label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
            className="w-full px-3 py-2.5 bg-cire-chaude border border-or-pale rounded-sm text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors"
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-600 font-ui">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-or-sacre text-white font-caps text-sm uppercase tracking-wider rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-50"
        >
          {loading
            ? T({ EN: "Sending...", FR: "Envoi..." })
            : T({ EN: "Order my elixirs", FR: "Commander mes élixirs" })}
        </button>
      </form>
    </div>
  );
}

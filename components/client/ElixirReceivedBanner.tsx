"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";

export default function ElixirReceivedBanner() {
  const { lang } = useLanguage();
  const router = useRouter();
  const T = (key: { EN: string; FR: string }) => key[lang];

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/client/prestart-status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.colisEnvoye && !data.produitsRecus) {
          setVisible(true);
        }
      })
      .catch(() => {});
  }, []);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/client/elixir-received", {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setConfirmed(true);
        // Fetch the scheduled detox start date for the confirmation message
        try {
          const statusRes = await fetch("/api/client/prestart-status");
          if (statusRes.ok) {
            // The elixir-received API sets detoxStartDate to next Monday
            // We'll compute it client-side for display
            const now = new Date();
            const day = now.getDay();
            const daysUntilMonday = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
            const nextMonday = new Date(now);
            nextMonday.setDate(now.getDate() + daysUntilMonday);
            setStartDate(nextMonday.toISOString());
          }
        } catch {
          // Ignore
        }
        setTimeout(() => router.refresh(), 2500);
      } else {
        setError(data.error || T({ EN: "Error — please try again", FR: "Erreur — réessaie" }));
      }
    } catch {
      setError(T({ EN: "Connection error", FR: "Erreur de connexion" }));
    } finally {
      setLoading(false);
    }
  }

  if (!visible) return null;

  if (confirmed) {
    const dateFormatted = startDate
      ? new Date(startDate).toLocaleDateString(lang === "FR" ? "fr-FR" : "en-US", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : null;

    return (
      <div className="bg-foret/10 border border-foret/30 rounded-sm p-5 text-center">
        <p className="font-display text-lg text-foret">
          {T({
            EN: "Welcome to the journey!",
            FR: "Bienvenue dans le voyage !",
          })}
        </p>
        {dateFormatted && (
          <p className="font-ui text-sm text-brun-chaud mt-2">
            {T({ EN: "Your program starts ", FR: "Ton programme démarre le " })}
            <strong className="text-foret">{dateFormatted}</strong>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-or-sacre/10 border-2 border-or-sacre rounded-sm p-5 text-center">
      <p className="font-display text-lg text-brun-chaud mb-1">
        {T({
          EN: "Your elixirs are on their way!",
          FR: "Tes élixirs sont en route !",
        })}
      </p>
      <p className="font-ui text-sm text-brun-mid mb-4">
        {T({
          EN: "When you receive them, confirm below to start your program.",
          FR: "Quand tu les reçois, confirme ci-dessous pour démarrer ton programme.",
        })}
      </p>
      {error && (
        <p className="font-ui text-sm text-red-600 mb-3">{error}</p>
      )}
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="px-6 py-3 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors disabled:opacity-50"
      >
        {loading
          ? T({ EN: "Confirming...", FR: "Confirmation..." })
          : T({ EN: "I received my elixirs", FR: "J'ai reçu mes élixirs" })}
      </button>
    </div>
  );
}

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
    try {
      const res = await fetch("/api/client/elixir-received", {
        method: "POST",
      });
      if (res.ok) {
        setConfirmed(true);
        setTimeout(() => router.refresh(), 1500);
      }
    } catch {
      // Silencieux
    } finally {
      setLoading(false);
    }
  }

  if (!visible) return null;

  if (confirmed) {
    return (
      <div className="bg-foret/10 border border-foret/30 rounded-sm p-5 text-center">
        <p className="font-display text-lg text-foret">
          {T({
            EN: "Welcome to the journey!",
            FR: "Bienvenue dans le voyage !",
          })}
        </p>
        <p className="font-ui text-sm text-brun-mid mt-1">
          {T({
            EN: "Your program starts now.",
            FR: "Ton programme commence maintenant.",
          })}
        </p>
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

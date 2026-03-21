"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [dailyRecapTime, setDailyRecapTime] = useState("18:00");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Chargement des réglages actuels
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          setDailyRecapTime(data.dailyRecapTime);
        }
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Sauvegarde des réglages
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyRecapTime }),
      });

      if (res.ok) {
        setMessage("Réglages sauvegardés avec succès.");
      } else {
        const data = await res.json();
        setMessage(data.error || "Erreur lors de la sauvegarde.");
      }
    } catch {
      setMessage("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm font-ui text-brun-mid/60">
          Chargement des réglages...
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-light text-brun-chaud mb-8">
        Réglages
      </h1>

      <div className="max-w-md">
        <form onSubmit={handleSave}>
          <div className="bg-cire-chaude border border-or-pale rounded-sm p-6">
            <label
              htmlFor="dailyRecapTime"
              className="block font-caps text-xs text-brun-mid uppercase tracking-wider mb-2"
            >
              Heure du récapitulatif
            </label>
            <p className="text-xs font-ui text-brun-mid/60 mb-3">
              Le banner de récapitulatif apparaîtra sur le dashboard à partir de
              cette heure.
            </p>
            <input
              id="dailyRecapTime"
              type="time"
              value={dailyRecapTime}
              onChange={(e) => setDailyRecapTime(e.target.value)}
              className="w-full bg-creme-sacree border border-or-pale rounded-sharp px-3 py-2 text-sm font-ui text-brun-chaud focus:outline-none focus:border-or-sacre transition-colors duration-150"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 bg-or-sacre text-white rounded-sharp uppercase font-caps text-sm tracking-wider px-6 py-3 hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50"
          >
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>

          {/* Message de confirmation */}
          {message && (
            <p className="mt-4 text-sm font-ui text-foret">{message}</p>
          )}
        </form>
      </div>
    </div>
  );
}

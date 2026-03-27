"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SymptomMessage {
  id: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

const MOOD_OPTIONS = [
  { emoji: "\u{1F614}", label: "Difficult" },
  { emoji: "\u{1F610}", label: "Neutral" },
  { emoji: "\u{1F642}", label: "Good" },
  { emoji: "\u{1F60A}", label: "Very good" },
  { emoji: "\u2728", label: "Excellent" },
];

function isSameDay(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export default function JournalPage() {
  // Formulaire de creation
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Section symptomes / mood
  const [todaySymptom, setTodaySymptom] = useState<SymptomMessage | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [symptomText, setSymptomText] = useState("");
  const [symptomLoading, setSymptomLoading] = useState(true);
  const [symptomSubmitting, setSymptomSubmitting] = useState(false);

  // Charge le symptome du jour au mount
  useEffect(() => {
    async function fetchTodaySymptom() {
      try {
        const res = await fetch("/api/symptoms");
        if (res.ok) {
          const data = await res.json();
          const messages: SymptomMessage[] = data.messages ?? [];
          const today = messages.find((m) => isSameDay(m.createdAt));
          if (today) {
            setTodaySymptom(today);
          }
        }
      } catch {
        // Erreur silencieuse
      } finally {
        setSymptomLoading(false);
      }
    }
    fetchTodaySymptom();
  }, []);

  // Soumettre le mood du jour
  async function handleMoodSubmit() {
    if (!selectedMood || symptomSubmitting) return;

    setSymptomSubmitting(true);
    try {
      const moodContent = symptomText.trim()
        ? `${selectedMood} ${symptomText.trim()}`
        : selectedMood;

      const res = await fetch("/api/symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: moodContent }),
      });

      if (res.ok) {
        const data = await res.json();
        setTodaySymptom({
          id: data.message.id,
          content: data.message.content,
          readAt: data.message.readAt ?? null,
          createdAt: data.message.createdAt,
        });
        setSelectedMood(null);
        setSymptomText("");
      }
    } catch {
      // Erreur silencieuse
    } finally {
      setSymptomSubmitting(false);
    }
  }

  // Creation d'une entree
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          isPrivate,
          mood: mood.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create entry");
        setSubmitting(false);
        return;
      }

      // Reset du formulaire
      setContent("");
      setMood("");
      setIsPrivate(false);

      // Entry saved
    } catch {
      setError("Connection error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl sm:text-3xl text-brun-chaud">
        Journal
      </h1>

      {/* Check-in link */}
      <CheckinLink />

      {/* Section 1 — How I feel today */}
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
        <h2 className="font-caps text-xs text-brun-mid uppercase tracking-wider mb-4">
          How do you feel today?
        </h2>

        {symptomLoading ? (
          <p className="text-sm text-brun-mid/60 font-ui">Loading...</p>
        ) : todaySymptom ? (
          /* Deja soumis aujourd'hui */
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{todaySymptom.content.split(" ")[0]}</span>
              <span className="text-sm font-ui text-brun-chaud">
                {todaySymptom.content.split(" ").slice(1).join(" ")}
              </span>
              <span className="text-xs font-ui text-brun-mid ml-auto">
                {new Date(todaySymptom.createdAt).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className="text-xs text-brun-mid/50 font-ui">
              Already submitted today
            </p>
          </div>
        ) : (
          /* Formulaire mood */
          <div className="space-y-4">
            {/* Mood options */}
            <div className="flex items-center gap-3 flex-wrap">
              {MOOD_OPTIONS.map((option) => (
                <button
                  key={option.emoji}
                  type="button"
                  onClick={() => setSelectedMood(option.emoji)}
                  className={`flex flex-col items-center gap-1 w-16 h-16 rounded-full border-2 justify-center transition-colors ${
                    selectedMood === option.emoji
                      ? "bg-or-sacre/20 border-or-sacre"
                      : "border-or-pale hover:border-or-sacre/50"
                  }`}
                >
                  <span className="text-xl">{option.emoji}</span>
                </button>
              ))}
            </div>

            {/* Labels sous les boutons */}
            <div className="flex items-center gap-3 flex-wrap">
              {MOOD_OPTIONS.map((option) => (
                <span
                  key={option.label}
                  className="w-16 text-center text-xs font-ui text-brun-mid"
                >
                  {option.label}
                </span>
              ))}
            </div>

            {/* Textarea optionnel */}
            <textarea
              value={symptomText}
              onChange={(e) => setSymptomText(e.target.value)}
              placeholder="What is present for you right now?"
              rows={2}
              className="w-full px-3 py-2 rounded-sharp border border-or-pale bg-creme-sacree text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors resize-none"
            />

            {/* Bouton Envoyer */}
            <button
              type="button"
              onClick={handleMoodSubmit}
              disabled={!selectedMood || symptomSubmitting}
              className="bg-or-sacre text-white rounded-sharp text-xs font-ui px-4 py-2 hover:bg-ambre-vif transition-colors disabled:opacity-50"
            >
              {symptomSubmitting ? "Sending..." : "Send"}
            </button>
          </div>
        )}
      </div>

      {/* Section 2 — Journal existant */}

      {/* Formulaire de creation */}
      <form
        onSubmit={handleSubmit}
        className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-4"
      >
        <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid">
          New entry
        </h2>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write here..."
          rows={4}
          className="w-full px-3 py-2 rounded-sharp border border-or-pale bg-creme-sacree text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors resize-y"
          required
        />

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Humeur optionnelle */}
          <input
            type="text"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder="Mood (optional)"
            className="px-3 py-2 rounded-sharp border border-or-pale bg-creme-sacree text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors w-full sm:w-48"
          />

          {/* Toggle prive */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="accent-or-sacre w-4 h-4"
            />
            <span className="text-sm font-ui text-brun-mid">
              Keep private
            </span>
          </label>

          {/* Bouton */}
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="ml-auto px-4 py-2 rounded-sm bg-or-sacre text-creme-sacree font-ui text-sm font-medium hover:bg-ambre-vif transition-colors disabled:opacity-50"
          >
            {submitting ? "Sending..." : "Add"}
          </button>
        </div>

        {error && <p className="text-sm text-red-600 font-ui">{error}</p>}
      </form>

    </div>
  );
}

function CheckinLink() {
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => { setHour(new Date().getHours()); }, []);
  if (hour === null) return null;

  const morningOpen = hour >= 5 && hour < 13;
  const eveningOpen = hour >= 16 && hour <= 23;

  if (morningOpen) {
    return (
      <Link href="/client/checkin/morning" className="text-sm font-ui text-or-sacre hover:text-ambre-vif transition-colors">
        Go to morning check-in &rarr;
      </Link>
    );
  }
  if (eveningOpen) {
    return (
      <Link href="/client/checkin/evening" className="text-sm font-ui text-or-sacre hover:text-ambre-vif transition-colors">
        Go to evening check-in &rarr;
      </Link>
    );
  }
  return null;
}


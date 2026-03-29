"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";

interface SymptomMessage {
  id: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

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
  const { lang } = useLanguage();
  const T = (key: { EN: string; FR: string }) => key[lang];

  const MOOD_OPTIONS = [
    { emoji: "\u{1F614}", label: T(t.journal.moodDifficult) },
    { emoji: "\u{1F610}", label: T(t.journal.moodNeutral) },
    { emoji: "\u{1F642}", label: T(t.journal.moodGood) },
    { emoji: "\u{1F60A}", label: T(t.journal.moodVeryGood) },
    { emoji: "\u2728", label: T(t.journal.moodExcellent) },
  ];

  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [todaySymptom, setTodaySymptom] = useState<SymptomMessage | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [symptomText, setSymptomText] = useState("");
  const [symptomLoading, setSymptomLoading] = useState(true);
  const [symptomSubmitting, setSymptomSubmitting] = useState(false);

  useEffect(() => {
    async function fetchTodaySymptom() {
      try {
        const res = await fetch("/api/symptoms");
        if (res.ok) {
          const data = await res.json();
          const messages: SymptomMessage[] = data.messages ?? [];
          const today = messages.find((m) => isSameDay(m.createdAt));
          if (today) setTodaySymptom(today);
        }
      } catch {
        // Silent
      } finally {
        setSymptomLoading(false);
      }
    }
    fetchTodaySymptom();
  }, []);

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
      // Silent
    } finally {
      setSymptomSubmitting(false);
    }
  }

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
        setError(data.error || "Error");
        setSubmitting(false);
        return;
      }

      setContent("");
      setMood("");
      setIsPrivate(false);
    } catch {
      setError("Connection error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl sm:text-3xl text-brun-chaud">
        {T(t.journal.title)}
      </h1>

      <CheckinLink lang={lang} />

      {/* Section 1 — How I feel today */}
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
        <h2 className="font-caps text-xs text-brun-mid uppercase tracking-wider mb-4">
          {T(t.journal.question1)}
        </h2>

        {symptomLoading ? (
          <p className="text-sm text-brun-mid/60 font-ui">{T(t.common.loading)}</p>
        ) : todaySymptom ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{todaySymptom.content.split(" ")[0]}</span>
              <span className="text-sm font-ui text-brun-chaud">
                {todaySymptom.content.split(" ").slice(1).join(" ")}
              </span>
              <span className="text-xs font-ui text-brun-mid ml-auto">
                {new Date(todaySymptom.createdAt).toLocaleTimeString(lang === "FR" ? "fr-FR" : "en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className="text-xs text-brun-mid/50 font-ui">{T(t.journal.alreadySubmitted)}</p>
          </div>
        ) : (
          <div className="space-y-4">
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

            <div className="flex items-center gap-3 flex-wrap">
              {MOOD_OPTIONS.map((option) => (
                <span key={option.label} className="w-16 text-center text-xs font-ui text-brun-mid">
                  {option.label}
                </span>
              ))}
            </div>

            <textarea
              value={symptomText}
              onChange={(e) => setSymptomText(e.target.value)}
              placeholder={T(t.journal.question2)}
              rows={2}
              className="w-full px-3 py-2 rounded-sharp border border-or-pale bg-creme-sacree text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors resize-none"
            />

            <button
              type="button"
              onClick={handleMoodSubmit}
              disabled={!selectedMood || symptomSubmitting}
              className="bg-or-sacre text-white rounded-sharp text-xs font-ui px-4 py-2 hover:bg-ambre-vif transition-colors disabled:opacity-50"
            >
              {symptomSubmitting ? T(t.journal.sending) : T(t.journal.send)}
            </button>
          </div>
        )}
      </div>

      {/* Journal form */}
      <form
        onSubmit={handleSubmit}
        className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-4"
      >
        <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid">
          {T(t.journal.newEntry)}
        </h2>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={T(t.journal.writePlaceholder)}
          rows={4}
          className="w-full px-3 py-2 rounded-sharp border border-or-pale bg-creme-sacree text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors resize-y"
          required
        />

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <input
            type="text"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder={T(t.journal.moodPlaceholder)}
            className="px-3 py-2 rounded-sharp border border-or-pale bg-creme-sacree text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors w-full sm:w-48"
          />

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="accent-or-sacre w-4 h-4"
            />
            <span className="text-sm font-ui text-brun-mid">
              {T(t.journal.keepPrivate)}
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="ml-auto px-4 py-2 rounded-sm bg-or-sacre text-creme-sacree font-ui text-sm font-medium hover:bg-ambre-vif transition-colors disabled:opacity-50"
          >
            {submitting ? T(t.journal.sending) : T(t.journal.add)}
          </button>
        </div>

        {error && <p className="text-sm text-red-600 font-ui">{error}</p>}
      </form>
    </div>
  );
}

function CheckinLink({ lang }: { lang: string }) {
  const T = (key: { EN: string; FR: string }) => key[lang as "EN" | "FR"];
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => { setHour(new Date().getHours()); }, []);
  if (hour === null) return null;

  const morningOpen = hour >= 5 && hour < 13;
  const eveningOpen = hour >= 16 && hour <= 23;

  if (morningOpen) {
    return (
      <Link href="/client/checkin/morning" className="text-sm font-ui text-or-sacre hover:text-ambre-vif transition-colors">
        {T(t.journal.goMorning)} &rarr;
      </Link>
    );
  }
  if (eveningOpen) {
    return (
      <Link href="/client/checkin/evening" className="text-sm font-ui text-or-sacre hover:text-ambre-vif transition-colors">
        {T(t.journal.goEvening)} &rarr;
      </Link>
    );
  }
  return null;
}

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

function getHour() {
  return new Date().getHours();
}

export default function EveningCheckinPage() {
  const router = useRouter();
  const [moment1, setMoment1] = useState("");
  const [moment2, setMoment2] = useState("");
  const [moment3, setMoment3] = useState("");
  const [moment4, setMoment4] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const hour = getHour();
  const isOpen = hour >= 16 && hour <= 23;

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/daily-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "CYCLE",
          gratitudeMoment: moment1.trim() || null,
          gratitudeRecu: moment2.trim() || null,
          freeFeeling: moment3.trim() || null,
          selfQuality: moment4.trim() || null,
        }),
      });
    } catch {
      // Continue
    } finally {
      setSaving(false);
      setDone(true);
    }
  }

  if (!isOpen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <p className="font-display text-xl text-brun-chaud mb-2">The evening space opens at 4pm.</p>
        <p className="font-ui text-sm text-brun-mid">Come back between 4pm and midnight.</p>
        <button
          onClick={() => router.push("/client/home")}
          className="mt-8 text-sm font-ui text-or-sacre hover:text-ambre-vif transition-colors"
        >
          &larr; Home
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 space-y-6">
        <h2 className="font-display text-2xl text-brun-chaud">It&apos;s noted.</h2>
        <p className="font-display text-lg text-brun-mid">Rest well tonight.</p>
        <button
          onClick={() => router.push("/client/home")}
          className="mt-4 px-8 py-3 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors"
        >
          Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-display text-2xl text-brun-chaud">4 true moments</h1>
        <p className="font-ui text-sm text-brun-mid mt-2">
          Light and shadow carry equal value here.
        </p>
      </div>

      <div className="space-y-5">
        <SpeechTextarea
          value={moment1}
          onChange={setMoment1}
          placeholder="A moment that touched me..."
        />
        <SpeechTextarea
          value={moment2}
          onChange={setMoment2}
          placeholder="Something I received..."
        />
        <SpeechTextarea
          value={moment3}
          onChange={setMoment3}
          placeholder="What emerged — joy, anger, doubt, lightness..."
        />
        <SpeechTextarea
          value={moment4}
          onChange={setMoment4}
          placeholder="What I notice in myself tonight..."
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

function SpeechTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  function toggleSpeech() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(" ");
      onChange(value + (value ? " " : "") + transcript);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  }

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors resize-none"
      />
      <button
        type="button"
        onClick={toggleSpeech}
        className={`absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          listening ? "bg-red-500 text-white" : "bg-or-pale/50 text-brun-mid"
        }`}
        title={listening ? "Stop" : "Dictate"}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1a4 4 0 00-4 4v7a4 4 0 008 0V5a4 4 0 00-4-4zm7 11a7 7 0 01-14 0H3a9 9 0 0017.94 1H21a7 7 0 010-1h-2zm-7 8a1 1 0 00-1 1v2h2v-2a1 1 0 00-1-1z" />
        </svg>
      </button>
    </div>
  );
}

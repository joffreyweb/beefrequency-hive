"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";

function getHour() {
  return new Date().getHours();
}

export default function EveningCheckinPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const T = (key: { EN: string; FR: string }) => key[lang];

  // 9 champs (tous optionnels, soumission partielle autorisée)
  const [a1, setA1] = useState("");
  const [a2, setA2] = useState("");
  const [a3, setA3] = useState("");
  const [b1, setB1] = useState("");
  const [b2, setB2] = useState("");
  const [b3, setB3] = useState("");
  const [b4, setB4] = useState("");
  const [reconnaissance, setReconnaissance] = useState("");
  const [cloture, setCloture] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const hour = getHour();
  const isOpen = hour >= 16 && hour <= 23;

  const clean = (s: string) => (s.trim() ? s.trim() : null);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/daily-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "CYCLE",
          eveningReflection: {
            microMoments: { a1: clean(a1), a2: clean(a2), a3: clean(a3) },
            piments: { b1: clean(b1), b2: clean(b2), b3: clean(b3), b4: clean(b4) },
            reconnaissance: clean(reconnaissance),
            cloture: clean(cloture),
          },
        }),
      });
    } catch {
      // soumission silencieuse — même si l'écriture échoue, on n'embête pas l'utilisateur.
    } finally {
      setSaving(false);
      setDone(true);
    }
  }

  if (!isOpen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <p className="font-display text-xl text-brun-chaud mb-2">{T(t.evening.closedTitle)}</p>
        <p className="font-ui text-sm text-brun-mid">{T(t.evening.closedSub)}</p>
        <button
          onClick={() => router.push("/client/home")}
          className="mt-8 text-sm font-ui text-or-sacre hover:text-ambre-vif transition-colors"
        >
          &larr; {T(t.evening.home)}
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 space-y-6">
        <h2 className="font-display text-2xl text-brun-chaud">{T(t.evening.doneTitle)}</h2>
        <p className="font-display text-lg text-brun-mid">{T(t.evening.doneSub)}</p>
        <button
          onClick={() => router.push("/client/home")}
          className="mt-4 px-8 py-3 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors"
        >
          {T(t.evening.home)}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* En-tête : titre + sous-titre + éthos */}
      <div className="text-center space-y-2">
        <h1 className="font-display text-2xl text-brun-chaud">{T(t.evening.title)}</h1>
        <p className="font-ui text-sm text-brun-mid">{T(t.evening.subtitle)}</p>
        <p className="font-caps text-[10px] uppercase tracking-wider text-or-sacre/80 pt-1">
          {T(t.evening.ethos)}
        </p>
      </div>

      {/* Section A — 3 micro-moments */}
      <section className="space-y-3">
        <header className="space-y-1 border-b border-or-pale/40 pb-2">
          <h2 className="font-display text-lg text-brun-chaud">{T(t.evening.sectionAHeader)}</h2>
          <p className="font-ui text-xs italic text-brun-mid/70">{T(t.evening.sectionANote)}</p>
        </header>
        <Field label={T(t.evening.a1Label)} value={a1} onChange={setA1} lang={lang} />
        <Field label={T(t.evening.a2Label)} value={a2} onChange={setA2} lang={lang} />
        <Field label={T(t.evening.a3Label)} value={a3} onChange={setA3} lang={lang} />
      </section>

      {/* Section B — 4 piments de gratitude */}
      <section className="space-y-3">
        <header className="space-y-1 border-b border-or-pale/40 pb-2">
          <h2 className="font-display text-lg text-brun-chaud">{T(t.evening.sectionBHeader)}</h2>
          <p className="font-ui text-xs italic text-brun-mid/70">{T(t.evening.sectionBNote)}</p>
        </header>
        <Field label={T(t.evening.b1Label)} value={b1} onChange={setB1} lang={lang} />
        <Field label={T(t.evening.b2Label)} value={b2} onChange={setB2} lang={lang} />
        <Field
          label={T(t.evening.b3Label)}
          hint={T(t.evening.b3Hint)}
          value={b3}
          onChange={setB3}
          lang={lang}
        />
        <Field label={T(t.evening.b4Label)} value={b4} onChange={setB4} lang={lang} />
      </section>

      {/* Section C — 1 reconnaissance */}
      <section className="space-y-3">
        <header className="space-y-1 border-b border-or-pale/40 pb-2">
          <h2 className="font-display text-lg text-brun-chaud">{T(t.evening.sectionCHeader)}</h2>
          <p className="font-ui text-xs italic text-brun-mid/70">{T(t.evening.sectionCNote)}</p>
        </header>
        <Field
          hint={T(t.evening.c1Hint)}
          value={reconnaissance}
          onChange={setReconnaissance}
          lang={lang}
        />
      </section>

      {/* Section D — clôture douce (un peu plus haute) */}
      <section className="space-y-3">
        <header className="space-y-1 border-b border-or-pale/40 pb-2">
          <h2 className="font-display text-lg text-brun-chaud">{T(t.evening.sectionDHeader)}</h2>
          <p className="font-ui text-xs italic text-brun-mid/70">{T(t.evening.sectionDNote)}</p>
        </header>
        <Field value={cloture} onChange={setCloture} lang={lang} rows={4} />
      </section>

      {/* CTA + skip */}
      <div className="space-y-3 pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors disabled:opacity-50"
        >
          {saving ? T(t.evening.saving) : T(t.evening.cta)}
        </button>
        <button
          type="button"
          onClick={() => router.push("/client/home")}
          className="block w-full text-center text-xs font-ui text-brun-mid/60 hover:text-brun-mid transition-colors"
        >
          {T(t.evening.skip)}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Field : label persistant (au-dessus) + hint optionnel + SpeechTextarea.
// Garde la dictée existante (NON NÉGOCIABLE), juste compactée (rows=2 par défaut).
// ─────────────────────────────────────────────────────────────────────────────
function Field({
  label,
  hint,
  value,
  onChange,
  lang,
  rows = 2,
}: {
  label?: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  lang: string;
  rows?: number;
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block font-ui text-sm text-brun-chaud">{label}</label>
      )}
      {hint && (
        <p className="font-ui text-[11px] italic text-brun-mid/60">{hint}</p>
      )}
      <SpeechTextarea value={value} onChange={onChange} lang={lang} rows={rows} />
    </div>
  );
}

// SpeechTextarea — textarea + bouton micro pour dicter (Web Speech API).
// Identique au composant original sur le contrat de dictée. Ajout : props `rows`
// (compact) et `placeholder` optionnel (labels persistants au-dessus à la place).
function SpeechTextarea({
  value,
  onChange,
  lang,
  rows = 3,
  placeholder = "",
}: {
  value: string;
  onChange: (v: string) => void;
  lang: string;
  rows?: number;
  placeholder?: string;
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
    rec.lang = lang === "FR" ? "fr-FR" : "en-US";
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
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2 pr-12 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors resize-none"
      />
      <button
        type="button"
        onClick={toggleSpeech}
        className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
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

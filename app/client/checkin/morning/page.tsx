"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const SLEEP_TYPES = ["Deep", "Light", "Fragmented", "No sleep"];
const DREAM_OPTIONS = ["Yes", "No", "Blurry"];

function getHour() {
  return new Date().getHours();
}

export default function MorningCheckinPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [energy, setEnergy] = useState(5);
  const [sleep, setSleep] = useState(5);
  const [sleepTypes, setSleepTypes] = useState<string[]>([]);
  const [dreamed, setDreamed] = useState<string | null>(null);
  const [dreamNotes, setDreamNotes] = useState("");
  const [morningFeeling, setMorningFeeling] = useState("");
  const [saving, setSaving] = useState(false);
  const [wisdomMessage, setWisdomMessage] = useState("");
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const hour = getHour();
  const isOpen = hour >= 5 && hour < 13;

  // Fetch a random wisdom message for the final step
  useEffect(() => {
    fetch("/api/auth/me").catch(() => {});
  }, []);

  function toggleSleepType(t: string) {
    setSleepTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function goNext() {
    setDirection("forward");
    setStep((s) => s + 1);
  }

  function goBack() {
    setDirection("back");
    setStep((s) => s - 1);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/daily-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "CYCLE",
          energyLevel: energy,
          sleepQuality: sleep,
          sleepType: JSON.stringify(sleepTypes),
          dreamed: dreamed === "Yes" ? "OUI" : dreamed === "No" ? "NON" : "SAIS_PAS",
          dreamNotes: dreamNotes.trim() || null,
          morningGratitude: morningFeeling.trim() || null,
        }),
      });

      // Fetch wisdom message for final screen
      const res = await fetch("/api/day-message");
      if (res.ok) {
        const data = await res.json();
        if (data.text) setWisdomMessage(data.text);
      }
    } catch {
      // Continue to final step regardless
    } finally {
      setSaving(false);
      goNext();
    }
  }

  if (!isOpen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <p className="font-display text-xl text-brun-chaud mb-2">The morning space opens at 5am.</p>
        <p className="font-ui text-sm text-brun-mid">Come back between 5am and 1pm.</p>
        <button
          onClick={() => router.push("/client/home")}
          className="mt-8 text-sm font-ui text-or-sacre hover:text-ambre-vif transition-colors"
        >
          &larr; Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col">
      {/* Progress dots */}
      {step < 7 && (
        <div className="flex items-center justify-center gap-2 mb-8">
          {[0, 1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              className="w-2 h-2 rounded-full transition-colors duration-200"
              style={{
                background: s === step ? "#B8821E" : s < step ? "#D4A042" : "#E8D5A8",
              }}
            />
          ))}
        </div>
      )}

      {/* Steps with transition */}
      <div
        key={step}
        className="flex-1 flex flex-col items-center justify-center animate-fade-in"
        style={{
          animation: `${direction === "forward" ? "fadeSlideIn" : "fadeSlideBack"} 0.3s ease-out`,
        }}
      >
        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div className="text-center space-y-6">
            <h1 className="font-display text-2xl text-brun-chaud">Begin where you are.</h1>
            <button onClick={goNext} className="px-8 py-3 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors">
              Start
            </button>
          </div>
        )}

        {/* Step 1 — Energy */}
        {step === 1 && (
          <div className="w-full max-w-sm space-y-6 text-center">
            <h2 className="font-display text-xl text-brun-chaud">Energy</h2>
            <p className="font-ui text-sm text-brun-mid">Without analyzing.</p>
            <div className="space-y-3">
              <input
                type="range"
                min={1}
                max={10}
                value={energy}
                onChange={(e) => setEnergy(Number(e.target.value))}
                className="w-full accent-or-sacre"
              />
              <p className="font-display text-3xl text-or-sacre">{energy}/10</p>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={goBack} className="flex-1 py-3 text-brun-mid font-caps text-sm uppercase tracking-wider">Back</button>
              <button onClick={goNext} className="flex-1 py-3 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors">Next</button>
            </div>
          </div>
        )}

        {/* Step 2 — Sleep */}
        {step === 2 && (
          <div className="w-full max-w-sm space-y-6 text-center">
            <h2 className="font-display text-xl text-brun-chaud">Sleep</h2>
            <p className="font-ui text-sm text-brun-mid">Just feel.</p>
            <div className="space-y-3">
              <input
                type="range"
                min={1}
                max={10}
                value={sleep}
                onChange={(e) => setSleep(Number(e.target.value))}
                className="w-full accent-or-sacre"
              />
              <p className="font-display text-3xl text-or-sacre">{sleep}/10</p>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={goBack} className="flex-1 py-3 text-brun-mid font-caps text-sm uppercase tracking-wider">Back</button>
              <button onClick={goNext} className="flex-1 py-3 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors">Next</button>
            </div>
          </div>
        )}

        {/* Step 3 — Sleep type */}
        {step === 3 && (
          <div className="w-full max-w-sm space-y-6 text-center">
            <h2 className="font-display text-xl text-brun-chaud">Sleep type</h2>
            <div className="flex flex-wrap justify-center gap-2">
              {SLEEP_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleSleepType(t)}
                  className={`px-4 py-2 rounded-full text-sm font-ui transition-colors ${
                    sleepTypes.includes(t)
                      ? "bg-or-sacre text-white"
                      : "bg-cire-chaude border border-or-pale text-brun-mid"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={goBack} className="flex-1 py-3 text-brun-mid font-caps text-sm uppercase tracking-wider">Back</button>
              <button onClick={goNext} className="flex-1 py-3 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors">Next</button>
            </div>
          </div>
        )}

        {/* Step 4 — Dreams */}
        {step === 4 && (
          <div className="w-full max-w-sm space-y-6 text-center">
            <h2 className="font-display text-xl text-brun-chaud">Dreams</h2>
            <div className="flex justify-center gap-2">
              {DREAM_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDreamed(d)}
                  className={`px-5 py-2 rounded-full text-sm font-ui transition-colors ${
                    dreamed === d
                      ? "bg-or-sacre text-white"
                      : "bg-cire-chaude border border-or-pale text-brun-mid"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            {(dreamed === "Yes" || dreamed === "Blurry") && (
              <SpeechTextarea
                value={dreamNotes}
                onChange={setDreamNotes}
                placeholder="What do you remember..."
              />
            )}
            <div className="flex gap-4 pt-4">
              <button onClick={goBack} className="flex-1 py-3 text-brun-mid font-caps text-sm uppercase tracking-wider">Back</button>
              <button onClick={goNext} className="flex-1 py-3 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors">Next</button>
            </div>
          </div>
        )}

        {/* Step 5 — Morning feeling */}
        {step === 5 && (
          <div className="w-full max-w-sm space-y-6 text-center">
            <h2 className="font-display text-xl text-brun-chaud">What is present for me this morning.</h2>
            <SpeechTextarea
              value={morningFeeling}
              onChange={setMorningFeeling}
              placeholder="No expectations. Just what is here."
            />
            <div className="flex gap-4 pt-4">
              <button onClick={goBack} className="flex-1 py-3 text-brun-mid font-caps text-sm uppercase tracking-wider">Back</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}

        {/* Step 6 — Done */}
        {step === 6 && (
          <div className="text-center space-y-6 max-w-sm">
            <h2 className="font-display text-2xl text-brun-chaud">It&apos;s noted.</h2>
            <p className="font-display text-lg text-brun-mid">Have a beautiful day.</p>
            {wisdomMessage && (
              <p className="font-display text-base text-brun-mid/70 italic pt-4">
                &ldquo;{wisdomMessage}&rdquo;
              </p>
            )}
            <button
              onClick={() => router.push("/client/home")}
              className="mt-6 px-8 py-3 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors"
            >
              Home
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeSlideBack {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
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
        rows={4}
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

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CLARITY_MAPS,
  LAYER_META,
  answerKey,
  CLARITY_TOTAL_QUESTIONS,
  type ClarityLayer,
} from "@/lib/clarity/maps";

const DONE_STATES = ["SUBMITTED", "GENERATING", "READY", "PUBLISHED"];

const LAYER_ACCENT: Record<ClarityLayer, string> = {
  SURFACE: "text-foret",
  EXPANSION: "text-or-sacre",
  VALIDATION: "text-brun-mid",
};

export default function ClarityFill({
  initialAnswers,
  initialStatus,
}: {
  initialAnswers: Record<string, string>;
  initialStatus: string;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [cardIdx, setCardIdx] = useState(0);
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  if (DONE_STATES.includes(status)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-4">🐝</div>
        <h1 className="font-display text-3xl text-brun-chaud mb-3">Merci.</h1>
        <p className="font-ui text-brun-mid mb-8">
          Ton Clarity est soumis. Joffrey va préparer ta synthèse — tu seras prévenu·e dès qu'elle est prête.
        </p>
        <Link
          href="/client/home"
          className="inline-block px-6 py-2.5 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors"
        >
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  const card = CLARITY_MAPS[cardIdx];
  const totalCards = CLARITY_MAPS.length;
  const isLast = cardIdx === totalCards - 1;

  const answeredCount = Object.values(answers).filter(
    (v) => typeof v === "string" && v.trim().length > 0,
  ).length;

  // Toutes les questions de la carte courante doivent être remplies pour continuer.
  const currentCardComplete = card.sections.every((section, secIdx) =>
    section.questions.every((_q, qIdx) => {
      const v = answers[answerKey(cardIdx, secIdx, qIdx)];
      return typeof v === "string" && v.trim().length > 0;
    }),
  );

  const sectionsUpTo = (idx: number) =>
    CLARITY_MAPS.slice(0, idx + 1).reduce((n, m) => n + m.sections.length, 0);

  function setAnswer(key: string, val: string) {
    setAnswers((a) => ({ ...a, [key]: val }));
  }

  function cardAnswers(idx: number): Record<string, string> {
    const out: Record<string, string> = {};
    CLARITY_MAPS[idx].sections.forEach((s, secIdx) =>
      s.questions.forEach((_q, qIdx) => {
        const k = answerKey(idx, secIdx, qIdx);
        const v = answers[k];
        if (typeof v === "string" && v.trim().length > 0) out[k] = v;
      })
    );
    return out;
  }

  async function saveCard(): Promise<boolean> {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/client/clarity", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: cardAnswers(cardIdx),
          sectionsDone: sectionsUpTo(cardIdx),
        }),
      });
      if (!res.ok) throw new Error();
      return true;
    } catch {
      setMsg("Échec de la sauvegarde — vérifie ta connexion et réessaie.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function goNext() {
    if (!currentCardComplete) {
      setMsg("Réponds à toutes les questions de cette carte pour continuer.");
      return;
    }
    const ok = await saveCard();
    if (ok) {
      setCardIdx((i) => Math.min(i + 1, totalCards - 1));
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function goPrev() {
    setCardIdx((i) => Math.max(i - 1, 0));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    if (!currentCardComplete) {
      setMsg("Réponds à toutes les questions pour soumettre.");
      return;
    }
    const ok = await saveCard();
    if (!ok) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/client/clarity", { method: "POST" });
      if (!res.ok) throw new Error();
      setStatus("SUBMITTED");
    } catch {
      setMsg("Échec de la soumission — réessaie dans un instant.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-caps text-xs uppercase tracking-wider text-brun-mid/70">
            Clarity by Beefrequency
          </span>
          <span className="font-ui text-xs text-brun-mid/70">
            {answeredCount}/{CLARITY_TOTAL_QUESTIONS} réponses
          </span>
        </div>
        <div className="flex gap-1.5">
          {CLARITY_MAPS.map((m, i) => (
            <div
              key={m.id}
              className={`h-1.5 flex-1 rounded-full ${i <= cardIdx ? "bg-or-sacre" : "bg-or-pale"}`}
            />
          ))}
        </div>
      </div>

      <header className="text-center mb-8">
        <div className="text-3xl mb-2">{card.emoji}</div>
        <p className="font-caps text-xs uppercase tracking-widest text-or-sacre mb-1">
          Carte {card.num} · {card.label}
        </p>
        <h1 className="font-display text-3xl text-brun-chaud mb-2">{card.subtitle}</h1>
        <p className="font-ui text-sm text-brun-mid max-w-xl mx-auto">{card.desc}</p>
      </header>

      <div className="space-y-8">
        {card.sections.map((section, secIdx) => (
          <section key={secIdx} className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-lg">{section.icon}</span>
              <div>
                <h2 className="font-display text-xl text-brun-chaud leading-tight">{section.title}</h2>
                <p className="font-ui text-xs text-brun-mid/70">{section.sub}</p>
              </div>
            </div>

            <div className="space-y-5">
              {section.questions.map((q, qIdx) => {
                const key = answerKey(cardIdx, secIdx, qIdx);
                return (
                  <div key={qIdx}>
                    <label className="block mb-1.5">
                      <span className={`font-caps text-[10px] uppercase tracking-wider ${LAYER_ACCENT[q.layer]}`}>
                        {LAYER_META[q.layer].label}
                      </span>
                      <span className="block font-ui text-sm text-brun-chaud mt-1">{q.text}</span>
                    </label>
                    <textarea
                      value={typeof answers[key] === "string" ? answers[key] : ""}
                      onChange={(e) => setAnswer(key, e.target.value)}
                      rows={3}
                      className="w-full rounded-[8px] border border-or-pale bg-creme-sacree px-3 py-2 font-ui text-sm text-brun-chaud placeholder:text-brun-mid/40 focus:outline-none focus:border-or-sacre resize-y"
                      placeholder="Prends le temps qu'il te faut…"
                    />
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {msg && <p className="mt-5 text-center font-ui text-sm text-red-600">{msg}</p>}
      {!currentCardComplete && !msg && (
        <p className="mt-5 text-center font-ui text-xs text-brun-mid/60">
          Réponds à toutes les questions de cette carte pour continuer.
        </p>
      )}

      <div className="mt-8 flex items-center justify-between gap-4">
        <button
          onClick={goPrev}
          disabled={cardIdx === 0 || saving}
          className="px-4 py-2.5 rounded-sharp border border-or-pale text-brun-mid font-ui text-sm disabled:opacity-40"
        >
          ← Précédent
        </button>

        <span className="font-ui text-xs text-brun-mid/60">
          Carte {cardIdx + 1} / {totalCards}
        </span>

        {isLast ? (
          <button
            onClick={submit}
            disabled={saving || !currentCardComplete}
            className="px-6 py-2.5 rounded-sharp bg-or-sacre text-white font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors disabled:opacity-50"
          >
            {saving ? "…" : "Soumettre mon Clarity"}
          </button>
        ) : (
          <button
            onClick={goNext}
            disabled={saving || !currentCardComplete}
            className="px-6 py-2.5 rounded-sharp bg-or-sacre text-white font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors disabled:opacity-50"
          >
            {saving ? "…" : "Enregistrer et continuer →"}
          </button>
        )}
      </div>

      <p className="mt-6 text-center font-ui text-xs text-brun-mid/50">
        Tes réponses sont enregistrées à chaque étape. Tu peux revenir plus tard.
      </p>
    </div>
  );
}

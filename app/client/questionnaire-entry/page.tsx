"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { SECTIONS } from "@/lib/questionnaire-data";

interface EntryData {
  id: string;
  status: string;
  sectionsDone: number;
  responses: Record<string, Record<string, string>> | null;
}

export default function QuestionnaireEntryPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const T = (key: { EN: string; FR: string }) => key[lang];

  const [entry, setEntry] = useState<EntryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentSection, setCurrentSection] = useState(0); // 0-indexed
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/client/questionnaire-entry")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.entry) {
          setEntry(data.entry);
          if (data.entry.responses) {
            setAnswers(data.entry.responses);
          }
          if (data.entry.status === "IN_PROGRESS") {
            setShowWelcome(false);
            setCurrentSection(Math.min(data.entry.sectionsDone, SECTIONS.length - 1));
          }
          if (data.entry.status === "SUBMITTED") {
            router.push("/client/home");
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  // Sauvegarder la section courante
  async function saveSection(sectionIndex: number) {
    const section = SECTIONS[sectionIndex];
    const sectionAnswers = answers[section.id] || {};

    setSaving(true);
    try {
      const res = await fetch("/api/client/questionnaire-entry", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId: section.id,
          answers: sectionAnswers,
          sectionNumber: sectionIndex + 1,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setEntry(data.entry);
      }
    } catch {
      // Silencieux
    } finally {
      setSaving(false);
    }
  }

  async function handleNext() {
    await saveSection(currentSection);
    if (currentSection < SECTIONS.length - 1) {
      setCurrentSection(currentSection + 1);
      window.scrollTo(0, 0);
    }
  }

  async function handleSubmit() {
    await saveSection(currentSection);
    setSubmitting(true);
    try {
      const res = await fetch("/api/client/questionnaire-entry", { method: "POST" });
      if (res.ok) {
        router.push("/client/home");
      }
    } catch {
      // Silencieux
    } finally {
      setSubmitting(false);
    }
  }

  function updateAnswer(sectionId: string, questionId: string, value: string) {
    setAnswers((prev) => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] || {}),
        [questionId]: value,
      },
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="font-ui text-sm text-brun-mid/60">Chargement...</p>
      </div>
    );
  }

  // Écran d'accueil — centré verticalement avec espacement équilibré
  if (showWelcome) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="max-w-md w-full flex flex-col items-center gap-8">
          <p className="font-display text-lg text-brun-chaud leading-relaxed whitespace-pre-line">
            {T({
              EN: `Before starting your journey, I need to read you.

This questionnaire is the first layer of our work together.
It allows me to prepare your protocol with precision, to respect
your system, and to welcome you where you truly are.

Take the time you need. You can stop and come back at any moment.

All your answers remain strictly confidential.`,
              FR: `Avant de commencer ton parcours, j'ai besoin de te lire.

Ce questionnaire est la première couche de notre travail ensemble.
Il me permet de préparer ton protocole avec précision, de respecter
ton système, et de t'accueillir là où tu en es vraiment.

Prends le temps qu'il te faut. Tu peux t'arrêter et revenir à tout moment.

Toutes tes réponses restent strictement confidentielles.`,
            })}
          </p>

          <p className="font-ui text-sm text-brun-mid/60 italic">
            — Joffrey Deleplanque &middot; BeeFrequency
          </p>

          <button
            onClick={() => setShowWelcome(false)}
            className="px-6 py-3 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors"
          >
            {T({
              EN: "Start reading my terrain →",
              FR: "Commencer la lecture de mon terrain →",
            })}
          </button>
        </div>
      </div>
    );
  }

  // Section courante
  const section = SECTIONS[currentSection];
  const sectionAnswers = answers[section.id] || {};
  const allAnswered = true; // All questions are optional
  const isLastSection = currentSection === SECTIONS.length - 1;

  return (
    <div className="space-y-6 pb-8">
      {/* Barre de progression */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-caps text-xs text-brun-mid uppercase tracking-wider">
          Section {currentSection + 1}/{SECTIONS.length}
        </span>
        <div className="flex-1 mx-3 h-1.5 bg-creme-sacree rounded-full overflow-hidden">
          <div
            className="h-full bg-or-sacre rounded-full transition-all duration-300"
            style={{ width: `${((currentSection + 1) / SECTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Header section */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{section.icon}</span>
          <h2 className="font-display text-lg text-brun-chaud">{section.title}</h2>
        </div>
        <p className="font-ui text-sm text-brun-mid leading-relaxed italic">
          {section.intro}
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-5">
        {section.questions.map((q) => {
          // Hide question cards that are conditionals (rendered inline by their parent checkbox)
          if (section.questions.some((other) => other.conditional === q.id)) return null;
          return (
          <div key={q.id} className="bg-cire-chaude border border-or-pale rounded-sm p-4">
            <p className="font-ui text-sm text-brun-chaud mb-3">{q.text}</p>

            {q.type === "mcq" && q.options && (
              <div className="space-y-2">
                {q.options.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                        sectionAnswers[q.id] === opt.value
                          ? "border-or-sacre bg-or-sacre"
                          : "border-brun-mid/30 group-hover:border-or-sacre/50"
                      }`}
                      onClick={() => updateAnswer(section.id, q.id, opt.value)}
                    >
                      {sectionAnswers[q.id] === opt.value && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </div>
                    <span
                      className="font-ui text-sm text-brun-chaud"
                      onClick={() => updateAnswer(section.id, q.id, opt.value)}
                    >
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {q.type === "checkbox" && q.options && (() => {
              // Parse checked values from stored JSON array string
              let checked: string[] = [];
              try { checked = JSON.parse(sectionAnswers[q.id] || "[]"); } catch { checked = []; }
              const hasChecked = checked.length > 0;

              return (
                <>
                  <div className="space-y-2">
                    {q.options.map((opt) => {
                      const isChecked = checked.includes(opt.value);
                      return (
                        <label
                          key={opt.value}
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => {
                            const next = isChecked
                              ? checked.filter((v) => v !== opt.value)
                              : [...checked, opt.value];
                            updateAnswer(section.id, q.id, JSON.stringify(next));
                          }}
                        >
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                              isChecked
                                ? "border-or-sacre bg-or-sacre"
                                : "border-brun-mid/30 group-hover:border-or-sacre/50"
                            }`}
                          >
                            {isChecked && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <span className="font-ui text-sm text-brun-chaud">{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  {/* Conditional textarea — visible if any checkbox is checked */}
                  {q.conditional && hasChecked && (
                    <div className="mt-4">
                      <p className="font-ui text-sm text-brun-chaud mb-2">
                        {T({ EN: "Please specify:", FR: "Précisez :" })}
                      </p>
                      <textarea
                        value={sectionAnswers[q.conditional] || ""}
                        onChange={(e) => updateAnswer(section.id, q.conditional!, e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-creme-sacree border border-or-pale rounded-sm text-sm font-ui text-brun-chaud resize-none focus:outline-none focus:border-or-sacre transition-colors"
                        placeholder={T({ EN: "Details about your situation...", FR: "Détails sur ta situation..." })}
                      />
                    </div>
                  )}
                </>
              );
            })()}

            {q.type === "textarea" && (
              // Skip if this textarea is rendered inline as a conditional of a checkbox question
              section.questions.some((other) => other.conditional === q.id)
                ? null
                : <textarea
                    value={sectionAnswers[q.id] || ""}
                    onChange={(e) => updateAnswer(section.id, q.id, e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 bg-creme-sacree border border-or-pale rounded-sm text-sm font-ui text-brun-chaud resize-none focus:outline-none focus:border-or-sacre transition-colors"
                    placeholder={T({ EN: "Your answer...", FR: "Ta réponse..." })}
                  />
            )}
          </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        {currentSection > 0 && (
          <button
            onClick={() => { saveSection(currentSection); setCurrentSection(currentSection - 1); window.scrollTo(0, 0); }}
            className="flex-1 py-3 border border-or-pale text-brun-mid font-ui text-xs uppercase tracking-widest rounded-sharp hover:bg-cire-chaude transition-colors"
          >
            {T({ EN: "← Previous section", FR: "← Section précédente" })}
          </button>
        )}

        {isLastSection ? (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            className="flex-1 py-3 bg-or-sacre text-white font-ui text-xs uppercase tracking-widest rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-40"
          >
            {submitting
              ? T({ EN: "Submitting...", FR: "Envoi..." })
              : T({ EN: "Submit my questionnaire", FR: "Soumettre mon questionnaire" })}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!allAnswered || saving}
            className="flex-1 py-3 bg-or-sacre text-white font-ui text-xs uppercase tracking-widest rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-40"
          >
            {saving
              ? T({ EN: "Saving...", FR: "Sauvegarde..." })
              : T({ EN: "Next section →", FR: "Section suivante →" })}
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { SECTIONS } from "@/lib/questionnaire-data";

interface Entry {
  id: string;
  status: string;
  sectionsDone: number;
  responses: Record<string, Record<string, string>> | null;
  submittedAt: string | null;
}

export default function QuestionnaireEntrySection({ clientId }: { clientId: string }) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/questionnaire-entry?clientId=${clientId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setEntry(data.entry); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) return <p className="font-ui text-sm text-brun-mid/60">Chargement...</p>;

  if (!entry) {
    return (
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-6 text-center">
        <p className="font-ui text-sm text-brun-mid/60">Aucun questionnaire d&apos;entrée rempli.</p>
      </div>
    );
  }

  const statusLabel = entry.status === "SUBMITTED"
    ? "Soumis"
    : entry.status === "IN_PROGRESS"
      ? "En cours"
      : "En attente";

  const statusColor = entry.status === "SUBMITTED"
    ? "bg-foret/10 text-foret"
    : entry.status === "IN_PROGRESS"
      ? "bg-or-sacre/10 text-or-sacre"
      : "bg-brun-mid/10 text-brun-mid";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-caps text-sm text-brun-mid uppercase tracking-wider">
          Questionnaire d&apos;entrée
        </h3>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-ui px-2 py-1 rounded-full ${statusColor}`}>
            {statusLabel}
          </span>
          <span className="text-[10px] font-ui text-brun-mid/50">
            {entry.sectionsDone}/{SECTIONS.length} sections
          </span>
        </div>
      </div>

      {/* Progression */}
      <div className="h-2 bg-creme-sacree rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${(entry.sectionsDone / SECTIONS.length) * 100}%`,
            background: entry.status === "SUBMITTED"
              ? "linear-gradient(90deg, #2D5A3D, #4A8F5A)"
              : "linear-gradient(90deg, #B8821E, #D4A84B)",
          }}
        />
      </div>

      {/* Réponses par section */}
      {entry.responses && SECTIONS.map((section) => {
        const sectionAnswers = (entry.responses as Record<string, Record<string, string>>)?.[section.id];
        if (!sectionAnswers) return null;

        return (
          <div key={section.id} className="bg-cire-chaude border border-or-pale rounded-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <span>{section.icon}</span>
              <h4 className="font-caps text-xs text-brun-mid uppercase tracking-wider">
                {section.title}
              </h4>
            </div>

            <div className="space-y-2">
              {section.questions.map((q) => {
                // Skip conditional textareas — shown inline with their parent
                if (section.questions.some((other) => other.conditional === q.id)) return null;

                const answer = sectionAnswers[q.id];
                if (!answer) return null;

                // Format display based on question type
                let displayAnswer: React.ReactNode = answer;
                if (q.type === "mcq" && q.options) {
                  const opt = q.options.find((o) => o.value === answer);
                  if (opt) displayAnswer = opt.label;
                } else if (q.type === "checkbox" && q.options) {
                  try {
                    const checked = JSON.parse(answer) as string[];
                    if (checked.length === 0) {
                      displayAnswer = <span className="text-brun-mid/50 italic">Aucun</span>;
                    } else {
                      displayAnswer = (
                        <ul className="space-y-0.5 mt-1">
                          {checked.map((val) => {
                            const opt = q.options?.find((o) => o.value === val);
                            return (
                              <li key={val} className="flex items-center gap-1.5">
                                <span className="text-or-sacre text-xs">✓</span>
                                <span>{opt ? opt.label : val}</span>
                              </li>
                            );
                          })}
                        </ul>
                      );
                    }
                  } catch {
                    displayAnswer = answer;
                  }
                }

                // Show conditional textarea inline if present
                const conditionalAnswer = q.conditional ? sectionAnswers[q.conditional] : null;

                return (
                  <div key={q.id} className="border-b border-or-pale/30 pb-2 last:border-0 last:pb-0">
                    <p className="font-ui text-xs text-brun-mid/60">{q.text}</p>
                    <div className="font-ui text-sm text-brun-chaud mt-0.5">{displayAnswer}</div>
                    {conditionalAnswer && (
                      <div className="mt-1 pl-3 border-l-2 border-or-sacre/30">
                        <p className="font-ui text-xs text-brun-mid/60">Précisions :</p>
                        <p className="font-ui text-sm text-brun-chaud mt-0.5">{conditionalAnswer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {entry.submittedAt && (
        <p className="font-ui text-[10px] text-brun-mid/50 text-right">
          Soumis le {new Date(entry.submittedAt).toLocaleDateString("fr-FR", {
            day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}

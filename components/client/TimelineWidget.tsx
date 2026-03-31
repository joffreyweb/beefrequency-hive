"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";

interface Phase {
  label: string;
  phaseType?: string;
  durationDays: number;
  status: string;
  dayInPhase?: number;
}

interface TimelineData {
  detox: Phase | null;
  phases: Phase[] | null;
  activePhase: {
    label: string;
    dayInPhase: number;
    durationDays: number;
    dayInProgram: number;
  } | null;
  globalDay: number;
  globalProgress: number;
  totalDays: number;
  hasStarted: boolean;
}

export default function TimelineWidget() {
  const { lang } = useLanguage();
  const T = (key: { EN: string; FR: string }) => key[lang];
  const [data, setData] = useState<TimelineData | null>(null);

  useEffect(() => {
    fetch("/api/client/timeline")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setData(d); })
      .catch(() => {});
  }, []);

  if (!data || !data.hasStarted) return null;

  // Construire la liste complète des segments pour la barre visuelle
  const segments: { label: string; days: number; status: string }[] = [];

  if (data.detox) {
    segments.push({ label: "Détox", days: 10, status: data.detox.status });
  }

  if (data.phases) {
    for (const p of data.phases) {
      segments.push({ label: p.label, days: p.durationDays, status: p.status });
    }
  }

  // Si pas encore de phases programme mais détox en cours, ajouter des placeholders
  if (!data.phases && data.detox) {
    segments.push({ label: "Cycle 1", days: 21, status: "UPCOMING" });
    segments.push({ label: "Intégration 1", days: 10, status: "UPCOMING" });
    segments.push({ label: "Cycle 2", days: 21, status: "UPCOMING" });
    segments.push({ label: "Intégration 2", days: 10, status: "UPCOMING" });
    segments.push({ label: "Cycle 3", days: 21, status: "UPCOMING" });
    segments.push({ label: "Intégration 3", days: 10, status: "UPCOMING" });
  }

  const totalDays = segments.reduce((sum, s) => sum + s.days, 0);

  const activePhase = data.activePhase;
  const daysRemaining = activePhase
    ? activePhase.durationDays - activePhase.dayInPhase
    : 0;

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
      <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-4">
        {T({ EN: "My Journey — Overview", FR: "Mon Passage — Vue globale" })}
      </h2>

      {/* Phase active + jours restants */}
      {activePhase && (
        <div className="text-center mb-4">
          <p className="font-display text-lg text-brun-chaud">
            {activePhase.label}
          </p>
          <p className="font-ui text-sm text-or-sacre">
            {T({ EN: "Day", FR: "Jour" })} {activePhase.dayInPhase}/{activePhase.durationDays}
            <span className="text-brun-mid/60 ml-2">
              — {daysRemaining} {T({ EN: "remaining", FR: "restant" })}
              {daysRemaining > 1 && lang === "FR" ? "s" : ""}
            </span>
          </p>
        </div>
      )}

      {/* Barre de progression globale */}
      <div className="relative h-3 bg-creme-sacree rounded-full overflow-hidden mb-3">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${data.globalProgress}%`,
            background: "linear-gradient(90deg, #B8821E, #D4A84B)",
          }}
        />
      </div>

      {/* Segments visuels */}
      <div className="flex gap-0.5 mb-2">
        {segments.map((seg, i) => {
          const widthPct = (seg.days / totalDays) * 100;
          let bgColor = "bg-brun-mid/10"; // UPCOMING
          if (seg.status === "COMPLETED") bgColor = "bg-foret/40";
          if (seg.status === "ACTIVE") bgColor = "bg-or-sacre";

          return (
            <div
              key={i}
              className={`h-2 rounded-full ${bgColor} transition-colors`}
              style={{ width: `${widthPct}%`, minWidth: "4px" }}
              title={`${seg.label} (${seg.days}j)`}
            />
          );
        })}
      </div>

      {/* Légende simplifiée */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {segments.map((seg, i) => (
          <span
            key={i}
            className={`font-ui text-[10px] ${
              seg.status === "ACTIVE"
                ? "text-or-sacre font-medium"
                : seg.status === "COMPLETED"
                  ? "text-foret/60"
                  : "text-brun-mid/40"
            }`}
          >
            {seg.label}
          </span>
        ))}
      </div>

      {/* Progression globale */}
      <p className="font-ui text-[10px] text-brun-mid/50 text-center mt-3">
        {T({ EN: "Day", FR: "Jour" })} {data.globalDay}/{data.totalDays}
      </p>
    </div>
  );
}

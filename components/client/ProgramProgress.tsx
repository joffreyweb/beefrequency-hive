"use client";

import { useState, useEffect } from "react";

interface Phase {
  name: string;
  moduleName: string;
  dayInPhase: number;
  totalDaysInPhase: number;
  daysRemaining: number;
}

interface NextPhase {
  name: string;
  duration: number;
  startsIn: number;
}

interface ModuleInfo {
  name: string;
  nameFr: string;
  duration: number;
}

interface ClientProgram {
  programName: string;
  totalDays: number;
  currentDay: number;
  progress: number;
  currentPhase: Phase;
  nextPhase: NextPhase | null;
  modules: ModuleInfo[];
  endDate: string;
  status: string;
}

const MODULE_COLORS: Record<string, string> = {
  detox: "bg-red-500",
  cycle: "bg-amber-500",
  break: "bg-emerald-600",
  protocol30: "bg-amber-700",
};

const MODULE_TEXT_COLORS: Record<string, string> = {
  detox: "text-red-600",
  cycle: "text-amber-600",
  break: "text-emerald-700",
  protocol30: "text-amber-800",
};

export default function ProgramProgress() {
  const [data, setData] = useState<ClientProgram | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/client/program")
      .then((r) => r.json())
      .then((d) => setData(d.clientProgram))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!data) return null;

  // Compute position for "you are here" marker
  let markerPosition = 0;
  let dayAcc = 0;
  for (const mod of data.modules) {
    if (dayAcc + mod.duration >= data.currentDay) {
      markerPosition = ((dayAcc + (data.currentDay - dayAcc)) / data.totalDays) * 100;
      break;
    }
    dayAcc += mod.duration;
  }

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-5 text-center">
        <p className="font-caps text-xs text-brun-mid uppercase tracking-wider mb-2">{data.programName}</p>
        <p className="font-display text-2xl text-brun-chaud">
          Jour {data.currentDay} <span className="text-brun-mid/40 font-ui text-lg">/ {data.totalDays}</span>
        </p>
        <div className="mt-3 mx-auto max-w-xs">
          <div className="h-2 bg-creme-sacree rounded-full overflow-hidden">
            <div className="h-full bg-or-sacre rounded-full transition-all duration-500" style={{ width: `${data.progress}%` }} />
          </div>
          <p className="text-xs font-ui text-brun-mid/50 mt-1">{data.progress}%</p>
        </div>
      </div>

      {/* Current phase */}
      <div className="bg-cire-chaude border-2 border-or-sacre rounded-sm p-5">
        <p className="font-caps text-xs text-or-sacre uppercase tracking-wider mb-1">Phase actuelle</p>
        <p className={`font-display text-xl ${MODULE_TEXT_COLORS[data.currentPhase.moduleName] || "text-brun-chaud"}`}>
          {data.currentPhase.name}
        </p>
        <p className="font-ui text-sm text-brun-mid mt-1">
          Jour {data.currentPhase.dayInPhase} / {data.currentPhase.totalDaysInPhase}
          {data.currentPhase.daysRemaining > 0 && (
            <span className="text-brun-mid/50"> · Encore {data.currentPhase.daysRemaining} jour{data.currentPhase.daysRemaining > 1 ? "s" : ""}</span>
          )}
        </p>
      </div>

      {/* Timeline */}
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
        <p className="font-caps text-xs text-brun-mid uppercase tracking-wider mb-3">Timeline</p>
        <div className="relative">
          <div className="flex rounded-full overflow-hidden h-4">
            {data.modules.map((mod, i) => (
              <div
                key={i}
                className={`${MODULE_COLORS[mod.name] || "bg-gray-300"} ${dayAcc <= data.currentDay ? "opacity-100" : "opacity-40"}`}
                style={{ flex: mod.duration }}
              />
            ))}
          </div>
          {/* Marker */}
          <div className="absolute -top-1" style={{ left: `${Math.min(markerPosition, 98)}%` }}>
            <div className="w-0.5 h-6 bg-brun-chaud" />
            <p className="text-[9px] font-ui text-brun-chaud -ml-3 mt-0.5 whitespace-nowrap">Ici</p>
          </div>
        </div>
        <div className="flex mt-2">
          {data.modules.map((mod, i) => (
            <span key={i} style={{ flex: mod.duration }} className="text-[9px] font-ui text-brun-mid/40 truncate">
              {mod.nameFr}
            </span>
          ))}
        </div>
      </div>

      {/* Next phase */}
      {data.nextPhase && (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
          <p className="font-caps text-xs text-brun-mid uppercase tracking-wider mb-1">Prochaine étape</p>
          <p className="font-display text-lg text-brun-chaud">{data.nextPhase.name}</p>
          <p className="font-ui text-sm text-brun-mid">
            Commence dans {data.nextPhase.startsIn} jour{data.nextPhase.startsIn > 1 ? "s" : ""} · Durée : {data.nextPhase.duration} jours
          </p>
        </div>
      )}
    </div>
  );
}

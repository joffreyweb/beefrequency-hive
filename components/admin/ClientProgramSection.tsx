"use client";

import { useState, useEffect } from "react";
import AssignProgramModal from "./AssignProgramModal";
import CustomProgramModal from "./CustomProgramModal";

interface ClientProgramSectionProps {
  clientId: string;
  clientName: string;
  parcoursType?: string;
}

type ProgramState = "pending" | "active" | "completed" | "paused";

interface ClientProgramInfo {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  currentDay: number;
  totalDays: number;
  state: ProgramState;
  program: {
    nameFr: string;
    modules: { order: number; module: { nameFr: string; duration: number; name: string } }[];
  };
}

const MODULE_COLORS: Record<string, string> = {
  detox: "bg-red-500", cycle: "bg-amber-500", break: "bg-emerald-600", protocol30: "bg-amber-700",
};

const STATE_LABELS: Record<ProgramState, string> = {
  pending: "En attente", active: "En cours", completed: "Terminé", paused: "En pause",
};

const STATE_BADGE: Record<ProgramState, string> = {
  pending: "bg-amber-100 text-amber-600",
  active: "bg-foret/10 text-foret",
  completed: "bg-brun-mid/10 text-brun-mid",
  paused: "bg-amber-100 text-amber-600",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-BE", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Brussels",
  });
}

export default function ClientProgramSection({ clientId, clientName, parcoursType }: ClientProgramSectionProps) {
  const isCustom = parcoursType === "CUSTOM";
  const [cp, setCp] = useState<ClientProgramInfo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [clientId]);

  function load() {
    fetch(`/api/admin/client-programs?clientId=${clientId}`)
      .then((r) => r.json())
      .then((d) => setCp(d.clientProgram))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  if (loading) return null;

  // endDate / state / currentDay / totalDays viennent du serveur (helper getProgramState).
  const totalDays = cp?.totalDays ?? 0;
  const currentDay = cp?.currentDay ?? 0;
  const progress = totalDays > 0 ? Math.round(Math.min(currentDay / totalDays, 1) * 100) : 0;

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider">{isCustom ? "Parcours sur-mesure" : "Programme"}</h2>
        <button
          onClick={() => setShowModal(true)}
          className="text-[11px] font-ui text-or-sacre hover:text-ambre-vif transition-colors"
        >
          {isCustom ? (cp ? "Composer" : "+ Composer") : cp ? "Modifier" : "+ Assigner"}
        </button>
      </div>

      {cp ? (
        <div>
          <p className="font-display text-lg text-brun-chaud">{cp.program.nameFr}</p>
          <p className="font-ui text-xs text-brun-mid/70 mt-1">
            Du {fmtDate(cp.startDate)} au {fmtDate(cp.endDate)}
          </p>
          <p className="font-ui text-sm text-brun-mid mt-1">
            Jour {currentDay} / {totalDays} · {progress}%
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${STATE_BADGE[cp.state]}`}>
              {STATE_LABELS[cp.state]}
            </span>
          </p>
          <div className="flex rounded-full overflow-hidden h-2 mt-2">
            {cp.program.modules.map((pm, i) => (
              <div key={i} className={MODULE_COLORS[pm.module.name] || "bg-gray-300"} style={{ flex: pm.module.duration }} />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm font-ui text-brun-mid/50">{isCustom ? "Aucun parcours composé — clique sur Composer" : "Aucun programme assigné"}</p>
      )}

      {isCustom ? (
        <CustomProgramModal
          isOpen={showModal}
          onClose={() => { setShowModal(false); load(); }}
          clientId={clientId}
          clientName={clientName}
        />
      ) : (
        <AssignProgramModal
          isOpen={showModal}
          onClose={() => { setShowModal(false); load(); }}
          clientId={clientId}
          clientName={clientName}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import AssignProgramModal from "./AssignProgramModal";

interface ClientProgramSectionProps {
  clientId: string;
  clientName: string;
}

interface ClientProgramInfo {
  id: string;
  status: string;
  startDate: string;
  currentDay: number;
  program: {
    nameFr: string;
    modules: { order: number; module: { nameFr: string; duration: number; name: string } }[];
  };
}

const MODULE_COLORS: Record<string, string> = {
  detox: "bg-red-500", cycle: "bg-amber-500", break: "bg-emerald-600", protocol30: "bg-amber-700",
};

export default function ClientProgramSection({ clientId, clientName }: ClientProgramSectionProps) {
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

  const totalDays = cp?.program.modules.reduce((acc, pm) => acc + pm.module.duration, 0) || 0;
  const daysSinceStart = cp ? Math.max(1, Math.floor((Date.now() - new Date(cp.startDate).getTime()) / 86400000) + 1) : 0;
  const progress = totalDays > 0 ? Math.round(Math.min(daysSinceStart / totalDays, 1) * 100) : 0;

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider">Programme</h2>
        <button
          onClick={() => setShowModal(true)}
          className="text-[11px] font-ui text-or-sacre hover:text-ambre-vif transition-colors"
        >
          {cp ? "Modifier" : "+ Assigner"}
        </button>
      </div>

      {cp ? (
        <div>
          <p className="font-display text-lg text-brun-chaud">{cp.program.nameFr}</p>
          <p className="font-ui text-sm text-brun-mid mt-1">
            Jour {Math.min(daysSinceStart, totalDays)} / {totalDays} · {progress}%
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
              cp.status === "active" ? "bg-foret/10 text-foret" : cp.status === "paused" ? "bg-amber-100 text-amber-600" : "bg-brun-mid/10 text-brun-mid"
            }`}>{cp.status}</span>
          </p>
          <div className="flex rounded-full overflow-hidden h-2 mt-2">
            {cp.program.modules.map((pm, i) => (
              <div key={i} className={MODULE_COLORS[pm.module.name] || "bg-gray-300"} style={{ flex: pm.module.duration }} />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm font-ui text-brun-mid/50">Aucun programme assigné</p>
      )}

      <AssignProgramModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); load(); }}
        clientId={clientId}
        clientName={clientName}
      />
    </div>
  );
}

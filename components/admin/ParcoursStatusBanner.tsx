"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ParcoursStatusBannerProps {
  clientId: string;
  onboardingCompleted: boolean;
  colisEnvoye: boolean;
  colisEnvoyeAt: string | null;
  produitsRecus: boolean;
  produitsRecusAt: string | null;
  detoxStartDate: string | null;
  programmeStartDate: string | null;
  startDate: string;
}

type StageKey = "inscrit" | "colis" | "recus" | "detox" | "programme";

export default function ParcoursStatusBanner({
  clientId,
  onboardingCompleted,
  colisEnvoye,
  produitsRecus,
  detoxStartDate,
  programmeStartDate,
  startDate,
}: ParcoursStatusBannerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [editingDate, setEditingDate] = useState(false);
  const [newStartDate, setNewStartDate] = useState(startDate.split("T")[0]);

  // Calcul jour detox
  let detoxDay = 0;
  if (detoxStartDate) {
    detoxDay = Math.max(1, Math.ceil((Date.now() - new Date(detoxStartDate).getTime()) / (1000 * 60 * 60 * 24)));
  }

  // Calcul jour programme
  let programmeDay = 0;
  const effStartDate = programmeStartDate || startDate;
  if (effStartDate) {
    programmeDay = Math.max(1, Math.ceil((Date.now() - new Date(effStartDate).getTime()) / (1000 * 60 * 60 * 24)));
  }

  // Determine active stage
  function getActiveStage(): StageKey {
    if (programmeStartDate && programmeDay > 0) return "programme";
    if (detoxStartDate && detoxDay <= 10) return "detox";
    if (produitsRecus) return "recus";
    if (colisEnvoye) return "colis";
    return "inscrit";
  }

  const activeStage = getActiveStage();

  const stages: { key: StageKey; label: string; sublabel?: string }[] = [
    { key: "inscrit", label: "Inscrit" },
    { key: "colis", label: "Colis envoye" },
    { key: "recus", label: "Produits recus" },
    { key: "detox", label: "Detox en cours", sublabel: detoxStartDate ? `J${detoxDay}/10` : undefined },
    { key: "programme", label: "Programme en cours", sublabel: programmeStartDate ? `J${programmeDay}/90` : undefined },
  ];

  const stageOrder: StageKey[] = ["inscrit", "colis", "recus", "detox", "programme"];
  const activeIdx = stageOrder.indexOf(activeStage);

  async function updateStage(field: string, value: boolean | string) {
    setLoading(field);
    try {
      await fetch(`/api/admin/clients/${clientId}/parcours-stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      router.refresh();
    } finally {
      setLoading("");
    }
  }

  async function handleUpdateStartDate() {
    if (!window.confirm("Modifier la date de depart du programme ? Cette action est exceptionnelle.")) return;
    setLoading("startDate");
    try {
      await fetch(`/api/admin/clients/${clientId}/parcours-stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programmeStartDate: newStartDate }),
      });
      setEditingDate(false);
      router.refresh();
    } finally {
      setLoading("");
    }
  }

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider">
          Parcours client
        </h2>
        <button
          onClick={() => setEditingDate(!editingDate)}
          className="text-xs font-ui text-or-sacre hover:text-ambre-vif transition-colors"
        >
          {editingDate ? "Annuler" : "Modifier date depart"}
        </button>
      </div>

      {/* Status banner */}
      <div className="flex items-center gap-1">
        {stages.map((stage, i) => {
          const isPast = i < activeIdx;
          const isCurrent = i === activeIdx;
          const isFuture = i > activeIdx;

          return (
            <div key={stage.key} className="flex items-center flex-1">
              <div
                className={`flex-1 rounded-lg px-3 py-2 text-center transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-or-sacre text-white"
                    : isPast
                    ? "bg-foret/10 text-foret"
                    : "bg-brun-mid/5 text-brun-mid/40"
                }`}
                onClick={() => {
                  if (stage.key === "colis" && !colisEnvoye) updateStage("colisEnvoye", true);
                  if (stage.key === "recus" && colisEnvoye && !produitsRecus) updateStage("produitsRecus", true);
                  if (stage.key === "detox" && produitsRecus && !detoxStartDate) updateStage("detoxStartDate", new Date().toISOString());
                  if (stage.key === "programme" && !programmeStartDate && detoxStartDate) updateStage("programmeStartDate", new Date().toISOString());
                }}
              >
                <p className="text-xs font-ui font-medium leading-tight">{stage.label}</p>
                {stage.sublabel && (
                  <p className={`text-[10px] font-ui mt-0.5 ${isCurrent ? "text-white/80" : ""}`}>
                    {stage.sublabel}
                  </p>
                )}
              </div>
              {i < stages.length - 1 && (
                <span className={`text-xs mx-0.5 ${isPast ? "text-foret" : "text-brun-mid/20"}`}>
                  {"\u2192"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit start date */}
      {editingDate && (
        <div className="mt-4 pt-4 border-t border-or-pale/50 flex items-center gap-3">
          <label className="text-xs font-ui text-brun-mid">Date de depart :</label>
          <input
            type="date"
            value={newStartDate}
            onChange={(e) => setNewStartDate(e.target.value)}
            className="px-2 py-1 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud focus:outline-none focus:border-or-sacre"
          />
          <button
            onClick={handleUpdateStartDate}
            disabled={loading === "startDate"}
            className="px-3 py-1 bg-or-sacre text-white text-xs font-ui uppercase rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-50"
          >
            {loading === "startDate" ? "..." : "Confirmer"}
          </button>
        </div>
      )}
    </div>
  );
}

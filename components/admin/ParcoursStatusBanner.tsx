"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TOTAL_PROGRAM_DAYS } from "@/lib/parcours";

interface ParcoursStatusBannerProps {
  clientId: string;
  onboardingCompleted: boolean;
  colisEnvoye: boolean;
  colisEnvoyeAt: string | null;
  produitsRecus: boolean;
  produitsRecusAt: string | null;
  detoxStartDate: string | null;
  startDate: string;
  parcoursType?: string;
  programTotalDays?: number | null;
}

type StageKey = "inscrit" | "colis" | "recus" | "detox" | "programme";

export default function ParcoursStatusBanner({
  clientId,
  onboardingCompleted,
  colisEnvoye,
  produitsRecus,
  detoxStartDate,
  startDate,
  parcoursType,
  programTotalDays,
}: ParcoursStatusBannerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [editingDate, setEditingDate] = useState(false);
  const [newStartDate, setNewStartDate] = useState(startDate.split("T")[0]);

  // Calcul jour detox — uniquement si la date de départ est passée
  let detoxDay = 0;
  let detoxStarted = false;
  if (detoxStartDate) {
    const diff = Math.floor((Date.now() - new Date(detoxStartDate).getTime()) / (1000 * 60 * 60 * 24));
    if (diff >= 0) {
      detoxDay = diff + 1;
      detoxStarted = true;
    }
  }

  // Jour programme = jour global depuis le début (J1 = jour de départ).
  // Source de date unique : detoxStartDate (= date de départ du parcours, détox ou non).
  // Passage : la phase "programme" démarre après les 10 j de détox. Custom : dès J1.
  const programmeDay = detoxDay; // dayInProgram (1-indexé depuis la date de départ)
  // CUSTOM = parcours composé sur-mesure : PAS de détox fixe de 10 j, durée = programTotalDays.
  const isCustom = parcoursType === "CUSTOM";
  const total = isCustom ? (programTotalDays ?? 0) : TOTAL_PROGRAM_DAYS;
  const totalLabel = total > 0 ? `/${total}` : "";
  // CUSTOM : le programme court dès le jour 1 (pas de gate détox). Passage : après les 10 j de détox.
  const programmeStarted = isCustom ? detoxStarted : (detoxStarted && detoxDay > 10);
  // Parcours terminé = on a dépassé le dernier jour (J > total). Sans total connu (custom mal renseigné) → jamais fini.
  const programmeFinished = detoxStarted && total > 0 && programmeDay > total;
  const programmeEndDate = detoxStartDate && total > 0
    ? new Date(new Date(detoxStartDate).getTime() + (total - 1) * 86400000)
    : null;

  // Determine active stage — séquence stricte : inscrit → colis → recus → detox → programme
  function getActiveStage(): StageKey {
    if (programmeFinished) return "programme";
    if (programmeStarted && (total === 0 || programmeDay <= total)) return "programme";
    // Détox : uniquement pour Le Passage (jamais pour un parcours custom sans détox).
    if (!isCustom && detoxStarted && detoxDay >= 1 && detoxDay <= 10) return "detox";
    if (produitsRecus) return "recus";
    if (colisEnvoye) return "colis";
    return "inscrit";
  }

  const activeStage = getActiveStage();

  const stages: { key: StageKey; label: string; sublabel?: string }[] = [
    { key: "inscrit", label: "Inscrit" },
    { key: "colis", label: "Colis envoye" },
    { key: "recus", label: "Produits recus" },
    // \u00c9tape d\u00e9tox : masqu\u00e9e pour un parcours custom (pas de d\u00e9tox fixe de 10 j).
    ...(!isCustom ? [{ key: "detox" as StageKey, label: "Detox en cours", sublabel: detoxStarted ? `J${Math.min(detoxDay, 10)}/10` : detoxStartDate ? `Demarre le ${new Date(detoxStartDate).toLocaleDateString("fr-FR")}` : undefined }] : []),
    { key: "programme", label: programmeFinished ? "Parcours termine" : "Programme en cours", sublabel: programmeFinished ? `Termine \u00b7 J${total}${totalLabel}` : programmeStarted ? `J${programmeDay}${totalLabel}` : undefined },
  ];

  const stageOrder: StageKey[] = isCustom
    ? ["inscrit", "colis", "recus", "programme"]
    : ["inscrit", "colis", "recus", "detox", "programme"];
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
    if (!window.confirm("Modifier la date de depart du programme ? Cette action recalcule toutes les phases.")) return;
    setLoading("startDate");
    try {
      await fetch("/api/client-phases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, startDate: newStartDate }),
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
        {/* Modifier la date recalcule les phases Le Passage (103 j) — interdit pour un parcours custom. */}
        {!isCustom && (
          <button
            onClick={() => setEditingDate(!editingDate)}
            className="text-xs font-ui text-or-sacre hover:text-ambre-vif transition-colors"
          >
            {editingDate ? "Annuler" : "Modifier date depart"}
          </button>
        )}
      </div>

      {/* Bandeau parcours terminé — visible seulement quand le parcours est achevé */}
      {programmeFinished && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-foret/10 border border-foret/30 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-foret shrink-0" />
          <span className="text-sm font-ui text-foret">
            Parcours termine — J{total}/{total}
            {programmeEndDate ? ` (le ${programmeEndDate.toLocaleDateString("fr-FR")})` : ""}
          </span>
        </div>
      )}

      {/* Status banner */}
      <div className="flex items-center gap-1">
        {stages.map((stage, i) => {
          const isPast = i < activeIdx;
          const isCurrent = i === activeIdx;

          // Seule "colis envoyé" est cliquable manuellement par l'admin
          // Les autres étapes s'activent via des actions client (J'ai reçu) ou dates (Detox/Programme)
          const isManuallyClickable = stage.key === "colis" && !colisEnvoye;

          return (
            <div key={stage.key} className="flex items-center flex-1">
              <div
                className={`flex-1 rounded-lg px-3 py-2 text-center transition-all ${
                  isManuallyClickable ? "cursor-pointer hover:ring-2 hover:ring-or-sacre/40" : ""
                } ${
                  isCurrent
                    ? "bg-or-sacre text-white"
                    : isPast
                    ? "bg-foret/10 text-foret"
                    : "bg-brun-mid/5 text-brun-mid/40"
                }`}
                onClick={() => {
                  if (stage.key === "colis" && !colisEnvoye) {
                    if (window.confirm("Marquer le colis comme envoyé ?")) {
                      updateStage("colisEnvoye", true);
                    }
                  }
                  // Les autres étapes ne sont plus cliquables — elles s'activent automatiquement
                  // via /api/client/elixir-received (J'ai reçu) et les dates
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

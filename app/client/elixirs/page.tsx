"use client";

import { useState, useEffect } from "react";

const TIMING_LABELS: Record<string, string> = {
  MATIN: "Morning",
  SOIR: "Evening",
  JOURNEE: "Daytime",
  FLEXIBLE: "Flexible",
};

const FREQ_LABELS: Record<string, string> = {
  DAILY: "Every day",
  MON_JEU: "Mon & Thu",
  MAR_VEN: "Tue & Fri",
  LUNDI: "Monday",
  MARDI: "Tuesday",
  MERCREDI: "Wednesday",
  JEUDI: "Thursday",
  VENDREDI: "Friday",
  SAMEDI: "Saturday",
  DIMANCHE: "Sunday",
};

interface PhaseElixir {
  id: string;
  dose: string | null;
  timing: string;
  frequency: string;
  notes: string | null;
  elixirLibrary: { name: string; description: string; dosage: string; unit: string };
}

interface ClientPhase {
  id: string;
  phaseType: string;
  phaseNumber: number;
  customName: string | null;
  startDate: string;
  endDate: string;
  status: string;
  phaseElixirs: PhaseElixir[];
}

function phaseName(p: ClientPhase): string {
  if (p.customName) return p.customName;
  if (p.phaseType === "DETOX") return "Detox";
  return `${p.phaseType === "CYCLE" ? "Cycle" : "Integration"} ${p.phaseNumber}`;
}

// Mes élixirs — page client (élixirs assignés par phase, source unique = PhaseElixir)
export default function ClientElixirsPage() {
  const [phases, setPhases] = useState<ClientPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/parcours");
        if (res.ok) {
          const data = await res.json();
          setPhases((data.clientPhases ?? []) as ClientPhase[]);
        }
      } catch {
        // Erreur silencieuse
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Demande de réassort — message automatique à Joffrey
  async function handleOrder(elixirName: string, id: string) {
    setOrdering(id);
    setOrderSuccess(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `Hi Joffrey, I would like to reorder the elixir "${elixirName}". Thank you!`,
        }),
      });
      if (res.ok) {
        setOrderSuccess(id);
        setTimeout(() => setOrderSuccess(null), 3000);
      }
    } catch {
      // Erreur silencieuse
    } finally {
      setOrdering(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm font-ui text-brun-mid/60">Loading your elixirs...</p>
      </div>
    );
  }

  // Phase active (pour le marqueur « en cours »)
  const nowMs = Date.now();
  const isActive = (p: ClientPhase) => {
    const s = new Date(p.startDate); s.setHours(0, 0, 0, 0);
    const e = new Date(p.endDate); e.setHours(23, 59, 59, 999);
    return nowMs >= s.getTime() && nowMs <= e.getTime();
  };

  // TOUS les élixirs assignés, groupés par phase (ordre chronologique).
  const phasesWithElixirs = phases.filter((p) => p.phaseElixirs.length > 0);
  const totalElixirs = phasesWithElixirs.reduce((n, p) => n + p.phaseElixirs.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl text-brun-chaud">My elixirs</h1>
        <p className="text-brun-mid font-ui text-sm mt-1">
          {totalElixirs > 0 ? "All your assigned elixirs, by phase" : "Your assigned elixirs"}
        </p>
      </div>

      {totalElixirs === 0 ? (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-8 text-center">
          <p className="text-sm font-ui text-brun-mid/60">No elixirs assigned yet</p>
        </div>
      ) : (
        <div className="space-y-8">
          {phasesWithElixirs.map((phase) => (
            <div key={phase.id} className="space-y-4">
              {/* En-tête de phase */}
              <div className="flex items-center gap-2">
                <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider">
                  {phaseName(phase)}
                </h2>
                {isActive(phase) && (
                  <span className="text-[10px] font-ui px-2 py-0.5 rounded-full bg-foret/10 text-foret uppercase tracking-wider">
                    En cours
                  </span>
                )}
              </div>

              {phase.phaseElixirs.map((pe) => (
                <div key={pe.id} className="bg-cire-chaude border border-or-pale rounded-sm p-5">
                  {/* En-tête : nom + timing */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-display text-lg text-brun-chaud">{pe.elixirLibrary.name}</h3>
                      <p className="text-xs font-ui text-brun-mid/70 mt-0.5">
                        {pe.elixirLibrary.description}
                      </p>
                    </div>
                    <span className="text-xs font-ui px-2 py-0.5 rounded-sharp shrink-0 bg-or-sacre/10 text-or-sacre">
                      {TIMING_LABELS[pe.timing] ?? pe.timing}
                    </span>
                  </div>

                  {/* Détails en grille */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    <div>
                      <p className="text-xs font-caps text-brun-mid uppercase tracking-wider">Dosage</p>
                      <p className="text-sm font-ui text-brun-chaud mt-0.5">
                        {pe.dose || pe.elixirLibrary.dosage}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-caps text-brun-mid uppercase tracking-wider">Frequency</p>
                      <p className="text-sm font-ui text-brun-chaud mt-0.5">
                        {FREQ_LABELS[pe.frequency] ?? pe.frequency}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-caps text-brun-mid uppercase tracking-wider">When</p>
                      <p className="text-sm font-ui text-brun-chaud mt-0.5">
                        {TIMING_LABELS[pe.timing] ?? pe.timing}
                      </p>
                    </div>
                  </div>

                  {/* Notes */}
                  {pe.notes && (
                    <p className="text-xs font-ui text-brun-mid/60 italic mb-3">{pe.notes}</p>
                  )}

                  {/* Bouton Order (demande de réassort) */}
                  <div className="flex items-center justify-end gap-2">
                    {orderSuccess === pe.id && (
                      <span className="text-xs font-ui text-foret">Message sent!</span>
                    )}
                    <button
                      onClick={() => handleOrder(pe.elixirLibrary.name, pe.id)}
                      disabled={ordering === pe.id}
                      className="px-3 py-1.5 text-xs font-caps uppercase tracking-wider bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50"
                    >
                      {ordering === pe.id ? "Sending..." : "Order"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

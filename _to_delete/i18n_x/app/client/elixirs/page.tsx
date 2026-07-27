"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ElixirInstructions from "@/components/client/ElixirInstructions";
import { useLanguage } from "@/lib/LanguageContext";

const TIMING_LABELS: Record<string, { EN: string; FR: string }> = {
  MATIN: { EN: "Morning", FR: "Matin" },
  SOIR: { EN: "Evening", FR: "Soir" },
  JOURNEE: { EN: "Daytime", FR: "Journée" },
  FLEXIBLE: { EN: "Flexible", FR: "Flexible" },
};

const FREQ_LABELS: Record<string, { EN: string; FR: string }> = {
  DAILY: { EN: "Every day", FR: "Tous les jours" },
  MON_JEU: { EN: "Mon & Thu", FR: "Lun & Jeu" },
  MAR_VEN: { EN: "Tue & Fri", FR: "Mar & Ven" },
  LUNDI: { EN: "Monday", FR: "Lundi" },
  MARDI: { EN: "Tuesday", FR: "Mardi" },
  MERCREDI: { EN: "Wednesday", FR: "Mercredi" },
  JEUDI: { EN: "Thursday", FR: "Jeudi" },
  VENDREDI: { EN: "Friday", FR: "Vendredi" },
  SAMEDI: { EN: "Saturday", FR: "Samedi" },
  DIMANCHE: { EN: "Sunday", FR: "Dimanche" },
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

function phaseName(p: ClientPhase, lang: "EN" | "FR"): string {
  if (p.customName) return p.customName;
  if (p.phaseType === "DETOX") return lang === "EN" ? "Detox" : "Détox";
  const base =
    p.phaseType === "CYCLE"
      ? "Cycle"
      : lang === "EN"
        ? "Integration"
        : "Intégration";
  return `${base} ${p.phaseNumber}`;
}

// Mes élixirs — page client (élixirs assignés par phase, source unique = PhaseElixir)
export default function ClientElixirsPage() {
  const { lang } = useLanguage();
  const T = (k: { EN: string; FR: string }) => k[lang];
  const router = useRouter();
  const [phases, setPhases] = useState<ClientPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [ordering, setOrdering] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/parcours");
        if (res.ok) {
          const data = await res.json();
          // Module élixirs désactivé → redirection vers l'accueil
          if (data.requiresElixirs === false) {
            setBlocked(true);
            router.replace("/client/home");
            return;
          }
          setPhases((data.clientPhases ?? []) as ClientPhase[]);
        }
      } catch {
        // Erreur silencieuse
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // Demande de réassort — message automatique à Joffrey
  async function handleOrder(elixirName: string, id: string) {
    setOrdering(id);
    setOrderSuccess(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: T({
            EN: `Hi Joffrey, I would like to reorder the elixir "${elixirName}". Thank you!`,
            FR: `Bonjour Joffrey, je souhaite recommander l'élixir "${elixirName}". Merci !`,
          }),
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

  if (loading || blocked) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm font-ui text-brun-mid/60">
          {blocked
            ? T({ EN: "Module not active.", FR: "Module non actif." })
            : T({ EN: "Loading your elixirs...", FR: "Chargement de vos élixirs..." })}
        </p>
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
        <h1 className="font-display text-2xl sm:text-3xl text-brun-chaud">
          {T({ EN: "My elixirs", FR: "Mes élixirs" })}
        </h1>
        <p className="text-brun-mid font-ui text-sm mt-1">
          {totalElixirs > 0
            ? T({ EN: "All your assigned elixirs, by phase", FR: "Tous vos élixirs assignés, par phase" })
            : T({ EN: "Your assigned elixirs", FR: "Vos élixirs assignés" })}
        </p>
      </div>

      {totalElixirs === 0 ? (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-8 text-center">
          <p className="text-sm font-ui text-brun-mid/60">
            {T({ EN: "No elixirs assigned yet", FR: "Aucun élixir assigné pour le moment" })}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {phasesWithElixirs.map((phase) => (
            <div key={phase.id} className="space-y-4">
              {/* En-tête de phase */}
              <div className="flex items-center gap-2">
                <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider">
                  {phaseName(phase, lang)}
                </h2>
                {isActive(phase) && (
                  <span className="text-[10px] font-ui px-2 py-0.5 rounded-full bg-foret/10 text-foret uppercase tracking-wider">
                    {T({ EN: "In progress", FR: "En cours" })}
                  </span>
                )}
              </div>

              {phase.phaseElixirs.map((pe) => (
                <div key={pe.id} className="bg-cire-chaude border border-or-pale rounded-sm p-5">
                  {/* En-tête : nom + timing */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-display text-lg text-brun-chaud">{pe.elixirLibrary.name}</h3>
                    <span className="text-xs font-ui px-2 py-0.5 rounded-sharp shrink-0 bg-or-sacre/10 text-or-sacre">
                      {TIMING_LABELS[pe.timing] ? T(TIMING_LABELS[pe.timing]) : pe.timing}
                    </span>
                  </div>

                  {/* Détails en grille */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    <div>
                      <p className="text-xs font-caps text-brun-mid uppercase tracking-wider">{T({ EN: "Dosage", FR: "Dosage" })}</p>
                      <p className="text-sm font-ui text-brun-chaud mt-0.5">
                        {pe.dose || pe.elixirLibrary.dosage}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-caps text-brun-mid uppercase tracking-wider">{T({ EN: "Frequency", FR: "Fréquence" })}</p>
                      <p className="text-sm font-ui text-brun-chaud mt-0.5">
                        {FREQ_LABELS[pe.frequency] ? T(FREQ_LABELS[pe.frequency]) : pe.frequency}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-caps text-brun-mid uppercase tracking-wider">{T({ EN: "When", FR: "Quand" })}</p>
                      <p className="text-sm font-ui text-brun-chaud mt-0.5">
                        {TIMING_LABELS[pe.timing] ? T(TIMING_LABELS[pe.timing]) : pe.timing}
                      </p>
                    </div>
                  </div>

                  {/* Notes */}
                  {pe.notes && (
                    <p className="text-xs font-ui text-brun-mid/60 italic mb-3">{pe.notes}</p>
                  )}

                  {/* Instruction de prise (accordion replié) */}
                  <ElixirInstructions description={pe.elixirLibrary.description} />

                  {/* Bouton Order (demande de réassort) */}
                  <div className="flex items-center justify-end gap-2">
                    {orderSuccess === pe.id && (
                      <span className="text-xs font-ui text-foret">{T({ EN: "Message sent!", FR: "Message envoyé !" })}</span>
                    )}
                    <button
                      onClick={() => handleOrder(pe.elixirLibrary.name, pe.id)}
                      disabled={ordering === pe.id}
                      className="px-3 py-1.5 text-xs font-caps uppercase tracking-wider bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50"
                    >
                      {ordering === pe.id
                        ? T({ EN: "Sending...", FR: "Envoi..." })
                        : T({ EN: "Order", FR: "Commander" })}
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

"use client";

import { useEffect, useState } from "react";

interface Elixir {
  id: string;
  dose: string | null;
  timing: string;
  elixirLibrary: { name: string };
}
interface Phase {
  id: string;
  phaseType: string;
  phaseNumber: number;
  customName: string | null;
  startDate: string;
  endDate: string;
  phaseElixirs: Elixir[];
}
interface Parcours {
  id: string;
  seq: number;
  parcoursType: string;
  status: string; // ACTIVE | COMPLETED
  detoxStartDate: string | null;
  programTotalDays: number | null;
  completedAt: string | null;
  phases: Phase[];
}

function fmt(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

// Historique des parcours — lecture seule (refonte Parcours — Étape 2C).
// Liste tous les parcours du client ; chaque terminé est dépliable pour revoir
// ses phases et les élixirs qui y étaient assignés. Rien n'est modifiable ici.
export default function ParcoursHistory({ clientId }: { clientId: string }) {
  const [list, setList] = useState<Parcours[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/clients/${clientId}/parcours`)
      .then((r) => r.json())
      .then((d) => {
        if (alive) setList(d.parcours ?? []);
      })
      .catch(() => alive && setList([]));
    return () => {
      alive = false;
    };
  }, [clientId]);

  // On n'affiche la section que s'il existe au moins un parcours TERMINÉ (historique réel).
  const past = (list ?? []).filter((p) => p.status === "COMPLETED");
  if (list === null || past.length === 0) return null;

  return (
    <div className="mb-6 border border-or-pale rounded-sm p-5">
      <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-3">
        Parcours passés ({past.length})
      </h2>
      <div className="space-y-2">
        {past.map((p) => {
          const open = openId === p.id;
          return (
            <div key={p.id} className="border border-or-pale/50 rounded-sharp">
              <button
                onClick={() => setOpenId(open ? null : p.id)}
                className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-cire-chaude/50 transition-colors"
              >
                <span className="text-sm font-ui text-brun-chaud">
                  #{p.seq} · {p.parcoursType}
                  <span className="text-brun-mid/50">
                    {" "}· {fmt(p.detoxStartDate)} → {fmt(p.completedAt)}
                  </span>
                </span>
                <span className="text-xs font-ui text-brun-mid/50 shrink-0">
                  {p.phases.length} phase(s) · {open ? "▲" : "▼"}
                </span>
              </button>

              {open && (
                <div className="px-3 pb-3 space-y-2 border-t border-or-pale/40 pt-2">
                  {p.phases.length === 0 && (
                    <p className="text-xs font-ui text-brun-mid/50">Aucune phase enregistrée.</p>
                  )}
                  {p.phases.map((ph) => (
                    <div key={ph.id} className="text-xs font-ui">
                      <p className="text-brun-chaud">
                        {ph.customName || `${ph.phaseType} ${ph.phaseNumber}`}
                        <span className="text-brun-mid/50">
                          {" "}· {fmt(ph.startDate)} → {fmt(ph.endDate)}
                        </span>
                      </p>
                      {ph.phaseElixirs.length > 0 && (
                        <ul className="mt-1 ml-3 list-disc text-brun-mid/70 space-y-0.5">
                          {ph.phaseElixirs.map((e) => (
                            <li key={e.id}>
                              {e.elixirLibrary.name}
                              {e.dose ? ` — ${e.dose}` : ""}
                              {e.timing && e.timing !== "FLEXIBLE" ? ` (${e.timing})` : ""}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import AddProgramOrModuleModal from "./AddProgramOrModuleModal";

interface ClientProgramRow {
  id: string;
  status: string;
  startDate: string;
  isMain: boolean;
  isCustom: boolean;
  mode: "SIMULTANE" | "SEQUENTIEL";
  startAfterProgramId: string | null;
  customNotes: string | null;
  skippedModules: string[] | null;
  program: { id: string; name: string; nameFr: string };
  startAfterProgram: { id: string; program: { nameFr: string } } | null;
}

interface ClientModuleRow {
  id: string;
  unlockedAt: string;
  unlockedBy: string;
  startedAt: string | null;
  completedAt: string | null;
  module: { id: string; name: string; nameFr: string; duration: number; accessMode: string };
}

interface Props {
  clientId: string;
  clientName: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function StackedProgramsSection({ clientId, clientName }: Props) {
  const [clientPrograms, setClientPrograms] = useState<ClientProgramRow[]>([]);
  const [clientModules, setClientModules] = useState<ClientModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/programs`);
      if (res.ok) {
        const data = await res.json();
        setClientPrograms(data.clientPrograms || []);
        setClientModules(data.clientModules || []);
      }
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  const complementary = clientPrograms.filter((cp) => !cp.isMain);
  const mainProgram = clientPrograms.find((cp) => cp.isMain);

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider">
          Empilage · Programmes & modules
        </h2>
        <button
          onClick={() => setModalOpen(true)}
          className="text-xs font-ui bg-or-sacre/10 text-or-sacre hover:bg-or-sacre/20 px-3 py-1.5 rounded transition-colors"
        >
          ➕ Ajouter un programme ou module
        </button>
      </div>

      {loading ? (
        <p className="text-xs font-ui text-brun-mid/50">Chargement...</p>
      ) : (
        <div className="space-y-4">
          {/* Parcours complémentaires (hors main) */}
          <div>
            <h3 className="font-caps text-[11px] uppercase tracking-wider text-brun-mid/70 mb-2">
              Parcours complémentaires
            </h3>
            {complementary.length === 0 ? (
              <p className="text-xs font-ui text-brun-mid/40 italic">
                {mainProgram
                  ? "Aucun parcours complémentaire. Parcours principal visible dans la section ci-dessus."
                  : "Aucun parcours assigné."}
              </p>
            ) : (
              <ul className="space-y-2">
                {complementary.map((cp) => (
                  <li key={cp.id} className="flex items-center justify-between gap-3 bg-creme-sacree border border-or-pale/40 rounded p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-ui text-brun-chaud truncate">
                        {cp.program.nameFr}
                        {cp.isCustom && <span className="ml-2 text-[10px] text-or-sacre">sur mesure</span>}
                      </p>
                      {cp.customNotes && (
                        <p className="text-[11px] font-ui text-brun-mid/60 italic truncate">{cp.customNotes}</p>
                      )}
                      <p className="text-[11px] font-ui text-brun-mid/60 mt-0.5">
                        {cp.mode === "SEQUENTIEL" && cp.startAfterProgram ? (
                          <>Démarre après <strong>{cp.startAfterProgram.program.nameFr}</strong></>
                        ) : (
                          <>Début : {formatDate(cp.startDate)}</>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0 text-[10px] font-ui">
                      <span className={`px-2 py-0.5 rounded ${
                        cp.mode === "SIMULTANE" ? "bg-foret/10 text-foret" : "bg-amber-100 text-amber-700"
                      }`}>
                        {cp.mode === "SIMULTANE" ? "simultané" : "séquentiel"}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${
                        cp.status === "active" ? "bg-foret/10 text-foret" :
                        cp.status === "paused" ? "bg-amber-100 text-amber-600" :
                        "bg-brun-mid/10 text-brun-mid"
                      }`}>
                        {cp.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Modules débloqués */}
          <div>
            <h3 className="font-caps text-[11px] uppercase tracking-wider text-brun-mid/70 mb-2">
              Modules débloqués (isolés)
            </h3>
            {clientModules.length === 0 ? (
              <p className="text-xs font-ui text-brun-mid/40 italic">Aucun module isolé débloqué.</p>
            ) : (
              <ul className="space-y-1.5">
                {clientModules.map((cm) => (
                  <li key={cm.id} className="flex items-center justify-between gap-3 bg-creme-sacree border border-or-pale/40 rounded px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-ui text-brun-chaud truncate">
                        {cm.module.nameFr}
                        <span className="ml-2 text-[10px] text-brun-mid/50">{cm.module.duration}j</span>
                      </p>
                      <p className="text-[11px] font-ui text-brun-mid/60">
                        Débloqué le {formatDate(cm.unlockedAt)}
                        {cm.completedAt && <> · terminé le {formatDate(cm.completedAt)}</>}
                      </p>
                    </div>
                    <span className="text-[10px] font-ui px-2 py-0.5 rounded bg-or-sacre/10 text-or-sacre shrink-0">
                      {cm.module.accessMode.toLowerCase()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <AddProgramOrModuleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        clientId={clientId}
        clientName={clientName}
        existingPrograms={clientPrograms.map((cp) => ({ id: cp.id, program: { id: cp.program.id, nameFr: cp.program.nameFr } }))}
        onSaved={() => load()}
      />
    </div>
  );
}

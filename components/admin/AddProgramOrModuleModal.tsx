"use client";

import { useEffect, useState } from "react";

type Mode = "SIMULTANE" | "SEQUENTIEL";
type Kind = "program" | "module" | "custom";

interface ModuleLite {
  id: string;
  name: string;
  nameFr: string;
  duration: number;
}

interface ProgramLite {
  id: string;
  name: string;
  nameFr: string;
  modules: { order: number; module: ModuleLite }[];
}

interface ExistingProgram {
  id: string;
  program: { id: string; nameFr: string };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  existingPrograms: ExistingProgram[];
  onSaved: () => void;
}

function todayISO(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

export default function AddProgramOrModuleModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  existingPrograms,
  onSaved,
}: Props) {
  const [kind, setKind] = useState<Kind>("program");
  const [programs, setPrograms] = useState<ProgramLite[]>([]);
  const [modules, setModules] = useState<ModuleLite[]>([]);

  // Champs communs Programme / Custom
  const [programId, setProgramId] = useState("");
  const [mode, setMode] = useState<Mode>("SIMULTANE");
  const [startAfterProgramId, setStartAfterProgramId] = useState("");
  const [startDate, setStartDate] = useState(todayISO());

  // Programme — skipped modules (optionnel)
  const [skippedProgram, setSkippedProgram] = useState<string[]>([]);

  // Custom — modules cochés (kept), nom libre
  const [customName, setCustomName] = useState("");
  const [keptCustom, setKeptCustom] = useState<string[]>([]);

  // Module isolé
  const [moduleId, setModuleId] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    fetch("/api/admin/programs")
      .then((r) => r.json())
      .then((d) => setPrograms(d.programs || []))
      .catch(() => {});
    fetch("/api/admin/modules")
      .then((r) => r.json())
      .then((d) => setModules(d.modules || []))
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    // Reset keptCustom quand programId custom change : par défaut on coche tout.
    if (kind !== "custom" || !programId) return;
    const prog = programs.find((p) => p.id === programId);
    if (prog) setKeptCustom(prog.modules.map((pm) => pm.module.id));
  }, [kind, programId, programs]);

  if (!isOpen) return null;

  const selectedProgram = programs.find((p) => p.id === programId);

  async function handleSave() {
    setSaving(true);
    setError("");

    try {
      let payload: Record<string, unknown> = { type: kind };

      if (kind === "module") {
        if (!moduleId) {
          setError("Choisis un module à débloquer");
          setSaving(false);
          return;
        }
        payload.moduleId = moduleId;
      } else {
        // program | custom
        if (!programId) {
          setError("Choisis un programme de base");
          setSaving(false);
          return;
        }
        payload.programId = programId;
        payload.mode = mode;
        if (mode === "SIMULTANE") payload.startDate = startDate;
        if (mode === "SEQUENTIEL") {
          if (!startAfterProgramId) {
            setError("Choisis le programme à la suite duquel démarrer");
            setSaving(false);
            return;
          }
          payload.startAfterProgramId = startAfterProgramId;
        }
        if (kind === "program") {
          if (skippedProgram.length > 0) payload.skippedModules = skippedProgram;
        } else {
          // custom : skippedModules = modules NON gardés (cases décochées)
          const allIds = selectedProgram?.modules.map((pm) => pm.module.id) ?? [];
          const skipped = allIds.filter((id) => !keptCustom.includes(id));
          payload.skippedModules = skipped;
          payload.customName = customName || clientName;
        }
      }

      const res = await fetch(`/api/admin/clients/${clientId}/programs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Erreur lors de l'ajout");
        return;
      }
      onSaved();
      onClose();
      // Reset local state
      setKind("program");
      setProgramId("");
      setModuleId("");
      setSkippedProgram([]);
      setKeptCustom([]);
      setCustomName("");
      setStartAfterProgramId("");
    } catch (e) {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-cire-chaude border border-or-pale rounded-[10px] p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg text-brun-chaud mb-1">Ajouter un programme ou module</h2>
        <p className="font-ui text-sm text-brun-mid mb-5">{clientName}</p>

        {error && (
          <p className="text-sm text-red-600 font-ui bg-red-50 px-3 py-2 rounded-sharp mb-4">{error}</p>
        )}

        {/* Choix du type */}
        <fieldset className="mb-5">
          <legend className="text-xs font-caps text-brun-mid uppercase tracking-wider mb-2">Type</legend>
          <div className="flex flex-col gap-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="kind"
                value="program"
                checked={kind === "program"}
                onChange={() => setKind("program")}
                className="mt-0.5 accent-or-sacre"
              />
              <span className="text-sm font-ui text-brun-chaud">
                <strong>Programme</strong>
                <span className="block text-xs text-brun-mid/70">Empiler un programme complet (simultané ou séquentiel)</span>
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="kind"
                value="module"
                checked={kind === "module"}
                onChange={() => setKind("module")}
                className="mt-0.5 accent-or-sacre"
              />
              <span className="text-sm font-ui text-brun-chaud">
                <strong>Module isolé</strong>
                <span className="block text-xs text-brun-mid/70">Débloquer un module seul (apparaîtra dans Mes Modules côté client — V3)</span>
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="kind"
                value="custom"
                checked={kind === "custom"}
                onChange={() => setKind("custom")}
                className="mt-0.5 accent-or-sacre"
              />
              <span className="text-sm font-ui text-brun-chaud">
                <strong>Parcours sur mesure</strong>
                <span className="block text-xs text-brun-mid/70">Choisir quels modules d&apos;un programme existant garder (cherry-pick)</span>
              </span>
            </label>
          </div>
        </fieldset>

        {/* Option Programme */}
        {kind === "program" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Programme</label>
              <select
                value={programId}
                onChange={(e) => { setProgramId(e.target.value); setSkippedProgram([]); }}
                className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp"
              >
                <option value="">Sélectionner...</option>
                {programs.map((p) => {
                  const days = p.modules.reduce((acc, pm) => acc + pm.module.duration, 0);
                  return <option key={p.id} value={p.id}>{p.nameFr} ({days}j)</option>;
                })}
              </select>
            </div>

            <ModeSelector
              mode={mode}
              setMode={setMode}
              startDate={startDate}
              setStartDate={setStartDate}
              startAfterProgramId={startAfterProgramId}
              setStartAfterProgramId={setStartAfterProgramId}
              existingPrograms={existingPrograms}
            />

            {selectedProgram && selectedProgram.modules.length > 1 && (
              <div>
                <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-2">
                  Modules à sauter (optionnel)
                </label>
                <div className="space-y-1.5">
                  {selectedProgram.modules.map((pm) => (
                    <label key={pm.module.id} className="flex items-center gap-2 text-sm font-ui text-brun-chaud cursor-pointer">
                      <input
                        type="checkbox"
                        checked={skippedProgram.includes(pm.module.id)}
                        onChange={() => toggle(skippedProgram, setSkippedProgram, pm.module.id)}
                        className="accent-or-sacre"
                      />
                      Sauter {pm.module.nameFr} ({pm.module.duration}j)
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Option Module isolé */}
        {kind === "module" && (
          <div>
            <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Module à débloquer</label>
            <select
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp"
            >
              <option value="">Sélectionner...</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>{m.nameFr} ({m.duration}j)</option>
              ))}
            </select>
          </div>
        )}

        {/* Option Custom */}
        {kind === "custom" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Nom du parcours sur mesure</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={`Parcours personnalisé ${clientName}`}
                className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp"
              />
            </div>
            <div>
              <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Programme de base</label>
              <select
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp"
              >
                <option value="">Sélectionner...</option>
                {programs.map((p) => {
                  const days = p.modules.reduce((acc, pm) => acc + pm.module.duration, 0);
                  return <option key={p.id} value={p.id}>{p.nameFr} ({days}j)</option>;
                })}
              </select>
            </div>

            {selectedProgram && (
              <div>
                <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-2">
                  Modules à garder (cherry-pick)
                </label>
                <div className="space-y-1.5">
                  {selectedProgram.modules.map((pm) => (
                    <label key={pm.module.id} className="flex items-center gap-2 text-sm font-ui text-brun-chaud cursor-pointer">
                      <input
                        type="checkbox"
                        checked={keptCustom.includes(pm.module.id)}
                        onChange={() => toggle(keptCustom, setKeptCustom, pm.module.id)}
                        className="accent-or-sacre"
                      />
                      {pm.module.nameFr} ({pm.module.duration}j)
                    </label>
                  ))}
                </div>
              </div>
            )}

            <ModeSelector
              mode={mode}
              setMode={setMode}
              startDate={startDate}
              setStartDate={setStartDate}
              startAfterProgramId={startAfterProgramId}
              setStartAfterProgramId={setStartAfterProgramId}
              existingPrograms={existingPrograms}
            />
          </div>
        )}

        <div className="flex gap-3 justify-end pt-5 mt-5 border-t border-or-pale/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-caps text-brun-mid border border-or-pale rounded-sharp hover:bg-creme-sacree"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-xs font-caps bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif disabled:opacity-40"
          >
            {saving ? "..." : "Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModeSelector({
  mode,
  setMode,
  startDate,
  setStartDate,
  startAfterProgramId,
  setStartAfterProgramId,
  existingPrograms,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
  startDate: string;
  setStartDate: (d: string) => void;
  startAfterProgramId: string;
  setStartAfterProgramId: (id: string) => void;
  existingPrograms: ExistingProgram[];
}) {
  return (
    <fieldset>
      <legend className="text-xs font-caps text-brun-mid uppercase tracking-wider mb-2">Mode</legend>
      <div className="flex flex-col gap-2">
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="radio"
            name="mode"
            value="SIMULTANE"
            checked={mode === "SIMULTANE"}
            onChange={() => setMode("SIMULTANE")}
            className="mt-0.5 accent-or-sacre"
          />
          <span className="text-sm font-ui text-brun-chaud">
            <strong>Simultané</strong>
            <span className="block text-xs text-brun-mid/70">Tourne en parallèle des autres programmes</span>
          </span>
        </label>
        {mode === "SIMULTANE" && (
          <div className="ml-6">
            <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Date de début</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp"
            />
          </div>
        )}

        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="radio"
            name="mode"
            value="SEQUENTIEL"
            checked={mode === "SEQUENTIEL"}
            onChange={() => setMode("SEQUENTIEL")}
            className="mt-0.5 accent-or-sacre"
          />
          <span className="text-sm font-ui text-brun-chaud">
            <strong>Séquentiel</strong>
            <span className="block text-xs text-brun-mid/70">Démarre après la fin d&apos;un autre programme</span>
          </span>
        </label>
        {mode === "SEQUENTIEL" && (
          <div className="ml-6">
            <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Démarrer après</label>
            <select
              value={startAfterProgramId}
              onChange={(e) => setStartAfterProgramId(e.target.value)}
              className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp"
            >
              <option value="">Sélectionner un programme existant...</option>
              {existingPrograms.map((ep) => (
                <option key={ep.id} value={ep.id}>{ep.program.nameFr}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </fieldset>
  );
}

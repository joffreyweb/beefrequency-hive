"use client";

import { useState, useEffect } from "react";

interface ProgramModule {
  order: number;
  module: { id: string; name: string; nameFr: string; duration: number };
}

interface Program {
  id: string;
  nameFr: string;
  modules: ProgramModule[];
}

interface AssignProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
}

const MODULE_COLORS: Record<string, string> = {
  detox: "bg-red-500", cycle: "bg-amber-500", break: "bg-emerald-600", protocol30: "bg-amber-700",
};

export default function AssignProgramModal({ isOpen, onClose, clientId, clientName }: AssignProgramModalProps) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); // Next Monday
    return d.toISOString().split("T")[0];
  });
  const [skipped, setSkipped] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetch("/api/admin/programs").then((r) => r.json()).then((d) => setPrograms(d.programs || []));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selected = programs.find((p) => p.id === selectedId);
  const activeModules = selected?.modules.filter((pm) => !skipped.includes(pm.module.id)) || [];
  const totalDays = activeModules.reduce((acc, pm) => acc + pm.module.duration, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + totalDays - 1);

  function toggleSkip(moduleId: string) {
    setSkipped((prev) => prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]);
  }

  async function handleAssign() {
    if (!selectedId) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/client-programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, programId: selectedId, startDate, skippedModules: skipped.length ? skipped : null }),
      });
      if (res.ok) onClose();
      else setError((await res.json()).error || "Erreur");
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="font-display text-lg text-brun-chaud mb-1">Assigner un programme</h2>
        <p className="font-ui text-sm text-brun-mid mb-5">{clientName}</p>

        {error && <p className="text-sm text-red-600 font-ui bg-red-50 px-3 py-2 rounded-sharp mb-4">{error}</p>}

        {/* Program select */}
        <div className="mb-4">
          <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Programme</label>
          <select
            value={selectedId}
            onChange={(e) => { setSelectedId(e.target.value); setSkipped([]); }}
            className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp"
          >
            <option value="">Sélectionner...</option>
            {programs.map((p) => {
              const days = p.modules.reduce((acc, pm) => acc + pm.module.duration, 0);
              return <option key={p.id} value={p.id}>{p.nameFr} ({days}j)</option>;
            })}
          </select>
        </div>

        {/* Start date */}
        <div className="mb-4">
          <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Date de début</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp" />
        </div>

        {/* Skip modules */}
        {selected && selected.modules.length > 1 && (
          <div className="mb-4">
            <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-2">Sauter des modules (optionnel)</label>
            <div className="space-y-1.5">
              {selected.modules.map((pm) => (
                <label key={pm.module.id + "-" + pm.order} className="flex items-center gap-2 text-sm font-ui text-brun-chaud cursor-pointer">
                  <input type="checkbox" checked={skipped.includes(pm.module.id)} onChange={() => toggleSkip(pm.module.id)} className="accent-or-sacre" />
                  {pm.module.nameFr} ({pm.module.duration}j)
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Timeline preview */}
        {selected && activeModules.length > 0 && (
          <div className="mb-5 p-3 bg-creme-sacree rounded-sharp">
            <div className="flex rounded-full overflow-hidden h-3 mb-2">
              {activeModules.map((pm, i) => (
                <div key={i} className={MODULE_COLORS[pm.module.name] || "bg-gray-300"} style={{ flex: pm.module.duration }} title={`${pm.module.nameFr} (${pm.module.duration}j)`} />
              ))}
            </div>
            <p className="text-xs font-ui text-brun-mid">
              {totalDays} jours · Fin estimée : {endDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2 border-t border-or-pale/30">
          <button onClick={onClose} className="px-4 py-2 text-xs font-caps text-brun-mid border border-or-pale rounded-sharp hover:bg-creme-sacree">Annuler</button>
          <button onClick={handleAssign} disabled={saving || !selectedId} className="px-4 py-2 text-xs font-caps bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif disabled:opacity-40">
            {saving ? "..." : "Assigner"}
          </button>
        </div>
      </div>
    </div>
  );
}

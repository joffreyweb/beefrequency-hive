"use client";

import { useState, useEffect, useCallback } from "react";

interface Module {
  id: string;
  name: string;
  nameFr: string;
  duration: number;
}

interface CustomProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
}

// Un module peut apparaître plusieurs fois (ex : detox → intégration → detox).
// On identifie chaque bloc par une clé locale stable, pas par le moduleId.
interface Block {
  key: string;
  moduleId: string;
}

const MODULE_COLORS: Record<string, string> = {
  detox: "bg-red-500",
  cycle: "bg-amber-500",
  break: "bg-emerald-600",
  protocol30: "bg-amber-700",
};

function fmtDate(d: Date): string {
  return d.toLocaleDateString("fr-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Brussels",
  });
}

export default function CustomProgramModal({ isOpen, onClose, clientId, clientName }: CustomProgramModalProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); // prochain lundi
    return d.toISOString().split("T")[0];
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [error, setError] = useState("");
  const [keyCounter, setKeyCounter] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [modRes, cpRes] = await Promise.all([
        fetch("/api/admin/modules").then((r) => r.json()),
        fetch(`/api/admin/client-programs/custom?clientId=${clientId}`).then((r) => r.json()),
      ]);
      setModules(modRes.modules || []);
      const cp = cpRes.clientProgram;
      if (cp && cp.program?.modules?.length) {
        setHasExisting(true);
        let c = 0;
        setBlocks(
          cp.program.modules.map((pm: { module: { id: string } }) => ({
            key: `existing-${c++}`,
            moduleId: pm.module.id,
          })),
        );
        setKeyCounter(c);
        if (cp.startDate) setStartDate(new Date(cp.startDate).toISOString().split("T")[0]);
      } else {
        setHasExisting(false);
        setBlocks([]);
      }
    } catch {
      setError("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  if (!isOpen) return null;

  const moduleById = (id: string) => modules.find((m) => m.id === id);
  const totalDays = blocks.reduce((acc, b) => acc + (moduleById(b.moduleId)?.duration ?? 0), 0);
  const end = new Date(startDate);
  end.setDate(end.getDate() + Math.max(totalDays - 1, 0));

  function addModule(moduleId: string) {
    if (!moduleId) return;
    setBlocks((prev) => [...prev, { key: `new-${keyCounter}`, moduleId }]);
    setKeyCounter((k) => k + 1);
  }
  function removeBlock(key: string) {
    setBlocks((prev) => prev.filter((b) => b.key !== key));
  }
  function move(index: number, dir: -1 | 1) {
    setBlocks((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave() {
    if (blocks.length === 0) {
      setError("Ajoute au moins un module");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/client-programs/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, startDate, moduleIds: blocks.map((b) => b.moduleId) }),
      });
      if (res.ok) onClose();
      else setError((await res.json()).error || "Erreur");
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/client-programs/custom?clientId=${clientId}`, { method: "DELETE" });
      if (res.ok) onClose();
      else setError((await res.json()).error || "Erreur");
    } catch {
      setError("Erreur réseau");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="font-display text-lg text-brun-chaud mb-1">Composer un parcours sur-mesure</h2>
        <p className="font-ui text-sm text-brun-mid mb-5">{clientName}</p>

        {error && <p className="text-sm text-red-600 font-ui bg-red-50 px-3 py-2 rounded-sharp mb-4">{error}</p>}

        {loading ? (
          <p className="text-sm font-ui text-brun-mid/50 py-6 text-center">Chargement…</p>
        ) : (
          <>
            {/* Date de début */}
            <div className="mb-4">
              <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Date de début</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp"
              />
            </div>

            {/* Ajouter un module */}
            <div className="mb-4">
              <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Ajouter un module</label>
              <select
                value=""
                onChange={(e) => addModule(e.target.value)}
                className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp"
              >
                <option value="">+ Choisir un module…</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nameFr} ({m.duration}j)
                  </option>
                ))}
              </select>
              <p className="text-[11px] font-ui text-brun-mid/50 mt-1">
                Un module peut être ajouté plusieurs fois. L&apos;ordre définit la timeline.
              </p>
            </div>

            {/* Séquence composée */}
            <div className="mb-4">
              <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-2">Séquence du parcours</label>
              {blocks.length === 0 ? (
                <p className="text-sm font-ui text-brun-mid/50 py-3 text-center border border-dashed border-or-pale/60 rounded-sharp">
                  Aucun module. Ajoute-en ci-dessus.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {blocks.map((b, i) => {
                    const mod = moduleById(b.moduleId);
                    return (
                      <div key={b.key} className="flex items-center gap-2 bg-creme-sacree border border-or-pale/50 rounded-sharp px-3 py-2">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${MODULE_COLORS[mod?.name ?? ""] || "bg-gray-300"}`} />
                        <span className="flex-1 text-sm font-ui text-brun-chaud">
                          {i + 1}. {mod?.nameFr ?? "Module inconnu"}{" "}
                          <span className="text-brun-mid/50">({mod?.duration ?? 0}j)</span>
                        </span>
                        <button onClick={() => move(i, -1)} disabled={i === 0} className="text-brun-mid hover:text-or-sacre disabled:opacity-25 px-1" title="Monter">↑</button>
                        <button onClick={() => move(i, 1)} disabled={i === blocks.length - 1} className="text-brun-mid hover:text-or-sacre disabled:opacity-25 px-1" title="Descendre">↓</button>
                        <button onClick={() => removeBlock(b.key)} className="text-red-400 hover:text-red-600 px-1" title="Retirer">✕</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Aperçu timeline */}
            {blocks.length > 0 && (
              <div className="mb-5 p-3 bg-creme-sacree rounded-sharp">
                <div className="flex rounded-full overflow-hidden h-3 mb-2">
                  {blocks.map((b) => {
                    const mod = moduleById(b.moduleId);
                    return (
                      <div
                        key={b.key}
                        className={MODULE_COLORS[mod?.name ?? ""] || "bg-gray-300"}
                        style={{ flex: mod?.duration ?? 1 }}
                        title={`${mod?.nameFr ?? ""} (${mod?.duration ?? 0}j)`}
                      />
                    );
                  })}
                </div>
                <p className="text-xs font-ui text-brun-mid">
                  {totalDays} jours · Du {fmtDate(new Date(startDate))} au {fmtDate(end)}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-between items-center pt-2 border-t border-or-pale/30">
              <div>
                {hasExisting && (
                  <button
                    onClick={handleDelete}
                    disabled={deleting || saving}
                    className="px-3 py-2 text-xs font-caps text-red-500 border border-red-200 rounded-sharp hover:bg-red-50 disabled:opacity-40"
                  >
                    {deleting ? "…" : "Retirer le parcours"}
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="px-4 py-2 text-xs font-caps text-brun-mid border border-or-pale rounded-sharp hover:bg-creme-sacree">
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || deleting || blocks.length === 0}
                  className="px-4 py-2 text-xs font-caps bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif disabled:opacity-40"
                >
                  {saving ? "…" : "Enregistrer"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

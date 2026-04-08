"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface ModuleOption {
  id: string;
  name: string;
  nameFr: string;
  duration: number;
}

interface ProgramModule {
  id: string;
  order: number;
  module: ModuleOption;
}

interface ProgramData {
  id: string;
  name: string;
  nameFr: string;
  nameEn: string;
  description: string | null;
  modules: ProgramModule[];
}

const MODULE_COLORS: Record<string, string> = {
  detox: "bg-red-400",
  cycle: "bg-or-sacre",
  break: "bg-foret/60",
  protocol30: "bg-ambre-vif",
};

export default function ProgramEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [program, setProgram] = useState<ProgramData | null>(null);
  const [allModules, setAllModules] = useState<ModuleOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [addModuleId, setAddModuleId] = useState("");

  useEffect(() => {
    fetch(`/api/admin/programs/${id}`).then((r) => r.json()).then((d) => setProgram(d.program));
    fetch("/api/admin/modules").then((r) => r.json()).then((d) => setAllModules(d.modules || []));
  }, [id]);

  if (!program) return <div className="text-center py-12 text-brun-mid font-ui">Chargement...</div>;

  function update(field: string, value: unknown) {
    setProgram((prev) => prev ? { ...prev, [field]: value } : prev);
    setSaved(false);
  }

  function addModule() {
    if (!addModuleId) return;
    const mod = allModules.find((m) => m.id === addModuleId);
    if (!mod || !program) return;
    const newPm: ProgramModule = {
      id: `temp-${Date.now()}`,
      order: program.modules.length + 1,
      module: mod,
    };
    setProgram({ ...program, modules: [...program.modules, newPm] });
    setAddModuleId("");
    setSaved(false);
  }

  function removeModule(index: number) {
    if (!program) return;
    const updated = program.modules.filter((_, i) => i !== index).map((pm, i) => ({ ...pm, order: i + 1 }));
    setProgram({ ...program, modules: updated });
    setSaved(false);
  }

  function moveModule(index: number, direction: -1 | 1) {
    if (!program) return;
    const mods = [...program.modules];
    const target = index + direction;
    if (target < 0 || target >= mods.length) return;
    [mods[index], mods[target]] = [mods[target], mods[index]];
    setProgram({ ...program, modules: mods.map((pm, i) => ({ ...pm, order: i + 1 })) });
    setSaved(false);
  }

  async function handleSave() {
    if (!program) return;
    setSaving(true);
    const res = await fetch(`/api/admin/programs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nameFr: program.nameFr,
        nameEn: program.nameEn,
        description: program.description,
        moduleSequence: program.modules.map((pm) => pm.module.id),
      }),
    });
    if (res.ok) setSaved(true);
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("Supprimer ce programme ?")) return;
    await fetch(`/api/admin/programs/${id}`, { method: "DELETE" });
    router.push("/admin/atelier/programs");
  }

  const totalDays = program.modules.reduce((acc, pm) => acc + pm.module.duration, 0);

  return (
    <div>
      <Link href="/admin/atelier/programs" className="text-[13px] font-ui text-brun-mid/50 hover:text-or-sacre transition-colors mb-4 inline-block">
        &larr; Programmes
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-brun-chaud">{program.nameFr}</h1>
        <div className="flex gap-2">
          <button onClick={handleDelete} className="px-4 py-2 text-xs font-caps text-red-500 border border-red-200 rounded-sharp hover:bg-red-50">Supprimer</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-xs font-caps bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif disabled:opacity-50">
            {saving ? "..." : saved ? "Sauvegardé" : "Sauvegarder"}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5 space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Nom FR</label>
            <input value={program.nameFr} onChange={(e) => update("nameFr", e.target.value)} className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp" />
          </div>
          <div>
            <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Nom EN</label>
            <input value={program.nameEn} onChange={(e) => update("nameEn", e.target.value)} className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Description</label>
          <input value={program.description || ""} onChange={(e) => update("description", e.target.value)} className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp" />
        </div>
        <p className="text-sm font-ui text-brun-mid">Durée totale : <span className="text-or-sacre font-medium">{totalDays} jours</span> · {program.modules.length} modules</p>
      </div>

      {/* Timeline preview */}
      {program.modules.length > 0 && (
        <div className="mb-6">
          <div className="flex rounded-full overflow-hidden h-4">
            {program.modules.map((pm, i) => (
              <div
                key={i}
                className={`${MODULE_COLORS[pm.module.name] || "bg-brun-mid/20"}`}
                style={{ flex: pm.module.duration }}
                title={`${pm.module.nameFr} (${pm.module.duration}j)`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Module sequence */}
      <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-4">Séquence de modules</h2>

        <div className="space-y-2 mb-4">
          {program.modules.map((pm, i) => (
            <div key={pm.id} className="flex items-center gap-3 bg-creme-sacree border border-or-pale/50 rounded-sharp px-4 py-2.5">
              <span className="text-xs font-ui text-brun-mid/40 w-6">{i + 1}.</span>
              <div className={`w-3 h-3 rounded-full ${MODULE_COLORS[pm.module.name] || "bg-brun-mid/20"}`} />
              <span className="text-sm font-ui text-brun-chaud flex-1">{pm.module.nameFr}</span>
              <span className="text-xs font-ui text-brun-mid/40">{pm.module.duration}j</span>
              <button onClick={() => moveModule(i, -1)} disabled={i === 0} className="text-xs text-brun-mid/30 hover:text-brun-mid disabled:opacity-20">&uarr;</button>
              <button onClick={() => moveModule(i, 1)} disabled={i === program.modules.length - 1} className="text-xs text-brun-mid/30 hover:text-brun-mid disabled:opacity-20">&darr;</button>
              <button onClick={() => removeModule(i)} className="text-xs text-red-400 hover:text-red-600">&times;</button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <select
            value={addModuleId}
            onChange={(e) => setAddModuleId(e.target.value)}
            className="flex-1 px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp"
          >
            <option value="">Ajouter un module...</option>
            {allModules.map((m) => (
              <option key={m.id} value={m.id}>{m.nameFr} ({m.duration}j)</option>
            ))}
          </select>
          <button onClick={addModule} disabled={!addModuleId} className="px-4 py-2 text-xs font-caps bg-or-sacre/10 text-or-sacre rounded-sharp hover:bg-or-sacre/20 disabled:opacity-30">
            +
          </button>
        </div>
      </div>
    </div>
  );
}

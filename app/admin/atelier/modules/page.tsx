"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Module {
  id: string;
  name: string;
  nameFr: string;
  duration: number;
  isStandalone: boolean;
  description: string | null;
  _count: { days: number; programModules: number };
}

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", nameFr: "", nameEn: "", duration: 10, description: "", isStandalone: false });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/admin/modules").then((r) => r.json()).then((d) => setModules(d.modules || []));
  }, []);

  async function handleCreate() {
    setCreating(true);
    const res = await fetch("/api/admin/modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, duration: Number(form.duration) }),
    });
    if (res.ok) {
      const { module: mod } = await res.json();
      setModules((prev) => [...prev, { ...mod, _count: { days: 0, programModules: 0 } }]);
      setShowForm(false);
      setForm({ name: "", nameFr: "", nameEn: "", duration: 10, description: "", isStandalone: false });
    }
    setCreating(false);
  }

  return (
    <div>
      <Link href="/admin/dashboard" className="text-[13px] font-ui text-brun-mid/50 hover:text-or-sacre transition-colors mb-4 inline-block">
        &larr; Cockpit
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-brun-chaud">Modules</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-xs font-caps uppercase tracking-wider bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors"
        >
          + Nouveau module
        </button>
      </div>

      {showForm && (
        <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5 mb-6 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom technique (slug)" className="px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp" />
            <input value={form.nameFr} onChange={(e) => setForm({ ...form, nameFr: e.target.value })} placeholder="Nom FR" className="px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp" />
            <input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} placeholder="Nom EN" className="px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp" />
          </div>
          <div className="flex gap-3 items-center">
            <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} className="w-24 px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp" />
            <span className="text-sm font-ui text-brun-mid">jours</span>
            <label className="flex items-center gap-2 text-sm font-ui text-brun-mid cursor-pointer ml-4">
              <input type="checkbox" checked={form.isStandalone} onChange={(e) => setForm({ ...form, isStandalone: e.target.checked })} className="accent-or-sacre" />
              Vendable seul
            </label>
          </div>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-caps text-brun-mid border border-or-pale rounded-sharp hover:bg-creme-sacree">Annuler</button>
            <button onClick={handleCreate} disabled={creating || !form.name || !form.nameFr || !form.nameEn} className="px-4 py-2 text-xs font-caps bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif disabled:opacity-40">
              {creating ? "..." : "Créer"}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod) => (
          <Link
            key={mod.id}
            href={`/admin/atelier/modules/${mod.id}`}
            className="bg-cire-chaude border border-or-pale rounded-[10px] p-5 hover:border-or-sacre transition-colors group"
          >
            <h3 className="font-display text-lg text-brun-chaud group-hover:text-or-sacre transition-colors">{mod.nameFr}</h3>
            <p className="font-ui text-sm text-brun-mid mt-1">{mod.duration} jours</p>
            <div className="flex items-center gap-2 mt-2">
              {mod.isStandalone && (
                <span className="text-[10px] font-ui bg-foret/10 text-foret px-2 py-0.5 rounded-full">Vendable seul</span>
              )}
              {mod._count.programModules > 0 && (
                <span className="text-[10px] font-ui text-brun-mid/50">{mod._count.programModules} programme(s)</span>
              )}
            </div>
            {mod.description && <p className="text-xs font-ui text-brun-mid/60 mt-2">{mod.description}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}

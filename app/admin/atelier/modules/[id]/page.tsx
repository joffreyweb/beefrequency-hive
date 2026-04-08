"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface ModuleDay {
  id?: string;
  dayNumber: number;
  elixirs: unknown;
  practices: unknown;
  notification: string | null;
}

interface ModuleData {
  id: string;
  name: string;
  nameFr: string;
  nameEn: string;
  duration: number;
  description: string | null;
  isStandalone: boolean;
  days: ModuleDay[];
}

export default function ModuleEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [mod, setMod] = useState<ModuleData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/modules/${id}`).then((r) => r.json()).then((d) => setMod(d.module));
  }, [id]);

  if (!mod) return <div className="text-center py-12 text-brun-mid font-ui">Chargement...</div>;

  function update(field: string, value: unknown) {
    setMod((prev) => prev ? { ...prev, [field]: value } : prev);
    setSaved(false);
  }

  function updateDay(dayNumber: number, field: string, value: string) {
    setMod((prev) => {
      if (!prev) return prev;
      const days = [...prev.days];
      const idx = days.findIndex((d) => d.dayNumber === dayNumber);
      if (idx >= 0) {
        days[idx] = { ...days[idx], [field]: value };
      } else {
        days.push({ dayNumber, elixirs: null, practices: null, notification: null, [field]: value });
      }
      return { ...prev, days: days.sort((a, b) => a.dayNumber - b.dayNumber) };
    });
    setSaved(false);
  }

  async function handleSave() {
    if (!mod) return;
    setSaving(true);
    const res = await fetch(`/api/admin/modules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nameFr: mod.nameFr,
        nameEn: mod.nameEn,
        duration: mod.duration,
        description: mod.description,
        isStandalone: mod.isStandalone,
        days: mod.days,
      }),
    });
    if (res.ok) setSaved(true);
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("Supprimer ce module ?")) return;
    await fetch(`/api/admin/modules/${id}`, { method: "DELETE" });
    router.push("/admin/atelier/modules");
  }

  // Generate day rows for the full duration
  const dayRows = Array.from({ length: mod.duration }, (_, i) => {
    const dayNumber = i + 1;
    const existing = mod.days.find((d) => d.dayNumber === dayNumber);
    return { dayNumber, notification: existing?.notification || "" };
  });

  return (
    <div>
      <Link href="/admin/atelier/modules" className="text-[13px] font-ui text-brun-mid/50 hover:text-or-sacre transition-colors mb-4 inline-block">
        &larr; Modules
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-brun-chaud">{mod.nameFr}</h1>
        <div className="flex gap-2">
          <button onClick={handleDelete} className="px-4 py-2 text-xs font-caps text-red-500 border border-red-200 rounded-sharp hover:bg-red-50">Supprimer</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-xs font-caps bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif disabled:opacity-50">
            {saving ? "..." : saved ? "Sauvegardé" : "Sauvegarder"}
          </button>
        </div>
      </div>

      <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5 space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Nom FR</label>
            <input value={mod.nameFr} onChange={(e) => update("nameFr", e.target.value)} className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp" />
          </div>
          <div>
            <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Nom EN</label>
            <input value={mod.nameEn} onChange={(e) => update("nameEn", e.target.value)} className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp" />
          </div>
        </div>
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Durée</label>
            <div className="flex items-center gap-2">
              <input type="number" value={mod.duration} onChange={(e) => update("duration", Number(e.target.value))} className="w-20 px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp" />
              <span className="text-sm font-ui text-brun-mid">jours</span>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-ui text-brun-mid cursor-pointer pb-2">
            <input type="checkbox" checked={mod.isStandalone} onChange={(e) => update("isStandalone", e.target.checked)} className="accent-or-sacre" />
            Vendable seul
          </label>
        </div>
        <div>
          <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Description</label>
          <input value={mod.description || ""} onChange={(e) => update("description", e.target.value)} className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp" />
        </div>
      </div>

      {/* Days */}
      <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-4">Jours ({mod.duration})</h2>
        <div className="space-y-2">
          {dayRows.map((day) => (
            <div key={day.dayNumber} className="flex items-center gap-3 py-2 border-b border-or-pale/20 last:border-0">
              <span className="font-ui text-xs text-brun-mid/50 w-10 text-right">J{day.dayNumber}</span>
              <input
                value={day.notification}
                onChange={(e) => updateDay(day.dayNumber, "notification", e.target.value)}
                placeholder="Notification du jour..."
                className="flex-1 px-3 py-1.5 text-sm font-ui bg-creme-sacree border border-or-pale/50 rounded-sharp focus:border-or-sacre transition-colors"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

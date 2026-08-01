"use client";

import { useState, useEffect } from "react";

type PType = "DETOX" | "CYCLE" | "BREAK" | "CUSTOM";
interface Mod { phaseType: PType; label: string; days: number }
interface Phase {
  id: string;
  phaseType: string;
  phaseNumber: number;
  customName: string | null;
  startDate: string;
  endDate: string;
  status: string;
}

const TYPE_LABELS: Record<PType, string> = {
  DETOX: "Detox",
  CYCLE: "Cycle",
  BREAK: "Intégration",
  CUSTOM: "Phase libre",
};
const DEFAULT_DAYS: Record<PType, number> = { DETOX: 10, CYCLE: 21, BREAK: 10, CUSTOM: 14 };
const ALL_TYPES: PType[] = ["DETOX", "CYCLE", "BREAK", "CUSTOM"];

function daysBetween(a: string, b: string): number {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1);
}
function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// Composeur de timeline PERSONNALISÉE (fiche client · parcours CUSTOM).
// Poser des modules à durées libres → régénère la timeline. Le 103j n'utilise pas ce composant.
export default function CustomTimelineComposer({ clientId }: { clientId: string }) {
  const [mods, setMods] = useState<Mod[]>([]);
  const [startDate, setStartDate] = useState("");
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`/api/client-phases?clientId=${clientId}`)
      .then((r) => (r.ok ? r.json() : { phases: [] }))
      .then((d: { phases?: Phase[] }) => {
        const ph = d.phases ?? [];
        setPhases(ph);
        if (ph.length > 0) {
          setMods(
            ph.map((p) => ({
              phaseType: (ALL_TYPES.includes(p.phaseType as PType) ? (p.phaseType as PType) : "CUSTOM"),
              label: p.customName || TYPE_LABELS[(p.phaseType as PType)] || "Phase",
              days: daysBetween(p.startDate, p.endDate),
            })),
          );
          setStartDate(new Date(ph[0].startDate).toISOString().split("T")[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clientId]);

  const total = mods.reduce((a, m) => a + (Number(m.days) || 0), 0);

  function addMod(t: PType) {
    setMods((m) => [...m, { phaseType: t, label: TYPE_LABELS[t], days: DEFAULT_DAYS[t] }]);
  }
  function updateMod(i: number, patch: Partial<Mod>) {
    setMods((m) => m.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }
  function removeMod(i: number) {
    setMods((m) => m.filter((_, j) => j !== i));
  }
  function move(i: number, dir: -1 | 1) {
    setMods((m) => {
      const n = [...m];
      const j = i + dir;
      if (j < 0 || j >= n.length) return n;
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  }

  async function regenerate() {
    if (mods.length === 0) {
      setMsg("Ajoute au moins un module.");
      return;
    }
    if (!confirm("Régénérer la timeline ? Les phases actuelles (et leurs élixirs/check-ins) seront remplacées.")) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`/api/client-phases/custom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, startDate: startDate || undefined, modules: mods }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Erreur lors de la régénération");
      }
      const d = await res.json();
      setPhases(d.phases ?? []);
      setMsg(`Timeline régénérée · ${d.totalDays} jours ✓`);
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Échec de la régénération");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm font-ui text-brun-mid/60 py-4">Chargement de la timeline…</p>;

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-caps text-sm text-brun-mid uppercase tracking-wider">Composer la timeline (personnalisée)</h3>
        <span className="text-xs font-ui text-or-sacre font-medium">{total} jours</span>
      </div>

      <div>
        <label className="block text-xs font-caps uppercase tracking-wider text-brun-mid mb-1">Date de départ</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp"
        />
      </div>

      <div className="space-y-2">
        {mods.map((m, i) => (
          <div key={i} className="flex items-center gap-2 bg-creme-sacree border border-or-pale/50 rounded-sharp p-2">
            <div className="flex flex-col leading-none">
              <button type="button" onClick={() => move(i, -1)} className="text-brun-mid/50 hover:text-or-sacre text-[10px]">▲</button>
              <button type="button" onClick={() => move(i, 1)} className="text-brun-mid/50 hover:text-or-sacre text-[10px]">▼</button>
            </div>
            <select
              value={m.phaseType}
              onChange={(e) => updateMod(i, { phaseType: e.target.value as PType })}
              className="text-sm font-ui bg-white border border-or-pale rounded-sharp px-2 py-1"
            >
              {ALL_TYPES.map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
            <input
              type="text"
              value={m.label}
              onChange={(e) => updateMod(i, { label: e.target.value })}
              placeholder="Nom de la phase"
              className="flex-1 min-w-0 text-sm font-ui bg-white border border-or-pale rounded-sharp px-2 py-1"
            />
            <input
              type="number"
              min={1}
              value={m.days}
              onChange={(e) => updateMod(i, { days: Number(e.target.value) })}
              className="w-16 text-sm font-ui bg-white border border-or-pale rounded-sharp px-2 py-1"
            />
            <span className="text-xs font-ui text-brun-mid/50">j</span>
            <button type="button" onClick={() => removeMod(i)} className="text-red-500 hover:text-red-700 text-sm">🗑️</button>
          </div>
        ))}
        {mods.length === 0 && (
          <p className="text-xs font-ui text-brun-mid/50 italic">
            Aucun module. Ajoute des phases ci-dessous — ou une seule « Phase libre » pour une durée simple.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {ALL_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => addMod(t)}
            className="px-3 py-1.5 text-xs font-ui border border-or-pale rounded-sharp text-brun-mid hover:border-or-sacre hover:text-or-sacre transition-colors"
          >
            + {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-or-pale/30">
        <button
          type="button"
          onClick={regenerate}
          disabled={saving}
          className="px-4 py-2 text-xs font-caps bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif disabled:opacity-50"
        >
          {saving ? "…" : "Régénérer la timeline"}
        </button>
        {msg && (
          <span className={`text-xs font-ui ${msg.startsWith("Échec") || msg.startsWith("Ajoute") ? "text-red-600" : "text-foret"}`}>{msg}</span>
        )}
      </div>

      {phases.length > 0 && (
        <div className="pt-3 border-t border-or-pale/30">
          <p className="text-xs font-caps uppercase tracking-wider text-brun-mid mb-2">Timeline actuelle · {phases.length} phases</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {phases.map((p) => (
              <div key={p.id} className="flex-shrink-0 min-w-[120px] border border-or-pale rounded-[8px] p-2 bg-creme-sacree">
                <p className="text-sm font-ui text-brun-chaud truncate">{p.customName || p.phaseType}</p>
                <p className="text-xs font-ui text-brun-mid/50">{fmt(p.startDate)} → {fmt(p.endDate)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ──

interface FunnelStep {
  step: string;
  count: number;
  conversionRate: number;
  dropoffRate: number;
}

interface FunnelSummary {
  totalLanding: number;
  totalCompleted: number;
  overallRate: number;
  topDropoff: { step: string; rate: number };
}

interface Visitor {
  id: string;
  sessionId: string;
  email: string | null;
  funnelStep: string;
  completed: boolean;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  firstSeen: string;
  lastSeen: string;
  totalVisits: number;
  prospectId: string | null;
  clientId: string | null;
}

type Tab = "funnel" | "abandons" | "sources";

const STEP_LABELS: Record<string, string> = {
  landing: "Landing", form_start: "D\u00e9but formulaire", form_email: "Email saisi",
  form_submit: "Formulaire soumis", onboarding_1: "Onboarding 1", onboarding_2: "Onboarding 2",
  onboarding_3: "Onboarding 3", onboarding_4: "Onboarding 4", onboarding_5: "Onboarding 5",
  completed: "Termin\u00e9",
};

// ── Main ──

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>("funnel");

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-brun-chaud">Analytics</h1>

      <div className="flex gap-1 bg-cire-chaude border border-or-pale rounded-lg p-1">
        {(["funnel", "abandons", "sources"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 font-ui text-sm rounded-md transition-colors ${
              tab === t ? "bg-or-sacre text-white" : "text-brun-mid hover:bg-or-pale/50"
            }`}>
            {t === "funnel" ? "Funnel" : t === "abandons" ? "Abandons" : "Sources"}
          </button>
        ))}
      </div>

      {tab === "funnel" && <FunnelTab />}
      {tab === "abandons" && <AbandonsTab />}
      {tab === "sources" && <SourcesTab />}
    </div>
  );
}

// ── Tab 1: Funnel ──

function FunnelTab() {
  const [steps, setSteps] = useState<FunnelStep[]>([]);
  const [summary, setSummary] = useState<FunnelSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [source, setSource] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ days: String(days) });
    if (source) params.set("source", source);
    const res = await fetch(`/api/admin/analytics/funnel?${params}`);
    const data = await res.json();
    setSteps(data.steps || []);
    setSummary(data.summary || null);
    setLoading(false);
  }, [days, source]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const maxCount = Math.max(...steps.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-3">
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-1.5 border border-or-pale rounded-sharp bg-white text-sm font-ui">
          <option value={7}>7 jours</option>
          <option value={30}>30 jours</option>
          <option value={90}>90 jours</option>
        </select>
        <input type="text" placeholder="Source..." value={source} onChange={(e) => setSource(e.target.value)}
          className="px-3 py-1.5 border border-or-pale rounded-sharp bg-white text-sm font-ui min-w-[150px]" />
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
            <p className="font-caps text-xs text-brun-mid uppercase tracking-wider">Visiteurs</p>
            <p className="font-display text-3xl text-or-sacre">{summary.totalLanding}</p>
          </div>
          <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
            <p className="font-caps text-xs text-brun-mid uppercase tracking-wider">Conversions</p>
            <p className="font-display text-3xl text-foret">{summary.totalCompleted}</p>
            <p className="text-xs font-ui text-brun-mid">{summary.overallRate}% taux global</p>
          </div>
          <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
            <p className="font-caps text-xs text-brun-mid uppercase tracking-wider">Plus gros abandon</p>
            <p className="font-display text-xl text-red-500">{STEP_LABELS[summary.topDropoff.step] || summary.topDropoff.step}</p>
            <p className="text-xs font-ui text-brun-mid">{summary.topDropoff.rate}% d&apos;abandon</p>
          </div>
        </div>
      )}

      {/* Funnel bars */}
      {loading ? (
        <p className="text-sm font-ui text-brun-mid/60 text-center py-10">Chargement...</p>
      ) : (
        <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5 space-y-3">
          {steps.map((s) => (
            <div key={s.step} className="flex items-center gap-3">
              <div className="w-32 shrink-0">
                <p className="font-ui text-xs text-brun-chaud truncate">{STEP_LABELS[s.step] || s.step}</p>
              </div>
              <div className="flex-1 h-7 bg-or-pale/30 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-or-sacre rounded-full transition-all"
                  style={{ width: `${maxCount > 0 ? (s.count / maxCount) * 100 : 0}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-ui font-medium text-brun-chaud">
                  {s.count}
                </span>
              </div>
              <div className="w-24 shrink-0 text-right">
                <span className="text-xs font-ui text-foret">{s.conversionRate}%</span>
                {s.dropoffRate > 0 && s.step !== "landing" && (
                  <span className="text-[10px] font-ui text-red-400 ml-1">-{s.dropoffRate}%</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab 2: Abandons ──

function AbandonsTab() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics/visitors?completed=false&hasEmail=true")
      .then((r) => r.json())
      .then((d) => setVisitors(d.visitors || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function createProspect(v: Visitor) {
    if (!v.email) return;
    setCreating(v.id);
    await fetch("/api/admin/prospects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: v.email,
        source: v.source || "website",
        sourceDetail: `funnel-abandon-${v.funnelStep}`,
        tags: ["abandon"],
        notes: `Abandon\u00e9 \u00e0 l'\u00e9tape: ${STEP_LABELS[v.funnelStep] || v.funnelStep}`,
      }),
    });
    setVisitors((prev) => prev.filter((x) => x.id !== v.id));
    setCreating(null);
  }

  if (loading) return <p className="text-sm font-ui text-brun-mid/60 text-center py-10">Chargement...</p>;

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-[10px] overflow-hidden">
      {visitors.length === 0 ? (
        <p className="p-5 text-center text-sm font-ui text-brun-mid/60">Aucun abandon avec email</p>
      ) : (
        <table className="w-full text-sm font-ui">
          <thead>
            <tr className="border-b border-or-pale">
              <th className="text-left p-3 text-xs text-brun-mid/60 font-normal">Email</th>
              <th className="text-left p-3 text-xs text-brun-mid/60 font-normal">&Eacute;tape abandon</th>
              <th className="text-left p-3 text-xs text-brun-mid/60 font-normal">Source</th>
              <th className="text-left p-3 text-xs text-brun-mid/60 font-normal">Derni&egrave;re visite</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {visitors.map((v) => (
              <tr key={v.id} className="border-b border-or-pale/30">
                <td className="p-3 text-brun-chaud">{v.email}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-100 text-red-600">
                    {STEP_LABELS[v.funnelStep] || v.funnelStep}
                  </span>
                </td>
                <td className="p-3 text-brun-mid">{v.source || "\u2014"}</td>
                <td className="p-3 text-xs text-brun-mid">
                  {new Date(v.lastSeen).toLocaleDateString("fr-FR")}
                </td>
                <td className="p-3">
                  {!v.prospectId && (
                    <button onClick={() => createProspect(v)} disabled={creating === v.id}
                      className="text-xs font-ui text-or-sacre hover:text-ambre-vif disabled:opacity-50">
                      {creating === v.id ? "..." : "Cr\u00e9er prospect"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Tab 3: Sources ──

function SourcesTab() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics/visitors")
      .then((r) => r.json())
      .then((d) => setVisitors(d.visitors || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm font-ui text-brun-mid/60 text-center py-10">Chargement...</p>;

  // Compute source stats
  const sourceStats: Record<string, { visits: number; conversions: number }> = {};
  for (const v of visitors) {
    const src = v.source || "direct";
    if (!sourceStats[src]) sourceStats[src] = { visits: 0, conversions: 0 };
    sourceStats[src].visits++;
    if (v.completed) sourceStats[src].conversions++;
  }

  const sorted = Object.entries(sourceStats).sort((a, b) => b[1].visits - a[1].visits);
  const maxVisits = Math.max(...sorted.map(([, s]) => s.visits), 1);

  return (
    <div className="space-y-6">
      {/* Visual bars */}
      <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5 space-y-3">
        <h3 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-3">Par source</h3>
        {sorted.map(([source, stats]) => (
          <div key={source} className="flex items-center gap-3">
            <div className="w-24 shrink-0">
              <p className="font-ui text-xs text-brun-chaud truncate">{source}</p>
            </div>
            <div className="flex-1 h-6 bg-or-pale/30 rounded-full overflow-hidden">
              <div className="h-full bg-or-sacre rounded-full" style={{ width: `${(stats.visits / maxVisits) * 100}%` }} />
            </div>
            <div className="w-32 shrink-0 text-right text-xs font-ui">
              <span className="text-brun-chaud">{stats.visits} visites</span>
              <span className="text-brun-mid/50 ml-2">{stats.conversions} conv.</span>
              <span className="text-foret ml-2">
                {stats.visits > 0 ? Math.round((stats.conversions / stats.visits) * 100) : 0}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-cire-chaude border border-or-pale rounded-[10px] overflow-hidden">
        <table className="w-full text-sm font-ui">
          <thead>
            <tr className="border-b border-or-pale">
              <th className="text-left p-3 text-xs text-brun-mid/60 font-normal">Source</th>
              <th className="text-right p-3 text-xs text-brun-mid/60 font-normal">Visites</th>
              <th className="text-right p-3 text-xs text-brun-mid/60 font-normal">Conversions</th>
              <th className="text-right p-3 text-xs text-brun-mid/60 font-normal">Taux</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(([source, stats]) => (
              <tr key={source} className="border-b border-or-pale/30">
                <td className="p-3 text-brun-chaud">{source}</td>
                <td className="p-3 text-right text-brun-chaud">{stats.visits}</td>
                <td className="p-3 text-right text-foret">{stats.conversions}</td>
                <td className="p-3 text-right text-brun-mid">
                  {stats.visits > 0 ? Math.round((stats.conversions / stats.visits) * 100) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

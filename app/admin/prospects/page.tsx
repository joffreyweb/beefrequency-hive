"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ──

interface Prospect {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  company: string | null;
  role: string | null;
  source: string;
  sourceDetail: string | null;
  referredBy: string | null;
  status: string;
  temperature: string;
  score: number;
  budget: string | null;
  timeline: string | null;
  needs: string[];
  painPoints: string[];
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
  touchpoints: number;
  notes: string | null;
  tags: string[];
  convertedAt: string | null;
  clientId: string | null;
  createdAt: string;
}

interface Activity {
  id: string;
  type: string;
  content: string | null;
  outcome: string | null;
  createdAt: string;
}

type View = "kanban" | "list";

const STATUSES = ["new", "contacted", "qualified", "negotiation", "won", "lost", "nurturing"];
const STATUS_LABELS: Record<string, string> = {
  new: "Nouveau", contacted: "Contact\u00e9", qualified: "Qualifi\u00e9",
  negotiation: "N\u00e9gociation", won: "Gagn\u00e9", lost: "Perdu", nurturing: "Nurturing",
};
const TEMP_COLORS: Record<string, string> = {
  cold: "bg-blue-100 text-blue-700", warm: "bg-orange-100 text-orange-700", hot: "bg-red-100 text-red-700",
};
const ACTIVITY_ICONS: Record<string, string> = {
  email_sent: "\u2709", call: "\uD83D\uDCDE", meeting: "\uD83E\uDD1D", note: "\uD83D\uDCDD",
  status_change: "\u21C4", linkedin: "in", whatsapp: "\uD83D\uDCAC",
};

// ── Main ──

export default function ProspectsPage() {
  const [view, setView] = useState<View>("kanban");
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tempFilter, setTempFilter] = useState("");
  const [selected, setSelected] = useState<Prospect | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const fetchProspects = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (tempFilter) params.set("temperature", tempFilter);
    const res = await fetch(`/api/admin/prospects?${params}`);
    const data = await res.json();
    setProspects(data.prospects || []);
    setLoading(false);
  }, [search, statusFilter, tempFilter]);

  useEffect(() => { fetchProspects(); }, [fetchProspects]);

  async function handleStatusChange(id: string, newStatus: string) {
    // Optimistic update
    setProspects((prev) => prev.map((p) => p.id === id ? { ...p, status: newStatus } : p));
    try {
      const res = await fetch(`/api/admin/prospects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        // Rollback
        await fetchProspects();
        return;
      }
    } catch {
      await fetchProspects();
      return;
    }
    fetchProspects();
  }

  function displayName(p: Prospect): string {
    return [p.firstName, p.lastName].filter(Boolean).join(" ") || p.email;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-brun-chaud">Prospects</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-or-sacre text-white font-ui text-xs uppercase tracking-wider rounded-[2px] hover:bg-ambre-vif transition-colors">
            + Nouveau
          </button>
          <a href="/api/admin/prospects?format=csv"
            className="px-4 py-2 border border-or-pale text-brun-mid font-ui text-xs uppercase tracking-wider rounded-[2px] hover:bg-cire-chaude transition-colors">
            CSV
          </a>
        </div>
      </div>

      {/* View toggle + filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex bg-cire-chaude border border-or-pale rounded-lg p-0.5">
          <button onClick={() => setView("kanban")}
            className={`px-3 py-1.5 font-ui text-xs rounded-md transition-colors ${view === "kanban" ? "bg-or-sacre text-white" : "text-brun-mid"}`}>
            Kanban
          </button>
          <button onClick={() => setView("list")}
            className={`px-3 py-1.5 font-ui text-xs rounded-md transition-colors ${view === "list" ? "bg-or-sacre text-white" : "text-brun-mid"}`}>
            Liste
          </button>
        </div>
        <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre min-w-[180px]" />
        {view === "list" && (
          <>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm">
              <option value="">Tous statuts</option>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
            <select value={tempFilter} onChange={(e) => setTempFilter(e.target.value)}
              className="px-3 py-1.5 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm">
              <option value="">Toutes temp.</option>
              <option value="cold">Froid</option>
              <option value="warm">Ti&egrave;de</option>
              <option value="hot">Chaud</option>
            </select>
          </>
        )}
      </div>

      {loading ? (
        <p className="text-sm font-ui text-brun-mid/60 text-center py-10">Chargement...</p>
      ) : view === "kanban" ? (
        <KanbanView prospects={prospects} onSelect={setSelected} onStatusChange={handleStatusChange} displayName={displayName} />
      ) : (
        <ListView prospects={prospects} onSelect={setSelected} displayName={displayName} />
      )}

      {/* Modal */}
      {selected && (
        <ProspectModal
          prospect={selected}
          onClose={() => { setSelected(null); fetchProspects(); }}
          onUpdate={fetchProspects}
        />
      )}

      {showAdd && (
        <AddProspectModal
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); fetchProspects(); }}
        />
      )}

      <p className="text-xs font-ui text-brun-mid/40 text-right">{prospects.length} prospect(s)</p>
    </div>
  );
}

// ── Kanban ──

function KanbanView({ prospects, onSelect, onStatusChange, displayName }: {
  prospects: Prospect[];
  onSelect: (p: Prospect) => void;
  onStatusChange: (id: string, status: string) => void;
  displayName: (p: Prospect) => string;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {STATUSES.map((status) => {
        const items = prospects.filter((p) => p.status === status);
        return (
          <div key={status} className="min-w-[200px] flex-1">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-caps text-[10px] uppercase tracking-widest text-brun-mid">{STATUS_LABELS[status]}</h3>
              {items.length > 0 && (
                <span className="px-1.5 py-0.5 bg-or-sacre/10 text-or-sacre text-[10px] rounded-full">{items.length}</span>
              )}
            </div>
            <div className="space-y-2">
              {items.map((p) => (
                <div
                  key={p.id}
                  className="bg-cire-chaude border border-or-pale rounded-lg p-3 hover:border-or-sacre transition-colors"
                >
                  <div
                    onClick={() => onSelect(p)}
                    className="cursor-pointer"
                  >
                    <p className="font-ui text-sm text-brun-chaud truncate">{displayName(p)}</p>
                    {p.company && <p className="font-ui text-[10px] text-brun-mid truncate">{p.company}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <span className={`px-1.5 py-0.5 text-[9px] rounded-full ${TEMP_COLORS[p.temperature] || ""}`}>
                        {p.temperature}
                      </span>
                      {p.score > 0 && <span className="text-[10px] font-ui text-or-sacre">{p.score}/100</span>}
                    </div>
                    {p.nextFollowUpAt && (
                      <p className="text-[10px] font-ui text-brun-mid/50 mt-1">
                        Suivi : {new Date(p.nextFollowUpAt).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>
                  {/* Quick status buttons — outside the clickable zone */}
                  {status !== "won" && status !== "lost" && getNextStatuses(status).length > 0 && (
                    <div className="flex gap-2 mt-2 pt-2 border-t border-or-pale/30">
                      {getNextStatuses(status).map((next) => (
                        <button
                          key={next}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onStatusChange(p.id, next);
                          }}
                          className="text-[10px] font-ui text-or-sacre hover:text-ambre-vif hover:underline px-1">
                          → {STATUS_LABELS[next]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-[10px] font-ui text-brun-mid/30 text-center py-4">&mdash;</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getNextStatuses(current: string): string[] {
  switch (current) {
    case "new": return ["contacted"];
    case "contacted": return ["qualified", "lost"];
    case "qualified": return ["negotiation", "lost"];
    case "negotiation": return ["won", "lost"];
    case "nurturing": return ["contacted"];
    default: return [];
  }
}

// ── List ──

function ListView({ prospects, onSelect, displayName }: {
  prospects: Prospect[];
  onSelect: (p: Prospect) => void;
  displayName: (p: Prospect) => string;
}) {
  return (
    <div className="bg-cire-chaude border border-or-pale rounded-[10px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-ui">
          <thead>
            <tr className="border-b border-or-pale">
              {["Nom", "Email", "Source", "Status", "Temp.", "Score", "Dernier contact", "Prochain suivi"].map((h) => (
                <th key={h} className="text-left p-3 text-xs text-brun-mid/60 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {prospects.map((p) => (
              <tr key={p.id} onClick={() => onSelect(p)}
                className="border-b border-or-pale/30 hover:bg-or-pale/10 cursor-pointer">
                <td className="p-3 text-brun-chaud">{displayName(p)}</td>
                <td className="p-3 text-brun-mid text-xs">{p.email}</td>
                <td className="p-3 text-brun-mid text-xs">{p.source}</td>
                <td className="p-3"><span className="px-2 py-0.5 text-[10px] rounded-full bg-or-sacre/10 text-or-sacre">{STATUS_LABELS[p.status]}</span></td>
                <td className="p-3"><span className={`px-2 py-0.5 text-[10px] rounded-full ${TEMP_COLORS[p.temperature] || ""}`}>{p.temperature}</span></td>
                <td className="p-3 text-brun-chaud">{p.score}</td>
                <td className="p-3 text-xs text-brun-mid">{p.lastContactAt ? new Date(p.lastContactAt).toLocaleDateString("fr-FR") : "\u2014"}</td>
                <td className="p-3 text-xs text-brun-mid">{p.nextFollowUpAt ? new Date(p.nextFollowUpAt).toLocaleDateString("fr-FR") : "\u2014"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Prospect Modal ──

function ProspectModal({ prospect, onClose, onUpdate }: {
  prospect: Prospect;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [form, setForm] = useState(prospect);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"info" | "activity">("info");
  const [activityForm, setActivityForm] = useState({ type: "note", content: "", outcome: "" });
  const [addingActivity, setAddingActivity] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/prospects/${prospect.id}/activity`)
      .then((r) => r.json())
      .then((d) => setActivities(d.activities || []))
      .catch(() => {});
  }, [prospect.id]);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/admin/prospects/${prospect.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.firstName, lastName: form.lastName, phone: form.phone,
        company: form.company, role: form.role, source: form.source,
        referredBy: form.referredBy, status: form.status, temperature: form.temperature,
        score: form.score, budget: form.budget, timeline: form.timeline,
        notes: form.notes, nextFollowUpAt: form.nextFollowUpAt,
        needs: form.needs, painPoints: form.painPoints, tags: form.tags,
      }),
    });
    setSaving(false);
    onUpdate();
    onClose();
  }

  async function handleAddActivity() {
    if (!activityForm.content && activityForm.type !== "status_change") return;
    setAddingActivity(true);
    await fetch(`/api/admin/prospects/${prospect.id}/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(activityForm),
    });
    const res = await fetch(`/api/admin/prospects/${prospect.id}/activity`);
    const data = await res.json();
    setActivities(data.activities || []);
    setActivityForm({ type: "note", content: "", outcome: "" });
    setAddingActivity(false);
  }

  async function handleDelete() {
    if (!confirm("Supprimer ce prospect ?")) return;
    await fetch(`/api/admin/prospects/${prospect.id}`, { method: "DELETE" });
    onUpdate();
    onClose();
  }

  async function handleConvert() {
    if (!confirm("Convertir en client ? Un compte sera cr\u00e9\u00e9.")) return;
    const res = await fetch(`/api/admin/prospects/${prospect.id}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (res.ok) {
      alert(`Client cr\u00e9\u00e9. Mot de passe temporaire : ${data.tempPassword}`);
      onUpdate();
      onClose();
    } else {
      alert(data.error || "Erreur");
    }
  }

  const name = [form.firstName, form.lastName].filter(Boolean).join(" ") || form.email;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-10 px-4 overflow-y-auto">
      <div className="bg-creme-sacree border border-or-pale rounded-[10px] w-full max-w-2xl shadow-xl mb-10">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-or-pale">
          <div>
            <p className="font-caps text-[10px] uppercase tracking-widest text-brun-mid/60">Modifier le prospect</p>
            <h2 className="font-display text-xl text-brun-chaud">{name}</h2>
            {form.company && <p className="font-ui text-xs text-brun-mid">{form.company} {form.role ? `— ${form.role}` : ""}</p>}
          </div>
          <button onClick={onClose} className="text-brun-mid hover:text-brun-chaud text-xl">&times;</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-or-pale">
          <button onClick={() => setTab("info")}
            className={`flex-1 py-2.5 font-ui text-sm transition-colors ${tab === "info" ? "text-or-sacre border-b-2 border-or-sacre" : "text-brun-mid"}`}>
            Informations
          </button>
          <button onClick={() => setTab("activity")}
            className={`flex-1 py-2.5 font-ui text-sm transition-colors ${tab === "activity" ? "text-or-sacre border-b-2 border-or-sacre" : "text-brun-mid"}`}>
            Historique ({activities.length})
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {tab === "info" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <MField label="Prénom" value={form.firstName || ""} onChange={(v) => setForm((p) => ({ ...p, firstName: v || null }))} />
                <MField label="Nom" value={form.lastName || ""} onChange={(v) => setForm((p) => ({ ...p, lastName: v || null }))} />
                <MField label="Téléphone" value={form.phone || ""} onChange={(v) => setForm((p) => ({ ...p, phone: v || null }))} />
                <MField label="Entreprise" value={form.company || ""} onChange={(v) => setForm((p) => ({ ...p, company: v || null }))} />
                <MField label="Rôle" value={form.role || ""} onChange={(v) => setForm((p) => ({ ...p, role: v || null }))} />
                <MField label="Référé par" value={form.referredBy || ""} onChange={(v) => setForm((p) => ({ ...p, referredBy: v || null }))} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <MSelect label="Status" value={form.status} options={STATUSES.map((s) => ({ v: s, l: STATUS_LABELS[s] }))} onChange={(v) => setForm((p) => ({ ...p, status: v }))} />
                <MSelect label="Température" value={form.temperature}
                  options={[{ v: "cold", l: "Froid" }, { v: "warm", l: "Tiède" }, { v: "hot", l: "Chaud" }]}
                  onChange={(v) => setForm((p) => ({ ...p, temperature: v }))} />
                <MField label="Score (0-100)" value={String(form.score)} onChange={(v) => setForm((p) => ({ ...p, score: parseInt(v) || 0 }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MSelect label="Budget" value={form.budget || ""}
                  options={[{ v: "", l: "—" }, { v: "unknown", l: "Inconnu" }, { v: "low", l: "Bas" }, { v: "mid", l: "Moyen" }, { v: "high", l: "Haut" }, { v: "premium", l: "Premium" }]}
                  onChange={(v) => setForm((p) => ({ ...p, budget: v || null }))} />
                <MSelect label="Timeline" value={form.timeline || ""}
                  options={[{ v: "", l: "—" }, { v: "immediate", l: "Immédiat" }, { v: "1-3months", l: "1-3 mois" }, { v: "6months+", l: "6 mois+" }, { v: "unknown", l: "Inconnu" }]}
                  onChange={(v) => setForm((p) => ({ ...p, timeline: v || null }))} />
              </div>

              <MField label="Prochain suivi" value={form.nextFollowUpAt ? form.nextFollowUpAt.slice(0, 10) : ""}
                onChange={(v) => setForm((p) => ({ ...p, nextFollowUpAt: v || null }))} type="date" />

              <div>
                <label className="block text-xs font-ui text-brun-mid mb-1">Notes</label>
                <textarea value={form.notes || ""} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value || null }))}
                  rows={3} className="w-full px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre" />
              </div>

              <MField label="Tags (séparés par ,)" value={form.tags.join(", ")}
                onChange={(v) => setForm((p) => ({ ...p, tags: v ? v.split(",").map((t) => t.trim()) : [] }))} />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Add activity */}
              <div className="bg-cire-chaude border border-or-pale rounded-sm p-3 space-y-2">
                <div className="flex gap-2">
                  <select value={activityForm.type} onChange={(e) => setActivityForm((p) => ({ ...p, type: e.target.value }))}
                    className="px-2 py-1.5 border border-or-pale rounded-sharp bg-white text-sm font-ui">
                    <option value="note">Note</option>
                    <option value="call">Appel</option>
                    <option value="email_sent">Email</option>
                    <option value="meeting">Réunion</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                  <select value={activityForm.outcome} onChange={(e) => setActivityForm((p) => ({ ...p, outcome: e.target.value }))}
                    className="px-2 py-1.5 border border-or-pale rounded-sharp bg-white text-sm font-ui">
                    <option value="">Outcome</option>
                    <option value="positive">Positif</option>
                    <option value="neutral">Neutre</option>
                    <option value="negative">Négatif</option>
                    <option value="no_response">Pas de réponse</option>
                  </select>
                </div>
                <textarea value={activityForm.content} onChange={(e) => setActivityForm((p) => ({ ...p, content: e.target.value }))}
                  placeholder="Détails..." rows={2}
                  className="w-full px-3 py-2 border border-or-pale rounded-sharp bg-white text-sm font-ui focus:outline-none focus:border-or-sacre" />
                <button onClick={handleAddActivity} disabled={addingActivity}
                  className="px-3 py-1.5 bg-or-sacre text-white font-ui text-xs rounded-[2px] hover:bg-ambre-vif disabled:opacity-50">
                  {addingActivity ? "..." : "Ajouter"}
                </button>
              </div>

              {/* Timeline */}
              {activities.length === 0 ? (
                <p className="text-sm font-ui text-brun-mid/60 text-center py-4">Aucune activité</p>
              ) : (
                <div className="space-y-3">
                  {activities.map((a) => (
                    <div key={a.id} className="flex gap-3 items-start">
                      <div className="w-7 h-7 rounded-full bg-or-sacre/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs">{ACTIVITY_ICONS[a.type] || "\u2022"}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-ui text-xs font-medium text-brun-chaud">{a.type.replace(/_/g, " ")}</span>
                          {a.outcome && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                              a.outcome === "positive" ? "bg-foret/10 text-foret" :
                              a.outcome === "negative" ? "bg-red-100 text-red-600" :
                              "bg-gray-100 text-gray-500"
                            }`}>{a.outcome}</span>
                          )}
                        </div>
                        {a.content && <p className="font-ui text-sm text-brun-chaud mt-0.5">{a.content}</p>}
                        <p className="font-ui text-[10px] text-brun-mid/40 mt-0.5">
                          {new Date(a.createdAt).toLocaleDateString("fr-FR")} {new Date(a.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-or-pale">
          <div className="flex gap-3 items-center">
            <button onClick={handleDelete} className="text-xs font-ui text-red-400 hover:text-red-600">Supprimer</button>
            {!form.clientId ? (
              <button onClick={handleConvert} className="px-3 py-1.5 bg-foret/10 text-foret font-ui text-xs uppercase tracking-wider rounded-[2px] hover:bg-foret hover:text-white transition-colors">
                Convertir en client
              </button>
            ) : (
              <span className="text-xs font-ui text-foret">✓ Déjà client</span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-4 py-2 border border-brun-mid text-brun-mid font-ui text-xs uppercase tracking-wider rounded-[2px] hover:bg-brun-mid hover:text-creme-sacree transition-colors">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 bg-or-sacre text-white font-ui text-xs uppercase tracking-wider rounded-[2px] hover:bg-ambre-vif disabled:opacity-50 transition-colors">
              {saving ? "..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add Modal ──

function AddProspectModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", phone: "", company: "", role: "", source: "manual", referredBy: "", notes: "" });
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!form.email) return;
    setSaving(true);
    await fetch("/api/admin/prospects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        firstName: form.firstName || null, lastName: form.lastName || null,
        phone: form.phone || null, company: form.company || null,
        role: form.role || null, referredBy: form.referredBy || null,
        notes: form.notes || null,
      }),
    });
    setSaving(false);
    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-creme-sacree border border-or-pale rounded-[10px] w-full max-w-md shadow-xl p-5 space-y-4">
        <h2 className="font-display text-xl text-brun-chaud">Nouveau prospect</h2>
        <div className="space-y-3">
          <MField label="Email *" value={form.email} onChange={(v) => setForm((p) => ({ ...p, email: v }))} />
          <div className="grid grid-cols-2 gap-3">
            <MField label="Prénom" value={form.firstName} onChange={(v) => setForm((p) => ({ ...p, firstName: v }))} />
            <MField label="Nom" value={form.lastName} onChange={(v) => setForm((p) => ({ ...p, lastName: v }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MField label="Téléphone" value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} />
            <MField label="Entreprise" value={form.company} onChange={(v) => setForm((p) => ({ ...p, company: v }))} />
          </div>
          <MSelect label="Source" value={form.source}
            options={[
              { v: "manual", l: "Manuel" }, { v: "referral", l: "Recommandation" }, { v: "website", l: "Site web" },
              { v: "instagram", l: "Instagram" }, { v: "linkedin", l: "LinkedIn" }, { v: "event", l: "Événement" },
              { v: "newsletter", l: "Newsletter" },
            ]}
            onChange={(v) => setForm((p) => ({ ...p, source: v }))} />
          <MField label="Référé par" value={form.referredBy} onChange={(v) => setForm((p) => ({ ...p, referredBy: v }))} />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose}
            className="flex-1 py-2 border border-brun-mid text-brun-mid font-ui text-xs uppercase tracking-wider rounded-[2px] hover:bg-brun-mid hover:text-creme-sacree transition-colors">
            Annuler
          </button>
          <button onClick={handleCreate} disabled={saving || !form.email}
            className="flex-1 py-2 bg-or-sacre text-white font-ui text-xs uppercase tracking-wider rounded-[2px] hover:bg-ambre-vif disabled:opacity-50 transition-colors">
            {saving ? "..." : "Cr\u00e9er"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Shared field components ──

function MField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-ui text-brun-mid mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre" />
    </div>
  );
}

function MSelect({ label, value, options, onChange }: { label: string; value: string; options: { v: string; l: string }[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-ui text-brun-mid mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre">
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

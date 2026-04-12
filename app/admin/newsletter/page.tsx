"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ──

interface Subscriber {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  source: string;
  sourceDetail: string | null;
  tags: string[];
  segments: string[];
  status: string;
  subscribedAt: string;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
}

interface Campaign {
  id: string;
  name: string;
  subject: string;
  previewText: string | null;
  content: string;
  targetTags: string[];
  targetSegments: string[];
  excludeTags: string[];
  status: string;
  sentAt: string | null;
  sentCount: number;
  openCount: number;
  clickCount: number;
  createdAt: string;
}

type Tab = "subscribers" | "campaigns" | "segments";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-foret/10 text-foret",
  unsubscribed: "bg-red-100 text-red-600",
  bounced: "bg-orange-100 text-orange-600",
  cleaned: "bg-gray-100 text-gray-500",
};

const CAMPAIGN_STATUS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  scheduled: "bg-blue-100 text-blue-600",
  sending: "bg-yellow-100 text-yellow-700",
  sent: "bg-foret/10 text-foret",
  failed: "bg-red-100 text-red-600",
};

// ── Main page ──

export default function NewsletterPage() {
  const [tab, setTab] = useState<Tab>("subscribers");

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-brun-chaud">Newsletter</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-cire-chaude border border-or-pale rounded-lg p-1">
        {(["subscribers", "campaigns", "segments"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 font-ui text-sm rounded-md transition-colors ${
              tab === t
                ? "bg-or-sacre text-white"
                : "text-brun-mid hover:bg-or-pale/50"
            }`}
          >
            {t === "subscribers" ? "Abonn\u00e9s" : t === "campaigns" ? "Campagnes" : "Segments"}
          </button>
        ))}
      </div>

      {tab === "subscribers" && <SubscribersTab />}
      {tab === "campaigns" && <CampaignsTab />}
      {tab === "segments" && <SegmentsTab />}
    </div>
  );
}

// ── Tab 1: Subscribers ──

function SubscribersTab() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", firstName: "", lastName: "", tags: "" });
  const [adding, setAdding] = useState(false);

  const fetchSubscribers = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (sourceFilter) params.set("source", sourceFilter);
    const res = await fetch(`/api/admin/newsletter/subscribers?${params}`);
    const data = await res.json();
    setSubscribers(data.subscribers || []);
    setLoading(false);
  }, [search, statusFilter, sourceFilter]);

  useEffect(() => { fetchSubscribers(); }, [fetchSubscribers]);

  async function handleAdd() {
    if (!addForm.email) return;
    setAdding(true);
    await fetch("/api/admin/newsletter/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: addForm.email,
        firstName: addForm.firstName || null,
        lastName: addForm.lastName || null,
        source: "manual",
        tags: addForm.tags ? addForm.tags.split(",").map((t) => t.trim()) : [],
      }),
    });
    setAddForm({ email: "", firstName: "", lastName: "", tags: "" });
    setShowAdd(false);
    setAdding(false);
    fetchSubscribers();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/newsletter/subscribers/${id}`, { method: "DELETE" });
    setSubscribers((prev) => prev.filter((s) => s.id !== id));
  }

  const sources = [...new Set(subscribers.map((s) => s.source))];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre flex-1 min-w-[200px]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="unsubscribed">D&eacute;sinscrit</option>
          <option value="bounced">Bounced</option>
          <option value="cleaned">Nettoy&eacute;</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm"
        >
          <option value="">Toutes les sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-or-sacre text-white font-ui text-xs uppercase tracking-wider rounded-[2px] hover:bg-ambre-vif transition-colors"
        >
          + Ajouter
        </button>
        <a
          href="/api/admin/newsletter/subscribers?format=csv"
          className="px-4 py-2 border border-or-pale text-brun-mid font-ui text-xs uppercase tracking-wider rounded-[2px] hover:bg-cire-chaude transition-colors"
        >
          Export CSV
        </a>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Email *" value={addForm.email} onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
              className="px-3 py-2 border border-or-pale rounded-sharp bg-white text-sm font-ui" />
            <input placeholder="Pr\u00e9nom" value={addForm.firstName} onChange={(e) => setAddForm((p) => ({ ...p, firstName: e.target.value }))}
              className="px-3 py-2 border border-or-pale rounded-sharp bg-white text-sm font-ui" />
            <input placeholder="Nom" value={addForm.lastName} onChange={(e) => setAddForm((p) => ({ ...p, lastName: e.target.value }))}
              className="px-3 py-2 border border-or-pale rounded-sharp bg-white text-sm font-ui" />
            <input placeholder="Tags (s\u00e9par\u00e9s par ,)" value={addForm.tags} onChange={(e) => setAddForm((p) => ({ ...p, tags: e.target.value }))}
              className="px-3 py-2 border border-or-pale rounded-sharp bg-white text-sm font-ui" />
          </div>
          <button onClick={handleAdd} disabled={adding || !addForm.email}
            className="px-4 py-2 bg-or-sacre text-white font-ui text-xs uppercase tracking-wider rounded-[2px] hover:bg-ambre-vif disabled:opacity-50">
            {adding ? "Ajout..." : "Ajouter"}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-cire-chaude border border-or-pale rounded-[10px] overflow-hidden">
        {loading ? (
          <p className="p-5 text-center text-sm font-ui text-brun-mid/60">Chargement...</p>
        ) : subscribers.length === 0 ? (
          <p className="p-5 text-center text-sm font-ui text-brun-mid/60">Aucun abonn&eacute;</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-ui">
              <thead>
                <tr className="border-b border-or-pale">
                  <th className="text-left p-3 text-xs text-brun-mid/60 font-normal">Email</th>
                  <th className="text-left p-3 text-xs text-brun-mid/60 font-normal">Nom</th>
                  <th className="text-left p-3 text-xs text-brun-mid/60 font-normal">Source</th>
                  <th className="text-left p-3 text-xs text-brun-mid/60 font-normal">Tags</th>
                  <th className="text-left p-3 text-xs text-brun-mid/60 font-normal">Status</th>
                  <th className="text-left p-3 text-xs text-brun-mid/60 font-normal">Date</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s) => (
                  <tr key={s.id} className="border-b border-or-pale/30 hover:bg-or-pale/10">
                    <td className="p-3 text-brun-chaud">{s.email}</td>
                    <td className="p-3 text-brun-chaud">{[s.firstName, s.lastName].filter(Boolean).join(" ") || "\u2014"}</td>
                    <td className="p-3 text-brun-mid">{s.source}</td>
                    <td className="p-3">
                      <div className="flex gap-1 flex-wrap">
                        {s.tags.map((tag) => (
                          <span key={tag} className="px-1.5 py-0.5 bg-or-sacre/10 text-or-sacre text-[10px] rounded-full">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[10px] rounded-full ${STATUS_COLORS[s.status] || ""}`}>{s.status}</span>
                    </td>
                    <td className="p-3 text-brun-mid text-xs">
                      {new Date(s.subscribedAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="p-3">
                      <button onClick={() => handleDelete(s.id)} className="text-xs text-red-400 hover:text-red-600">&times;</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs font-ui text-brun-mid/40 text-right">{subscribers.length} abonn&eacute;(s)</p>
    </div>
  );
}

// ── Tab 2: Campaigns ──

function CampaignsTab() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", subject: "", previewText: "", content: "", targetTags: "", targetSegments: "", excludeTags: "" });
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    const res = await fetch("/api/admin/newsletter/campaigns");
    const data = await res.json();
    setCampaigns(data.campaigns || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  function openNew() {
    setForm({ name: "", subject: "", previewText: "", content: "", targetTags: "", targetSegments: "", excludeTags: "" });
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(c: Campaign) {
    setForm({
      name: c.name, subject: c.subject, previewText: c.previewText || "",
      content: c.content, targetTags: c.targetTags.join(", "),
      targetSegments: c.targetSegments.join(", "), excludeTags: c.excludeTags.join(", "),
    });
    setEditId(c.id);
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      name: form.name, subject: form.subject, previewText: form.previewText || null,
      content: form.content,
      targetTags: form.targetTags ? form.targetTags.split(",").map((t) => t.trim()) : [],
      targetSegments: form.targetSegments ? form.targetSegments.split(",").map((t) => t.trim()) : [],
      excludeTags: form.excludeTags ? form.excludeTags.split(",").map((t) => t.trim()) : [],
    };
    if (editId) {
      await fetch(`/api/admin/newsletter/campaigns/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/admin/newsletter/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setSaving(false);
    setShowForm(false);
    fetchCampaigns();
  }

  async function handleSend(id: string) {
    if (!confirm("Envoyer cette campagne ? Cette action est irr\u00e9versible.")) return;
    setSending(id);
    const res = await fetch(`/api/admin/newsletter/campaigns/${id}/send`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      alert(`Campagne envoy\u00e9e \u00e0 ${data.sentCount} destinataire(s)`);
    } else {
      alert(data.error || "Erreur");
    }
    setSending(null);
    fetchCampaigns();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce brouillon ?")) return;
    await fetch(`/api/admin/newsletter/campaigns/${id}`, { method: "DELETE" });
    fetchCampaigns();
  }

  return (
    <div className="space-y-4">
      <button onClick={openNew}
        className="px-4 py-2 bg-or-sacre text-white font-ui text-xs uppercase tracking-wider rounded-[2px] hover:bg-ambre-vif transition-colors">
        + Nouvelle campagne
      </button>

      {/* Campaign form */}
      {showForm && (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-4">
          <h3 className="font-display text-lg text-brun-chaud">
            {editId ? "Modifier" : "Nouvelle"} campagne
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Nom (interne)" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} />
            <FormField label="Sujet" value={form.subject} onChange={(v) => setForm((p) => ({ ...p, subject: v }))} />
          </div>
          <FormField label="Preview text" value={form.previewText} onChange={(v) => setForm((p) => ({ ...p, previewText: v }))} />
          <div>
            <label className="block text-xs font-ui text-brun-mid mb-1">Contenu (HTML)</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              rows={10}
              className="w-full px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre font-mono"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Tags cibles (,)" value={form.targetTags} onChange={(v) => setForm((p) => ({ ...p, targetTags: v }))} />
            <FormField label="Segments cibles (,)" value={form.targetSegments} onChange={(v) => setForm((p) => ({ ...p, targetSegments: v }))} />
            <FormField label="Tags exclus (,)" value={form.excludeTags} onChange={(v) => setForm((p) => ({ ...p, excludeTags: v }))} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-brun-mid text-brun-mid font-ui text-xs uppercase tracking-wider rounded-[2px] hover:bg-brun-mid hover:text-creme-sacree transition-colors">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving || !form.name || !form.subject || !form.content}
              className="px-4 py-2 bg-or-sacre text-white font-ui text-xs uppercase tracking-wider rounded-[2px] hover:bg-ambre-vif disabled:opacity-50 transition-colors">
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      )}

      {/* Campaigns list */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-sm font-ui text-brun-mid/60 text-center py-5">Chargement...</p>
        ) : campaigns.length === 0 ? (
          <p className="text-sm font-ui text-brun-mid/60 text-center py-5">Aucune campagne</p>
        ) : (
          campaigns.map((c) => (
            <div key={c.id} className="bg-cire-chaude border border-or-pale rounded-[10px] p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-display text-base text-brun-chaud truncate">{c.name}</p>
                  <span className={`px-2 py-0.5 text-[10px] rounded-full shrink-0 ${CAMPAIGN_STATUS[c.status] || ""}`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-xs font-ui text-brun-mid truncate">{c.subject}</p>
                {c.status === "sent" && (
                  <p className="text-xs font-ui text-brun-mid/50 mt-1">
                    Envoy&eacute; le {new Date(c.sentAt!).toLocaleDateString("fr-FR")} &middot; {c.sentCount} envois
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                {c.status === "draft" && (
                  <>
                    <button onClick={() => openEdit(c)}
                      className="text-xs font-ui text-or-sacre hover:text-ambre-vif">Modifier</button>
                    <button onClick={() => handleSend(c.id)} disabled={sending === c.id}
                      className="text-xs font-ui text-foret hover:text-foret/70 disabled:opacity-50">
                      {sending === c.id ? "Envoi..." : "Envoyer"}
                    </button>
                    <button onClick={() => handleDelete(c.id)}
                      className="text-xs font-ui text-red-400 hover:text-red-600">&times;</button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Tab 3: Segments ──

function SegmentsTab() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/newsletter/subscribers")
      .then((r) => r.json())
      .then((data) => setSubscribers(data.subscribers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm font-ui text-brun-mid/60 text-center py-5">Chargement...</p>;

  // Compute segment & tag counts
  const tagCounts: Record<string, number> = {};
  const segmentCounts: Record<string, number> = {};
  const sourceCounts: Record<string, number> = {};

  for (const s of subscribers) {
    if (s.status !== "active") continue;
    for (const t of s.tags) tagCounts[t] = (tagCounts[t] || 0) + 1;
    for (const seg of s.segments) segmentCounts[seg] = (segmentCounts[seg] || 0) + 1;
    sourceCounts[s.source] = (sourceCounts[s.source] || 0) + 1;
  }

  const activeCount = subscribers.filter((s) => s.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
        <h3 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-3">Vue d&apos;ensemble</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="font-display text-2xl text-or-sacre">{activeCount}</p>
            <p className="text-xs font-ui text-brun-mid">Abonn&eacute;s actifs</p>
          </div>
          <div>
            <p className="font-display text-2xl text-or-sacre">{Object.keys(tagCounts).length}</p>
            <p className="text-xs font-ui text-brun-mid">Tags</p>
          </div>
          <div>
            <p className="font-display text-2xl text-or-sacre">{Object.keys(segmentCounts).length}</p>
            <p className="text-xs font-ui text-brun-mid">Segments</p>
          </div>
        </div>
      </div>

      {/* Tags */}
      {Object.keys(tagCounts).length > 0 && (
        <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
          <h3 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).map(([tag, count]) => (
              <span key={tag} className="px-3 py-1.5 bg-or-sacre/10 text-or-sacre text-sm font-ui rounded-full">
                {tag} <span className="text-or-sacre/60">({count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Segments */}
      {Object.keys(segmentCounts).length > 0 && (
        <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
          <h3 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-3">Segments</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(segmentCounts).sort((a, b) => b[1] - a[1]).map(([seg, count]) => (
              <span key={seg} className="px-3 py-1.5 bg-ambre-vif/10 text-ambre-profond text-sm font-ui rounded-full">
                {seg} <span className="opacity-60">({count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sources */}
      {Object.keys(sourceCounts).length > 0 && (
        <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
          <h3 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-3">Sources</h3>
          <div className="space-y-2">
            {Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).map(([source, count]) => (
              <div key={source} className="flex items-center justify-between">
                <span className="text-sm font-ui text-brun-chaud">{source}</span>
                <span className="text-sm font-ui text-brun-mid">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared ──

function FormField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-ui text-brun-mid mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre"
      />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

interface Pack {
  id: string;
  totalSessions: number;
  paidAt: string;
  amount: number | null;
  notes: string | null;
  createdAt: string;
}

interface AppointmentItem {
  id: string;
  scheduledAt: string;
  durationMin: number;
  status: string;
  sessionPackId: string | null;
  title: string;
}

export default function SessionPacksSection({ clientId }: { clientId: string }) {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [usedCount, setUsedCount] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ totalSessions: "10", paidAt: new Date().toISOString().split("T")[0], amount: "", notes: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const [packRes, apptRes] = await Promise.all([
      fetch(`/api/admin/session-packs?clientId=${clientId}`),
      fetch(`/api/admin/appointments?clientId=${clientId}`),
    ]);
    if (packRes.ok) {
      const d = await packRes.json();
      setPacks(d.packs || []);
      setTotalSessions(d.totalSessions || 0);
      setUsedCount(d.usedCount || 0);
      setRemaining(d.remaining || 0);
    }
    if (apptRes.ok) {
      const d = await apptRes.json();
      setAppointments(d.appointments || []);
    }
  }

  async function handleAdd() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/session-packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          totalSessions: Number(form.totalSessions),
          paidAt: form.paidAt,
          amount: form.amount ? Number(form.amount) : null,
          notes: form.notes || null,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ totalSessions: "10", paidAt: new Date().toISOString().split("T")[0], amount: "", notes: "" });
        fetchData();
      }
    } finally { setLoading(false); }
  }

  async function togglePackLink(appointmentId: string, currentPackId: string | null) {
    // If linked, unlink. If unlinked, link to first available pack.
    const newPackId = currentPackId ? null : (packs[0]?.id || null);
    if (!newPackId && !currentPackId) return;

    await fetch(`/api/admin/session-packs/${packs[0]?.id || "x"}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId, sessionPackId: newPackId }),
    });
    fetchData();
  }

  const pct = totalSessions > 0 ? Math.round((usedCount / totalSessions) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Decompte */}
      <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
        <h3 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-4">Decompte seances</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="font-display text-3xl text-or-sacre">{totalSessions}</p>
            <p className="text-xs font-ui text-brun-mid/60">Total prepayees</p>
          </div>
          <div className="text-center">
            <p className="font-display text-3xl text-brun-chaud">{usedCount}</p>
            <p className="text-xs font-ui text-brun-mid/60">Utilisees</p>
          </div>
          <div className="text-center">
            <p className={`font-display text-3xl ${remaining <= 0 ? "text-red-600" : remaining <= 2 ? "text-orange-500" : "text-foret"}`}>
              {remaining}
            </p>
            <p className="text-xs font-ui text-brun-mid/60">Restantes</p>
          </div>
        </div>
        {totalSessions > 0 && (
          <div className="h-3 bg-or-pale/30 rounded-full">
            <div
              className={`h-full rounded-full transition-all ${remaining <= 0 ? "bg-red-500" : remaining <= 2 ? "bg-orange-400" : "bg-foret"}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Prepaiements */}
      <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-caps text-sm text-brun-mid uppercase tracking-wider">Prepaiements</h3>
          <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-or-sacre text-white text-xs font-ui uppercase tracking-wider rounded-sharp hover:bg-ambre-vif">
            {showForm ? "Annuler" : "Ajouter un prepaiement"}
          </button>
        </div>

        {showForm && (
          <div className="border border-or-sacre rounded-lg p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-ui text-brun-mid/60 mb-1">Nombre de seances</label>
                <input type="number" value={form.totalSessions} onChange={(e) => setForm({ ...form, totalSessions: e.target.value })} className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud" />
              </div>
              <div>
                <label className="block text-xs font-ui text-brun-mid/60 mb-1">Date paiement</label>
                <input type="date" value={form.paidAt} onChange={(e) => setForm({ ...form, paidAt: e.target.value })} className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud" />
              </div>
              <div>
                <label className="block text-xs font-ui text-brun-mid/60 mb-1">Montant (optionnel)</label>
                <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="EUR" className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud" />
              </div>
              <div>
                <label className="block text-xs font-ui text-brun-mid/60 mb-1">Notes</label>
                <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes internes..." className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud" />
              </div>
            </div>
            <button onClick={handleAdd} disabled={loading} className="px-4 py-2 bg-or-sacre text-white text-xs font-ui uppercase rounded-sharp hover:bg-ambre-vif disabled:opacity-50">
              {loading ? "..." : "Enregistrer"}
            </button>
          </div>
        )}

        {packs.length === 0 ? (
          <p className="text-sm text-brun-mid/60 font-ui text-center py-3">Aucun prepaiement.</p>
        ) : (
          <div className="space-y-2">
            {packs.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 border border-or-pale/30 rounded-lg">
                <div>
                  <p className="text-sm font-ui text-brun-chaud">{p.totalSessions} seances</p>
                  <p className="text-xs font-ui text-brun-mid/50">
                    Paye le {new Date(p.paidAt).toLocaleDateString("fr-FR")}
                    {p.amount ? ` · ${p.amount} EUR` : ""}
                  </p>
                </div>
                {p.notes && <p className="text-xs font-ui text-brun-mid/40 max-w-[200px] truncate">{p.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historique seances */}
      <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
        <h3 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-4">Historique seances</h3>
        {appointments.length === 0 ? (
          <p className="text-sm text-brun-mid/60 font-ui text-center py-3">Aucune seance.</p>
        ) : (
          <div className="space-y-2">
            {appointments.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 border border-or-pale/30 rounded-lg">
                <div>
                  <p className="text-sm font-ui text-brun-chaud">
                    {new Date(a.scheduledAt).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                    {" · "}
                    {new Date(a.scheduledAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-xs font-ui text-brun-mid/50">{a.durationMin} min · {a.status}</p>
                </div>
                <button
                  onClick={() => togglePackLink(a.id, a.sessionPackId)}
                  className={`text-xs font-ui px-2 py-1 rounded-sharp ${a.sessionPackId ? "bg-foret/10 text-foret" : "bg-brun-mid/10 text-brun-mid/50 hover:bg-or-sacre/10 hover:text-or-sacre"}`}
                >
                  {a.sessionPackId ? "Sur pack" : "Hors pack"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Appointment {
  id: string;
  clientId: string;
  title: string;
  scheduledAt: string;
  durationMin: number;
  status: string;
  zoomJoinUrl: string | null;
  zoomStartUrl: string | null;
  client: { user: { name: string } };
}

interface Slot {
  start: string;
  available: boolean;
  busyCaldav?: boolean;
}

interface ClientOption {
  id: string;
  user: { name: string; email: string };
}

const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export default function AgendaPage() {
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [slots, setSlots] = useState<Record<string, Slot[]>>({});

  // Modal state
  const [modal, setModal] = useState<{ date: string; time: string } | null>(null);
  const [form, setForm] = useState({ clientId: "", durationMin: "60", notes: "", useFromPack: true, meetingType: "zoom" as "zoom" | "presentiel" });
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [weekStart]);

  function fetchData() {
    const month = weekStart.toISOString().slice(0, 7);
    fetch(`/api/admin/appointments?month=${month}`)
      .then((r) => r.json())
      .then((d) => setAppointments(d.appointments || []))
      .catch(() => {});

    const start = weekStart.toISOString().split("T")[0];
    fetch(`/api/availability?start=${start}&days=7`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots || {}))
      .catch(() => {});
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce RDV ?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/appointments/${id}`, { method: "DELETE" });
      fetchData();
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  }

  function openModal(slotStart: string) {
    setModal({
      date: slotStart.split("T")[0],
      time: slotStart,
    });
    setForm({ clientId: "", durationMin: "60", notes: "", useFromPack: true, meetingType: "zoom" });
    setCreateResult("");
  }

  async function handleCreate() {
    if (!form.clientId || !modal) return;
    setCreating(true);
    setCreateResult("");
    try {
      const res = await fetch("/api/admin/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: form.clientId,
          scheduledAt: modal.time,
          durationMin: Number(form.durationMin) || 60,
          notes: form.notes || null,
          sendEmail: true,
          useFromPack: form.useFromPack,
          meetingType: form.meetingType,
        }),
      });
      if (res.ok) {
        setCreateResult("ok");
        setModal(null);
        fetchData();
      } else {
        const data = await res.json();
        setCreateResult(data.error || "Erreur");
      }
    } catch {
      setCreateResult("Erreur de connexion");
    } finally {
      setCreating(false);
    }
  }

  function prevWeek() {
    setWeekStart((w) => { const d = new Date(w); d.setDate(d.getDate() - 7); return d; });
  }
  function nextWeek() {
    setWeekStart((w) => { const d = new Date(w); d.setDate(d.getDate() + 7); return d; });
  }

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
  });

  const apptsByDate: Record<string, Appointment[]> = {};
  appointments.forEach((a) => {
    const key = a.scheduledAt.split("T")[0];
    if (!apptsByDate[key]) apptsByDate[key] = [];
    apptsByDate[key].push(a);
  });

  // Extract unique clients from appointments for the dropdown
  const knownClients: ClientOption[] = [];
  const seen = new Set<string>();
  appointments.forEach((a) => {
    if (!seen.has(a.clientId)) {
      seen.add(a.clientId);
      knownClients.push({ id: a.clientId, user: a.client.user } as ClientOption);
    }
  });

  return (
    <div>
      <Link href="/admin/dashboard" className="text-[13px] font-ui text-brun-mid/50 hover:text-or-sacre transition-colors mb-4 inline-block">
        &larr; Cockpit
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-brun-chaud">Agenda</h1>
        <div className="flex items-center gap-3">
          <button onClick={prevWeek} className="px-3 py-1.5 border border-or-pale text-brun-mid text-xs font-ui rounded-sharp hover:border-or-sacre">&larr;</button>
          <span className="text-sm font-ui text-brun-chaud">
            {weekStart.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
            {" — "}
            {days[6].toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </span>
          <button onClick={nextWeek} className="px-3 py-1.5 border border-or-pale text-brun-mid text-xs font-ui rounded-sharp hover:border-or-sacre">&rarr;</button>
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const key = day.toISOString().split("T")[0];
          const daySlots = slots[key] || [];
          const dayAppts = apptsByDate[key] || [];
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <div key={key} className={`border rounded-[10px] p-3 min-h-[200px] ${isWeekend ? "bg-brun-mid/5 border-brun-mid/10" : "bg-cire-chaude border-or-pale"}`}>
              <p className="font-caps text-xs text-brun-mid uppercase tracking-wider mb-2 text-center">
                {DAYS_FR[day.getDay()]} {day.getDate()}
              </p>

              {/* Existing appointments */}
              {dayAppts.map((a) => (
                <div key={a.id} className={`flex items-center gap-1 mb-1 rounded text-xs font-ui ${
                  a.status === "CANCELLED"
                    ? "bg-red-50 text-red-600 line-through"
                    : "bg-or-sacre/15 text-brun-chaud"
                }`}>
                  <Link
                    href={`/admin/clients/${a.clientId}`}
                    className="flex-1 px-2 py-1.5 hover:bg-or-sacre/25 rounded transition-colors"
                  >
                    <span className="font-medium">
                      {new Date(a.scheduledAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {" "}{a.client.user.name.split(" ")[0]}
                  </Link>
                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={deleting === a.id}
                    className="px-1.5 py-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-30"
                    title="Supprimer"
                  >
                    {deleting === a.id ? "…" : "✕"}
                  </button>
                </div>
              ))}

              {/* All slots — 3 states: free, CalDAV busy (clickable), DB busy (disabled) */}
              {daySlots.map((s) => (
                <button
                  key={s.start}
                  onClick={() => s.available ? openModal(s.start) : undefined}
                  disabled={!s.available}
                  className={`w-full text-[10px] font-ui text-center py-1 rounded mb-0.5 transition-colors ${
                    !s.available
                      ? "text-brun-mid/25 bg-brun-mid/5 cursor-default"
                      : s.busyCaldav
                        ? "text-ambre-vif/70 bg-ambre-vif/10 hover:bg-ambre-vif/20 cursor-pointer"
                        : "text-foret/50 bg-foret/5 hover:bg-foret/15 hover:text-foret cursor-pointer"
                  }`}
                  title={s.busyCaldav && s.available ? "Occupé iPhone — cliquer pour créer quand même" : undefined}
                >
                  {new Date(s.start).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  {s.busyCaldav && s.available ? " ●" : ""}
                </button>
              ))}
            </div>
          );
        })}
      </div>

      {/* Modal creation RDV */}
      {modal && (
        <CreateAppointmentModal
          dateTime={modal.time}
          knownClients={knownClients}
          form={form}
          setForm={setForm}
          creating={creating}
          createResult={createResult}
          onCreate={handleCreate}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function CreateAppointmentModal({
  dateTime,
  knownClients,
  form,
  setForm,
  creating,
  createResult,
  onCreate,
  onClose,
}: {
  dateTime: string;
  knownClients: ClientOption[];
  form: { clientId: string; durationMin: string; notes: string; useFromPack: boolean; meetingType: "zoom" | "presentiel" };
  setForm: (f: { clientId: string; durationMin: string; notes: string; useFromPack: boolean; meetingType: "zoom" | "presentiel" }) => void;
  creating: boolean;
  createResult: string;
  onCreate: () => void;
  onClose: () => void;
}) {
  const [allClients, setAllClients] = useState<ClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  useEffect(() => {
    fetch("/api/admin/clients-list")
      .then((r) => r.json())
      .then((data) => {
        setAllClients((data.clients || []).map((c: any) => ({ id: c.id, user: c.user })));
        setLoadingClients(false);
      })
      .catch(() => {
        setAllClients(knownClients);
        setLoadingClients(false);
      });
  }, []);

  const d = new Date(dateTime);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-creme-sacree border border-or-pale rounded-[10px] p-6 w-full max-w-md shadow-xl">
        <h3 className="font-display text-lg text-brun-chaud mb-1">Nouveau RDV</h3>
        <p className="text-sm font-ui text-brun-mid mb-4">
          {d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          {" a "}
          {d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-ui text-brun-mid/60 mb-1">Client</label>
            {loadingClients ? (
              <p className="text-xs font-ui text-brun-mid/40">Chargement...</p>
            ) : (
              <select
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud"
              >
                <option value="">Choisir un client...</option>
                {allClients.map((c) => (
                  <option key={c.id} value={c.id}>{c.user.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Type de RDV */}
          <div>
            <label className="block text-xs font-ui text-brun-mid/60 mb-2">Type de RDV</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="meetingType"
                  value="zoom"
                  checked={form.meetingType === "zoom"}
                  onChange={() => setForm({ ...form, meetingType: "zoom" })}
                  className="accent-or-sacre"
                />
                <span className="text-sm font-ui text-brun-chaud">Zoom</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="meetingType"
                  value="presentiel"
                  checked={form.meetingType === "presentiel"}
                  onChange={() => setForm({ ...form, meetingType: "presentiel" })}
                  className="accent-or-sacre"
                />
                <span className="text-sm font-ui text-brun-chaud">Présentiel</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-ui text-brun-mid/60 mb-1">Duree (min)</label>
            <select
              value={form.durationMin}
              onChange={(e) => setForm({ ...form, durationMin: e.target.value })}
              className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud"
            >
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">60 min</option>
              <option value="90">90 min</option>
              <option value="120">120 min</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-ui text-brun-mid/60 mb-1">Notes internes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Notes pour Joffrey uniquement..."
              className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud resize-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-ui text-brun-mid cursor-pointer">
              <input
                type="checkbox"
                checked={form.useFromPack}
                onChange={(e) => setForm({ ...form, useFromPack: e.target.checked })}
                className="accent-or-sacre"
              />
              Decompter du pack prepaye
            </label>
          </div>
        </div>

        {createResult && createResult !== "ok" && (
          <p className="text-xs font-ui text-red-600 mt-3">{createResult}</p>
        )}

        <div className="flex gap-3 justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-or-pale text-brun-mid text-xs font-ui uppercase rounded-sharp hover:bg-cire-chaude transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onCreate}
            disabled={creating || !form.clientId}
            className="px-4 py-2 bg-or-sacre text-white text-xs font-ui uppercase rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-50"
          >
            {creating ? "Creation..." : "Confirmer le RDV"}
          </button>
        </div>
      </div>
    </div>
  );
}

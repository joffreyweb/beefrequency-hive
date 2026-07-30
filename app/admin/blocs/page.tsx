"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface PEvent {
  id: string;
  title: string;
  scheduledAt: string;
  durationMin: number;
  notes: string | null;
}

export default function BlocsPage() {
  const [events, setEvents] = useState<PEvent[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState(60);
  const [busy, setBusy] = useState(false);
  // Rappel du soir
  const [shutdownEnabled, setShutdownEnabled] = useState(false);
  const [shutdownHour, setShutdownHour] = useState(20);
  const [msg, setMsg] = useState("");

  async function load() {
    const [ev, st] = await Promise.all([
      fetch("/api/admin/personal-events").then((r) => r.json()),
      fetch("/api/admin/settings").then((r) => r.json()),
    ]);
    setEvents(ev.events || []);
    setShutdownEnabled(!!st.shutdownEnabled);
    setShutdownHour(st.shutdownHour ?? 20);
  }
  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!title.trim() || !date) return;
    setBusy(true);
    try {
      const scheduledAt = new Date(`${date}T${time || "09:00"}`).toISOString();
      await fetch("/api/admin/personal-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, scheduledAt, durationMin: duration }),
      });
      setTitle("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string) {
    await fetch(`/api/admin/personal-events/${id}`, { method: "DELETE" });
    await load();
  }

  async function saveShutdown() {
    setMsg("");
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shutdownEnabled, shutdownHour }),
    });
    setMsg("Enregistré ✓");
  }

  function fmt(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Brussels",
    });
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-5">
        <p className="font-caps text-[11px] tracking-[0.2em] uppercase text-or-sacre">Agenda interne</p>
        <h1 className="font-display text-3xl text-brun-chaud mt-0.5">Blocs perso</h1>
        <p className="font-ui text-sm text-brun-mid/70 mt-1">
          Tes blocs de temps personnels — ils s&apos;affichent dans l&apos;Agenda du jour de Ma Journée, à côté des RDV clients.
        </p>
      </div>

      {/* Ajout bloc */}
      <div className="bg-cire-chaude border border-or-pale rounded-[12px] p-5 mb-6 space-y-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Intitulé du bloc…" className="w-full px-3 py-2 font-ui text-sm bg-creme-sacree border border-or-pale rounded-[8px] focus:outline-none focus:border-or-sacre" />
        <div className="flex flex-wrap gap-2 items-center">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 font-ui text-sm bg-creme-sacree border border-or-pale rounded-[8px] focus:outline-none focus:border-or-sacre" />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="px-3 py-2 font-ui text-sm bg-creme-sacree border border-or-pale rounded-[8px] focus:outline-none focus:border-or-sacre" />
          <span className="flex items-center gap-1 font-ui text-sm text-brun-mid/70">
            <input type="number" min={15} step={15} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-16 px-2 py-2 bg-creme-sacree border border-or-pale rounded-[8px] focus:outline-none focus:border-or-sacre" /> min
          </span>
          <button onClick={add} disabled={busy || !title.trim() || !date} className="px-4 py-2 font-caps text-sm bg-or-sacre text-white rounded-[8px] hover:bg-ambre-profond disabled:opacity-30">Ajouter</button>
        </div>
      </div>

      {/* Liste blocs */}
      <div className="space-y-2 mb-8">
        {events.length === 0 ? (
          <p className="font-ui text-sm text-brun-mid/50">Aucun bloc à venir.</p>
        ) : (
          events.map((ev) => (
            <div key={ev.id} className="flex items-center gap-3 p-3 bg-cire-chaude border border-or-pale rounded-[10px]">
              <span className="font-caps text-sm text-or-sacre shrink-0">{fmt(ev.scheduledAt)}</span>
              <span className="flex-1 min-w-0 font-ui text-sm text-brun-chaud truncate">{ev.title}</span>
              <span className="text-[11px] font-ui text-brun-mid/50">{ev.durationMin} min</span>
              <button onClick={() => del(ev.id)} className="text-[11px] font-ui text-brun-mid/40 hover:text-red-500">✕</button>
            </div>
          ))
        )}
      </div>

      {/* Rappel du soir */}
      <div className="bg-cire-chaude border border-or-pale rounded-[12px] p-5 space-y-3">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider">Rappel du soir</h2>
        <label className="flex items-center gap-2 font-ui text-sm text-brun-chaud">
          <input type="checkbox" checked={shutdownEnabled} onChange={(e) => setShutdownEnabled(e.target.checked)} className="accent-or-sacre" />
          Activer le rappel du soir (« As-tu posté ? Prépare demain »)
        </label>
        <div className="flex items-center gap-2">
          <label className="font-ui text-sm text-brun-chaud">Heure</label>
          <input type="number" min={0} max={23} value={shutdownHour} onChange={(e) => setShutdownHour(Number(e.target.value))} className="w-16 px-2 py-1.5 font-ui text-sm bg-creme-sacree border border-or-pale rounded-[8px] focus:outline-none focus:border-or-sacre" />
          <span className="font-ui text-xs text-brun-mid/60">h (Europe/Brussels)</span>
          <button onClick={saveShutdown} className="ml-2 px-4 py-2 font-caps text-sm bg-or-sacre text-white rounded-[8px] hover:bg-ambre-profond">Enregistrer</button>
          {msg && <span className="font-ui text-xs text-brun-mid/70">{msg}</span>}
        </div>
      </div>

      <div className="mt-6">
        <Link href="/admin/journee" className="font-ui text-sm text-brun-mid/60 hover:text-or-sacre">← Ma Journée</Link>
      </div>
    </div>
  );
}

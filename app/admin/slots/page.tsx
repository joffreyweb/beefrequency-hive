"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

interface Slot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export default function AdminSlotsPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [newDay, setNewDay] = useState(1);
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("10:00");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSlots();
  }, []);

  async function fetchSlots() {
    const res = await fetch("/api/admin/slots");
    if (res.ok) {
      const data = await res.json();
      setSlots(data.slots);
    }
  }

  async function addSlot() {
    setLoading(true);
    try {
      await fetch("/api/admin/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayOfWeek: newDay, startTime: newStart, endTime: newEnd }),
      });
      await fetchSlots();
    } finally {
      setLoading(false);
    }
  }

  async function deleteSlot(id: string) {
    await fetch(`/api/admin/slots?id=${id}`, { method: "DELETE" });
    await fetchSlots();
  }

  // Group slots by day
  const slotsByDay = DAYS.map((name, i) => ({
    name,
    dayOfWeek: i,
    slots: slots.filter((s) => s.dayOfWeek === i),
  }));

  return (
    <div>
      <Link href="/admin/dashboard" className="text-[13px] font-ui text-brun-mid/50 hover:text-or-sacre transition-colors mb-4 inline-block">
        &larr; Cockpit
      </Link>

      <h1 className="font-display text-2xl text-brun-chaud mb-6">Creneaux disponibles</h1>

      {/* Ajouter un creneau */}
      <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5 mb-6">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-4">
          Ajouter un creneau
        </h2>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs font-ui text-brun-mid/60 mb-1">Jour</label>
            <select
              value={newDay}
              onChange={(e) => setNewDay(Number(e.target.value))}
              className="px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud"
            >
              {DAYS.map((d, i) => (
                <option key={i} value={i}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-ui text-brun-mid/60 mb-1">Debut</label>
            <input
              type="time"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              className="px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud"
            />
          </div>
          <div>
            <label className="block text-xs font-ui text-brun-mid/60 mb-1">Fin</label>
            <input
              type="time"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              className="px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud"
            />
          </div>
          <button
            onClick={addSlot}
            disabled={loading}
            className="px-4 py-2 bg-or-sacre text-white text-xs font-ui uppercase tracking-wider rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-50"
          >
            {loading ? "..." : "Ajouter"}
          </button>
        </div>
      </div>

      {/* Agenda semaine */}
      <div className="grid grid-cols-7 gap-2">
        {slotsByDay.map((day) => (
          <div key={day.dayOfWeek} className="bg-cire-chaude border border-or-pale rounded-[10px] p-3">
            <h3 className="font-caps text-xs text-brun-mid uppercase tracking-wider mb-2 text-center">
              {day.name}
            </h3>
            {day.slots.length === 0 ? (
              <p className="text-xs text-brun-mid/30 text-center font-ui">—</p>
            ) : (
              <div className="space-y-1.5">
                {day.slots.map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between bg-or-sacre/10 rounded px-2 py-1.5">
                    <span className="text-xs font-ui text-brun-chaud">
                      {slot.startTime}-{slot.endTime}
                    </span>
                    <button
                      onClick={() => deleteSlot(slot.id)}
                      className="text-red-400 hover:text-red-600 text-xs"
                      title="Supprimer"
                    >
                      {"\u2715"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

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
}

const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export default function AgendaPage() {
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1); // Monday
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [slots, setSlots] = useState<Record<string, Slot[]>>({});
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);

  useEffect(() => {
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
  }, [weekStart]);

  function prevWeek() {
    setWeekStart((w) => {
      const d = new Date(w);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }

  function nextWeek() {
    setWeekStart((w) => {
      const d = new Date(w);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }

  // Build 7 days from weekStart
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  // Map appointments by date key
  const apptsByDate: Record<string, Appointment[]> = {};
  appointments.forEach((a) => {
    const key = a.scheduledAt.split("T")[0];
    if (!apptsByDate[key]) apptsByDate[key] = [];
    apptsByDate[key].push(a);
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
                <Link
                  key={a.id}
                  href={`/admin/clients/${a.clientId}`}
                  className={`block mb-1 px-2 py-1.5 rounded text-xs font-ui transition-colors ${
                    a.status === "CANCELLED"
                      ? "bg-red-50 text-red-600 line-through"
                      : "bg-or-sacre/15 text-brun-chaud hover:bg-or-sacre/25"
                  }`}
                >
                  <span className="font-medium">
                    {new Date(a.scheduledAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {" "}{a.client.user.name.split(" ")[0]}
                </Link>
              ))}

              {/* Available slots (only show hours, clickable) */}
              {!isWeekend && daySlots.filter((s) => s.available).length > 0 && dayAppts.length === 0 && (
                <div className="space-y-0.5 mt-1">
                  {daySlots.filter((s) => s.available).slice(0, 4).map((s) => (
                    <div
                      key={s.start}
                      className="text-[10px] font-ui text-foret/40 text-center py-0.5 rounded bg-foret/5 cursor-default"
                    >
                      {new Date(s.start).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  ))}
                  {daySlots.filter((s) => s.available).length > 4 && (
                    <p className="text-[9px] text-brun-mid/30 text-center">+{daySlots.filter((s) => s.available).length - 4}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

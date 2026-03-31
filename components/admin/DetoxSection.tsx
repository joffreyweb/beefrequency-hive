"use client";

import { useState, useEffect, useCallback } from "react";

interface DetoxDay {
  id: string;
  clientId: string;
  dayNumber: number;
  date: string;
  elixirDone: boolean;
  protocolDone: boolean;
  pratiqueDone: boolean;
  notes: string | null;
}

interface DetoxSectionProps {
  clientId: string;
}

const STATUS_COLORS: Record<string, string> = {
  done: "border-foret/30 bg-foret/5",
  active: "border-or-sacre bg-or-sacre/5",
  upcoming: "border-or-pale bg-cire-chaude",
};

export default function DetoxSection({ clientId }: DetoxSectionProps) {
  const [days, setDays] = useState<DetoxDay[]>([]);
  const [detoxStartDate, setDetoxStartDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");

  const fetchDays = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/detox-days?clientId=${clientId}`);
      const data = await res.json();
      if (res.ok) {
        setDays(data.days || []);
        setDetoxStartDate(data.detoxStartDate);
      }
    } catch {
      // Silencieux
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchDays();
  }, [fetchDays]);

  // Toggle une checkbox instantanément
  async function toggleField(dayId: string, field: string, currentValue: boolean) {
    // Optimistic update
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId ? { ...d, [field]: !currentValue } : d
      )
    );

    await fetch("/api/admin/detox-days", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayId, field, value: !currentValue }),
    });
  }

  // Sauvegarder les notes
  async function saveNotes(dayId: string) {
    await fetch("/api/admin/detox-days", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayId, field: "notes", value: notesValue || null }),
    });

    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId ? { ...d, notes: notesValue || null } : d
      )
    );
    setEditingNotes(null);
  }

  // Calcul de la progression
  const completedDays = days.filter(
    (d) => d.elixirDone && d.protocolDone && d.pratiqueDone
  ).length;
  const totalChecks = days.reduce(
    (sum, d) =>
      sum + (d.elixirDone ? 1 : 0) + (d.protocolDone ? 1 : 0) + (d.pratiqueDone ? 1 : 0),
    0
  );
  const progressPct = days.length > 0 ? Math.round((totalChecks / (days.length * 3)) * 100) : 0;

  // Déterminer le jour actuel de la détox
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const detoxStart = detoxStartDate ? new Date(detoxStartDate) : null;
  if (detoxStart) detoxStart.setHours(0, 0, 0, 0);
  const currentDetoxDay = detoxStart
    ? Math.floor((today.getTime() - detoxStart.getTime()) / 86400000) + 1
    : 0;

  if (loading) {
    return (
      <p className="font-ui text-sm text-brun-mid/60">Chargement de la détox…</p>
    );
  }

  if (!detoxStartDate) {
    return (
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-6 text-center">
        <p className="font-ui text-sm text-brun-mid/60">
          La détox n&apos;a pas encore démarré pour ce client.
        </p>
        <p className="font-ui text-xs text-brun-mid/40 mt-1">
          Le programme détox démarre automatiquement quand le client confirme la réception de ses élixirs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header + barre de progression */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-caps text-sm text-brun-mid uppercase tracking-wider">
            Programme Détox — 10 jours
          </h3>
          <span className="font-ui text-xs text-brun-mid/60">
            {completedDays}/10 jours complétés
          </span>
        </div>

        {/* Barre progression */}
        <div className="h-2.5 bg-creme-sacree rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPct}%`,
              background:
                progressPct === 100
                  ? "linear-gradient(90deg, #2D5A3D, #4A8F5A)"
                  : "linear-gradient(90deg, #B8821E, #D4A84B)",
            }}
          />
        </div>
        <p className="font-ui text-[10px] text-brun-mid/50 mt-1 text-right">
          {progressPct}% — {totalChecks}/30 tâches
        </p>
      </div>

      {/* Grille des 10 jours */}
      <div className="space-y-2">
        {days.map((day) => {
          const dayDate = new Date(day.date);
          const isToday = currentDetoxDay === day.dayNumber;
          const isPast = day.dayNumber < currentDetoxDay;
          const allDone = day.elixirDone && day.protocolDone && day.pratiqueDone;

          let statusClass = STATUS_COLORS.upcoming;
          if (allDone) statusClass = STATUS_COLORS.done;
          else if (isToday) statusClass = STATUS_COLORS.active;
          else if (isPast && !allDone) statusClass = "border-red-200 bg-red-50/30";

          return (
            <div
              key={day.id}
              className={`border rounded-sm p-4 transition-colors ${statusClass}`}
            >
              <div className="flex items-center justify-between mb-2">
                {/* Numéro du jour + date */}
                <div className="flex items-center gap-2">
                  <span
                    className={`font-caps text-xs uppercase tracking-wider ${
                      isToday
                        ? "text-or-sacre font-medium"
                        : allDone
                          ? "text-foret"
                          : "text-brun-mid"
                    }`}
                  >
                    Jour {day.dayNumber}
                  </span>
                  <span className="font-ui text-[10px] text-brun-mid/50">
                    {dayDate.toLocaleDateString("fr-FR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  {isToday && (
                    <span className="text-[9px] bg-or-sacre text-white px-1.5 py-0.5 rounded-full font-ui">
                      Aujourd&apos;hui
                    </span>
                  )}
                </div>

                {/* Status compact */}
                {allDone && (
                  <span className="text-[9px] bg-foret/10 text-foret px-2 py-0.5 rounded-full font-ui">
                    Complété
                  </span>
                )}
              </div>

              {/* Checkboxes */}
              <div className="flex gap-6">
                <CheckboxItem
                  label="Élixirs"
                  checked={day.elixirDone}
                  onChange={() => toggleField(day.id, "elixirDone", day.elixirDone)}
                />
                <CheckboxItem
                  label="Protocole"
                  checked={day.protocolDone}
                  onChange={() => toggleField(day.id, "protocolDone", day.protocolDone)}
                />
                <CheckboxItem
                  label="Pratique"
                  checked={day.pratiqueDone}
                  onChange={() => toggleField(day.id, "pratiqueDone", day.pratiqueDone)}
                />
              </div>

              {/* Notes */}
              <div className="mt-2">
                {editingNotes === day.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      placeholder="Notes du jour…"
                      className="flex-1 px-2 py-1 bg-creme-sacree border border-or-pale rounded-sm text-xs font-ui text-brun-chaud focus:outline-none focus:border-or-sacre"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveNotes(day.id);
                        if (e.key === "Escape") setEditingNotes(null);
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => saveNotes(day.id)}
                      className="text-[10px] font-ui text-or-sacre hover:text-ambre-vif"
                    >
                      OK
                    </button>
                    <button
                      onClick={() => setEditingNotes(null)}
                      className="text-[10px] font-ui text-brun-mid/50 hover:text-brun-mid"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingNotes(day.id);
                      setNotesValue(day.notes || "");
                    }}
                    className="font-ui text-[10px] text-brun-mid/40 hover:text-brun-mid transition-colors"
                  >
                    {day.notes ? (
                      <span className="text-brun-mid/60 italic">{day.notes}</span>
                    ) : (
                      "+ Ajouter une note"
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Checkbox item ───

function CheckboxItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer select-none group">
      <div
        onClick={onChange}
        className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-colors ${
          checked
            ? "bg-foret border-foret"
            : "border-brun-mid/30 group-hover:border-or-sacre"
        }`}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span
        className={`font-ui text-xs ${
          checked ? "text-foret" : "text-brun-mid"
        }`}
      >
        {label}
      </span>
    </label>
  );
}

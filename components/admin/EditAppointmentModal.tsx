"use client";

import { useEffect, useState } from "react";
import DurationPicker from "@/components/admin/DurationPicker";

interface AppointmentLite {
  id: string;
  scheduledAt: string;
  durationMin: number;
  client: { user: { name: string } };
}

interface Props {
  appointment: AppointmentLite;
  onClose: () => void;
  onSaved: () => void;
}

const TZ = "Europe/Brussels";

function toLocalParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value || "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

function buildISOInBrussels(date: string, time: string): string {
  // Convertit "YYYY-MM-DD" + "HH:MM" (pensés Europe/Brussels) en ISO UTC
  const localRef = new Date(`${date}T${time}:00`);
  const localStr = localRef.toLocaleString("en-US", { timeZone: "UTC" });
  const tzStr = localRef.toLocaleString("en-US", { timeZone: TZ });
  const diff = new Date(localStr).getTime() - new Date(tzStr).getTime();
  return new Date(localRef.getTime() + diff).toISOString();
}

export default function EditAppointmentModal({ appointment, onClose, onSaved }: Props) {
  const initial = toLocalParts(appointment.scheduledAt);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [durationMin, setDurationMin] = useState(String(appointment.durationMin));
  const [sendEmail, setSendEmail] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const durNum = Number(durationMin);
      if (!Number.isFinite(durNum) || durNum < 15 || durNum > 480) {
        setError("Durée invalide (15–480 min)");
        setSaving(false);
        return;
      }
      const scheduledAt = buildISOInBrussels(date, time);
      const res = await fetch(`/api/admin/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt,
          durationMin: durNum,
          sendEmail,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Erreur lors de la modification");
        return;
      }
      onSaved();
      onClose();
    } catch (e) {
      setError("Erreur de connexion");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-creme-sacree border border-or-pale rounded-[10px] p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg text-brun-chaud mb-1">Modifier le RDV</h3>
        <p className="text-sm font-ui text-brun-mid mb-4">{appointment.client.user.name}</p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-ui text-brun-mid/60 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud"
            />
          </div>

          <div>
            <label className="block text-xs font-ui text-brun-mid/60 mb-1">Heure</label>
            <input
              type="time"
              value={time}
              step={60 * 15}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud"
            />
          </div>

          <div>
            <label className="block text-xs font-ui text-brun-mid/60 mb-1">Durée (min)</label>
            <DurationPicker value={durationMin} onChange={setDurationMin} />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-ui text-brun-mid cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="accent-or-sacre"
              />
              Notifier le client par email
            </label>
          </div>
        </div>

        {error && <p className="text-xs font-ui text-red-600 mt-3">{error}</p>}

        <div className="flex gap-3 justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-or-pale text-brun-mid text-xs font-ui uppercase rounded-sharp hover:bg-cire-chaude transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-or-sacre text-white text-xs font-ui uppercase rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

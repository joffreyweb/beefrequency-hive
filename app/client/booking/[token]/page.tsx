"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface Slot {
  start: string;
  available: boolean;
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [valid, setValid] = useState<boolean | null>(null);
  const [clientName, setClientName] = useState("");
  const [error, setError] = useState("");
  const [slots, setSlots] = useState<Record<string, Slot[]>>({});
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [done, setDone] = useState(false);
  const [zoomUrl, setZoomUrl] = useState("");

  useEffect(() => {
    // Validate token
    fetch(`/api/booking/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.valid) {
          setValid(true);
          setClientName(d.clientName || "");
        } else {
          setValid(false);
          setError(d.error || "Lien invalide");
        }
      })
      .catch(() => { setValid(false); setError("Erreur de connexion"); });

    // Load slots
    const start = new Date().toISOString().split("T")[0];
    fetch(`/api/availability?start=${start}&days=21`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots || {}))
      .catch(() => {});
  }, [token]);

  async function handleBook() {
    if (!selectedSlot) return;
    setBooking(true);
    try {
      const res = await fetch(`/api/booking/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: selectedSlot }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
        setZoomUrl(data.appointment?.zoomJoinUrl || "");
      } else {
        setError(data.error || "Erreur");
      }
    } finally {
      setBooking(false);
    }
  }

  if (valid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-creme-sacree">
        <p className="font-ui text-sm text-brun-mid/60">Chargement...</p>
      </div>
    );
  }

  if (!valid || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-creme-sacree px-4">
        <div className="text-center">
          <h1 className="font-display text-2xl text-brun-chaud mb-2">Lien invalide</h1>
          <p className="font-ui text-sm text-brun-mid">{error}</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-creme-sacree px-4">
        <div className="text-center max-w-sm">
          <h1 className="font-display text-2xl text-brun-chaud mb-3">Session confirmee</h1>
          <p className="font-ui text-sm text-brun-mid mb-2">
            {new Date(selectedSlot!).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            {" a "}
            {new Date(selectedSlot!).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="font-ui text-sm text-brun-mid mb-4">
            Tu recevras un email de confirmation avec le lien Zoom.
          </p>
          {zoomUrl && (
            <a href={zoomUrl} target="_blank" rel="noopener noreferrer" className="inline-block px-6 py-2.5 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif">
              Lien Zoom
            </a>
          )}
        </div>
      </div>
    );
  }

  const sortedDates = Object.keys(slots).sort();

  return (
    <div className="min-h-screen bg-creme-sacree px-4 py-8">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-brun-chaud">Hive</h1>
          <p className="font-caps text-sm text-or-sacre tracking-widest mt-1">BeeFrequency</p>
          <p className="font-ui text-sm text-brun-mid mt-4">
            Bonjour {clientName?.split(" ")[0]}. Choisis ton creneau.
          </p>
        </div>

        <div className="space-y-4">
          {sortedDates.map((date) => {
            const daySlots = slots[date].filter((s) => s.available);
            if (daySlots.length === 0) return null;

            return (
              <div key={date} className="bg-cire-chaude border border-or-pale rounded-[10px] p-4">
                <p className="font-caps text-xs text-brun-mid uppercase tracking-wider mb-3">
                  {new Date(date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                <div className="flex flex-wrap gap-2">
                  {daySlots.map((s) => {
                    const isSelected = selectedSlot === s.start;
                    return (
                      <button
                        key={s.start}
                        onClick={() => setSelectedSlot(s.start)}
                        className={`px-4 py-2 rounded-lg text-sm font-ui transition-colors ${
                          isSelected
                            ? "bg-or-sacre text-white"
                            : "bg-creme-sacree border border-or-pale text-brun-chaud hover:border-or-sacre"
                        }`}
                      >
                        {new Date(s.start).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {selectedSlot && (
          <div className="mt-6 text-center">
            <button
              onClick={handleBook}
              disabled={booking}
              className="px-8 py-3 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif disabled:opacity-50"
            >
              {booking ? "Confirmation..." : "Confirmer ce creneau"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

interface SessionItem {
  id: string;
  scheduledAt: string;
  durationMin: number;
  fromPack: boolean;
}

export default function MySessionsSection({ lang }: { lang: string }) {
  const [data, setData] = useState<{ totalSessions: number; usedCount: number; remaining: number; sessions: SessionItem[] } | null>(null);

  const isFR = lang === "FR";

  useEffect(() => {
    fetch("/api/client/session-packs")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setData(d); })
      .catch(() => {});
  }, []);

  if (!data || data.totalSessions === 0) return null;

  const pct = data.totalSessions > 0 ? Math.round((data.usedCount / data.totalSessions) * 100) : 0;

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-4">
      <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid">
        {isFR ? "Mes seances" : "My sessions"}
      </h2>

      {/* Counter */}
      <div className="text-center">
        <p className={`font-display text-5xl ${data.remaining <= 0 ? "text-red-600" : data.remaining <= 2 ? "text-orange-500" : "text-or-sacre"}`}>
          {data.remaining}
        </p>
        <p className="font-ui text-sm text-brun-mid mt-1">
          {isFR ? "seances restantes" : "sessions remaining"}
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-or-pale/30 rounded-full">
        <div
          className={`h-full rounded-full transition-all ${data.remaining <= 0 ? "bg-red-500" : data.remaining <= 2 ? "bg-orange-400" : "bg-or-sacre"}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      <div className="flex justify-between text-xs font-ui text-brun-mid/60">
        <span>{data.usedCount} {isFR ? "utilisees" : "used"}</span>
        <span>{data.totalSessions} {isFR ? "total prepayees" : "total prepaid"}</span>
      </div>

      {/* Session history */}
      {data.sessions.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-or-pale/30">
          <p className="text-xs font-ui text-brun-mid/60 mb-2">{isFR ? "Historique" : "History"}</p>
          {data.sessions.slice(0, 10).map((s) => (
            <div key={s.id} className="flex items-center justify-between py-1.5">
              <p className="text-sm font-ui text-brun-chaud">
                {new Date(s.scheduledAt).toLocaleDateString(isFR ? "fr-FR" : "en-US", { day: "numeric", month: "short" })}
              </p>
              <p className="text-xs font-ui text-brun-mid/50">{s.durationMin} min</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

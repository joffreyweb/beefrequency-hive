"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { Lang } from "@/lib/translations";
import { t } from "@/lib/translations";

export default function CheckinButtons({ lang = "FR" }: { lang?: Lang }) {
  const [hour, setHour] = useState<number | null>(null);
  const T = (key: { EN: string; FR: string }) => key[lang];

  useEffect(() => {
    setHour(new Date().getHours());
  }, []);

  if (hour === null) return null;

  const morningOpen = hour >= 5 && hour < 13;
  const eveningOpen = hour >= 16 && hour <= 23;

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Morning card */}
      {morningOpen ? (
        <Link
          href="/client/checkin/morning"
          className="bg-cire-chaude border border-or-sacre rounded-sm p-4 hover:bg-or-sacre/5 transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{"\u2600\uFE0F"}</span>
            <span className="font-ui text-sm text-brun-chaud">{T(t.home.morningCheckin)}</span>
          </div>
          <p className="font-ui text-xs text-or-sacre">{T(t.home.morningAvailable)}</p>
        </Link>
      ) : (
        <div className="bg-creme-sacree border border-or-pale/50 rounded-sm p-4 opacity-50">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg grayscale">{"\u2600\uFE0F"}</span>
            <span className="font-ui text-sm text-brun-mid/50">{T(t.home.morningCheckin)}</span>
          </div>
          <p className="font-ui text-xs text-brun-mid/40">{T(t.home.morningOpens)}</p>
        </div>
      )}

      {/* Evening card */}
      {eveningOpen ? (
        <Link
          href="/client/checkin/evening"
          className="bg-cire-chaude border border-or-sacre rounded-sm p-4 hover:bg-or-sacre/5 transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{"\uD83C\uDF19"}</span>
            <span className="font-ui text-sm text-brun-chaud">{T(t.home.eveningCheckin)}</span>
          </div>
          <p className="font-ui text-xs text-or-sacre">{T(t.home.eveningAvailable)}</p>
        </Link>
      ) : (
        <div className="bg-creme-sacree border border-or-pale/50 rounded-sm p-4 opacity-50">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg grayscale">{"\uD83C\uDF19"}</span>
            <span className="font-ui text-sm text-brun-mid/50">{T(t.home.eveningCheckin)}</span>
          </div>
          <p className="font-ui text-xs text-brun-mid/40">{T(t.home.eveningOpens)}</p>
        </div>
      )}
    </div>
  );
}

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
          <span className="text-lg block mb-1">{"\u2600\uFE0F"}</span>
          <p className="font-ui text-sm text-brun-chaud leading-snug">{T(t.home.morningCheckin)}</p>
          <p className="font-ui text-xs text-or-sacre mt-2">{T(t.home.morningAvailable)}</p>
        </Link>
      ) : (
        <div className="bg-creme-sacree border border-or-pale/50 rounded-sm p-4 opacity-50">
          <span className="text-lg grayscale block mb-1">{"\u2600\uFE0F"}</span>
          <p className="font-ui text-sm text-brun-mid/50 leading-snug">{T(t.home.morningCheckin)}</p>
          <p className="font-ui text-xs text-brun-mid/40 mt-2">{T(t.home.morningOpens)}</p>
        </div>
      )}

      {/* Evening card */}
      {eveningOpen ? (
        <Link
          href="/client/checkin/evening"
          className="bg-cire-chaude border border-or-sacre rounded-sm p-4 hover:bg-or-sacre/5 transition-colors"
        >
          <span className="text-lg block mb-1">{"\uD83C\uDF19"}</span>
          <p className="font-ui text-sm text-brun-chaud leading-snug">{T(t.home.eveningCheckin)}</p>
          <p className="font-ui text-xs text-or-sacre mt-2">{T(t.home.eveningAvailable)}</p>
        </Link>
      ) : (
        <div className="bg-creme-sacree border border-or-pale/50 rounded-sm p-4 opacity-50">
          <span className="text-lg grayscale block mb-1">{"\uD83C\uDF19"}</span>
          <p className="font-ui text-sm text-brun-mid/50 leading-snug">{T(t.home.eveningCheckin)}</p>
          <p className="font-ui text-xs text-brun-mid/40 mt-2">{T(t.home.eveningOpens)}</p>
        </div>
      )}
    </div>
  );
}

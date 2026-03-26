"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function CheckinButtons() {
  const [hour, setHour] = useState<number | null>(null);

  useEffect(() => {
    setHour(new Date().getHours());
  }, []);

  if (hour === null) return null;

  const morningOpen = hour >= 5 && hour < 13;
  const eveningOpen = hour >= 16 && hour <= 23;

  return (
    <div className="flex items-center justify-center gap-3">
      {morningOpen ? (
        <Link
          href="/client/checkin/morning"
          className="text-sm font-ui text-or-sacre hover:text-ambre-vif transition-colors"
        >
          Morning check-in &rarr;
        </Link>
      ) : (
        <span className="text-sm font-ui text-brun-mid/30">
          Morning check-in
        </span>
      )}
      <span className="text-brun-mid/20">·</span>
      {eveningOpen ? (
        <Link
          href="/client/checkin/evening"
          className="text-sm font-ui text-or-sacre hover:text-ambre-vif transition-colors"
        >
          Evening check-in &rarr;
        </Link>
      ) : (
        <span className="text-sm font-ui text-brun-mid/30">
          Evening check-in
        </span>
      )}
    </div>
  );
}

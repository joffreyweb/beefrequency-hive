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
    <div className="grid grid-cols-2 gap-3">
      {/* Morning card */}
      {morningOpen ? (
        <Link
          href="/client/checkin/morning"
          className="bg-cire-chaude border border-or-sacre rounded-sm p-4 hover:bg-or-sacre/5 transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">☀️</span>
            <span className="font-ui text-sm text-brun-chaud">Morning check-in</span>
          </div>
          <p className="font-ui text-xs text-or-sacre">Available until 1pm</p>
        </Link>
      ) : (
        <div className="bg-creme-sacree border border-or-pale/50 rounded-sm p-4 opacity-50">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg grayscale">☀️</span>
            <span className="font-ui text-sm text-brun-mid/50">Morning check-in</span>
          </div>
          <p className="font-ui text-xs text-brun-mid/40">Opens at 5am</p>
        </div>
      )}

      {/* Evening card */}
      {eveningOpen ? (
        <Link
          href="/client/checkin/evening"
          className="bg-cire-chaude border border-or-sacre rounded-sm p-4 hover:bg-or-sacre/5 transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🌙</span>
            <span className="font-ui text-sm text-brun-chaud">Evening check-in</span>
          </div>
          <p className="font-ui text-xs text-or-sacre">Available until midnight</p>
        </Link>
      ) : (
        <div className="bg-creme-sacree border border-or-pale/50 rounded-sm p-4 opacity-50">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg grayscale">🌙</span>
            <span className="font-ui text-sm text-brun-mid/50">Evening check-in</span>
          </div>
          <p className="font-ui text-xs text-brun-mid/40">Opens at 4pm</p>
        </div>
      )}
    </div>
  );
}

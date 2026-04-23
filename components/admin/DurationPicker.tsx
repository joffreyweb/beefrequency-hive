"use client";

import { useState } from "react";

const DURATION_PRESETS = ["30", "60", "90", "120"] as const;

export default function DurationPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const isPreset = (DURATION_PRESETS as readonly string[]).includes(value);
  const [mode, setMode] = useState<"preset" | "custom">(isPreset ? "preset" : "custom");

  return (
    <div className="flex gap-2">
      <select
        value={mode === "preset" ? value : "__other"}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "__other") {
            setMode("custom");
            onChange(value && !isPreset ? value : "45");
          } else {
            setMode("preset");
            onChange(v);
          }
        }}
        className="flex-1 px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud"
      >
        <option value="30">30 min</option>
        <option value="60">60 min</option>
        <option value="90">90 min (1h30)</option>
        <option value="120">120 min (2h)</option>
        <option value="__other">Autre…</option>
      </select>
      {mode === "custom" && (
        <input
          type="number"
          min={15}
          max={480}
          step={5}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="min"
          className="w-24 px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud"
        />
      )}
    </div>
  );
}

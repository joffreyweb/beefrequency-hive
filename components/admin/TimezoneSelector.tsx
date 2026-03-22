"use client";

import { useState } from "react";

const TIMEZONES = [
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/London", label: "Londres (GMT/BST)" },
  { value: "Europe/Madrid", label: "Madrid (CET/CEST)" },
  { value: "Europe/Zurich", label: "Zurich (CET/CEST)" },
  { value: "Europe/Amsterdam", label: "Amsterdam (CET/CEST)" },
  { value: "Europe/Brussels", label: "Bruxelles (CET/CEST)" },
  { value: "Europe/Rome", label: "Rome (CET/CEST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "Europe/Lisbon", label: "Lisbonne (WET/WEST)" },
  { value: "Atlantic/Canary", label: "Îles Canaries (WET/WEST)" },
  { value: "America/New_York", label: "New York (EST/EDT)" },
  { value: "America/Chicago", label: "Chicago (CST/CDT)" },
  { value: "America/Denver", label: "Denver (MST/MDT)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)" },
  { value: "America/Toronto", label: "Toronto (EST/EDT)" },
  { value: "America/Montreal", label: "Montréal (EST/EDT)" },
  { value: "America/Sao_Paulo", label: "São Paulo (BRT)" },
  { value: "America/Buenos_Aires", label: "Buenos Aires (ART)" },
  { value: "America/Mexico_City", label: "Mexico (CST/CDT)" },
  { value: "Africa/Casablanca", label: "Casablanca (WET)" },
  { value: "Africa/Tunis", label: "Tunis (CET)" },
  { value: "Asia/Dubai", label: "Dubaï (GST)" },
  { value: "Asia/Singapore", label: "Singapour (SGT)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Bangkok", label: "Bangkok (ICT)" },
  { value: "Asia/Kolkata", label: "Inde (IST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
  { value: "Pacific/Auckland", label: "Auckland (NZST/NZDT)" },
];

interface TimezoneSelectorProps {
  clientId: string;
  currentTimezone: string | null;
}

export default function TimezoneSelector({ clientId, currentTimezone }: TimezoneSelectorProps) {
  const [value, setValue] = useState(currentTimezone || "Europe/Paris");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleChange(newValue: string) {
    setValue(newValue);
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone: newValue }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch { } finally { setSaving(false); }
  }

  return (
    <div>
      <select value={value} onChange={e => handleChange(e.target.value)} disabled={saving}
        className="w-full px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors disabled:opacity-40">
        {TIMEZONES.map(tz => (
          <option key={tz.value} value={tz.value}>{tz.label}</option>
        ))}
      </select>
      {saved && <p className="text-xs text-foret font-ui mt-1">Fuseau horaire enregistré ✓</p>}
    </div>
  );
}

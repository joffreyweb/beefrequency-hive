"use client";

import { useEffect, useState } from "react";

interface Settings {
  dailyRecapTime: string;
  emailReminderSession: boolean;
  emailNewMessage: boolean;
  notifyOverdueTask: boolean;
  defaultSessionDuration: number;
  sessionBuffer: number;
  senderEmail: string;
  emailSignature: string;
  timezone: string;
  language: string;
}

const DEFAULTS: Settings = {
  dailyRecapTime: "18:00",
  emailReminderSession: true,
  emailNewMessage: true,
  notifyOverdueTask: true,
  defaultSessionDuration: 60,
  sessionBuffer: 15,
  senderEmail: "",
  emailSignature: "",
  timezone: "Europe/Brussels",
  language: "fr",
};

export default function SettingsPage() {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => setS({ ...DEFAULTS, ...data }))
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
    if (res.ok) setSaved(true);
    setSaving(false);
  }

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-sm font-ui text-brun-mid/60">Chargement...</p></div>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl text-brun-chaud">Paramètres</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 text-xs font-caps uppercase tracking-wider bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-50"
        >
          {saving ? "Sauvegarde..." : saved ? "Sauvegardé" : "Sauvegarder"}
        </button>
      </div>

      <div className="space-y-6">
        {/* Notifications */}
        <Section title="Notifications">
          <Toggle label="Email rappel séance 48h" checked={s.emailReminderSession} onChange={(v) => update("emailReminderSession", v)} />
          <Toggle label="Email nouveau message client" checked={s.emailNewMessage} onChange={(v) => update("emailNewMessage", v)} />
          <Toggle label="Notification tâche en retard" checked={s.notifyOverdueTask} onChange={(v) => update("notifyOverdueTask", v)} />
        </Section>

        {/* Séances */}
        <Section title="Séances">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Durée par défaut</label>
              <select value={s.defaultSessionDuration} onChange={(e) => update("defaultSessionDuration", Number(e.target.value))} className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp">
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
                <option value={120}>120 min</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Buffer entre séances</label>
              <select value={s.sessionBuffer} onChange={(e) => update("sessionBuffer", Number(e.target.value))} className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp">
                <option value={0}>Pas de buffer</option>
                <option value={10}>10 min</option>
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
              </select>
            </div>
          </div>
        </Section>

        {/* Emails */}
        <Section title="Emails">
          <div>
            <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Email expéditeur</label>
            <input value={s.senderEmail} onChange={(e) => update("senderEmail", e.target.value)} placeholder="admin@beefrequency.com" className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp" />
          </div>
          <div>
            <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Signature email</label>
            <textarea value={s.emailSignature} onChange={(e) => update("emailSignature", e.target.value)} rows={3} placeholder="Joffrey Deleplanque&#10;BeeFrequency" className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp resize-y" />
          </div>
        </Section>

        {/* Horaires */}
        <Section title="Horaires">
          <div>
            <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Heure du récapitulatif quotidien</label>
            <input type="time" value={s.dailyRecapTime} onChange={(e) => update("dailyRecapTime", e.target.value)} className="px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp" />
          </div>
        </Section>

        {/* Application */}
        <Section title="Application">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Fuseau horaire</label>
              <select value={s.timezone} onChange={(e) => update("timezone", e.target.value)} className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp">
                <option value="Europe/Brussels">Europe/Brussels</option>
                <option value="Europe/Paris">Europe/Paris</option>
                <option value="Europe/Madrid">Europe/Madrid</option>
                <option value="Europe/London">Europe/London</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">Langue</label>
              <select value={s.language} onChange={(e) => update("language", e.target.value)} className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp">
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
      <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-1">
      <span className="text-sm font-ui text-brun-chaud">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-or-sacre" : "bg-brun-mid/20"}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

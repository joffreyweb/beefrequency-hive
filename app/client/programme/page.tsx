"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ═══════════════════════════════════════
// Types
// ═══════════════════════════════════════

interface PhaseInfo {
  phaseType: "CYCLE" | "BREAK";
  phaseNumber: number;
  durationDays: number;
  startDay: number;
  label: string;
  startDate: string;
  endDate: string;
  status: "UPCOMING" | "ACTIVE" | "COMPLETED";
}

interface ActiveInfo {
  phase: PhaseInfo;
  dayInPhase: number;
  dayInProgram: number;
  totalDays: number;
}

interface TodayElixir {
  id: string;
  name: string;
  description: string;
  dose: string;
  unit: string;
  timing: string;
  notes: string | null;
}

interface TodayPractice {
  id: string;
  type: string;
  title: string;
  description: string | null;
  duration: number | null;
}

interface CheckinData {
  id?: string;
  phase: string;
  energyLevel: number | null;
  sleepQuality: number | null;
  sleepType: string | null;
  dreamed: string | null;
  dreamNotes: string | null;
  morningGratitude: string | null;
  freeFeeling: string | null;
  pride1: string | null;
  pride2: string | null;
  pride3: string | null;
  gratitudeMoment: string | null;
  gratitudeSensation: string | null;
  gratitudeRecu: string | null;
  gratitudeSoi: string | null;
  selfQuality: string | null;
  closingSentence: string | null;
  elixirTaken: boolean;
}

type ViewTab = "aujourdhui" | "calendrier";

// ═══════════════════════════════════════
// Labels
// ═══════════════════════════════════════

const TIMING_LABELS: Record<string, string> = {
  MATIN: "Matin",
  SOIR: "Soir",
  JOURNEE: "Journée",
  FLEXIBLE: "Flexible",
};

const TIMING_ORDER: Record<string, number> = {
  MATIN: 0,
  JOURNEE: 1,
  SOIR: 2,
  FLEXIBLE: 3,
};

const SLEEP_OPTIONS = [
  { key: "leger", label: "Léger" },
  { key: "profond", label: "Profond" },
  { key: "reves", label: "Rêves" },
  { key: "reveils", label: "Réveils" },
  { key: "endormissement_long", label: "Long endormissement" },
  { key: "nuit_continue", label: "Nuit continue" },
];

const DREAM_OPTIONS = [
  { key: "OUI", label: "Oui" },
  { key: "NON", label: "Non" },
  { key: "SAIS_PAS", label: "Je ne sais pas" },
];

// ═══════════════════════════════════════
// Main Component
// ═══════════════════════════════════════

export default function ProgrammePage() {
  const [loading, setLoading] = useState(true);
  const [phases, setPhases] = useState<PhaseInfo[]>([]);
  const [activeInfo, setActiveInfo] = useState<ActiveInfo | null>(null);
  const [todayElixirs, setTodayElixirs] = useState<TodayElixir[]>([]);
  const [todayPractices, setTodayPractices] = useState<TodayPractice[]>([]);
  const [checkin, setCheckin] = useState<CheckinData>(emptyCheckin("CYCLE"));
  const [viewTab, setViewTab] = useState<ViewTab>("aujourdhui");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [calendarCheckins, setCalendarCheckins] = useState<Record<string, boolean>>({});
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/parcours");
      if (!res.ok) throw new Error();
      const data = await res.json();

      setPhases(data.phases ?? []);
      setActiveInfo(data.activeInfo ?? null);
      setTodayElixirs(data.todayElixirs ?? []);
      setTodayPractices(data.todayPractices ?? []);

      if (data.todayCheckin) {
        setCheckin({
          ...data.todayCheckin,
          sleepType: data.todayCheckin.sleepType ?? "[]",
        });
      } else if (data.activeInfo) {
        setCheckin(emptyCheckin(data.activeInfo.phase.phaseType));
      }

      // Build calendar map
      if (data.activeInfo) {
        const checkins = await fetch("/api/daily-checkin").then((r) => r.json());
        const map: Record<string, boolean> = {};
        for (const c of checkins.checkins ?? []) {
          map[c.date.split("T")[0]] = true;
        }
        setCalendarCheckins(map);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-save to localStorage
  useEffect(() => {
    if (loading) return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      try {
        localStorage.setItem("hive_checkin_draft", JSON.stringify(checkin));
      } catch {
        // silent
      }
    }, 1000);
  }, [checkin, loading]);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem("hive_checkin_draft");
      if (draft) {
        const parsed = JSON.parse(draft);
        // Only use draft if there's no server data
        if (!checkin.id && parsed.phase) {
          setCheckin((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {
      // silent
    }
  }, []);

  async function handleSave() {
    if (!activeInfo) return;
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/daily-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...checkin,
          phase: activeInfo.phase.phaseType,
        }),
      });

      if (res.ok) {
        setSaved(true);
        localStorage.removeItem("hive_checkin_draft");
        setTimeout(() => setSaved(false), 3000);
        await loadData();
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm font-ui text-brun-mid/60">Chargement de votre parcours...</p>
      </div>
    );
  }

  if (!activeInfo) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl sm:text-3xl text-brun-chaud">Mon programme</h1>
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-8 text-center">
          <p className="text-sm text-brun-mid/60 font-ui">
            Votre parcours n&apos;a pas encore été configuré. Contactez votre accompagnant.
          </p>
        </div>
      </div>
    );
  }

  const isCycle = activeInfo.phase.phaseType === "CYCLE";

  return (
    <div className="space-y-5 pb-24">
      {/* Header — Où suis-je ? */}
      <div>
        <h1 className="font-display text-2xl text-brun-chaud">Mon programme</h1>

        {/* Badge phase active */}
        <div className="flex items-center gap-3 mt-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-or-sacre/10 text-or-sacre text-sm font-ui">
            <span className="w-2 h-2 rounded-full bg-or-sacre" />
            {activeInfo.phase.label} · J.{activeInfo.dayInPhase}
          </span>
        </div>

        {/* Barre de progression globale */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-ui text-brun-mid/50">Progression globale</span>
            <span className="text-xs font-ui text-brun-mid/50">
              J.{activeInfo.dayInProgram} / {activeInfo.totalDays}
            </span>
          </div>
          <div className="h-1.5 bg-or-pale/30 rounded-full">
            <div
              className="h-full rounded-full bg-or-sacre/40 transition-all duration-300"
              style={{ width: `${(activeInfo.dayInProgram / activeInfo.totalDays) * 100}%` }}
            />
          </div>
        </div>

        {/* Barre de progression phase */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-ui text-brun-mid/50">{activeInfo.phase.label}</span>
            <span className="text-xs font-ui text-brun-mid/50">
              J.{activeInfo.dayInPhase} / {activeInfo.phase.durationDays}
            </span>
          </div>
          <div className="h-2 bg-or-pale/30 rounded-full">
            <div
              className="h-full rounded-full bg-or-sacre transition-all duration-300"
              style={{ width: `${(activeInfo.dayInPhase / activeInfo.phase.durationDays) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-or-pale">
        {(["aujourdhui", "calendrier"] as ViewTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setViewTab(tab)}
            className={`px-4 py-2.5 text-sm font-ui transition-colors border-b-2 -mb-px ${
              viewTab === tab
                ? "text-or-sacre border-or-sacre"
                : "text-brun-mid border-transparent hover:text-brun-chaud"
            }`}
          >
            {tab === "aujourdhui" ? "Aujourd'hui" : "Calendrier"}
          </button>
        ))}
      </div>

      {/* Content */}
      {viewTab === "aujourdhui" ? (
        <DailyCard
          isCycle={isCycle}
          elixirs={todayElixirs}
          practices={todayPractices}
          checkin={checkin}
          setCheckin={setCheckin}
        />
      ) : (
        <CalendarView
          activeInfo={activeInfo}
          calendarCheckins={calendarCheckins}
        />
      )}

      {/* Sticky save button */}
      {viewTab === "aujourdhui" && (
        <div className="fixed bottom-16 left-0 right-0 px-4 pb-4 z-40">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 text-sm font-ui uppercase tracking-[0.06em] bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-50 shadow-lg"
          >
            {saving ? "Enregistrement..." : saved ? "Sauvegardé ✓" : "Sauvegarder"}
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// Daily Card
// ═══════════════════════════════════════

function DailyCard({
  isCycle,
  elixirs,
  practices,
  checkin,
  setCheckin,
}: {
  isCycle: boolean;
  elixirs: TodayElixir[];
  practices: TodayPractice[];
  checkin: CheckinData;
  setCheckin: (fn: (prev: CheckinData) => CheckinData) => void;
}) {
  const sortedElixirs = [...elixirs].sort(
    (a, b) => (TIMING_ORDER[a.timing] ?? 3) - (TIMING_ORDER[b.timing] ?? 3)
  );

  return (
    <div className="space-y-6">
      {/* Élixirs du jour */}
      {sortedElixirs.length > 0 && (
        <section className="bg-cire-chaude border border-or-pale rounded-sm p-5">
          <h3 className="font-caps text-xs text-or-sacre uppercase tracking-wider mb-3">
            {isCycle ? "Mes élixirs aujourd'hui" : "Soutien du jour"}
          </h3>
          <div className="space-y-2.5">
            {sortedElixirs.map((e) => (
              <div key={e.id} className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-ui text-brun-mid/60 mr-2">
                    {TIMING_LABELS[e.timing]}
                  </span>
                  <span className="text-sm font-ui text-brun-chaud">{e.name}</span>
                </div>
                <span className="text-sm font-ui text-brun-mid">{e.dose}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pratiques */}
      {practices.length > 0 && (
        <section className="bg-cire-chaude border border-or-pale rounded-sm p-5">
          <h3 className="font-caps text-xs text-or-sacre uppercase tracking-wider mb-3">
            {isCycle ? "Ma pratique" : "Pratique"}
          </h3>
          {practices.map((p) => (
            <div key={p.id} className="mb-2 last:mb-0">
              <p className="text-sm font-ui text-brun-chaud">{p.title}</p>
              {p.description && (
                <p className="text-xs font-ui text-brun-mid/60 mt-0.5">{p.description}</p>
              )}
              {p.duration && (
                <p className="text-xs font-ui text-brun-mid/40 mt-0.5">{p.duration} min</p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Check-in form */}
      {isCycle ? (
        <CycleCheckin checkin={checkin} setCheckin={setCheckin} />
      ) : (
        <BreakCheckin checkin={checkin} setCheckin={setCheckin} />
      )}

      {/* Élixir taken */}
      <section className="bg-cire-chaude border border-or-pale rounded-sm p-5">
        <PillCheckbox
          checked={checkin.elixirTaken}
          onChange={(v) => setCheckin((prev) => ({ ...prev, elixirTaken: v }))}
          label="J'ai pris mes élixirs"
        />
      </section>
    </div>
  );
}

// ═══════════════════════════════════════
// Cycle Check-in (complet matin/soir)
// ═══════════════════════════════════════

function CycleCheckin({
  checkin,
  setCheckin,
}: {
  checkin: CheckinData;
  setCheckin: (fn: (prev: CheckinData) => CheckinData) => void;
}) {
  const sleepTypes: string[] = parseSleepType(checkin.sleepType);

  function toggleSleep(key: string) {
    const current = parseSleepType(checkin.sleepType);
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key];
    setCheckin((prev) => ({ ...prev, sleepType: JSON.stringify(next) }));
  }

  return (
    <>
      {/* MON MATIN */}
      <section className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-5">
        <h3 className="font-caps text-xs text-brun-mid uppercase tracking-wider border-b border-or-pale/50 pb-2">
          Mon matin
        </h3>

        {/* Énergie */}
        <SliderField
          label="Énergie"
          value={checkin.energyLevel}
          onChange={(v) => setCheckin((prev) => ({ ...prev, energyLevel: v }))}
        />

        {/* Sommeil */}
        <SliderField
          label="Sommeil"
          value={checkin.sleepQuality}
          onChange={(v) => setCheckin((prev) => ({ ...prev, sleepQuality: v }))}
        />

        {/* Type de sommeil */}
        <div>
          <p className="text-xs font-ui text-brun-mid mb-2">Type de sommeil</p>
          <div className="flex flex-wrap gap-2">
            {SLEEP_OPTIONS.map((opt) => (
              <PillCheckbox
                key={opt.key}
                checked={sleepTypes.includes(opt.key)}
                onChange={() => toggleSleep(opt.key)}
                label={opt.label}
              />
            ))}
          </div>
        </div>

        {/* Rêves */}
        <div>
          <p className="text-xs font-ui text-brun-mid mb-2">As-tu rêvé ?</p>
          <div className="flex gap-2">
            {DREAM_OPTIONS.map((opt) => (
              <PillCheckbox
                key={opt.key}
                checked={checkin.dreamed === opt.key}
                onChange={() => setCheckin((prev) => ({ ...prev, dreamed: opt.key }))}
                label={opt.label}
              />
            ))}
          </div>
        </div>

        {/* Dream notes */}
        <TextArea
          value={checkin.dreamNotes}
          onChange={(v) => setCheckin((prev) => ({ ...prev, dreamNotes: v }))}
          placeholder="Rêves, messages reçus, images fortes..."
        />

        {/* Morning gratitude */}
        <TextArea
          value={checkin.morningGratitude}
          onChange={(v) => setCheckin((prev) => ({ ...prev, morningGratitude: v }))}
          placeholder="Ce pour quoi je suis reconnaissant(e) ce matin..."
        />
      </section>

      {/* MON SOIR */}
      <section className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-5">
        <h3 className="font-caps text-xs text-brun-mid uppercase tracking-wider border-b border-or-pale/50 pb-2">
          Mon soir
        </h3>

        {/* Free feeling */}
        <TextArea
          value={checkin.freeFeeling}
          onChange={(v) => setCheckin((prev) => ({ ...prev, freeFeeling: v }))}
          placeholder="Ce que j'ai ressenti aujourd'hui..."
        />

        {/* 3 fiertés */}
        <div>
          <p className="text-xs font-ui text-brun-mid mb-2">3 moments où j&apos;ai été fier(e)</p>
          <div className="space-y-2">
            <TextInput
              value={checkin.pride1}
              onChange={(v) => setCheckin((prev) => ({ ...prev, pride1: v }))}
              placeholder="Premier moment de fierté..."
            />
            <TextInput
              value={checkin.pride2}
              onChange={(v) => setCheckin((prev) => ({ ...prev, pride2: v }))}
              placeholder="Deuxième moment de fierté..."
            />
            <TextInput
              value={checkin.pride3}
              onChange={(v) => setCheckin((prev) => ({ ...prev, pride3: v }))}
              placeholder="Troisième moment de fierté..."
            />
          </div>
        </div>

        {/* 4 gratitudes */}
        <div>
          <p className="text-xs font-ui text-brun-mid mb-2">4 piments de gratitude</p>
          <div className="space-y-2">
            <TextInput
              value={checkin.gratitudeMoment}
              onChange={(v) => setCheckin((prev) => ({ ...prev, gratitudeMoment: v }))}
              placeholder="Un moment agréable..."
            />
            <TextInput
              value={checkin.gratitudeSensation}
              onChange={(v) => setCheckin((prev) => ({ ...prev, gratitudeSensation: v }))}
              placeholder="Une sensation ok..."
            />
            <TextInput
              value={checkin.gratitudeRecu}
              onChange={(v) => setCheckin((prev) => ({ ...prev, gratitudeRecu: v }))}
              placeholder="Quelque chose reçu..."
            />
            <TextInput
              value={checkin.gratitudeSoi}
              onChange={(v) => setCheckin((prev) => ({ ...prev, gratitudeSoi: v }))}
              placeholder="Une chose pour moi..."
            />
          </div>
        </div>

        {/* Self quality */}
        <TextArea
          value={checkin.selfQuality}
          onChange={(v) => setCheckin((prev) => ({ ...prev, selfQuality: v }))}
          placeholder="Ce que je reconnais en moi aujourd'hui..."
        />

        {/* Closing sentence */}
        <TextInput
          value={checkin.closingSentence}
          onChange={(v) => setCheckin((prev) => ({ ...prev, closingSentence: v }))}
          placeholder="Clôture — 1 phrase pour résumer ma journée..."
        />
      </section>
    </>
  );
}

// ═══════════════════════════════════════
// Break Check-in (allégé)
// ═══════════════════════════════════════

function BreakCheckin({
  checkin,
  setCheckin,
}: {
  checkin: CheckinData;
  setCheckin: (fn: (prev: CheckinData) => CheckinData) => void;
}) {
  return (
    <section className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-5">
      <h3 className="font-caps text-xs text-brun-mid uppercase tracking-wider border-b border-or-pale/50 pb-2">
        Mon ressenti
      </h3>

      <TextArea
        value={checkin.freeFeeling}
        onChange={(v) => setCheckin((prev) => ({ ...prev, freeFeeling: v }))}
        placeholder="Écriture libre — ce qui me traverse en ce moment..."
        rows={5}
      />

      <TextInput
        value={checkin.closingSentence}
        onChange={(v) => setCheckin((prev) => ({ ...prev, closingSentence: v }))}
        placeholder="Clôture — 1 phrase..."
      />
    </section>
  );
}

// ═══════════════════════════════════════
// Calendar View
// ═══════════════════════════════════════

function CalendarView({
  activeInfo,
  calendarCheckins,
}: {
  activeInfo: ActiveInfo;
  calendarCheckins: Record<string, boolean>;
}) {
  const phase = activeInfo.phase;
  const start = new Date(phase.startDate);
  const days: Date[] = [];
  for (let i = 0; i < phase.durationDays; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [viewCheckin, setViewCheckin] = useState<CheckinData | null>(null);
  const [loadingDay, setLoadingDay] = useState(false);

  async function handleDayClick(date: Date) {
    const dateStr = formatISODate(date);
    if (date >= today) return; // Future / today → no read-only view

    setSelectedDay(dateStr);
    setLoadingDay(true);
    try {
      const res = await fetch(`/api/daily-checkin?date=${dateStr}`);
      const data = await res.json();
      setViewCheckin(data.checkin ?? null);
    } catch {
      setViewCheckin(null);
    } finally {
      setLoadingDay(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
        <h3 className="font-caps text-xs text-brun-mid uppercase tracking-wider mb-3">
          {phase.label} — {phase.durationDays} jours
        </h3>

        <div className="grid grid-cols-7 gap-2">
          {days.map((d) => {
            const dateStr = formatISODate(d);
            const isToday = d.getTime() === today.getTime();
            const isPast = d < today;
            const completed = calendarCheckins[dateStr];

            return (
              <button
                key={dateStr}
                onClick={() => isPast && handleDayClick(d)}
                disabled={!isPast}
                className={`aspect-square rounded-full flex items-center justify-center text-xs font-ui transition-all ${
                  isToday
                    ? "bg-or-sacre text-white ring-2 ring-or-sacre/30"
                    : completed
                      ? "bg-foret/20 text-foret"
                      : isPast
                        ? "bg-brun-mid/10 text-brun-mid hover:bg-or-pale/50"
                        : "bg-brun-mid/5 text-brun-mid/30"
                }`}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Read-only view of past checkin */}
      {selectedDay && (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
          <h4 className="font-caps text-xs text-brun-mid uppercase tracking-wider mb-3">
            {new Date(selectedDay).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
          </h4>

          {loadingDay ? (
            <p className="text-sm font-ui text-brun-mid/60">Chargement...</p>
          ) : !viewCheckin ? (
            <p className="text-sm font-ui text-brun-mid/50">Aucun check-in ce jour.</p>
          ) : (
            <ReadOnlyCheckin checkin={viewCheckin} />
          )}
        </div>
      )}
    </div>
  );
}

function ReadOnlyCheckin({ checkin }: { checkin: CheckinData }) {
  const fields: [string, string | null | undefined][] = [
    ["Énergie", checkin.energyLevel ? `${checkin.energyLevel}/10` : null],
    ["Sommeil", checkin.sleepQuality ? `${checkin.sleepQuality}/10` : null],
    ["Gratitude matin", checkin.morningGratitude],
    ["Ressenti", checkin.freeFeeling],
    ["Fierté 1", checkin.pride1],
    ["Fierté 2", checkin.pride2],
    ["Fierté 3", checkin.pride3],
    ["Moment agréable", checkin.gratitudeMoment],
    ["Sensation ok", checkin.gratitudeSensation],
    ["Reçu", checkin.gratitudeRecu],
    ["Pour moi", checkin.gratitudeSoi],
    ["Qualité reconnue", checkin.selfQuality],
    ["Clôture", checkin.closingSentence],
  ];

  const filledFields = fields.filter(([, v]) => v);

  return (
    <div className="space-y-2">
      {filledFields.map(([label, value]) => (
        <div key={label}>
          <span className="text-xs font-caps text-brun-mid/60 uppercase tracking-wider">{label}</span>
          <p className="text-sm font-ui text-brun-chaud mt-0.5">{value}</p>
        </div>
      ))}
      {checkin.elixirTaken && (
        <p className="text-xs font-ui text-foret mt-2">Élixirs pris ✓</p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// Shared UI Components
// ═══════════════════════════════════════

function SliderField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  const val = value ?? 5;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-ui text-brun-mid">{label}</span>
        <span className="text-sm font-ui text-or-sacre font-medium">{val}/10</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={val}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-or-sacre"
        style={{
          background: `linear-gradient(to right, #B8821E 0%, #B8821E ${(val - 1) * 11.1}%, #E8D5A8 ${(val - 1) * 11.1}%, #E8D5A8 100%)`,
        }}
      />
    </div>
  );
}

function PillCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`px-3 py-1.5 rounded-full text-xs font-ui transition-all duration-150 border ${
        checked
          ? "bg-or-sacre text-white border-or-sacre"
          : "bg-creme-sacree text-brun-mid border-or-pale hover:border-or-sacre/50"
      }`}
    >
      {label}
    </button>
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string | null;
  onChange: (v: string) => void;
  placeholder: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre resize-none placeholder:text-brun-mid/30 placeholder:italic"
    />
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string | null;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre placeholder:text-brun-mid/30 placeholder:italic"
    />
  );
}

// ═══════════════════════════════════════
// Helpers
// ═══════════════════════════════════════

function emptyCheckin(phase: string): CheckinData {
  return {
    phase,
    energyLevel: null,
    sleepQuality: null,
    sleepType: "[]",
    dreamed: null,
    dreamNotes: null,
    morningGratitude: null,
    freeFeeling: null,
    pride1: null,
    pride2: null,
    pride3: null,
    gratitudeMoment: null,
    gratitudeSensation: null,
    gratitudeRecu: null,
    gratitudeSoi: null,
    selfQuality: null,
    closingSentence: null,
    elixirTaken: false,
  };
}

function parseSleepType(raw: string | null): string[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function formatISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

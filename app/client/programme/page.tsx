"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  dose: string;
  timing: string;
}

interface TodayPractice {
  id: string;
  type: string;
  title: string;
  description: string | null;
  duration: number | null;
}

interface WeeklyMusic {
  id: string;
  title: string;
  url: string;
  description: string | null;
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

const TIMING_ORDER: Record<string, number> = { MATIN: 0, JOURNEE: 1, SOIR: 2, FLEXIBLE: 3 };
const TIMING_LABELS: Record<string, string> = { MATIN: "Morning", SOIR: "Evening", JOURNEE: "Daytime", FLEXIBLE: "Flexible" };

const SLEEP_OPTIONS = [
  { key: "leger", label: "Light" },
  { key: "profond", label: "Deep" },
  { key: "reves", label: "Dreams" },
  { key: "reveils", label: "Awakenings" },
  { key: "endormissement_long", label: "Slow onset" },
  { key: "nuit_continue", label: "Continuous night" },
];

const slideVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

function emptyCheckin(phase: string): CheckinData {
  return {
    phase, energyLevel: null, sleepQuality: null, sleepType: "[]",
    dreamed: null, dreamNotes: null, morningGratitude: null,
    freeFeeling: null, pride1: null, pride2: null, pride3: null,
    gratitudeMoment: null, gratitudeSensation: null, gratitudeRecu: null,
    gratitudeSoi: null, selfQuality: null, closingSentence: null, elixirTaken: false,
  };
}

function parseSleepType(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function formatISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function ProgrammePage() {
  const [loading, setLoading] = useState(true);
  const [activeInfo, setActiveInfo] = useState<ActiveInfo | null>(null);
  const [todayElixirs, setTodayElixirs] = useState<TodayElixir[]>([]);
  const [todayPractices, setTodayPractices] = useState<TodayPractice[]>([]);
  const [weeklyMusic, setWeeklyMusic] = useState<WeeklyMusic | null>(null);
  const [checkin, setCheckin] = useState<CheckinData>(emptyCheckin("CYCLE"));
  const [viewTab, setViewTab] = useState<ViewTab>("aujourdhui");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [calendarCheckins, setCalendarCheckins] = useState<Record<string, boolean>>({});
  const [morningStep, setMorningStep] = useState(0);
  const [morningDone, setMorningDone] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/parcours");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setActiveInfo(data.activeInfo ?? null);
      setTodayElixirs(data.todayElixirs ?? []);
      setTodayPractices(data.todayPractices ?? []);

      if (data.todayCheckin) {
        setCheckin({ ...data.todayCheckin, sleepType: data.todayCheckin.sleepType ?? "[]" });
        setMorningDone(true);
      } else if (data.activeInfo) {
        setCheckin(emptyCheckin(data.activeInfo.phase.phaseType));
      }

      if (data.activeInfo) {
        const checkins = await fetch("/api/daily-checkin").then(r => r.json());
        const map: Record<string, boolean> = {};
        for (const c of checkins.checkins ?? []) map[c.date.split("T")[0]] = true;
        setCalendarCheckins(map);

        // Load J7 music if day 7/14/21
        const day = data.activeInfo.dayInPhase;
        if (data.activeInfo.phase.phaseType === "CYCLE" && day % 7 === 0) {
          const supRes = await fetch("/api/supports?type=MUSIC&limit=1");
          if (supRes.ok) {
            const supData = await supRes.json();
            if (supData.supports?.[0]) setWeeklyMusic(supData.supports[0]);
          }
        }
      }
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (loading) return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      try { localStorage.setItem("hive_checkin_draft", JSON.stringify(checkin)); } catch { }
    }, 1000);
  }, [checkin, loading]);

  async function handleSave() {
    if (!activeInfo) return;
    setSaving(true); setSaved(false);
    try {
      const res = await fetch("/api/daily-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...checkin, phase: activeInfo.phase.phaseType }),
      });
      if (res.ok) {
        setSaved(true);
        localStorage.removeItem("hive_checkin_draft");
        setTimeout(() => setSaved(false), 3000);
        await loadData();
      }
    } catch { } finally { setSaving(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-sm font-ui text-brun-mid/60">Loading...</p>
    </div>
  );

  if (!activeInfo) return (
    <div className="space-y-4 pb-24">
      <h1 className="font-display text-2xl text-brun-chaud">The Passage</h1>
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-8 text-center">
        <p className="text-sm font-ui text-brun-mid/60">Your journey has not been configured yet.</p>
      </div>
    </div>
  );

  const isCycle = activeInfo.phase.phaseType === "CYCLE";
  const isWeeklyDay = isCycle && activeInfo.dayInPhase % 7 === 0;

  return (
    <div className="space-y-5 pb-36">

      {/* Header progression */}
      <div className="space-y-2 mt-1">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-or-sacre/10 text-or-sacre text-sm font-ui">
            <span className="w-2 h-2 rounded-full bg-or-sacre" />
            {activeInfo.phase.label} · Day {activeInfo.dayInPhase}
          </span>
        </div>
        <ProgressBar label="Overall progress" value={activeInfo.dayInProgram} total={activeInfo.totalDays} thin />
        <ProgressBar label={activeInfo.phase.label} value={activeInfo.dayInPhase} total={activeInfo.phase.durationDays} />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-or-pale">
        {(["aujourdhui", "calendrier"] as ViewTab[]).map(tab => (
          <button key={tab} onClick={() => setViewTab(tab)}
            className={`px-4 py-2.5 text-sm font-ui transition-colors border-b-2 -mb-px ${viewTab === tab ? "text-or-sacre border-or-sacre" : "text-brun-mid border-transparent"}`}>
            {tab === "aujourdhui" ? "Today" : "Calendar"}
          </button>
        ))}
      </div>

      {viewTab === "aujourdhui" ? (
        <div className="space-y-6">

          {/* Elixirs */}
          {todayElixirs.length > 0 && (
            <section className="bg-cire-chaude border border-or-pale rounded-sm p-5">
              <h3 className="font-caps text-xs text-or-sacre uppercase tracking-wider mb-3">
                {isCycle ? "My elixirs today" : "Today's support"}
              </h3>
              <div className="space-y-2.5">
                {[...todayElixirs]
                  .sort((a, b) => (TIMING_ORDER[a.timing] ?? 3) - (TIMING_ORDER[b.timing] ?? 3))
                  .map(e => (
                    <div key={e.id} className="flex items-baseline justify-between">
                      <div>
                        <span className="text-xs font-ui text-brun-mid/60 mr-2">{TIMING_LABELS[e.timing]}</span>
                        <span className="text-sm font-ui text-brun-chaud">{e.name}</span>
                      </div>
                      <span className="text-sm font-ui text-brun-mid">{e.dose}</span>
                    </div>
                  ))}
              </div>
              <div className="mt-4 pt-4 border-t border-or-pale/50">
                <ChipBtn
                  selected={checkin.elixirTaken}
                  onClick={() => setCheckin(prev => ({ ...prev, elixirTaken: !prev.elixirTaken }))}
                  label={checkin.elixirTaken ? "✓ Elixirs taken" : "I took my elixirs"}
                />
              </div>
            </section>
          )}

          {/* Practices */}
          {todayPractices.length > 0 && (
            <section className="bg-cire-chaude border border-or-pale rounded-sm p-5">
              <h3 className="font-caps text-xs text-or-sacre uppercase tracking-wider mb-3">My practice</h3>
              {todayPractices.map(p => (
                <div key={p.id} className="mb-2 last:mb-0">
                  <p className="text-sm font-ui text-brun-chaud">{p.title}</p>
                  {p.description && <p className="text-xs font-ui text-brun-mid/60 mt-0.5">{p.description}</p>}
                  {p.duration && <p className="text-xs font-ui text-brun-mid/40 mt-0.5">{p.duration} min</p>}
                </div>
              ))}
            </section>
          )}

          {/* Morning check-in */}
          {isCycle ? (
            morningDone ? (
              <MorningDoneCard checkin={checkin} onEdit={() => { setMorningDone(false); setMorningStep(0); }} />
            ) : (
              <MorningWizard
                checkin={checkin}
                setCheckin={setCheckin}
                step={morningStep}
                setStep={setMorningStep}
                onComplete={() => setMorningDone(true)}
              />
            )
          ) : (
            <BreakCheckin checkin={checkin} setCheckin={setCheckin} />
          )}

          {/* Evening check-in */}
          {isCycle && morningDone && (
            <EveningCheckin checkin={checkin} setCheckin={setCheckin} />
          )}

          {/* Bonus J7 */}
          {isWeeklyDay && morningDone && (
            <WeeklyRitual music={weeklyMusic} day={activeInfo.dayInPhase} />
          )}

          {/* Save button */}
          <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-creme-sacree/90 backdrop-blur-sm z-40 border-t border-or-pale/50">
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
              className="w-full py-3.5 text-sm font-ui uppercase tracking-[0.08em] bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-50">
              {saving ? "Saving..." : saved ? "Moment saved ✓" : "Save this moment"}
            </motion.button>
          </div>
        </div>
      ) : (
        <CalendarView activeInfo={activeInfo} calendarCheckins={calendarCheckins} />
      )}
    </div>
  );
}

// ─── Morning Wizard ───────────────────────────────────────────────────────────

function MorningWizard({ checkin, setCheckin, step, setStep, onComplete }: {
  checkin: CheckinData;
  setCheckin: (fn: (prev: CheckinData) => CheckinData) => void;
  step: number;
  setStep: (n: number) => void;
  onComplete: () => void;
}) {
  const TOTAL_STEPS = 6;
  const next = () => step < TOTAL_STEPS ? setStep(step + 1) : onComplete();
  const sleepTypes = parseSleepType(checkin.sleepType);

  function toggleSleep(key: string) {
    const cur = parseSleepType(checkin.sleepType);
    const updated = cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key];
    setCheckin(prev => ({ ...prev, sleepType: JSON.stringify(updated) }));
  }

  const steps = [
    // 0 — Intro
    <div key="intro" className="text-center space-y-10 py-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
        <p className="font-caps text-xs text-brun-mid/50 uppercase tracking-widest mb-6">My morning</p>
        <h2 className="font-display text-3xl text-brun-chaud leading-snug">Start where you are.</h2>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>
        <motion.button whileTap={{ scale: 0.96 }} onClick={next}
          className="bg-or-sacre text-white px-8 py-3 rounded-sharp font-ui text-sm uppercase tracking-wider">
          Start
        </motion.button>
      </motion.div>
    </div>,

    // 1 — Energy
    <div key="energie" className="space-y-8 py-4">
      <StepHeader label="Energy" question="How is your energy this morning?" />
      <SliderStep value={checkin.energyLevel ?? 5} onChange={v => setCheckin(prev => ({ ...prev, energyLevel: v }))} guidance="Without analyzing." />
      <ContinueBtn onClick={next} />
    </div>,

    // 2 — Sleep
    <div key="sommeil" className="space-y-8 py-4">
      <StepHeader label="Sleep" question="How did you sleep?" />
      <SliderStep value={checkin.sleepQuality ?? 5} onChange={v => setCheckin(prev => ({ ...prev, sleepQuality: v }))} guidance="Just feel." />
      <ContinueBtn onClick={next} />
    </div>,

    // 3 — Sleep type
    <div key="sleep-type" className="space-y-8 py-4">
      <StepHeader label="Sleep type" question="What describes your night?" />
      <div className="flex flex-wrap gap-2">
        {SLEEP_OPTIONS.map(opt => (
          <ChipBtn key={opt.key} selected={sleepTypes.includes(opt.key)}
            onClick={() => toggleSleep(opt.key)} label={opt.label} />
        ))}
      </div>
      <ContinueBtn onClick={next} />
    </div>,

    // 4 — Dreams
    <div key="reves" className="space-y-6 py-4">
      <StepHeader label="Dreams" question="Did anything stay with you?" />
      <div className="flex gap-3">
        {[{ key: "OUI", label: "Yes" }, { key: "NON", label: "No" }, { key: "SAIS_PAS", label: "Hazy" }].map(opt => (
          <ChipBtn key={opt.key} selected={checkin.dreamed === opt.key}
            onClick={() => setCheckin(prev => ({ ...prev, dreamed: opt.key }))}
            label={opt.label} flex />
        ))}
      </div>
      <AnimatePresence>
        {(checkin.dreamed === "OUI" || checkin.dreamed === "SAIS_PAS") && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <VoiceTextarea
              value={checkin.dreamNotes ?? ""}
              onChange={v => setCheckin(prev => ({ ...prev, dreamNotes: v }))}
              placeholder="A few words are enough..."
              rows={3}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <ContinueBtn onClick={next} />
    </div>,

    // 5 — Morning feeling
    <div key="ressenti" className="space-y-6 py-4">
      <StepHeader label="Feeling" question="What I feel this morning." />
      <VoiceTextarea
        value={checkin.morningGratitude ?? ""}
        onChange={v => setCheckin(prev => ({ ...prev, morningGratitude: v }))}
        placeholder="No expectations. Just what is here."
        rows={4}
      />
      <ContinueBtn onClick={next} />
    </div>,

    // 6 — Morning validation
    <div key="done-matin" className="text-center space-y-8 py-12">
      <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
        className="font-display text-3xl text-brun-chaud">Noted.</motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.6 }}
        className="text-sm font-ui text-brun-mid/50 italic">Nothing to add.</motion.p>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0, duration: 0.4 }}>
        <motion.button whileTap={{ scale: 0.96 }} onClick={next}
          className="bg-or-sacre text-white px-8 py-3 rounded-sharp font-ui text-sm uppercase tracking-wider">
          Continue to evening →
        </motion.button>
      </motion.div>
    </div>,
  ];

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-sm overflow-hidden">
      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 pt-5 pb-2">
        {Array.from({ length: TOTAL_STEPS + 1 }).map((_, i) => (
          <motion.div key={i}
            animate={{ width: i === step ? 20 : 6, backgroundColor: i === step ? "#B8821E" : i < step ? "#B8821E" : "#E8D5A8", opacity: i < step ? 0.4 : 1 }}
            transition={{ duration: 0.2 }}
            className="h-1.5 rounded-full" />
        ))}
      </div>
      <div className="px-6 pb-8" style={{ minHeight: 300 }}>
        <AnimatePresence mode="wait">
          <motion.div key={step} variants={slideVariants} initial="initial" animate="animate" exit="exit"
            transition={{ duration: 0.35, ease: "easeOut" }}>
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Evening Checkin ──────────────────────────────────────────────────────────

function EveningCheckin({ checkin, setCheckin }: {
  checkin: CheckinData;
  setCheckin: (fn: (prev: CheckinData) => CheckinData) => void;
}) {
  return (
    <section className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-5">
      <h3 className="font-caps text-xs text-brun-mid uppercase tracking-wider border-b border-or-pale/50 pb-2">My evening</h3>

      <VoiceTextarea value={checkin.freeFeeling ?? ""}
        onChange={v => setCheckin(prev => ({ ...prev, freeFeeling: v }))}
        placeholder="What I went through today..." rows={3} />

      <div>
        <p className="text-xs font-ui text-brun-mid mb-1">4 true moments</p>
        <p className="text-xs font-ui text-brun-mid/40 italic mb-3">Light and shadow hold equal value here.</p>
        <div className="space-y-2">
          {[
            { field: "gratitudeMoment" as const, ph: "A moment that touched me..." },
            { field: "gratitudeSensation" as const, ph: "Something I received..." },
            { field: "gratitudeRecu" as const, ph: "What emerged — joy, anger, doubt, lightness..." },
            { field: "gratitudeSoi" as const, ph: "What I observe in myself tonight..." },
          ].map(({ field, ph }) => (
            <input key={field} type="text" value={checkin[field] ?? ""}
              onChange={e => setCheckin(prev => ({ ...prev, [field]: e.target.value }))}
              placeholder={ph}
              className="w-full px-3 py-2.5 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre placeholder:text-brun-mid/30 placeholder:italic" />
          ))}
        </div>
      </div>

      <VoiceTextarea value={checkin.selfQuality ?? ""}
        onChange={v => setCheckin(prev => ({ ...prev, selfQuality: v }))}
        placeholder="What I recognize in myself tonight..." rows={2} />

      <input type="text" value={checkin.closingSentence ?? ""}
        onChange={e => setCheckin(prev => ({ ...prev, closingSentence: e.target.value }))}
        placeholder="One sentence to close this day..."
        className="w-full px-3 py-2.5 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre placeholder:text-brun-mid/30 placeholder:italic" />
    </section>
  );
}

// ─── Weekly Ritual J7 ─────────────────────────────────────────────────────────

function WeeklyRitual({ music, day }: { music: WeeklyMusic | null; day: number }) {
  const [started, setStarted] = useState(false);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
      className="bg-cire-chaude border border-or-sacre/30 rounded-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-or-sacre animate-pulse" />
        <p className="font-caps text-xs text-or-sacre uppercase tracking-wider">Day {day} ritual</p>
      </div>
      <p className="font-display text-xl text-brun-chaud">A different moment tonight.</p>
      <p className="text-sm font-ui text-brun-mid leading-relaxed">
        Take your elixir.<br />
        Play this sound.<br />
        Observe what passes.<br />
        <span className="italic text-brun-mid/60">21 minutes. Nothing else.</span>
      </p>

      {music ? (
        <div className="space-y-3">
          {!started ? (
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => setStarted(true)}
              className="w-full py-3 bg-or-sacre text-white rounded-sharp font-ui text-sm uppercase tracking-wider">
              Start · {music.title}
            </motion.button>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <audio controls src={music.url} className="w-full" style={{ filter: "sepia(0.4)" }} />
              {music.description && (
                <p className="text-xs font-ui text-brun-mid/60 italic">{music.description}</p>
              )}
              <p className="text-center text-xs font-ui text-brun-mid/40 italic">Close your eyes when you are ready.</p>
            </motion.div>
          )}
        </div>
      ) : (
        <p className="text-xs font-ui text-brun-mid/40 italic">No music assigned this week.</p>
      )}
    </motion.section>
  );
}

// ─── Break Checkin ────────────────────────────────────────────────────────────

function BreakCheckin({ checkin, setCheckin }: {
  checkin: CheckinData;
  setCheckin: (fn: (prev: CheckinData) => CheckinData) => void;
}) {
  return (
    <section className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-5">
      <h3 className="font-caps text-xs text-brun-mid uppercase tracking-wider border-b border-or-pale/50 pb-2">My feeling</h3>
      <VoiceTextarea value={checkin.freeFeeling ?? ""}
        onChange={v => setCheckin(prev => ({ ...prev, freeFeeling: v }))}
        placeholder="Free writing — what is moving through me right now..." rows={5} />
      <input type="text" value={checkin.closingSentence ?? ""}
        onChange={e => setCheckin(prev => ({ ...prev, closingSentence: e.target.value }))}
        placeholder="Closing — 1 sentence..."
        className="w-full px-3 py-2.5 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre placeholder:text-brun-mid/30 placeholder:italic" />
    </section>
  );
}

// ─── Morning Done Card ────────────────────────────────────────────────────────

function MorningDoneCard({ checkin, onEdit }: { checkin: CheckinData; onEdit: () => void }) {
  return (
    <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="font-caps text-xs text-or-sacre uppercase tracking-wider">My morning · completed</p>
        <button onClick={onEdit} className="text-xs font-ui text-brun-mid/40 hover:text-brun-mid">Edit</button>
      </div>
      <div className="flex gap-6">
        {checkin.energyLevel && <div><p className="text-xs font-ui text-brun-mid/50">Energy</p><p className="font-display text-2xl text-brun-chaud">{checkin.energyLevel}/10</p></div>}
        {checkin.sleepQuality && <div><p className="text-xs font-ui text-brun-mid/50">Sleep</p><p className="font-display text-2xl text-brun-chaud">{checkin.sleepQuality}/10</p></div>}
      </div>
      {checkin.morningGratitude && (
        <p className="text-sm font-ui text-brun-mid/70 italic mt-3 border-l-2 border-or-pale pl-3 leading-relaxed">
          {checkin.morningGratitude}
        </p>
      )}
    </div>
  );
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

function CalendarView({ activeInfo, calendarCheckins }: { activeInfo: ActiveInfo; calendarCheckins: Record<string, boolean> }) {
  const { phase } = activeInfo;
  const start = new Date(phase.startDate);
  const days: Date[] = [];
  for (let i = 0; i < phase.durationDays; i++) {
    const d = new Date(start); d.setDate(d.getDate() + i); days.push(d);
  }
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [viewCheckin, setViewCheckin] = useState<CheckinData | null>(null);
  const [loadingDay, setLoadingDay] = useState(false);

  async function handleDayClick(date: Date) {
    const dateStr = formatISODate(date);
    if (date >= today) return;
    setSelectedDay(dateStr); setLoadingDay(true);
    try {
      const res = await fetch(`/api/daily-checkin?date=${dateStr}`);
      const data = await res.json();
      setViewCheckin(data.checkin ?? null);
    } catch { setViewCheckin(null); } finally { setLoadingDay(false); }
  }

  return (
    <div className="space-y-4">
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
        <h3 className="font-caps text-xs text-brun-mid uppercase tracking-wider mb-3">{phase.label} — {phase.durationDays} days</h3>
        <div className="grid grid-cols-7 gap-2">
          {days.map(d => {
            const dateStr = formatISODate(d);
            const isToday = d.getTime() === today.getTime();
            const isPast = d < today;
            const completed = calendarCheckins[dateStr];
            return (
              <button key={dateStr} onClick={() => isPast && handleDayClick(d)} disabled={!isPast}
                className={`aspect-square rounded-full flex items-center justify-center text-xs font-ui transition-all ${isToday ? "bg-or-sacre text-white ring-2 ring-or-sacre/30" : completed ? "bg-foret/20 text-foret" : isPast ? "bg-brun-mid/10 text-brun-mid hover:bg-or-pale/50" : "bg-brun-mid/5 text-brun-mid/30"}`}>
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </div>
      {selectedDay && (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
          <h4 className="font-caps text-xs text-brun-mid uppercase tracking-wider mb-3">
            {new Date(selectedDay).toLocaleDateString("en-US", { day: "numeric", month: "long" })}
          </h4>
          {loadingDay ? <p className="text-sm font-ui text-brun-mid/60">Loading...</p> :
            !viewCheckin ? <p className="text-sm font-ui text-brun-mid/50">No check-in this day.</p> :
            <div className="space-y-2">
              {([["Energy", viewCheckin.energyLevel ? `${viewCheckin.energyLevel}/10` : null],
                ["Sleep", viewCheckin.sleepQuality ? `${viewCheckin.sleepQuality}/10` : null],
                ["Morning feeling", viewCheckin.morningGratitude],
                ["Evening feeling", viewCheckin.freeFeeling],
                ["Closing", viewCheckin.closingSentence],
              ] as [string, string | null][]).filter(([, v]) => v).map(([label, value]) => (
                <div key={label}>
                  <span className="text-xs font-caps text-brun-mid/60 uppercase tracking-wider">{label}</span>
                  <p className="text-sm font-ui text-brun-chaud mt-0.5">{value}</p>
                </div>
              ))}
              {viewCheckin.elixirTaken && <p className="text-xs font-ui text-foret mt-2">Elixirs taken ✓</p>}
            </div>
          }
        </div>
      )}
    </div>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────

function ProgressBar({ label, value, total, thin }: { label: string; value: number; total: number; thin?: boolean }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs font-ui text-brun-mid/50">{label}</span>
        <span className="text-xs font-ui text-brun-mid/50">Day {value} / {total}</span>
      </div>
      <div className={`${thin ? "h-1.5" : "h-2"} bg-or-pale/30 rounded-full`}>
        <div className={`h-full rounded-full ${thin ? "bg-or-sacre/40" : "bg-or-sacre"} transition-all`}
          style={{ width: `${(value / total) * 100}%` }} />
      </div>
    </div>
  );
}

function StepHeader({ label, question }: { label: string; question: string }) {
  return (
    <div>
      <p className="font-caps text-xs text-brun-mid/50 uppercase tracking-widest mb-3">{label}</p>
      <h2 className="font-display text-2xl text-brun-chaud">{question}</h2>
    </div>
  );
}

function SliderStep({ value, onChange, guidance }: { value: number; onChange: (v: number) => void; guidance: string }) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <motion.span key={value} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.15 }} className="font-display text-5xl text-or-sacre">{value}</motion.span>
        <span className="font-display text-2xl text-brun-mid/40">/10</span>
      </div>
      <input type="range" min={1} max={10} value={value} onChange={e => onChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-or-sacre"
        style={{ background: `linear-gradient(to right, #B8821E 0%, #B8821E ${(value - 1) * 11.1}%, #E8D5A8 ${(value - 1) * 11.1}%, #E8D5A8 100%)` }} />
      <p className="text-center text-sm font-ui text-brun-mid/50 italic">{guidance}</p>
    </div>
  );
}

function ChipBtn({ selected, onClick, label, flex }: { selected: boolean; onClick: () => void; label: string; flex?: boolean }) {
  return (
    <motion.button type="button" whileTap={{ scale: 0.95 }}
      animate={{ backgroundColor: selected ? "#B8821E" : "#F0E8D5", color: selected ? "#FDFAF4" : "#6B4423" }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-ui border border-or-pale ${flex ? "flex-1" : ""}`}>
      {label}
    </motion.button>
  );
}

function ContinueBtn({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-end pt-2">
      <motion.button whileTap={{ scale: 0.96 }} onClick={onClick}
        className="text-sm font-ui text-or-sacre hover:text-ambre-vif transition-colors">
        Continue →
      </motion.button>
    </div>
  );
}

function VoiceTextarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder: string; rows?: number;
}) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<unknown>(null);

  function startListening() {
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new (SpeechRecognition as new () => { lang: string; continuous: boolean; interimResults: boolean; onresult: (e: unknown) => void; onend: () => void; start: () => void; stop: () => void })();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (e: unknown) => {
      const event = e as { results: { [key: number]: { [key: number]: { transcript: string } } }; resultIndex: number };
      const transcript = event.results[event.resultIndex][0].transcript;
      onChange(value ? value + " " + transcript : transcript);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function stopListening() {
    const r = recognitionRef.current as { stop: () => void } | null;
    if (r) r.stop();
    setListening(false);
  }

  return (
    <div className="relative">
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        className="w-full px-3 py-3 pr-12 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre resize-none placeholder:text-brun-mid/30 placeholder:italic" />
      <motion.button type="button"
        whileTap={{ scale: 0.9 }}
        animate={{ color: listening ? "#B8821E" : "#B4B2A9" }}
        onClick={listening ? stopListening : startListening}
        className="absolute right-3 top-3"
        title={listening ? "Stop" : "Dictate"}>
        {listening ? (
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
            <MicIcon active />
          </motion.div>
        ) : (
          <MicIcon active={false} />
        )}
      </motion.button>
    </div>
  );
}

function MicIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 22 22" fill="none"
      stroke={active ? "#B8821E" : "#B4B2A9"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="6" height="11" rx="3" />
      <path d="M4 11a7 7 0 0014 0" />
      <line x1="11" y1="18" x2="11" y2="21" />
      <line x1="8" y1="21" x2="14" y2="21" />
    </svg>
  );
}

// ─── Time Window Helper ───────────────────────────────────────────────────────
// Exported for use in other components if needed
export function getTimeWindow(): "morning" | "inter" | "evening" | "closed" {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 13) return "morning";
  if (hour >= 13 && hour < 16) return "inter";
  if (hour >= 16 && hour < 24) return "evening";
  return "closed";
}

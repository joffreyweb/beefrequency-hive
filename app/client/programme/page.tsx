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
const TIMING_LABELS: Record<string, string> = { MATIN: "Matin", SOIR: "Soir", JOURNEE: "Journée", FLEXIBLE: "Flexible" };

const SLEEP_OPTIONS = [
  { key: "leger", label: "Léger" },
  { key: "profond", label: "Profond" },
  { key: "reves", label: "Rêves" },
  { key: "reveils", label: "Réveils" },
  { key: "endormissement_long", label: "Long endormissement" },
  { key: "nuit_continue", label: "Nuit continue" },
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

        // Charger musique J7 si jour 7/14/21
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
      <p className="text-sm font-ui text-brun-mid/60">Chargement…</p>
    </div>
  );

  if (!activeInfo) return (
    <div className="space-y-4 pb-24">
      <h1 className="font-display text-2xl text-brun-chaud">Le Passage</h1>
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-8 text-center">
        <p className="text-sm font-ui text-brun-mid/60">Votre parcours n&apos;a pas encore été configuré.</p>
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
            {activeInfo.phase.label} · J.{activeInfo.dayInPhase}
          </span>
        </div>
        <ProgressBar label="Progression globale" value={activeInfo.dayInProgram} total={activeInfo.totalDays} thin />
        <ProgressBar label={activeInfo.phase.label} value={activeInfo.dayInPhase} total={activeInfo.phase.durationDays} />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-or-pale">
        {(["aujourdhui", "calendrier"] as ViewTab[]).map(tab => (
          <button key={tab} onClick={() => setViewTab(tab)}
            className={`px-4 py-2.5 text-sm font-ui transition-colors border-b-2 -mb-px ${viewTab === tab ? "text-or-sacre border-or-sacre" : "text-brun-mid border-transparent"}`}>
            {tab === "aujourdhui" ? "Aujourd'hui" : "Calendrier"}
          </button>
        ))}
      </div>

      {viewTab === "aujourdhui" ? (
        <div className="space-y-6">

          {/* Élixirs */}
          {todayElixirs.length > 0 && (
            <section className="bg-cire-chaude border border-or-pale rounded-sm p-5">
              <h3 className="font-caps text-xs text-or-sacre uppercase tracking-wider mb-3">
                {isCycle ? "Mes élixirs aujourd'hui" : "Soutien du jour"}
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
                  label={checkin.elixirTaken ? "✓ Élixirs pris" : "J'ai pris mes élixirs"}
                />
              </div>
            </section>
          )}

          {/* Pratiques */}
          {todayPractices.length > 0 && (
            <section className="bg-cire-chaude border border-or-pale rounded-sm p-5">
              <h3 className="font-caps text-xs text-or-sacre uppercase tracking-wider mb-3">Ma pratique</h3>
              {todayPractices.map(p => (
                <div key={p.id} className="mb-2 last:mb-0">
                  <p className="text-sm font-ui text-brun-chaud">{p.title}</p>
                  {p.description && <p className="text-xs font-ui text-brun-mid/60 mt-0.5">{p.description}</p>}
                  {p.duration && <p className="text-xs font-ui text-brun-mid/40 mt-0.5">{p.duration} min</p>}
                </div>
              ))}
            </section>
          )}

          {/* Check-in matin */}
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

          {/* Check-in soir */}
          {isCycle && morningDone && (
            <EveningCheckin checkin={checkin} setCheckin={setCheckin} />
          )}

          {/* Bonus J7 */}
          {isWeeklyDay && morningDone && (
            <WeeklyRitual music={weeklyMusic} day={activeInfo.dayInPhase} />
          )}

          {/* Bouton save */}
          <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-creme-sacree/90 backdrop-blur-sm z-40 border-t border-or-pale/50">
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
              className="w-full py-3.5 text-sm font-ui uppercase tracking-[0.08em] bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-50">
              {saving ? "Enregistrement…" : saved ? "Moment validé ✓" : "Valider ce moment"}
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
        <p className="font-caps text-xs text-brun-mid/50 uppercase tracking-widest mb-6">Mon matin</p>
        <h2 className="font-display text-3xl text-brun-chaud leading-snug">Commence là où tu es.</h2>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>
        <motion.button whileTap={{ scale: 0.96 }} onClick={next}
          className="bg-or-sacre text-white px-8 py-3 rounded-sharp font-ui text-sm uppercase tracking-wider">
          Commencer
        </motion.button>
      </motion.div>
    </div>,

    // 1 — Énergie
    <div key="energie" className="space-y-8 py-4">
      <StepHeader label="Énergie" question="Comment est ton énergie ce matin ?" />
      <SliderStep value={checkin.energyLevel ?? 5} onChange={v => setCheckin(prev => ({ ...prev, energyLevel: v }))} guidance="Sans analyser." />
      <ContinueBtn onClick={next} />
    </div>,

    // 2 — Sommeil
    <div key="sommeil" className="space-y-8 py-4">
      <StepHeader label="Sommeil" question="Comment as-tu dormi ?" />
      <SliderStep value={checkin.sleepQuality ?? 5} onChange={v => setCheckin(prev => ({ ...prev, sleepQuality: v }))} guidance="Juste ressentir." />
      <ContinueBtn onClick={next} />
    </div>,

    // 3 — Type de sommeil
    <div key="sleep-type" className="space-y-8 py-4">
      <StepHeader label="Type de sommeil" question="Qu'est-ce qui décrit ta nuit ?" />
      <div className="flex flex-wrap gap-2">
        {SLEEP_OPTIONS.map(opt => (
          <ChipBtn key={opt.key} selected={sleepTypes.includes(opt.key)}
            onClick={() => toggleSleep(opt.key)} label={opt.label} />
        ))}
      </div>
      <ContinueBtn onClick={next} />
    </div>,

    // 4 — Rêves
    <div key="reves" className="space-y-6 py-4">
      <StepHeader label="Rêves" question="Quelque chose est resté ?" />
      <div className="flex gap-3">
        {[{ key: "OUI", label: "Oui" }, { key: "NON", label: "Non" }, { key: "SAIS_PAS", label: "Flou" }].map(opt => (
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
              placeholder="Quelques mots suffisent…"
              rows={3}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <ContinueBtn onClick={next} />
    </div>,

    // 5 — Ressenti matin
    <div key="ressenti" className="space-y-6 py-4">
      <StepHeader label="Ressenti" question="Ce que je ressens ce matin." />
      <VoiceTextarea
        value={checkin.morningGratitude ?? ""}
        onChange={v => setCheckin(prev => ({ ...prev, morningGratitude: v }))}
        placeholder="Aucune attente. Juste ce qui est là."
        rows={4}
      />
      <ContinueBtn onClick={next} />
    </div>,

    // 6 — Validation matin
    <div key="done-matin" className="text-center space-y-8 py-12">
      <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
        className="font-display text-3xl text-brun-chaud">C&apos;est noté.</motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.6 }}
        className="text-sm font-ui text-brun-mid/50 italic">Rien à ajouter.</motion.p>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0, duration: 0.4 }}>
        <motion.button whileTap={{ scale: 0.96 }} onClick={next}
          className="bg-or-sacre text-white px-8 py-3 rounded-sharp font-ui text-sm uppercase tracking-wider">
          Continuer vers le soir →
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
      <h3 className="font-caps text-xs text-brun-mid uppercase tracking-wider border-b border-or-pale/50 pb-2">Mon soir</h3>

      <VoiceTextarea value={checkin.freeFeeling ?? ""}
        onChange={v => setCheckin(prev => ({ ...prev, freeFeeling: v }))}
        placeholder="Ce que j'ai traversé aujourd'hui…" rows={3} />

      <div>
        <p className="text-xs font-ui text-brun-mid mb-1">4 instants vrais</p>
        <p className="text-xs font-ui text-brun-mid/40 italic mb-3">Lumière et ombre ont la même valeur ici.</p>
        <div className="space-y-2">
          {[
            { field: "gratitudeMoment" as const, ph: "Un moment qui m'a touché…" },
            { field: "gratitudeSensation" as const, ph: "Quelque chose que j'ai reçu…" },
            { field: "gratitudeRecu" as const, ph: "Ce qui a émergé — joie, colère, doute, légèreté…" },
            { field: "gratitudeSoi" as const, ph: "Ce que j'observe en moi ce soir…" },
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
        placeholder="Ce que je reconnais en moi ce soir…" rows={2} />

      <input type="text" value={checkin.closingSentence ?? ""}
        onChange={e => setCheckin(prev => ({ ...prev, closingSentence: e.target.value }))}
        placeholder="Une phrase pour clore cette journée…"
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
        <p className="font-caps text-xs text-or-sacre uppercase tracking-wider">Rituel du jour {day}</p>
      </div>
      <p className="font-display text-xl text-brun-chaud">Un moment différent ce soir.</p>
      <p className="text-sm font-ui text-brun-mid leading-relaxed">
        Prends ton élixir.<br />
        Mets ce son.<br />
        Observe ce qui passe.<br />
        <span className="italic text-brun-mid/60">21 minutes. Sans rien faire d&apos;autre.</span>
      </p>

      {music ? (
        <div className="space-y-3">
          {!started ? (
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => setStarted(true)}
              className="w-full py-3 bg-or-sacre text-white rounded-sharp font-ui text-sm uppercase tracking-wider">
              Commencer · {music.title}
            </motion.button>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <audio controls src={music.url} className="w-full" style={{ filter: "sepia(0.4)" }} />
              {music.description && (
                <p className="text-xs font-ui text-brun-mid/60 italic">{music.description}</p>
              )}
              <p className="text-center text-xs font-ui text-brun-mid/40 italic">Ferme les yeux quand tu es prêt.</p>
            </motion.div>
          )}
        </div>
      ) : (
        <p className="text-xs font-ui text-brun-mid/40 italic">Aucune musique assignée pour cette semaine.</p>
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
      <h3 className="font-caps text-xs text-brun-mid uppercase tracking-wider border-b border-or-pale/50 pb-2">Mon ressenti</h3>
      <VoiceTextarea value={checkin.freeFeeling ?? ""}
        onChange={v => setCheckin(prev => ({ ...prev, freeFeeling: v }))}
        placeholder="Écriture libre — ce qui me traverse en ce moment…" rows={5} />
      <input type="text" value={checkin.closingSentence ?? ""}
        onChange={e => setCheckin(prev => ({ ...prev, closingSentence: e.target.value }))}
        placeholder="Clôture — 1 phrase…"
        className="w-full px-3 py-2.5 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre placeholder:text-brun-mid/30 placeholder:italic" />
    </section>
  );
}

// ─── Morning Done Card ────────────────────────────────────────────────────────

function MorningDoneCard({ checkin, onEdit }: { checkin: CheckinData; onEdit: () => void }) {
  return (
    <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="font-caps text-xs text-or-sacre uppercase tracking-wider">Mon matin · complété</p>
        <button onClick={onEdit} className="text-xs font-ui text-brun-mid/40 hover:text-brun-mid">Modifier</button>
      </div>
      <div className="flex gap-6">
        {checkin.energyLevel && <div><p className="text-xs font-ui text-brun-mid/50">Énergie</p><p className="font-display text-2xl text-brun-chaud">{checkin.energyLevel}/10</p></div>}
        {checkin.sleepQuality && <div><p className="text-xs font-ui text-brun-mid/50">Sommeil</p><p className="font-display text-2xl text-brun-chaud">{checkin.sleepQuality}/10</p></div>}
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
        <h3 className="font-caps text-xs text-brun-mid uppercase tracking-wider mb-3">{phase.label} — {phase.durationDays} jours</h3>
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
            {new Date(selectedDay).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
          </h4>
          {loadingDay ? <p className="text-sm font-ui text-brun-mid/60">Chargement…</p> :
            !viewCheckin ? <p className="text-sm font-ui text-brun-mid/50">Aucun check-in ce jour.</p> :
            <div className="space-y-2">
              {([["Énergie", viewCheckin.energyLevel ? `${viewCheckin.energyLevel}/10` : null],
                ["Sommeil", viewCheckin.sleepQuality ? `${viewCheckin.sleepQuality}/10` : null],
                ["Ressenti matin", viewCheckin.morningGratitude],
                ["Ressenti soir", viewCheckin.freeFeeling],
                ["Clôture", viewCheckin.closingSentence],
              ] as [string, string | null][]).filter(([, v]) => v).map(([label, value]) => (
                <div key={label}>
                  <span className="text-xs font-caps text-brun-mid/60 uppercase tracking-wider">{label}</span>
                  <p className="text-sm font-ui text-brun-chaud mt-0.5">{value}</p>
                </div>
              ))}
              {viewCheckin.elixirTaken && <p className="text-xs font-ui text-foret mt-2">Élixirs pris ✓</p>}
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
        <span className="text-xs font-ui text-brun-mid/50">J.{value} / {total}</span>
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
        Continuer →
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
    recognition.lang = "fr-FR";
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
        title={listening ? "Arrêter" : "Dicter"}>
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
// Exporté pour usage dans d'autres composants si besoin
export function getTimeWindow(): "matin" | "inter" | "soir" | "fermé" {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 13) return "matin";
  if (hour >= 13 && hour < 16) return "inter";
  if (hour >= 16 && hour < 24) return "soir";
  return "fermé";
}
